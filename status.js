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
  questionnaireNoQuestions:
    'Sorry, no questions have been added to this questionnaire yet. Please check back later.',
  questionnaireNotFound:
    id => `Sorry, no questionnaire of ID '${id}' could be found. Please check the ID and try again.`,
  questionnaireNotSelected:
    'Sorry, no questionnaire was selected. Please try again using the ID of the questionnaire.',
  questionnairesNotFound:
    'Sorry, no questionnaires were found. Please add them to the questionnaires folder.',
  responseNoAnswers:
    'Sorry, no answers have been provided. Please re-attempt the questionnaire and try submitting again.',
  responseNotSaved:
    'Sorry, your response could not be saved at this time. Please try submitting again.',
};

// Custom warning messages
const warnings = {
  questionnaireNoQuestionsCreator:
    'No questions have been added to this questionnaire yet. Please add at least one question for your participants to answer.',
  responsesNotFound:
    id => `Sorry, no responses for questionnaire of ID '${id}' have been given yet. Please check back later.`,
};

module.exports = {
  codes,
  errors,
  warnings,
};
