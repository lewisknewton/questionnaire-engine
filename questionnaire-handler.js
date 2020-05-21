'use strict';

const fs = require('fs');
const path = require('path');

const common = require('./common');
const queries = require('./database/queries');
const dbClient = require('./db-client');

const questionnaires = [];
const localDir = './questionnaires';

/**
 * Generates a URL-friendly ID for a resource (i.e. questionnaire or response).
 */
function generateID() {
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
  const id = generateID();
  const { path } = questionnaire;

  try {
    const result = await dbClient.query(queries.addQuestionnaire, [id, path]);

    return result.rows[0];
  } catch (err) {
    console.log(err);
  }
}

/**
 * Retrieves the database records associated with a questionnaire
 * by its URL-friendly ID.
 */
async function selectQuestionnaireByID(id) {
  try {
    const result = await dbClient.query(queries.selectQuestionnaireByID, [id]);

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
 * Retrieves a single questionnaire using its URL-friendly ID.
 */
async function selectQuestionnaire(id) {
  const { path } = await selectQuestionnaireByID(id);

  try {
    const file = await fs.promises.readFile(path);

    return JSON.parse(file);
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
        const file = await fs.promises.readFile(path);
        const copyInDB = await selectQuestionnaireByPath(path);

        let questionnaire = { ...JSON.parse(file), path };

        if (copyInDB == null) {
          questionnaire = Object.assign(questionnaire, await addQuestionnaire(questionnaire));
        } else {
          questionnaire = Object.assign(questionnaire, await selectQuestionnaireByPath(path));
        }

        const inArray = await common.isInArray(questionnaires, 'path', questionnaire.path);

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
 * Stores a response for a given questionnaire in the database.
 */
async function addResponse(response) {
  console.log(response);
}

module.exports = {
  selectQuestionnaire,
  selectQuestionnaires,
  addResponse,
};
