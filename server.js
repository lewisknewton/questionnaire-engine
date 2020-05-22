'use strict';

const { isFilled } = require('./common');
const qh = require('./questionnaire-handler');
const { codes, errors } = require('./status');
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
    return res.status(codes.notFound).json({ error: errors.questionnairesNotFound });
  }

  res.json(result);
}

/**
 * Retrieves a single questionnaire using its URL-friendly ID, passed via the request.
 */
async function getQuestionnaire(req, res) {
  const id = req.params.id;

  if (!isFilled(id)) {
    return res.status(codes.badRequest).json({ error: errors.questionnaireNotSelected });
  }

  const result = await qh.selectQuestionnaire(id);

  if (!isFilled(result, true)) {
    return res.status(codes.notFound).json({ error: errors.questionnaireNotFound(id) });
  } else if (!isFilled(result.questions)) {
    return res.status(codes.noContent).json({ error: errors.questionnaireNoQuestions });
  }

  res.json(result);
}

/**
 * Stores the user's response for a given questionnaire.
 */
async function postResponse(req, res) {
  const qID = req.params.id;
  const body = req.body;
  const answers = body.answers;

  if (!isFilled(qID)) {
    return res.status(codes.badRequest).json({ error: errors.questionnaireNotSelected });
  }

  if (!isFilled(answers, true)) {
    return res.status(codes.badRequest).json({ error: errors.questionnaireNoAnswers });
  }

  const result = await qh.addResponse(body);

  if (!isFilled(result, true)) {
    res.status(codes.internalServerErr).json({ error: errors.responseNotSaved });
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
