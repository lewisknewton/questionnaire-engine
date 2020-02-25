'use strict';

const { Client } = require('pg');
const config = require('./config');

const dbClient = new Client(config);

dbClient.connect();

dbClient.on('error', (err) => {
  console.error(`Database error: ${err}`);
  dbClient.end();
});

async function selectQuestionnaires() {
  const query = 'SELECT * FROM questionnaire';
  const result = await dbClient.query(query);

  if (result.rows.length > 0) {
    return result.rows;
  }

  return 'Sorry, no questionnaires were found.';
}

module.exports = {
  selectQuestionnaires
};
