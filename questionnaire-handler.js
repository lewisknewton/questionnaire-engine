'use strict';

const fs = require('fs');
const path = require('path');
const dbClient = require('./db-client');

const localDir = './questionnaires';

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
 * Checks whether a local questionnaire has already been copied into the database.
 */
async function selectDBCopy(path) {
  try {
    const query = `
      SELECT id,
             unique_id AS "uniqueId", 
             name, 
             scored, 
             file_path AS path
      FROM   questionnaire 
      WHERE  file_path = $1
    `;
    const result = await dbClient.query(query, [path]);

    // Return the selected questionnaire
    return result.rows[0];
  } catch (err) {
    console.error(err);
  }
}

/**
 * Compares a questionnaire file and its copy in the database to check if they are the same.
 */
function checkUpToDate(original, copy) {
  // Define properties to compare
  const toCompare = ['name', 'scored', 'path', 'author_email', 'questions'];

  try {
    for (const prop of toCompare) {
      if (original[prop] !== copy[prop]) return false;

      return true;
    }
  } catch (err) {
    console.error(err);
  }
}

/**
 * Retrieves a single questionnaire using its unique name and parent directory.
 */
async function selectQuestionnaire(name, dir = localDir) {
  // Include extension if necessary
  const filename = !name.includes('.json') ? `${name}.json` : name;

  try {
    const itemStats = await getStats(dir);

    // Read questionnaire using the given directory if found
    if (itemStats[filename] && itemStats[filename].isFile) {
      const file = await fs.promises.readFile(`${dir}/${filename}`);

      return JSON.parse(file);
    }

    // Otherwise, walk through sub-directories
    for (const item in itemStats) {
      if (!itemStats[item].isFile) {
        return await selectQuestionnaire(name, itemStats[item].path);
      }
    }
  } catch (err) {
    console.error(err);
  }
}

/**
 * Synchronises all file-based questionnaires in a directory with their database records.
 */
async function syncQuestionnaires(dir) {
  try {
    const itemStats = await getStats(dir);

    for (const name in itemStats) {
      if (itemStats[name].isFile) {
        const path = itemStats[name].path;
        const file = await fs.promises.readFile(path);

        const questionnaire = { ...JSON.parse(file), path };
        const copy = await selectDBCopy(path);

        // Add to the database if not already stored there
        if (copy == null) {
          await addQuestionnaire(questionnaire);
        } else if (!checkUpToDate(questionnaire, copy)) {
          await updateQuestionnaire(copy.uniqueId, questionnaire);
        }
      } else {
        // If a directory is found, look for questionnaires inside it
        await syncQuestionnaires(`${dir}/${name}`);
      }
    }
  } catch (err) {
    console.error(err);
  }
}

/**
 * Selects all questionnaires.
 */
async function selectQuestionnaires() {
  await syncQuestionnaires(localDir);

  try {
    const query = `
      SELECT id, 
             name, 
             scored
      FROM   questionnaire
    `;
    const result = await dbClient.query(query);

    // Return the selected questionnaires
    return result.rows;
  } catch (err) {
    console.error(err);
  }
}

/**
 * Stores a given option for a single or multi-select question in the database.
 */
async function addOption(questionId, option) {
  try {
    const query = `
      INSERT INTO question_option (text, question_id)
      VALUES ($1, $2)
      RETURNING text;
    `;
    const result = await dbClient.query(query, [option, questionId]);

    // Return the inserted option
    return result.rows[0];
  } catch (err) {
    console.error(err);
  }
}

/**
 * Stores a given question of a questionnaire in the database.
 */
async function addQuestion(questionnaireId, question) {
  const { id, text, options } = question;

  try {
    const query = `
      INSERT INTO question (id, text, questionnaire_id)
      VALUES ($1, $2, $3)
      RETURNING unique_id AS "uniqueId", id, text;
    `;
    const result = await dbClient.query(query, [id, text, questionnaireId]);
    const inserted = result.rows[0];

    // Insert options for single and multi-select questions
    if (options != null && options.length > 0) {
      inserted.options = [];

      for (const option of options) {
        const insertedOption = await addOption(inserted.uniqueId, option);
        inserted.options.push(insertedOption);
      }
    }

    return inserted;
  } catch (err) {
    console.error(err);
  }
}

/**
 * Stores a given questionnaire in the database.
 */
async function addQuestionnaire(questionnaire) {
  // Generate URL-friendly ID for the questionnaire
  const id = Number(new Date()).toString(36);

  const { name, scored, path, questions } = questionnaire;

  try {
    const query = `
      INSERT INTO questionnaire (id, name, scored, file_path) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id, 
                name, 
                scored, 
                file_path AS path,
                unique_id AS "uniqueId"
      `;
    const result = await dbClient.query(query, [id, name, scored || false, path]);
    const inserted = result.rows[0];

    if (questions != null && questions.length > 0) {
      inserted.questions = [];

      for (const question of questions) {
        const insertedQuestion = await addQuestion(inserted.uniqueId, question);
        inserted.questions.push(insertedQuestion);
      }
    }

    return inserted;
  } catch (err) {
    console.error(err);
  }
}

/**
 * Updates a given questionnaire stored in the database.
 */
async function updateQuestionnaire(id, content) {
  const { name, scored, path, questions } = content;

  try {
    const query = `
      UPDATE    questionnaire 
      SET       name = COALESCE($2, name), 
                scored = COALESCE($3, scored), 
                file_path = COALESCE($4, file_path) 
      WHERE     unique_id = $1
      RETURNING id,
                name,
                scored,
                file_path AS path,
                unique_id AS "uniqueId"
      `;

    const result = await dbClient.query(query, [id, name, scored, path]);
    const updated = result.rows[0];

    return updated;
  } catch (err) {
    console.error(err);
  }
}

/**
 * Stores a response for a given questionnaire in the database.
 */
async function addResponse(name, response) {
  try {
    const query = 'INSERT INTO response (questionnaire_id, data) VALUES ($1, $2) RETURNING *';
    const result = await dbClient.query(query, [name, response]);

    // Return the inserted response
    return result.rows[0];
  } catch (err) {
    console.error(err);
  }
}

module.exports = {
  selectQuestionnaire,
  selectQuestionnaires,
  addResponse,
};
