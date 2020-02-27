const knex = require('knex');
const fixtures = require('./myclassroom-fixtures');
const app = require('../src/app');

describe('Classes Endpoints', () => {
  let db;

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DATABASE_URL,
    })
    app.set('db', db)
    db.raw('TRUNCATE users, classes RESTART IDENTITY CASCADE')
  });

  afterEach('cleanup', () => db.raw('TRUNCATE users, classes RESTART IDENTITY CASCADE'));

  after('disconnect from db', () => db.destroy())

  describe('GET /api/classes', () => {
    const testUsers = fixtures.makeUsersArray();

    beforeEach('insert users', () => {
      return db
        .into('users')
        .insert(testUsers)
    })

    context(`Given no classes`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app)
          .get('/api/classes')
          .set( 'Authorization', fixtures.makeAuthHeader(testUsers[0]) )
          .expect(200, [])
      })
    })

    context('Given there are classes in the database', () => {
      const testClasses = fixtures.makeClassesArray();

      beforeEach('insert classes', () => {
        return db
          .into('classes')
          .insert(testClasses)
      })

      it('gets the classes from database', () => {
        return supertest(app)
          .get('/api/classes')
          .set('Authorization', fixtures.makeAuthHeader(testUsers[0]))
          .expect(200, testClasses)
      })
    })
  })

  describe(`POST /api/classes`, () => {
    const testUsers = fixtures.makeUsersArray();

    beforeEach('insert users', () => {
      return db
        .into('users')
        .insert(testUsers)
    })

    it(`creates a class, responding with 201 and the new class`, function () {
      this.retries(3)
      const newClass = {
        class_name: 'add class name',
        user_id: 1,
        days: 'MTWRF',
        times: '8 - 9am',
        location: 'Main Hall',
        room: '320',
      }
      return supertest(app)
        .post('/api/classes')
        .send(newClass)
        .set('Authorization', fixtures.makeAuthHeader(testUsers[0]))
        .expect(201)
        .expect(res => {
          expect(res.body.class_name).to.eql(newClass.class_name)
          expect(res.body.user_id).to.eql(newClass.user_id)
          expect(res.body.days).to.eql(newClass.days)
          expect(res.body.times).to.eql(newClass.times)
          expect(res.body.location).to.eql(newClass.location)
          expect(res.body.room).to.eql(newClass.room)
          expect(res.body).to.have.property('class_id')
          expect(res.headers.location).to.eql(`/api/classes/${res.body.class_id}`)
        })
        .then(res =>
          supertest(app)
            .get(`/api/classes/${res.body.class_id}`)
            .set('Authorization', fixtures.makeAuthHeader(testUsers[0]))
            .expect(res.body)
        )
    });
  });

  describe('GET /api/classes/:class_id', () => {
    const testUsers = fixtures.makeUsersArray();
    const testClasses = fixtures.makeClassesArray();

    beforeEach('insert users', () => {
      return db
        .into('users')
        .insert(testUsers)
    })

    beforeEach('insert classes', () => {
      return db
        .into('classes')
        .insert(testClasses)
    })

    it('responds with 200 and the specified class', () => {
      const class_id = 1;
      const expectedClass = fixtures.makeExpectedClass();

      return supertest(app)
        .get(`/api/classes/${class_id}`)
        .set('Authorization', fixtures.makeAuthHeader(testUsers[0]))
        .expect(200, expectedClass)
    })
  })

  describe(`PATCH /api/classes/:class_id`, () => {
    const testUsers = fixtures.makeUsersArray();
    const testClasses = fixtures.makeClassesArray();

    beforeEach('insert users', () => {
      return db
        .into('users')
        .insert(testUsers)
    })

    beforeEach('insert classes', () => {
      return db
        .into('classes')
        .insert(testClasses)
    })

    context(`Given no classes`, () => {
      it(`responds with 404`, () => {
        const class_id = 123456
        return supertest(app)
          .patch(`/api/classes/${class_id}`)
          .set('Authorization', fixtures.makeAuthHeader(testUsers[0]))
          .expect(404, { error: { message: `Class Not Found` } })
      })
    })

    context('Given there are classes in the database', () => {
      it('responds with 204 and updates the class', () => {
        const idToUpdate = 1
        const updateClass = {
          class_name: 'update class name',
          user_id: 1,
          days: 'MTWRF',
          times: '8 - 9am',
          location: 'Main Hall',
          room: '320',
        }

        const expectedClass = {
          ...testClasses[idToUpdate - 1],
          ...updateClass
        }

        return supertest(app)
          .patch(`/api/classes/${idToUpdate}`)
          .send(updateClass)
          .set('Authorization', fixtures.makeAuthHeader(testUsers[0]))
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/classes/${idToUpdate}`)
              .set('Authorization', fixtures.makeAuthHeader(testUsers[0]))
              .expect(200)
              .expect(res => {
                expect(res.body.class_name).to.eql(expectedClass.class_name)
                expect(res.body.user_id).to.eql(expectedClass.user_id)
                expect(res.body.days).to.eql(expectedClass.days)
                expect(res.body.times).to.eql(expectedClass.times)
                expect(res.body.location).to.eql(expectedClass.location)
                expect(res.body.room).to.eql(expectedClass.room)
                expect(res.body).to.have.property('class_id')
              })
          )
      })
    })
  });

  describe(`DELETE/api /classes/:class_id`, () => {
    const testUsers = fixtures.makeUsersArray();

    beforeEach('insert users', () => {
      return db
        .into('users')
        .insert(testUsers)
    })

    context(`Given no classes`, () => {
      it(`responds with 404`, () => {
        const class_id = 123456
        return supertest(app)
          .delete(`/api/classes/${class_id}`)
          .set('Authorization', fixtures.makeAuthHeader(testUsers[0]))
          .expect(404, { error: { message: `Class Not Found` } })
      })
    });

    context('Given there are classes in the database', () => {
      const testClasses = fixtures.makeClassesArray();

      beforeEach('insert classes', () => {
        return db
          .into('classes')
          .insert(testClasses)
      })

      it('responds with 204 and removes the class', () => {
        const idToRemove = 2
        const expectedClass = testClasses.filter(schoolClass => schoolClass.class_id !== idToRemove)

        return supertest(app)
          .delete(`/api/classes/${idToRemove}`)
          .set('Authorization', fixtures.makeAuthHeader(testUsers[0]))
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/classes`)
              .set('Authorization', fixtures.makeAuthHeader(testUsers[0]))
              .expect(res => {
                for (let i = 0; i < expectedClass.length; i++) {
                  expect(res.body[i].class_name).to.eql(expectedClass[i].class_name)
                  expect(res.body[i].user_id).to.eql(expectedClass[i].user_id)
                  expect(res.body[i].days).to.eql(expectedClass[i].days)
                  expect(res.body[i].times).to.eql(expectedClass[i].times)
                  expect(res.body[i].location).to.eql(expectedClass[i].location)
                  expect(res.body[i].room).to.eql(expectedClass[i].room)
                  expect(res.body[i]).to.have.property('class_id')
                }
              })
          )
      })
    });
  });
});