'use strict';

const fs = require('fs');
const path = require('path');

const { isFilled, isInArray } = require('./common');
const queries = require('./database/queries');
const dbClient = require('./db-client');

const questionnaires = [];
const localDir = './questionnaires';

/**
 * Generates a URL-friendly ID for a resource (i.e. questionnaire or response).
 */
function generateId() {
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
  const id = generateId();
  const { path } = questionnaire;

  try {
    const result = await dbClient.query(queries.addQuestionnaire, [id, path]);

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
 * by its URL-friendly ID.
 */
async function selectQuestionnaireById(id) {
  try {
    const result = await dbClient.query(queries.selectQuestionnaireById, [id]);

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
          questionnaire = Object.assign(questionnaire, await selectQuestionnaireByPath(path));
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
 * Retrieves a single questionnaire using its URL-friendly ID.
 */
async function selectQuestionnaire(id) {
  // Fetch records in the database
  const questionnaire = await selectQuestionnaireById(id);

  if (!isFilled(questionnaire, true)) return;

  const { path } = questionnaire;

  return readQuestionnaireFile(path);
}

/**
 * Stores a response for a given questionnaire.
 */
async function addResponse(response) {
  const id = generateId();
  const { uniqueId } = await selectQuestionnaireById(response.questionnaireId);

  try {
    const result = await dbClient.query(queries.addResponse, [id, uniqueId]);

    return result.rows[0];
  } catch (err) {
    console.error(err);
  }
}

/**
 * Retrieves all responses for a given questionnaire.
 */
async function selectResponses(questionnaireId) {
  const questionnaire = await selectQuestionnaireById(questionnaireId);

  if (!isFilled(questionnaire, true)) return;

  const { uniqueId } = questionnaire;

  try {
    const result = await dbClient.query(queries.selectResponses, [uniqueId]);

    return isFilled(result.rows) ? result.rows : [];
  } catch (err) {
    console.error(err);
  }
}

module.exports = {
  selectQuestionnaires,
  selectQuestionnaire,
  addResponse,
  selectResponses,
};
