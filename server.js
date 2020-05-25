'use strict';

const express = require('express');
const path = require('path');

const api = require('./routes/api-routes');
const web = require('./routes/web-routes');
const apiRouter = express.Router();
const webRouter = express.Router();

const app = express();
const port = 8080;

// Serve client files
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

// Define API routes
apiRouter.get('/questionnaires', api.getQuestionnaires);
apiRouter.get('/questionnaires/:id', api.getQuestionnaire);
apiRouter.post('/questionnaires/:id/responses', express.json(), api.postResponse);

// Define default routes (serving client files)
webRouter.get('/take/:id', web.takeQuestionnaire);

app.use('/', webRouter);
app.use('/api', apiRouter);

const server = app.listen(port);

module.exports = server;
