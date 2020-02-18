const path = require('path');
const express = require('express');
const xss = require('xss');
const logger = require('../logger')
const AssignmentsService = require('./assignments-service');

const assignmentsRouter = express.Router();
const jsonParser = express.json();

const serializeAssignments = assignment => ({
  assignment_id: assignment.assignment_id,
  class_id: assignment.class_id,
  due_date: assignment.due_date,
  title: xss(assignment.title),
  notes: xss(assignment.notes),
  category: xss(assignment.category),
  class_name: assignment.class_name
})

assignmentsRouter
  .route('/')

  .get((req, res, next) => {
    AssignmentsService.getAllAssignments(req.app.get('db'))
      .then(assignments => {
        res.json(assignments.map(serializeAssignments))
      })
      .catch(next)
  })

  .post(jsonParser, (req, res, next) => {
    const {
      class_id, due_date, title, notes, category
    } = req.body

    const newAssignment = {
      class_id, due_date, title, notes, category
    };

    for (const field of ['class_id', 'due_date', 'title', 'notes', 'category']) {
      if (!newAssignment[field]) {
        logger.error(`${field} is required`)
        return res.status(400).send({
          error: { message: `Missing '${field}' in request body` }
        })
      }
    };

    AssignmentsService.insertAssignment(
      req.app.get('db'),
      newAssignment
    )
    .then(assignment => {
      logger.info(`Assignments with id ${assignment.assignment_id} created.`)
      res
        .status(201)
        .location(path.posix.join(req.originalUrl, `/${assignment.assignment_id}`))
        .json(serializeAssignments(assignment))
    })
    .catch(next)

  })

assignmentsRouter
  .route('/:assignment_id')

  .all((req, res, next) => {
    AssignmentsService.getById(
      req.app.get('db'),
      req.params.assignment_id
    )
      .then(assignment => {
        if (!assignment) {
          return res.status(404).json({
            error: { message: 'Assignment Not Found' }
          })
        }
        res.assignment = assignment
        next()
      })
      .catch(next)
  })

  .get((req, res) => {
    res.json(serializeAssignments(res.assignment))
  })

  .delete( (req, res, next) => {
    AssignmentsService.deleteAssignment(
      req.app.get('db'),
      req.params.assignment_id
    )
      .then( () => {
        res.status(204).end()
      })
      .catch(next)
  })

  .patch(jsonParser, (req, res, next) => {
    const {
      class_id, due_date, title, notes, category
    } = req.body

    const assignemntToUpdate = {
      class_id, due_date, title, notes, category
    };

    const numberOfValues = Object.values(assignemntToUpdate).filter(Boolean).length
    if (numberOfValues === 0) {
      return res.status(400).json({
        error: {
          message: `Request body must contain a class_id, due_date, title, notes, and category`
        }
      })
    }

    AssignmentsService.updateAssignment(
      req.app.get('db'),
      req.params.assignment_id,
      assignemntToUpdate
    )
      .then(updatedAssignement => {
        console.log('updatedAssign', updatedAssignement)
        res
        .status(201)
        .json(serializeAssignments(updatedAssignement))
      })
      .catch(next)

  })

module.exports = assignmentsRouter;