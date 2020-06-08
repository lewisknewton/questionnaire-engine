'use strict';

const fs = require('fs');
const path = require('path');

const { isFilled, isInArray } = require('./common');
const config = require('./config.json');
const queries = require('./database/queries');
const dbClient = require('./database/db-client');

const qnrs = [];
const { directory: localDir } = config.questionnaires;

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
 * Removes the stored record about a questionnaire in the database, using its
 * unique ID.
 */
async function deleteQuestionnaire(id) {
  try {
    const result = await dbClient.query(queries.deleteQuestionnaireById, [id]);

    return result.rows[0];
  } catch (err) {
    console.error(err);
  }
}

/**
 * Ensures the database contains records only for files stored in the
 * local directory.
 */
async function keepUpToDate(records) {
  for (const record of records) {
    const file = await readQuestionnaireFile(record.path);

    if (file == null) {
      const existing = await isInArray(qnrs, 'id', record.shortId)[0];

      // Remove the questionnaire already shown to users
      for (let i = 0; i < qnrs.length; i += 1) {
        if (qnrs[i] === existing) {
          qnrs.splice(i, 1);
          i -= 1;
        }
      }

      await deleteQuestionnaire(record.id);
    }
  }
}

/**
 * Retrieves all questionnaires in the local directory.
 */
async function selectQuestionnaires(dir = localDir) {
  try {
    const itemStats = await getStats(dir);
    const records = await selectQuestionnaireRecords();

    keepUpToDate(records);

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

        if (!isFilled(inArray)) qnrs.push(qnr);
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

    for (const question in answers) {
      // Insert all answers in the response
      const answer = {
        content: answers[question],
        questionId: question,
        responseId: insertedResponse.id,
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
    const order = questions.map(question => question.id);

    for (const response of responses) {
      const sortable = [];

      for (const answer of response.answers) {
        const type = questions
          .filter(question => question.id === answer.questionId)
          .map(question => question.type)[0];

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

module.exports = {
  generateShortId,
  selectQuestionnaires,
  selectQuestionnaire,
  addResponse,
  selectResponses,
};
