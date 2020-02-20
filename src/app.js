require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { CLIENT_ORIGIN } = require('./config');
const errorHandler = require('./error-handler');
const assignmentsRouter = require('./assignments/assignments-router');
const classesRouter = require('./classes/classes-router');

const app = express();

app.use(morgan((CLIENT_ORIGIN === 'production') ? 'tiny' : 'common', {
  skip: () => CLIENT_ORIGIN === 'test',
}))
app.use(cors());
app.use(helmet());

app.use('/api/assignments', assignmentsRouter);
app.use('/api/classes', classesRouter);

app.get('/', (req, res) => {
  res.json({ok: true});
});

/* Error handling */
app.use(errorHandler);

module.exports = app;