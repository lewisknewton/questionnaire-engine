'use strict';

const fs = require('fs');
const path = require('path');

const { generateShortId, isFilled, isInArray } = require('./common');
const config = require('../config.json');
const queries = require('./database/queries');
const dbClient = require('./database/db-client');

const qnrs = [];
const { directory: localDir } = config.questionnaires;

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
async function addQuestionnaire(qnr) {
  const shortId = generateShortId();
  const { path } = qnr;

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
    if (err.code === 'ENOENT') return null;
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
 * Retrieves all stored records about questionnaires in the database.
 */
async function selectQuestionnaireRecords() {
  try {
    const result = await dbClient.query(queries.selectQuestionnaireRecords);

    return result.rows;
  } catch (err) {
    console.error(err);
  }
}

/**
 * Removes a questionnaire from the questionnaire array shown to users.
 */
async function removeQuestionnaire(id) {
  const existing = await isInArray(qnrs, 'id', id)[0];

  for (let i = 0; i < qnrs.length; i += 1) {
    if (qnrs[i] === existing) {
      qnrs.splice(i, 1);
      i -= 1;
    }
  }
}

/**
 * Removes the stored records about a questionnaire in the database, using its
 * unique ID. Also removes related records, including its responses.
 */
async function deleteQuestionnaireRecords(id) {
  try {
    const result = await dbClient.query(queries.deleteQuestionnaire, [id]);

    return result.rows[0];
  } catch (err) {
    console.error(err);
  }
}

/**
 * Deletes a questionnaire file stored in the local directory, using its path.
 */
async function deleteQuestionnaireFile(path) {
  try {
    await fs.promises.unlink(path);
  } catch (err) {
    console.error(err);
  }
}

/**
 * Removes a questionnaire's stored records in the database and its
 * related file, using its short ID.
 */
async function deleteQuestionnaire(id) {
  const qnr = await selectQuestionnaireByShortId(id);

  if (isFilled(qnr, true)) {
    const { id: qnrUniqueId, path } = qnr;

    await removeQuestionnaire(id);
    await deleteQuestionnaireRecords(qnrUniqueId);
    await deleteQuestionnaireFile(path);
  }
}

/**
 * Ensures the database contains records only for files stored in the
 * local directory.
 */
async function keepUpToDate(records) {
  for (const record of records) {
    const { id, shortId, path } = record;
    const file = await readQuestionnaireFile(path);

    if (file == null) {
      await removeQuestionnaire(shortId);
      await deleteQuestionnaireRecords(id);
    }
  }
}

/**
 * Checks if all the properties of two questionnaires are identical or different.
 */
function isSame(old, current) {
  if (typeof old === 'object' && typeof current === 'object') {
    const existingProps = Object.getOwnPropertyNames(old);
    const incomingProps = Object.getOwnPropertyNames(current);

    if (existingProps.length !== incomingProps.length) return false;

    for (let i = 0; i < existingProps.length; i += 1) {
      const prop = existingProps[i];

      if (old[prop] !== current[prop]) {
        if (Array.isArray(old[prop]) && Array.isArray(current[prop])) {
          if (old[prop].length !== current[prop].length) return false;

          for (const sub in old[prop]) isSame(old[prop][sub], current[prop][sub]);
        } else {
          return false;
        }
      }
    }
  } else {
    if (old !== current) return false;
  }

  return true;
}

/**
 * Retrieves all questionnaires in the local directory.
 */
async function selectQuestionnaires(dir = localDir) {
  try {
    const itemStats = await getStats(dir);
    const records = await selectQuestionnaireRecords();

    await keepUpToDate(records);

    // Add questionnaires stored in the local directory
    for (const name in itemStats) {
      if (itemStats[name].isFile) {
        const path = itemStats[name].path;
        const file = await readQuestionnaireFile(path);
        let qnr = { ...file, path };

        // Check if the questionnaire already has a record in the database
        const record = await isInArray(records, 'path', qnr.path)[0];

        if (record == null) {
          qnr = Object.assign(qnr, await addQuestionnaire(qnr));
        } else {
          qnr.id = record.shortId;
        }

        // Check if the questionnaire has already been selected
        const inArray = await isInArray(qnrs, 'id', qnr.id);

        // Hide the path from users
        delete qnr.path;

        if (isFilled(inArray)) {
          const old = inArray[0];

          if (!isSame(old, qnr)) qnrs[qnrs.indexOf(old)] = qnr;
        } else {
          qnrs.push(qnr);
        }
      } else {
        // If the item is a directory, look for questionnaires inside it
        await selectQuestionnaires(`${dir}/${name}`);
      }
    }

    return qnrs;
  } catch (err) {
    console.error(err);
  }
}

/**
 * Retrieves a single questionnaire using its short ID.
 */
async function selectQuestionnaire(id) {
  // Fetch records in the database
  const qnr = await selectQuestionnaireByShortId(id);

  if (!isFilled(qnr, true)) return;

  const { shortId, path } = qnr;

  return { id: shortId, ...await readQuestionnaireFile(path) };
}

module.exports = {
  generateShortId,
  deleteQuestionnaire,
  readQuestionnaireFile,
  selectQuestionnaire,
  selectQuestionnaireByShortId,
  selectQuestionnaires,
};
