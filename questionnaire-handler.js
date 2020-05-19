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
      SELECT  questionnaire.unique_id AS "uniqueId",
              questionnaire.name,
              questionnaire.scored,
              questionnaire.file_path AS path,
              COALESCE(
                JSON_AGG(questions.*) 
                FILTER (
                  WHERE questions."uniqueId" IS NOT NULL
                ),
              '[]'
              ) AS questions
      FROM (
        SELECT  question.unique_id AS "uniqueId",
                question.id,
                question.text,
                question.type,
                question.questionnaire_id,
                COALESCE(
                  JSON_AGG(
                    JSON_BUILD_OBJECT(
                      'id', question_option.id,
                      'text', question_option.text
                    )
                  ) FILTER (
                      WHERE question_option.unique_id IS NOT NULL
                  ),
                '[]'
                ) AS options
        FROM question
        LEFT JOIN question_option ON question.unique_id = question_option.question_id
        GROUP BY question.unique_id
      ) AS questions
      RIGHT JOIN questionnaire ON questions.questionnaire_id = questionnaire.unique_id
      WHERE questionnaire.file_path = $1
      GROUP BY questionnaire.unique_id
    `;

    const result = await dbClient.query(query, [path]);
    const selected = result.rows[0];

    return selected;
  } catch (err) {
    console.error(err);
  }
}

/**
 * Compares two sets of options for single and multi-select questions to
 * check if they are the same.
 */
function compareOptions(originals, copies) {
  let optionsSame = true;
  const optionsDiffs = [];

  // Helper function to sort options alphabetically
  const alphabetise = (a, b) => (a.text > b.text) ? 1 : -1;

  // Helper function to copy mismatching options
  const recordDiff = (first, second) => {
    const differing = { first, second };

    if (!optionsDiffs.includes(differing)) optionsDiffs.push(differing);
    optionsSame = false;
  };

  // Helper function to add missing properties for comparisons
  const formatOptions = (options) => {
    for (let i = 0; i < options.length; i += 1) {
      if (!Object.prototype.hasOwnProperty.call(options[i], 'text')) {
        options[i] = { text: options[i] };
      }
    }

    options.sort(alphabetise);
  };

  if ((!filled(originals) !== !filled(copies)) || !sameLength(originals, copies)) {
    // If one set is filled, one set empty, or both have different lengths
    optionsSame = false;
  } else if (filled(originals) && filled(copies)) {
    for (const arr of [originals, copies]) formatOptions(arr);

    for (let i = 0; i < originals.length; i += 1) {
      if (originals[i].text !== copies[i].text) recordDiff(originals[i], copies[i]);
    }
  }

  return { optionsSame, optionsDiffs };
}

/**
 * Compares two sets of questions to check if they are the same.
 */
function compareQuestions(originals, copies) {
  let questionsSame = true;
  const questionsDiffs = [];

  const toCompare = ['id', 'text', 'type'];

  // Helper function to sort questions by ID alphabetically
  const alphabetise = (a, b) => (a.id > b.id) ? 1 : -1;

  // Helper function to copy mismatching questions
  const recordDiff = (first, second) => {
    const differing = { first, second };

    if (questionsDiffs[questionsDiffs.length] === differing) console.log('ye');
    // if (questionsDiffs.includes(differing)) console.log('ye');

    if (!questionsDiffs.includes(differing)) questionsDiffs.push(differing);
    questionsSame = false;
  };

  if ((!filled(originals) !== !filled(copies)) || !sameLength(originals, copies)) {
    // If one set is filled, one set empty, or both have different lengths
    questionsSame = false;
  } else if (filled(originals) && filled(copies)) {
    for (const arr of [originals, copies]) arr.sort(alphabetise);

    for (let i = 0; i < originals.length; i += 1) {
      for (const prop of toCompare) {
        if (originals[i][prop] !== copies[i][prop]) recordDiff(originals[i], copies[i]);
      }

      const originalOptions = originals[i].options;
      const copyOptions = copies[i].options;

      // Check options if there are any (single or multi-select questions)
      if (filled(originalOptions) || filled(copyOptions)) {
        const { optionsSame } = compareOptions(originalOptions, copyOptions);

        if (!optionsSame) recordDiff(originals[i], copies[i]);
      }
    }
  }

  return { questionsSame, questionsDiffs };
}

/**
 * Compares two questionnaires to check if they are the same.
 */
function compareQuestionnaires(original, copy) {
  let same = true;
  const diffs = [];

  const toCompare = ['name', 'scored', 'path', 'author_email'];

  // Helper function to copy mismatching questionnaires
  const recordDiff = (first, second) => {
    const differing = { first, second };

    if (!diffs.includes(differing)) diffs.push(differing);
    same = false;
  };

  // Compare properties, ignoring optional booleans (e.g. scored)
  for (const prop of toCompare) {
    if (original[prop] == null && [null, false].includes(copy[prop])) continue;
    if (original[prop] !== copy[prop]) recordDiff(original, copy);
  }

  const originalQuestions = original.questions;
  const copyQuestions = copy.questions;

  // Check questions if there are any
  if (filled(originalQuestions) || filled(copyQuestions)) {
    const { questionsSame } = compareQuestions(originalQuestions, copyQuestions);

    if (!questionsSame) recordDiff(original, copy);
  }

  return { same, diffs };
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
 * Synchronises all file-based questionnaires in the directory with their
 * database records.
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
        } else {
          const { same } = compareQuestionnaires(questionnaire, copy);

          if (!same) await updateQuestionnaire(copy.uniqueId, questionnaire);
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
      INSERT INTO question_option (
                  text, 
                  question_id
      )
      VALUES (
                  $1, 
                  $2
      )
      RETURNING   unique_id AS "uniqueId",
                  id,
                  text,
                  question_id
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
  const { id, text, type, options } = question;

  try {
    const query = `
      INSERT INTO question (
                  id, 
                  text, 
                  type, 
                  questionnaire_id
      )
      VALUES (
                  $1, 
                  $2, 
                  $3, 
                  $4
      )
      RETURNING   unique_id AS "uniqueId", 
                  id, 
                  text, 
                  type
    `;
    const result = await dbClient.query(query, [id, text, type, questionnaireId]);
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

    // console.log(inserted);

    return inserted;
  } catch (err) {
    console.error(err);
  }
}

/**
 * Updates a given option of a question stored in the database.
 */
async function updateOption(questionId, content) {
  try {
    const deletionQuery = `
      DELETE FROM question_option
      WHERE       question_id = $1
    `;
    await dbClient.query(deletionQuery, [questionId]);

    const updated = await addOption(questionId, content);

    return updated;
  } catch (err) {
    console.error(err);
  }
}

/**
 * Updates a given question of a questionnaire stored in the database.
 */
async function updateQuestion(uniqueId, content) {
  const { id, text, type, options } = content;

  try {
    const query = `
      UPDATE    question
      SET       id = COALESCE($1, id),
                text = COALESCE($2, text),
                type = COALESCE($3, type)
      WHERE     unique_id = $4
      RETURNING unique_id AS "uniqueId",
                id,
                text
    `;
    const result = await dbClient.query(query, [id, text, type, uniqueId]);
    const updated = result.rows[0];

    if (filled(options)) {
      updated.options = [];

      for (const incoming of options) {
        // console.log(incoming);
        // updated.options.push(await addOption(updated.uniqueId, incoming));
      }
    }

    return updated;
  } catch (err) {
    console.error(err);
  }
}

/**
 * Updates a given questionnaire stored in the database.
 */
async function updateQuestionnaire(uniqueId, content) {
  const { name, scored, path, questions } = content;

  try {
    const query = `
      UPDATE    questionnaire
      SET       name = COALESCE($1, name),
                scored = COALESCE($2, scored), 
                file_path = COALESCE($3, file_path) 
      WHERE     unique_id = $4
      RETURNING name,
                scored,
                file_path AS path,
                unique_id AS "uniqueId"
      `;

    const result = await dbClient.query(query, [name, scored, path, uniqueId]);
    const updated = result.rows[0];

    if (filled(questions)) {
      updated.questions = [];

      // Check new questions against existing questions
      const existing = await getQuestionnaire(uniqueId);
      const { questionsSame, questionsDiffs } = compareQuestions(existing.questions, content.questions);

      // console.log(existing.questions);

      if (!questionsSame) console.log(questionsDiffs);

      /* if (!questionsSame && !filled(questionsDiffs)) {
        // Some questions do not exist in the questionnaire yet
        console.log(JSON.stringify(questionsDiffs));
      } */

      /* for (const incoming of questions) {
        const questionPK = await getQuestionPK(incoming.id, updated.uniqueId);
 
        updated.questions.push(await updateQuestion(questionPK, incoming));
      } */
    }

    return updated;
  } catch (err) {
    console.error(err);
  }
}

async function getQuestionnaire(uniqueId) {
  try {
    const query = `
      SELECT  questionnaire.unique_id AS "uniqueId",
              questionnaire.name,
              questionnaire.scored,
              questionnaire.file_path AS path,
              COALESCE(
                JSON_AGG(questions.*) 
                FILTER (
                  WHERE questions."uniqueId" IS NOT NULL
                ),
              '[]'
              ) AS questions
      FROM (
        SELECT  question.unique_id AS "uniqueId",
                question.id,
                question.text,
                question.type,
                question.questionnaire_id,
                COALESCE(
                  JSON_AGG(
                    JSON_BUILD_OBJECT(
                      'id', question_option.id,
                      'text', question_option.text
                    )
                  ) FILTER (
                      WHERE question_option.unique_id IS NOT NULL
                  ),
                '[]'
                ) AS options
        FROM question
        LEFT JOIN question_option ON question.unique_id = question_option.question_id
        GROUP BY question.unique_id
      ) AS questions
      RIGHT JOIN questionnaire ON questions.questionnaire_id = questionnaire.unique_id
      WHERE questionnaire.unique_id = $1
      GROUP BY questionnaire.unique_id
    `;

    const result = await dbClient.query(query, [uniqueId]);
    const selected = result.rows[0];

    return selected;
  } catch (err) {
    console.error(err);
  }
}

async function getQuestion(uniqueId) {
  try {
    const query = `
      SELECT    question.unique_id AS "uniqueId",
                question.id,
                question.text,
                question.type,
                COALESCE(
                  JSON_AGG(
                    JSON_BUILD_OBJECT(
                      'id', question_option.id,
                      'text', question_option.text
                    )
                  ) FILTER (
                      WHERE question_option.unique_id IS NOT NULL
                    ),
                '[]'
                ) AS options
      FROM      question
      LEFT JOIN question_option
      ON        question_option.question_id = question.unique_id
      WHERE     question.unique_id = $1
      GROUP BY  question.unique_id
    `;
    const result = await dbClient.query(query, [uniqueId]);

    return result.rows[0];
  } catch (err) {
    console.error(err);
  }
}

/**
 * Retrieves the unique identifer for a given question, found using its
 * human-readable ID and questionnaire ID.
 */
async function getQuestionPK(id, questionnaireId) {
  try {
    const query = `
      SELECT  unique_id AS "uniqueId"
      FROM    question
      WHERE   id = $1 AND
              questionnaire_id = $2
    `;
    const result = await dbClient.query(query, [id, questionnaireId]);

    return result.rows[0].uniqueId;
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
