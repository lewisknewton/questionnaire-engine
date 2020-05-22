'use strict';

const qh = require('../questionnaire-handler');

const { isFilled } = require('../common');
const { codes, errors } = require('../status');

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
  }

  if (!isFilled(result.questions)) {
    return res.status(codes.noContent).json({ error: errors.questionnaireNoQuestions });
  }

  res.json(result);
}

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
 * Stores the user's response for a given questionnaire.
 */
async function postResponse(req, res) {
  const questionnaireId = req.params.id;
  const body = req.body;
  const answers = body.answers;

  if (!isFilled(questionnaireId)) {
    return res.status(codes.badRequest).json({ error: errors.questionnaireNotSelected });
  }

  if (!isFilled(answers, true)) {
    return res.status(codes.badRequest).json({ error: errors.questionnaireNoAnswers });
  }

  const result = await qh.addResponse(body);

  if (!isFilled(result, true)) {
    return res.status(codes.internalServerErr).json({ error: errors.responseNotSaved });
  }

  return res.status(codes.created)
    .json({ success: 'Thank you, your response has been saved.', result });
}

module.exports = {
  getQuestionnaire,
  getQuestionnaires,
  postResponse,
};
