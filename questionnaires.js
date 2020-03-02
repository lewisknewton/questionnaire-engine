'use strict';

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const config = require('./config');

const localDir = './public/questionnaires';
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

async function selectQuestionnaires() {
  const questionnaires = {};

  try {
    const itemStats = await getStats(localDir);

    // Add questionnaires stored in local directory
    for (const name in itemStats) {
      if (itemStats[name].isFile) {
        const file = await fs.promises.readFile(itemStats[name].path);

        questionnaires[name] = JSON.parse(file);
        questionnaires[name].file = true;
      }
    }

    // Add questionnaires stored in database
  const query = 'SELECT * FROM questionnaire';
  const result = await dbClient.query(query);

    // if (result.rows.length > 0) 
    questionnaires.test = 'None in database';

    return questionnaires;
  } catch (e) {
    console.error(e);
  }
}

  return 'Sorry, no questionnaires were found.';
}

module.exports = {
  selectQuestionnaires
};
