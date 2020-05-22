'use strict';

const path = require('path');

function doTest(req, res) {
  res.sendFile(path.join(__dirname, '../test.html'));
}

module.exports = {
  doTest,
};
