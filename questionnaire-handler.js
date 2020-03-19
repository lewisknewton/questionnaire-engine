'use strict';

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const config = require('./config');

const localDir = './questionnaires';
const questionnaires = {};

const dbClient = new Client(config);

dbClient.connect();

dbClient.on('error', (err) => {
  console.error(`Database error: ${err}`);
  dbClient.end();
});

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
 * Retrieves all stored questionnaires, referencing their parent directory.
 */
async function selectQuestionnaires(dir = localDir) {
  try {
    const itemStats = await getStats(dir);

    // Add questionnaires stored in local directory
    for (const name in itemStats) {
      if (itemStats[name].isFile) {
        const file = await fs.promises.readFile(itemStats[name].path);

        questionnaires[name] = JSON.parse(file);
        questionnaires[name].file = true;
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

module.exports = {
  selectQuestionnaire,
  selectQuestionnaires,
};
