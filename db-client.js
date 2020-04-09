const { Client } = require('pg');
const config = require('./database/config');

const dbClient = new Client(config);

dbClient.connect();

dbClient.on('error', (err) => {
  console.error(`Database error: ${err}`);
  dbClient.end();
});

module.exports = dbClient;
