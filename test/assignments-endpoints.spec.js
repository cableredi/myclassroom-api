const knex = require('knex');
const fixtures = require('./myclassroom-fixtures');
const app = require('../src/app');

describe.only('Assignments Endpoints', () => {
  let db;

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

  describe('GET /api/assignments', () => {
    const testUsers = fixtures.makeUsersArray();
    const testClasses = fixtures.makeClassesArray();

    context(`Given no assignments`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app)
          .get('/api/assignments')
          .set('Authorization', fixtures.makeAuthHeader(testUsers[0]))
          .expect(200, [])
      })
    })

    context('Given there are assignments in the database', () => {
      const testAssignments = fixtures.makeAssignmentsArray();

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

      beforeEach('insert assignments', () => {
        return db
          .into('assignments')
          .insert(testAssignments)
      })

      it('gets the assignments from database', () => {
        return supertest(app)
          .get('/api/assignments')
          .set('Authorization', fixtures.makeAuthHeader(testUsers[0]))
          .expect(200)
          .expect(res => {
            for (let i = 0; i < testAssignments.length; i++) {
              expect(res.body[i].class_id).to.eql(testAssignments[i].class_id)
              expect(res.body[i].title).to.eql(testAssignments[i].title)
              expect(res.body[i].notes).to.eql(testAssignments[i].notes)
              expect(res.body[i].category).to.eql(testAssignments[i].category)
              expect(res.body[i].due_date.substring(0, 9)).to.eql(testAssignments[i].due_date.substring(0, 9))
              expect(res.body[i].expected_result).to.eql(testAssignments[i].expected_result)
              expect(res.body[i].actual_result).to.eql(testAssignments[i].actual_result)
              expect(res.body[i]).to.have.property('assignment_id')
            }
          })
      })
    })
  })

  describe(`POST /api/assignments`, () => {
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

    it(`creates an assignment, responding with 201 and the new assignment`, function () {
      this.retries(3)
      const newAssignment = {
        "class_id": 1,
        "due_date": "2020-02-08T12:00:00-06:30",
        "title": "Test Assignment 1",
        "notes": "Test Notes 1",
        "category": "Homework"
      }
      return supertest(app)
        .post('/api/assignments')
        .send(newAssignment)
        .set('Authorization', fixtures.makeAuthHeader(testUsers[0]))
        .expect(201)
        .expect(res => {
          expect(res.body.due_date.substring(0, 9)).to.eql(newAssignment.due_date.substring(0, 9))
          expect(res.body.expected_result).to.eql(newAssignment.expected_result)
          expect(res.body.actual_result).to.eql(newAssignment.actual_result)
          expect(res.body.title).to.eql(newAssignment.title)
          expect(res.body.notes).to.eql(newAssignment.notes)
          expect(res.body.category).to.eql(newAssignment.category)
          expect(res.body).to.have.property('assignment_id')
          expect(res.headers.location).to.eql(`/api/assignments/${res.body.assignment_id}`)
        })
        .then(res =>
          supertest(app)
            .get(`/api/assignments/${res.body.assignment_id}`)
            .set('Authorization', fixtures.makeAuthHeader(testUsers[0]))
            .expect(res.body)
        )
    });
  });

  describe('GET /api/assignments/:assignment_id', () => {
    const testUsers = fixtures.makeUsersArray();
    const testClasses = fixtures.makeClassesArray();
    const testAssignments = fixtures.makeAssignmentsArray();

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

    beforeEach('insert assignments', () => {
      return db
        .into('assignments')
        .insert(testAssignments)
    })

    it('responds with 200 and the specified assignment', () => {
      const assignment_id = 2;
      const expectedAssignment = fixtures.makeExpectedAssignment();

      return supertest(app)
        .get(`/api/assignments/${assignment_id}`)
        .set('Authorization', fixtures.makeAuthHeader(testUsers[0]))
        .expect(200)
        .expect(res => {
          expect(res.body.due_date.substring(0, 9)).to.eql(expectedAssignment.due_date.substring(0, 9))
          expect(res.body.expected_result).to.eql(expectedAssignment.expected_result)
          expect(res.body.actual_result).to.eql(expectedAssignment.actual_result)
          expect(res.body.title).to.eql(expectedAssignment.title)
          expect(res.body.notes).to.eql(expectedAssignment.notes)
          expect(res.body.category).to.eql(expectedAssignment.category)
          expect(res.body).to.have.property('assignment_id')
        })
    })
  })

  describe(`PATCH /api/assignments/:assignment_id`, () => {
    const testUsers = fixtures.makeUsersArray();
    const testClasses = fixtures.makeClassesArray();
    const testAssignments = fixtures.makeAssignmentsArray();

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

    beforeEach('insert assignments', () => {
      return db
        .into('assignments')
        .insert(testAssignments)
    })

    context(`Given no assignments`, () => {
      it(`responds with 404`, () => {
        const assignment_id = 123456
        return supertest(app)
          .patch(`/api/assignments/${assignment_id}`)
          .set('Authorization', fixtures.makeAuthHeader(testUsers[0]))
          .expect(404, { error: { message: `Assignment Not Found` } })
      })
    })

    context('Given there are assignments in the database', () => {
      it('responds with 204 and updates the class', () => {
        const idToUpdate = 1;
        const updateAssignment = {
          "class_id": 1,
          "due_date": new Date(),
          "title": "Updated Assignment 1",
          "notes": "Updated Notes 1",
          "category": "Homework"
        };

        const expectedAssignment = {
          ...testAssignments[idToUpdate - 1],
          ...updateAssignment
        };

        return supertest(app)
          .patch(`/api/assignments/${idToUpdate}`)
          .send(updateAssignment)
          .set('Authorization', fixtures.makeAuthHeader(testUsers[0]))
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/assignments/${idToUpdate}`)
              .set('Authorization', fixtures.makeAuthHeader(testUsers[0]))
              .expect(200)
              .expect(res => {
                expect(res.body.class_id).to.eql(expectedAssignment.class_id)
                const expectedDueDate = new Date().toLocaleString('en', { timeZone: 'UTC' })
                const actualDueDate = new Date(res.body.due_date).toLocaleString()
                expect(actualDueDate).to.eql(expectedDueDate)
                expect(res.body.title).to.eql(expectedAssignment.title)
                expect(res.body.notes).to.eql(expectedAssignment.notes)
                expect(res.body.category).to.eql(expectedAssignment.category)
                expect(res.body).to.have.property('assignment_id')
              })
          )
      })
    })
  });

  describe.only(`DELETE/api /assignments/:assignment_id`, () => {
    const testUsers = fixtures.makeUsersArray();

    beforeEach('insert users', () => {
      return db
        .into('users')
        .insert(testUsers)
    })

    context(`Given no assignments`, () => {
      it(`responds with 404`, () => {
        const assignment_id = 123456
        return supertest(app)
          .delete(`/api/assignments/${assignment_id}`)
          .set('Authorization', fixtures.makeAuthHeader(testUsers[0]))
          .expect(404, { error: { message: `Assignment Not Found` } })
      })
    });

    context('Given there are assignments in the database', () => {
      const testClasses = fixtures.makeClassesArray();
      const testAssignments = fixtures.makeAssignmentsArray();

      beforeEach('insert classes', () => {
        return db
          .into('classes')
          .insert(testClasses)
      })

      beforeEach('insert assignments', () => {
        return db
          .into('assignments')
          .insert(testAssignments)
      })

      it('responds with 204 and removes the assignment', () => {
        const idToRemove = 2
        const expectedAssignment = testAssignments.filter(assignment => assignment.assignment_id !== idToRemove)

        return supertest(app)
          .delete(`/api/assignments/${idToRemove}`)
          .set('Authorization', fixtures.makeAuthHeader(testUsers[0]))
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/assignments`)
              .set('Authorization', fixtures.makeAuthHeader(testUsers[0]))
              .expect(res => {
                for (let i = 0; i < expectedAssignment.length; i++) {
                  expect(res.body[i].class_id).to.eql(expectedAssignment[i].class_id)
                  const expectedDueDate = new Date(expectedAssignment[i].reported_on).getMonth() + new Date(expectedAssignment[i].reported_on).getDay() + new Date(expectedAssignment[i].reported_on).getFullYear()
                  const actualDueDate = new Date(res.body[i].due_date).getMonth() + new Date(res.body[i].due_date).getDay() + new Date(res.body[i].due_date).getFullYear()
                  expect(actualDueDate).to.eql(expectedDueDate)
                  expect(res.body[i].title).to.eql(expectedAssignment[i].title)
                  expect(res.body[i].notes).to.eql(expectedAssignment[i].notes)
                  expect(res.body[i].category).to.eql(expectedAssignment[i].category)
                  expect(res.body[i]).to.have.property('assignment_id')
                }
              })
          )
      })
    });
  });
});