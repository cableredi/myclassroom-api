const express = require('express');
const path = require('path');
const UsersService = require('./users-service');
const { requireAuth } = require('../middleware/jwt-auth');
const xss = require('xss');

const usersRouter = express.Router();
const jsonBodyParser = express.json();

const serializeStudents = student => ({
  user_id: student.user_id,
  teacher_user_id: student.teacher_user_id,
  first_name: xss(student.first_name),
  last_name: xss(student.last_name),
  user_name: xss(student.user_name),
  role: xss(student.role),
  date_created: new Date(student.date_created),
})

usersRouter
  .post('/', jsonBodyParser, (req, res, next) => {
    const { password, user_name, first_name, last_name, role, teacher_user_id } = req.body

    for (const field of ['first_name', 'last_name', 'role', 'user_name', 'password'])
      if (!req.body[field])
        return res.status(400).json({
          error: `Missing '${field}' in request body`
        })

    const userNameError = UsersService.validateUserName(user_name)
    if (userNameError)
      return res.status(400).json({ error: userNameError })

    const passwordError = UsersService.validatePassword(password)
    if (passwordError)
      return res.status(400).json({ error: passwordError })

    UsersService.hasUserWithUserName(
      req.app.get('db'),
      user_name
    )
      .then(hasUserWithUserName => {
        if (hasUserWithUserName)
          return res.status(400).json({ error: `Username already taken` })

        return UsersService.hashPassword(password)
          .then(hashedPassword => {
            const newUser = {
              user_name,
              password: hashedPassword,
              first_name,
              last_name,
              role,
              teacher_user_id,
              date_created: 'now()',
            }

            return UsersService.insertUser(
              req.app.get('db'),
              newUser
            )
              .then(user => {
                res
                  .status(201)
                  .location(path.posix.join(req.originalUrl, `/${user.user_id}`))
                  .json(UsersService.serializeUser(user))
              })
          })
      })
      .catch(next)
  });

  usersRouter
    .get('/', requireAuth, (req, res, next) => {
      userInfo = req.user.user_id;
  
      UsersService.getStudents(
        req.app.get('db'),
        userInfo
      )
        .then(students => {
          res.json(students.map(serializeStudents))
        })
        .catch(next)
    })

module.exports = usersRouter;