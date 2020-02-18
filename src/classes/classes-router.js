const path = require('path');
const express = require('express');
const xss = require('xss');
const logger = require('../logger')
const ClassesService = require('./classes-service');

const classesRouter = express.Router();
const jsonParser = express.json();

const serializeClasses = schoolClass => ({
  class_id: schoolClass.class_id,
  class_name: xss(schoolClass.class_name),
  user_id: schoolClass.user_id,
  days: xss(schoolClass.days),
  times: xss(schoolClass.times),
  location: xss(schoolClass.location),
  room: xss(schoolClass.room)
})

classesRouter
  .route('/')

  .get((req, res, next) => {
    ClassesService.getAllClasses(req.app.get('db'))
      .then(classes => {
        res.json(classes.map(serializeClasses))
      })
      .catch(next)
  })

  .post(jsonParser, (req, res, next) => {
    const {
      class_name, user_id, days, times, location, room
    } = req.body

    const newClass = {
      class_name, user_id, days, times, location, room
    };

    for (const field of ['class_name', 'user_id']) {
      if (!newClass[field]) {
        logger.error(`${field} is required`)
        return res.status(400).send({
          error: { message: `Missing '${field}' in request body` }
        })
      }
    };

    ClassesService.insertClass(
      req.app.get('db'),
      newClass
    )
    .then(schoolClass => {
      logger.info(`Class with id ${schoolClass.class_id} created.`)
      res
        .status(201)
        .location(path.posix.join(req.originalUrl, `/${schoolClass.class_id}`))
        .json(serializeClasses(schoolClass))
    })
    .catch(next)

  })

  classesRouter
  .route('/:class_id')

  .all((req, res, next) => {
    ClassesService.getById(
      req.app.get('db'),
      req.params.class_id
    )
      .then(schoolClass => {
        if (!schoolClass) {
          return res.status(404).json({
            error: { message: 'Class Not Found' }
          })
        }
        res.schoolClass = schoolClass
        next()
      })
      .catch(next)
  })

  .get((req, res) => {
    res.json(serializeClasses(res.schoolClass))
  })

  .delete( (req, res, next) => {
    ClassesService.deleteClass(
      req.app.get('db'),
      req.params.class_id
    )
      .then( () => {
        res.status(204).end()
      })
      .catch(next)
  })

  .patch(jsonParser, (req, res, next) => {
    const {
      class_id, class_name, user_id, days, times, location, room
    } = req.body

    const classToUpdate = {
      class_id, class_name, user_id
    };

    const numberOfValues = Object.values(classToUpdate).filter(Boolean).length
    if (numberOfValues === 0) {
      return res.status(400).json({
        error: {
          message: `Request body must contain a class_id, class_name, and user_id`
        }
      })
    }

    classToUpdate.days = days;
    classToUpdate.times = times;
    classToUpdate.location = location;
    classToUpdate.room = room;

    ClassesService.updateClass(
      req.app.get('db'),
      req.params.class_id,
      classToUpdate
    )
      .then(numRowsAffected => {
        res.status(204).end()
      })
      .catch(next)

  })

module.exports = classesRouter;