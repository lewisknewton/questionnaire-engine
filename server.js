'use strict';

const qs = require('./questionnaires');
const path = require('path');
const express = require('express');

const app = express();
const port = 8080;

async function getQuestionnaires(req, res) {
  res.json(await qs.selectQuestionnaires());
}

// Serve client files
app.use('/', express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

// Define API routes
app.get('/questionnaires', getQuestionnaires);
app.listen(port);
