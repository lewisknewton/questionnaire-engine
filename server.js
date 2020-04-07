'use strict';

const qh = require('./questionnaire-handler');
const { codes } = require('./status');
const express = require('express');
const path = require('path');

const router = express.Router();
const app = express();
const port = 8080;

/**
 * Retrieves all stored questionnaires.
 */
async function getQuestionnaires(req, res) {
  const result = await qh.selectQuestionnaires();

  if (!result) {
    res.status(codes.notFound).json({ error: 'Sorry, no questionnaires were found.' });
    return;
  }

  res.json(result);
}

/**
 * Retrieves a single questionnaire using its unique name passed via the request.
 */
async function getQuestionnaire(req, res) {
  const name = req.params.name;
  const result = await qh.selectQuestionnaire(name);

  if (name === 'null' || name == null) {
    res.status(codes.badRequest).json({ error: 'Sorry, no questionnaire was selected. Please try again.' });
  } else if (!result) {
    res.status(codes.notFound).json({ error: `Sorry, no questionnaire named '${name}' could be found.` });
    return;
  }

  res.json(result);
}

/**
 * Stores the user's response for a given questionnaire.
 */
async function postResponse(req, res) {
  const result = await qh.addResponse(req.params.name, req.body);

  res.json(result);
}

// Serve client files
app.use('/', express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

// Define API routes
router.get('/questionnaires', getQuestionnaires);
router.get('/questionnaires/:name', getQuestionnaire);
router.post('/questionnaires/:name', express.json(), postResponse);

app.use('/api', router);

app.listen(port);

module.exports = app;
