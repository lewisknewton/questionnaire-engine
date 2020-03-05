'use strict';

const qs = require('./questionnaire-handler');
const path = require('path');
const express = require('express');

const localDir = './questionnaires';

const app = express();
const port = 8080;

async function getQuestionnaires(req, res) {
  const result = await qs.selectQuestionnaires(localDir);

  if (!result) {
    res.status(404).send('Sorry, no questionnaires were found.');
    return;
  }

  res.json(result);
}

async function getQuestionnaire(req, res) {
  const name = req.params.name;
  const result = await qs.selectQuestionnaire(name);

  if (!result) {
    res.status(404).send(`Sorry, no questionnaire named '${name}' could be found.`);
    return;
  }

  res.json(result);
}

// Serve client files
app.use('/', express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

// Define API routes
app.get('/questionnaires', getQuestionnaires);
app.get('/questionnaires/:name', getQuestionnaire);
app.listen(port);
