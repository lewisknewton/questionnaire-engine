'use strict';

const codes = {
  ok: 200,
  created: 201,
  noContent: 204,
  badRequest: 400,
  notFound: 404,
  internalServerErr: 500,
};

// Custom error messages
const errors = {
  questionnaireNoAnswers:
    'Sorry, no answers have been provided. Please re-attempt the questionnaire and try again.',
  questionnaireNotFound:
    id => `Sorry, no questionnaire of ID '${id}' could be found.`,
  questionnaireNoQuestions:
    'Sorry, this questionnaire does not have any questions yet.',
  questionnaireNotSelected:
    'Sorry, no questionnaire was selected. Please try again.',
  questionnairesNotFound:
    'Sorry, no questionnaires were found.',
  responseNotSaved:
    'Sorry, your response could not be saved at this time. Please try again.',
  responsesNotFound:
    id => `Sorry, no responses for questionnaire of ID '${id}' could be found.`,
};

module.exports = {
  codes,
  errors,
};
