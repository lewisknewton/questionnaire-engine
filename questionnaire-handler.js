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

async function selectQuestionnaire(name) {
  const file = await fs.promises.readFile(`${localDir}/${name}.json`);

  return JSON.parse(file);
}

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

    // Add questionnaires stored in database
    const query = 'SELECT * FROM questionnaire';
    const result = await dbClient.query(query);

    // if (result.rows.length > 0) 
    // questionnaires.test = 'None in database';

    return questionnaires;
  } catch (e) {
    console.error(e);
  }
}

async function insertQuestionnaire() {
  const query = 'INSERT INTO questionnaire () VALUES ();';

  // return added questionnaire or all questionnaires
}

module.exports = {
  selectQuestionnaire,
  selectQuestionnaires
};
