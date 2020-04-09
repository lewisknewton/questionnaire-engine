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
    res.status(codes.notFound)
      .json({ error: 'Sorry, no questionnaires were found.' });
    return;
  }

  res.json(result);
}

/**
 * Retrieves a single questionnaire using its unique name passed via the request.
 */
async function getQuestionnaire(req, res) {
  const name = req.params.name;

  if (name == null || name === 'null') {
    res.status(codes.badRequest)
      .json({ error: 'Sorry, no questionnaire was selected. Please try again.' });
    return;
  }

  const result = await qh.selectQuestionnaire(name);

  if (!result) {
    res.status(codes.notFound)
      .json({ error: `Sorry, no questionnaire named '${name}' could be found.` });
    return;
  }

  if (result.questions == null || result.questions.length === 0) {
    res.status(codes.notFound)
      .json({ error: 'Sorry, this questionnaire does not have any questions yet.' });
    return;
  }

  res.json(result);
}

/**
 * Stores the user's response for a given questionnaire.
 */
async function postResponse(req, res) {
  const body = req.body;
  const name = req.params.name;
  const answers = body.answers;

  if (name == null || name === 'null') {
    res.status(codes.badRequest)
      .json({ error: 'Sorry, no questionnaire was associated with this response. Please try again.' });
    return;
  } else if (answers == null || Object.keys(answers).length === 0) {
    res.status(codes.badRequest)
      .json({ error: 'Sorry, no answers have been provided. Please try again.' });
    return;
  }

  const result = await qh.addResponse(name, body);

  res.status(codes.created)
    .json({ success: 'Thank you, your response has been saved.', result });
}

// Serve client files
app.use('/', express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

// Define API routes
router.get('/questionnaires', getQuestionnaires);
router.get('/questionnaires/:name', getQuestionnaire);
router.post('/questionnaires/:name/responses', express.json(), postResponse);

app.use('/api', router);

app.listen(port);

module.exports = app;
