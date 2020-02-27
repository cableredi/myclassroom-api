const knex = require('knex');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const fixtures = require('./myclassroom-fixtures');

describe('Auth Endpoints', () => {
  let db

  const testUsers = fixtures.makeUsersArray();
  const testUser = testUsers[0];

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DATABASE_URL,
    })
    app.set('db', db)
    db.raw('TRUNCATE users, classes, assignments RESTART IDENTITY CASCADE')
  });

  afterEach('cleanup', () => db.raw('TRUNCATE users, classes, assignments RESTART IDENTITY CASCADE'));

  after('disconnect from db', () => db.destroy())

  describe(`POST /api/auth/login`, () => {
    it(`responds 200 and JWT auth token using secret when valid credentials`, () => {
      const userValidCreds = {
        user_name: testUser.user_name,
        password: testUser.password,
      }
      const expectedToken = jwt.sign(
        { user_id: testUser.user_id },
        process.env.JWT_SECRET,
        {
          subject: testUser.user_name,
          expiresIn: process.env.JWT_EXPIRY,
          algorithm: 'HS256',
        }
      )
      return supertest(app)
        .post('/api/auth/login')
        .send(userValidCreds)
        .expect(200, {
          authToken: expectedToken,
        })
    })
  })

  describe(`POST /api/auth/refresh`, () => {
    it(`responds 200 and JWT auth token using secret`, () => {
      const expectedToken = jwt.sign(
        { user_id: testUser.user_id },
        process.env.JWT_SECRET,
        {
          subject: testUser.user_name,
          expiresIn: process.env.JWT_EXPIRY,
          algorithm: 'HS256',
        }
      )
      return supertest(app)
        .post('/api/auth/refresh')
        .set('Authorization', fixtures.makeAuthHeader(testUser))
        .expect(200, {
          authToken: expectedToken,
        })
    })
  })
})