const { Client } = require('pg');
const config = require('../config.json');

const dbClient = new Client(config.database);

/**
 * Connects to the PostgreSQL database.
 */
async function connectToDB() {
  try {
    await dbClient.connect();

    dbClient.on('error', (err) => {
      console.error(`Database error: ${err}`);
      dbClient.end();
    });
  } catch (err) {
    console.error(`There was a problem connecting to the database. Please check the configuration file.\n Details:\n ${err}`);
  }
}

connectToDB();

module.exports = dbClient;
