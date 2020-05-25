'use strict';

const path = require('path');

function takeQuestionnaire(req, res) {
  res.sendFile(path.join(__dirname, '../public/take.html'));
}

module.exports = {
  takeQuestionnaire,
};
