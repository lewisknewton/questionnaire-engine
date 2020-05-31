'use strict';

const qh = require('../questionnaire-handler');

const { isFilled } = require('../common');
const { codes, errors, warnings } = require('../status');

/**
 * Retrieves all stored questionnaires.
 */
async function getQuestionnaires(req, res) {
  const result = await qh.selectQuestionnaires();

  if (!isFilled(result, true)) {
    return res.status(codes.notFound).json({ error: errors.questionnairesNotFound });
  }

  return res.json(result);
}

/**
 * Retrieves a single questionnaire using its short ID, passed via the request.
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
    return res.json({ ...result, warning: warnings.questionnaireNoQuestions });
  }

  return res.json(result);
}

/**
 * Retrieves all responses for a given questionnaire using its short
 * ID, passed via the request.
 */
async function getResponses(req, res) {
  const questionnaireId = req.params.id;

  if (!isFilled(questionnaireId)) {
    return res.status(codes.badRequest).json({ error: errors.questionnaireNotSelected });
  }

  const result = await qh.selectResponses(questionnaireId);

  if (!isFilled(result, true)) {
    // The questionnaire does not exist
    return res.status(codes.notFound).json({ error: errors.questionnaireNotFound(questionnaireId) });
  }

  if (result.questions.length === 0) {
    // The questionnaire exists, but no questions were provided
    return res.json({ ...result, warning: warnings.questionnaireNoQuestionsCreator });
  }

  if (result.responses.length === 0) {
    // The questionnaire exists, but no responses have been given yet
    return res.json({ ...result, warning: warnings.responsesNotFound(questionnaireId) });
  }

  return res.json(result);
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
    return res.status(codes.badRequest).json({ error: errors.responseNoAnswers });
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
  getResponses,
  postResponse,
};
