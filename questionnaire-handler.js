'use strict';

const fs = require('fs');
const path = require('path');
const dbClient = require('./db-client');

const localDir = './questionnaires';

// Helper function to check if arrays are filled
const filled = arr => arr != null && arr.length > 0;

// Helper function to check if arrays are the same length
const sameLength = (arr1, arr2) => arr1.length === arr2.length;

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
 * Compares options for single and multi-select questions in a questionnaire
 * file and their database copies to check if they are the same.
 */
function checkOptionsUpToDate(originals, copies) {
  let same = true;

  // Helper function to sort options alphabetically
  const alphabetise = (a, b) => (a > b) ? 1 : -1;

  if ((!filled(originals) !== !filled(copies)) || !sameLength(originals, copies)) {
    // If one set is filled, one set empty, or both have different lengths
    same = false;
  } else if (filled(originals) && filled(copies)) {
    originals.sort(alphabetise);
    copies.sort(alphabetise);

    for (let i = 0; i < originals.length; i += 1) {
      if (originals[i] !== copies[i]) same = false;
    }
  }

  return same;
}

/**
 * Compares questions in a questionnaire file and their database copies to
 * check if they are the same.
 */
function checkQuestionsUpToDate(originals, copies) {
  let same = true;

  // Question-level properties to compare
  const toCompare = ['id', 'text', 'type'];

  // Helper function to sort questions by ID alphabetically
  const alphabetise = (a, b) => (a.id > b.id) ? 1 : -1;

  if ((!filled(originals) !== !filled(copies)) || sameLength(originals, copies)) {
    // If one set is filled, one set empty, or both have different lengths
    same = false;
  } else if (filled(originals) && filled(copies)) {
    originals.sort(alphabetise);
    copies.sort(alphabetise);

    for (let i = 0; i < originals.length; i += 1) {
      for (const prop of toCompare) {
        if (originals[i][prop] !== copies[i][prop]) same = false;
      }

      const originalOptions = originals[i].options;
      const copyOptions = copies[i].options;

      // Check options if there are any (single or multi-select questions)
      if (filled(originalOptions) || filled(copyOptions)) {
        same = same && checkOptionsUpToDate(originalOptions, copyOptions);
      }
    }
  }

  return same;
}

/**
 * Compares a questionnaire file and its database copy to check if they are the same.
 */
function checkUpToDate(original, copy) {
  let same = true;

  // Top-level properties to compare
  const toCompare = ['name', 'scored', 'path', 'author_email'];

  // Compare properties, ignoring optional booleans (e.g. scored)
  for (const prop of toCompare) {
    if (original[prop] == null && [null, false].includes(copy[prop])) continue;
    if (original[prop] !== copy[prop]) same = false;
  }

  const originalQuestions = original.questions;
  const copyQuestions = copy.questions;

  // Check questions if there are any
  if (filled(originalQuestions) || filled(copyQuestions)) {
    same = same && checkQuestionsUpToDate(originalQuestions, copyQuestions);
  }

  return same;
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
    if (filled(options)) {
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

    if (filled(questions)) {
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
      WITH updated AS (
        UPDATE    questionnaire
      UPDATE    questionnaire 
        UPDATE    questionnaire
        SET       name = COALESCE($1, name),
                  scored = COALESCE($2, scored), 
                  file_path = COALESCE($3, file_path) 
        WHERE     unique_id = $4
        RETURNING name,
                  scored,
                  file_path AS path,
                  unique_id
      )
      SELECT  updated.*,
              JSON_AGG(JSON_BUILD_OBJECT('uniqueId', question.unique_id, 'id', question.id)) AS questions
      FROM    updated
      JOIN    question 
        ON    question.questionnaire_id = updated.unique_id
      GROUP BY  updated.unique_id,
                updated.name,
                updated.scored,
                updated.path
    `;

    const result = await dbClient.query(query, [name, scored, path, id]);
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
