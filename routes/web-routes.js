'use strict';

const path = require('path');

function doTest(req, res) {
  res.sendFile(path.join(__dirname, '../test.html'));
}

function takeQuestionnaire(req, res) {
  res.sendFile(path.join(__dirname, '../public/take.html'));
}

module.exports = {
  doTest,
  takeQuestionnaire,
};
