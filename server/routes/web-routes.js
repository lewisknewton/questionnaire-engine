'use strict';

const path = require('path');

function reviewQuestionnaire(req, res) {
  return res.sendFile(path.join(__dirname, '../../public/review.html'));
}

function takeQuestionnaire(req, res) {
  return res.sendFile(path.join(__dirname, '../../public/take.html'));
}

module.exports = {
  reviewQuestionnaire,
  takeQuestionnaire,
};
