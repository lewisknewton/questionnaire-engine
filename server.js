'use strict';

const qh = require('./questionnaire-handler');
const path = require('path');
const express = require('express');

const app = express();
const port = 8080;

async function getQuestionnaires(req, res) {
  const result = await qh.selectQuestionnaires();

  if (!result) {
    res.status(404).json({ error: 'Sorry, no questionnaires were found.' });
    return;
  }

  res.json(result);
}

async function getQuestionnaire(req, res) {
  const name = req.params.name;
  const result = await qh.selectQuestionnaire(name);

  if (!result) {
    res.status(404).json({ error: `Sorry, no questionnaire named '${name}' could be found.` });
    return;
  }

  res.json(result);
}

/* eslint-disable */
async function postQuestionnaire(req, res) {
  // const questionnaires = await qh.insertQuestionnaire(req.body.questionnaire);
  // res.json(questionnaires);

  console.log(req);
}
/* eslint-enable */

// Serve client files
app.use('/', express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

// Define API routes
app.get('/questionnaires', getQuestionnaires);
app.get('/questionnaires/:name', getQuestionnaire);

app.listen(port);
