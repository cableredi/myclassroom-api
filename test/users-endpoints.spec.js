const knex = require('knex')
const bcrypt = require('bcryptjs')
const app = require('../src/app')
const fixtures = require('./myclassroom-fixtures');

describe('Users Endpoints', function() {
  let db

  const testUsers = fixtures.makeUsersArray();

  const testUser = testUsers[0]

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DATABASE_URL,
    })
    app.set('db', db)
    db.raw('TRUNCATE users RESTART IDENTITY CASCADE')
  });

  afterEach('cleanup', () => db.raw('TRUNCATE users RESTART IDENTITY CASCADE'));

  after('disconnect from db', () => db.destroy())

  describe(`POST /api/users`, () => {
    context(`User Validation`, () => {
      beforeEach('insert users', () => {
        return db
          .into('users')
          .insert(testUsers)
      })

      const requiredFields = ['user_name', 'password', 'first_name', 'last_name', 'role']

      requiredFields.forEach(field => {
        const registerAttemptBody = {
          user_name: 'test user_name',
          password: 'test password',
          first_name: 'test first_name',
          last_name: 'test last_name',
          role: 'teacher'
        }

        it(`responds with 400 required error when '${field}' is missing`, () => {
          delete registerAttemptBody[field]

          return supertest(app)
            .post('/api/users')
            .send(registerAttemptBody)
            .expect(400, {
              error: `Missing '${field}' in request body`,
            })
        })
      })

      it(`responds 400 'Password be longer than 8 characters' when empty password`, () => {
        const userShortPassword = {
          user_name: 'test user_name',
          password: '1234567',
          first_name: 'test first_name',
          last_name: 'test last_name',
          role: 'teacher'
        }
        return supertest(app)
          .post('/api/users')
          .send(userShortPassword)
          .expect(400, { error: `Password be longer than 8 characters` })
      })

      it(`responds 400 'Password be less than 72 characters' when long password`, () => {
        const userLongPassword = {
          user_name: 'test user_name',
          password: '*'.repeat(73),
          first_name: 'test first_name',
          last_name: 'test last_name',
          role: 'teacher'
        }
        return supertest(app)
          .post('/api/users')
          .send(userLongPassword)
          .expect(400, { error: `Password be less than 72 characters` })
      })

      it(`responds 400 error when password starts with spaces`, () => {
        const userPasswordStartsSpaces = {
          user_name: 'test user_name',
          password: ' 1Aa!2Bb@',
          first_name: 'test first_name',
          last_name: 'test last_name',
          role: 'teacher'
        }
        return supertest(app)
          .post('/api/users')
          .send(userPasswordStartsSpaces)
          .expect(400, { error: `Password must not start or end with empty spaces` })
      })

      it(`responds 400 error when password ends with spaces`, () => {
        const userPasswordEndsSpaces = {
          user_name: 'test user_name',
          password: '1Aa!2Bb@ ',
          first_name: 'test first_name',
          last_name: 'test last_name',
          role: 'teacher'
        }
        return supertest(app)
          .post('/api/users')
          .send(userPasswordEndsSpaces)
          .expect(400, { error: `Password must not start or end with empty spaces` })
      })

      it(`responds 400 error when password isn't complex enough`, () => {
        const userPasswordNotComplex = {
          user_name: 'test user_name',
          password: '11AAaabb',
          first_name: 'test first_name',
          last_name: 'test last_name',
          role: 'teacher'
        }
        return supertest(app)
          .post('/api/users')
          .send(userPasswordNotComplex)
          .expect(400, { error: `Password must contain one upper case, lower case, number and special character` })
      })

      it(`responds 400 'User name already taken' when user_name isn't unique`, () => {
        const duplicateUser = {
          user_name: testUser.user_name,
          password: '11AAaa!!',
          first_name: 'test first_name',
          last_name: 'test last_name',
          role: 'teacher'
        }
        return supertest(app)
          .post('/api/users')
          .send(duplicateUser)
          .expect(400, { error: `Username already taken` })
      })
    })

    context(`Happy path`, () => {
      it(`responds 201, serialized user, storing bcryped password`, () => {
        const newUser = {
          user_name: 'test happy path user_name',
          password: '11AAaa!!',
          first_name: 'test first_name',
          last_name: 'test last_name',
          role: 'student',
          teacher_user_id: 1
        }
        return supertest(app)
          .post('/api/users')
          .send(newUser)
          .expect(201)
          .expect(res => {
            expect(res.body).to.have.property(`user_id`)
            expect(res.body.user_name).to.eql(newUser.user_name)
            expect(res.body.first_name).to.eql(newUser.first_name)
            expect(res.body.last_name).to.eql(newUser.last_name)
            expect(res.body.role).to.eql(newUser.role)
            expect(res.body.teacher_user_id).to.eql(newUser.teacher_user_id)
            expect(res.body).to.not.have.property('password')
            //expect(res.headers.location).to.eql(`/api/users/${res.body.user_id}`)
            const expectedDate = new Date().toLocaleString('en', { timeZone: 'UTC' })
            const actualDate = new Date(res.body.date_created).toLocaleString()
            expect(actualDate).to.eql(expectedDate)
          })
          .expect(res =>
            db
              .from('users')
              .select('*')
              .where({ user_id: res.body.user_id })
              .first()
              .then(row => {
                expect(row.user_name).to.eql(newUser.user_name)
                expect(row.first_name).to.eql(newUser.first_name)
                expect(row.last_name).to.eql(newUser.last_name)
                expect(row.role).to.eql(newUser.role)
                expect(row.teacher_user_id).to.eql(newUser.teacher_user_id)
                const expectedDate = new Date().toLocaleString('en', { timeZone: 'UTC' })
                const actualDate = new Date(row.date_created).toLocaleString()
                expect(actualDate).to.eql(expectedDate)

                return bcrypt.compare(newUser.password, row.password)
              })
              .then(compareMatch => {
                expect(compareMatch).to.be.true
              })
          )
      })
    })
  })
})