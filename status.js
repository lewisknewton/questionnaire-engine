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
  questionnaireNotFound:
    id => `Sorry, no questionnaire of ID '${id}' could be found.`,
  questionnaireNotSelected:
    'Sorry, no questionnaire was selected. Please try again.',
  questionnairesNotFound:
    'Sorry, no questionnaires were found.',
  responseNoAnswers:
    'Sorry, no answers have been provided. Please re-attempt the questionnaire and try again.',
  responseNotSaved:
    'Sorry, your response could not be saved at this time. Please try again.',
  responsesNotFound:
    id => `Sorry, no responses for questionnaire of ID '${id}' could be found.`,
};

// Custom warning messages
const warnings = {
  questionnaireNoQuestionsCreator:
    'No questions have been added to this questionnaire yet. Please add at least one question for your participants to answer.',
  responsesNotFound:
    id => `Sorry, no responses for questionnaire of ID '${id}' have been given yet.`,
};

module.exports = {
  codes,
  errors,
  warnings,
};
