'use strict';

const express = require('express');
const path = require('path');

const api = require('./server/routes/api-routes');
const web = require('./server/routes/web-routes');
const apiRouter = express.Router();
const webRouter = express.Router();

const app = express();
const port = 8080;

// Serve client files
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

// Define API routes
apiRouter.get('/questionnaires', api.getQuestionnaires);
apiRouter.post('/questionnaires', api.postQuestionnaire);
apiRouter.get('/questionnaires/:id', api.getQuestionnaire);
apiRouter.delete('/questionnaires/:id', api.deleteQuestionnaire);

apiRouter.get('/questionnaires/:id/responses', api.getResponses);
apiRouter.post('/questionnaires/:id/responses', express.json(), api.postResponse);
apiRouter.delete('/questionnaires/:id/responses', api.deleteResponses);
apiRouter.delete('/questionnaires/:id/responses/:rId', api.deleteResponse);

// Define default routes (serving client files)
webRouter.get('/take/:id', web.takeQuestionnaire);
webRouter.get('/review/:id', web.reviewQuestionnaire);

app.use('/', webRouter);
app.use('/api', apiRouter);

const server = app.listen(port, err => {
  if (err != null) console.error(`Server error: ${err}`);
});

module.exports = server;
