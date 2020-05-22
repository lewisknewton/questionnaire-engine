'use strict';

const { isFilled } = require('./common');
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

  if (!isFilled(result, true)) {
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
  const id = req.params.id;

  if (!isFilled(id)) {
    res.status(codes.badRequest)
      .json({ error: 'Sorry, no questionnaire was selected. Please try again.' });
    return;
  }

  const result = await qh.selectQuestionnaire(id);

  if (!isFilled(result, true)) {
    res.status(codes.notFound)
      .json({ error: `Sorry, no questionnaire of ID '${id}' could be found.` });
    return;
  } else if (!isFilled(result.questions)) {
    res.json({ error: 'Sorry, this questionnaire does not have any questions yet.' });
    return;
  }

  res.json(result);
}

/**
 * Stores the user's response for a given questionnaire.
 */
async function postResponse(req, res) {
  const body = req.body;
  const qID = req.params.id;
  const answers = body.answers;

  if (!isFilled(qID)) {
    res.status(codes.badRequest)
      .json({ error: 'Sorry, no questionnaire was associated with this response. Please try again.' });
    return;
  } else if (!isFilled(answers, true)) {
    res.status(codes.badRequest)
      .json({ error: 'Sorry, no answers have been provided. Please try again.' });
    return;
  }

  const result = await qh.addResponse(body);

  if (!isFilled(result, true)) {
    res.status(codes.internalServerErr)
      .json({ error: 'Sorry, your response could not be saved at this time. Please try again.' });
  } else {
    res.status(codes.created)
      .json({ success: 'Thank you, your response has been saved.', result });
  }
}

// Serve client files
app.use('/', express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

// Define API routes
router.get('/questionnaires', getQuestionnaires);
router.get('/questionnaires/:id', getQuestionnaire);
router.post('/questionnaires/:id/responses', express.json(), postResponse);

app.use('/api', router);

const server = app.listen(port);

module.exports = server;
