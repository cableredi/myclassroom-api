const jwt = require('jsonwebtoken');

function makeUsersArray() {
  return [
    {
      user_id: 1,
      user_name: 'test-user-1',
      first_name: 'user first 1',
      last_name: 'user last 1',
      role: 'teacher',
      password: '$2a$12$YslIk77V5HvK2BG4Rzw57OMm1sTx0ssMCURA6njiYO.SohOgAAc7y',
      date_created: new Date('2029-01-22T16:28:32.615Z'),
    },
    {
      user_id: 2,
      user_name: 'test-user-2',
      first_name: 'user first 2',
      last_name: 'user last 2',
      role: 'student',
      password: '$2a$12$YslIk77V5HvK2BG4Rzw57OMm1sTx0ssMCURA6njiYO.SohOgAAc7y',
      date_created: new Date('2029-01-22T16:28:32.615Z'),
    },
  ]
};

function makeAssignmentsArray() {
  return [
    {
      "assignment_id": 1,
      "class_id": 1,
      "due_date": "2020-02-08T12:00:00-06:30",
      "title": "Test Assignment 1",
      "notes": "Test Notes 1",
      "category": "Homework"
    },
    {
      "assignment_id": 2,
      "class_id": 2,
      "due_date": "2020-02-08T12:00:00-06:30",
      "title": "Test Assignment 2",
      "notes": "Test Notes 2",
      "category": "Test"
    },
  ]
};

function makeExpectedAssignment() {
  return {
    "assignment_id": 2,
    "class_id": 2,
    "due_date": "2020-02-08T12:00:00-06:30",
    "title": "Test Assignment 2",
    "notes": "Test Notes 2",
    "category": "Test"
  }
};

function makeClassesArray() {
  return [
    {
      "class_id": 1,
      "class_name": "Test Class 1",
      "user_id": 1,
      "days": "days 1",
      "times": "times 1",
      "location": "Location 1",
      "room": "Room 1",
    },
    {
      "class_id": 2,
      "class_name": "Test Class 2",
      "user_id": 1,
      "days": "days 2",
      "times": "times 2",
      "location": "Location 2",
      "room": "Room 2",
    },
  ]
};

function makeExpectedClass() {
  return {
    "class_id": 1,
    "class_name": "Test Class 1",
    "user_id": 1,
    "days": "days 1",
    "times": "times 1",
    "location": "Location 1",
    "room": "Room 1",
  }
};

function makeAuthHeader(user, secret = process.env.JWT_SECRET) {
  const token = jwt.sign({ user_id: user.user_id }, secret, {
    subject: user.user_name,
    algorithm: 'HS256',
  })
  
  return `Bearer ${token}`
};


module.exports = {
  makeUsersArray,
  makeAssignmentsArray,
  makeExpectedAssignment,
  makeClassesArray,
  makeExpectedClass,
  makeAuthHeader,
};