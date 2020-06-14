'use strict';

const { generateShortId, isFilled } = require('./common');
const { readQuestionnaireFile, selectQuestionnaireByShortId } = require('./questionnaire-handler');
const queries = require('./database/queries');
const dbClient = require('./database/db-client');

/**
 * Stores an answer for a given response, including the reference to the
 * question for which the answer was given.
 */
async function addAnswer(answer) {
  const { content, questionId, responseId } = answer;

  try {
    const result = await dbClient.query(queries.addAnswer, [questionId, content, responseId]);

    return result.rows[0];
  } catch (err) {
    console.error(err);
  }
}

/**
 * Stores a response for a given questionnaire, using the
 * answers stored in the response and the questionnaire's unique ID.
 */
async function addResponse(response) {
  const shortId = generateShortId();
  const { answers, questionnaireId } = response;
  const { id } = await selectQuestionnaireByShortId(questionnaireId);

  try {
    const result = await dbClient.query(queries.addResponse, [shortId, id]);
    const insertedResponse = result.rows[0];
    insertedResponse.answers = [];

    for (const qn in answers) {
      // Insert all answers in the response
      const answer = {
        content: answers[qn],
        questionId: qn,
        responseId: insertedResponse.uniqueId,
      };

      if (Array.isArray(answer.content) && isFilled(answer.content)) {
        // Insert values individually for multi-select questions
        for (const value of answer.content) {
          answer.content = value;
          insertedResponse.answers.push(await addAnswer(answer));
        }
      } else {
        // Insert whole values for all other question types
        insertedResponse.answers.push(await addAnswer(answer));
      }
    }

    // Hide the primary key from users
    delete insertedResponse.uniqueId;

    return insertedResponse;
  } catch (err) {
    console.error(err);
  }
}

/**
 * Retrieves all responses for a given questionnaire, using
 * the questionnaire's short ID.
 */
async function selectResponses(qnrId) {
  const qnr = await selectQuestionnaireByShortId(qnrId);

  if (!isFilled(qnr, true)) return;

  const { id: qnrUniqueId, shortId, path } = qnr;

  try {
    const result = await dbClient.query(queries.selectResponses, [qnrUniqueId]);
    const responses = isFilled(result.rows) ? result.rows : [];

    const { name, questions } = await readQuestionnaireFile(path);
    const order = questions.map(qn => qn.id);

    for (const response of responses) {
      const sortable = [];

      for (const answer of response.answers) {
        const type = questions
          .filter(qn => qn.id === answer.questionId)
          .map(qn => qn.type)[0];

        if (answer.content.length === 1) {
          // Replace nulls with empty arrays for multi-select questions
          if (type === 'multi-select' && !isFilled(answer.content)) answer.content = [];

          // Replace one-item arrays with single values for other questions
          answer.content = answer.content[0];
        }

        const index = order.indexOf(answer.questionId);
        sortable.push([index, answer]);
      }

      // Retain the original question order in answers
      response.answers = sortable.sort().map(item => item[1]);
    }

    return {
      questionnaireId: shortId,
      name,
      hasQuestions: isFilled(questions),
      responses,
    };
  } catch (err) {
    console.error(err);
  }
}

/**
 * Removes responses' stored records in the database and their related answers,
 * using their related questionnaire's short ID.
 */
async function deleteResponses(qnrId) {
  const qnr = await selectQuestionnaireByShortId(qnrId);

  if (isFilled(qnr, true)) {
    const { id: qnrUniqueId } = qnr;

    try {
      const result = await dbClient.query(queries.deleteResponses, [qnrUniqueId]);

      return result.rows[0];
    } catch (err) {
      console.error(err);
    }
  }
}

module.exports = {
  addResponse,
  selectResponses,
  deleteResponses,
};
