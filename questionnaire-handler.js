'use strict';

const fs = require('fs');
const path = require('path');

const { isFilled, isInArray } = require('./common');
const queries = require('./database/queries');
const dbClient = require('./database/db-client');

const questionnaires = [];
const localDir = './questionnaires';

/**
 * Generates a short ID for a resource (i.e. questionnaire or response).
 */
function generateShortId() {
  return Number(new Date()).toString(36);
}

/**
 * Retrieves information about directories and files.
 */
async function getStats(dirPath) {
  const itemStats = {};
  const items = await fs.promises.readdir(dirPath);

  for (const item of items) {
    const filePath = path.join(dirPath, item);
    const stats = await fs.promises.stat(filePath);

    itemStats[item] = { path: filePath, isFile: stats.isFile() };
  }

  return itemStats;
}

/**
 * Stores a given questionnaire in the database.
 */
async function addQuestionnaire(questionnaire) {
  const shortId = generateShortId();
  const { path } = questionnaire;

  try {
    const result = await dbClient.query(queries.addQuestionnaire, [shortId, path]);

    return result.rows[0];
  } catch (err) {
    console.error(err);
  }
}

/**
 * Reads a questionnaire file using a given path and parses it as JSON.
 */
async function readQuestionnaireFile(path) {
  if (!isFilled(path)) return;

  try {
    const file = await fs.promises.readFile(path);

    return JSON.parse(file);
  } catch (err) {
    console.error(err);
  }
}

/**
 * Retrieves the database records associated with a questionnaire
 * by its short ID.
 */
async function selectQuestionnaireByShortId(id) {
  try {
    const result = await dbClient.query(queries.selectQuestionnaireByShortId, [id]);

    return result.rows[0];
  } catch (err) {
    console.error(err);
  }
}

/**
 * Retrieves the database records associated with a questionnaire
 * by its file path.
 */
async function selectQuestionnaireByPath(path) {
  try {
    const result = await dbClient.query(queries.selectQuestionnaireByPath, [path]);

    return result.rows[0];
  } catch (err) {
    console.error(err);
  }
}

/**
 * Retrieves all questionnaires in the local directory.
 */
async function selectQuestionnaires(dir = localDir) {
  try {
    const itemStats = await getStats(dir);

    // Add questionnaires stored in the local directory
    for (const name in itemStats) {
      if (itemStats[name].isFile) {
        const path = itemStats[name].path;
        const file = await readQuestionnaireFile(path);
        const copyInDB = await selectQuestionnaireByPath(path);

        let questionnaire = { ...file, path };

        if (copyInDB == null) {
          questionnaire = Object.assign(questionnaire, await addQuestionnaire(questionnaire));
        } else {
          const { shortId } = await selectQuestionnaireByPath(path);
          questionnaire.id = shortId;
        }

        const inArray = await isInArray(questionnaires, 'path', questionnaire.path);

        if (!inArray) {
          questionnaires.push(questionnaire);
        }
      } else {
        // If the item is a directory, look for questionnaires inside it
        await selectQuestionnaires(`${dir}/${name}`);
      }
    }

    return questionnaires;
  } catch (err) {
    console.error(err);
  }
}

/**
 * Retrieves a single questionnaire using its short ID.
 */
async function selectQuestionnaire(id) {
  // Fetch records in the database
  const questionnaire = await selectQuestionnaireByShortId(id);

  if (!isFilled(questionnaire, true)) return;

  const { shortId, path } = questionnaire;

  return { id: shortId, ...await readQuestionnaireFile(path), path };
}

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
    insertedResponse.answers = answers;

    for (const question in insertedResponse.answers) {
      // Insert all answers in the response
      const answer = {
        content: answers[question],
        questionId: question,
        responseId: insertedResponse.id,
      };

      insertedResponse.answers = { ...await addAnswer(answer) };
    }

    return insertedResponse;
  } catch (err) {
    console.error(err);
  }
}

/**
 * Retrieves all responses for a given questionnaire, using
 * the questionnaire's short ID.
 */
async function selectResponses(questionnaireId) {
  const questionnaire = await selectQuestionnaireByShortId(questionnaireId);

  if (!isFilled(questionnaire, true)) return;

  const { id: qId, shortId, path } = questionnaire;

  try {
    const result = await dbClient.query(queries.selectResponses, [qId]);
    const responses = isFilled(result.rows) ? result.rows : [];

    const { name, questions } = await readQuestionnaireFile(path);

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

module.exports = {
  generateShortId,
  selectQuestionnaires,
  selectQuestionnaire,
  addResponse,
  selectResponses,
};
