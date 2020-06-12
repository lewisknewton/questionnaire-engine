'use strict';

const config = require('../../config.json');
const { isFilled } = require('../common');
const { codes, errors, warnings } = require('../status');

const qh = require('../questionnaire-handler');
const rh = require('../response-handler');
const multer = require('multer');

// Define where and how to store questionnaire files
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.questionnaires.directory),
  filename: (req, file, cb) => {
    const { 0: originalName, 1: ext } = file.originalname.split('.');
    const uniqueName = `${originalName}-${Date.now()}`;

    cb(null, `${uniqueName}.${ext}`);
  },
});

const uploader = multer({ ...config.multer, storage });
const single = uploader.single('questionnaire');

/**
 * Retrieves all stored questionnaires.
 */
async function getQuestionnaires(req, res) {
  const result = await qh.selectQuestionnaires();

  if (!isFilled(result, true)) {
    return res.status(codes.notFound).json({ error: errors.questionnairesNotFound });
  }

  return res.json(result);
}

/**
 * Retrieves a single questionnaire using its short ID, passed via the request.
 */
async function getQuestionnaire(req, res) {
  const id = req.params.id;

  if (!isFilled(id)) {
    return res.status(codes.badRequest).json({ error: errors.questionnaireNotSelected });
  }

  const result = await qh.selectQuestionnaire(id);

  if (!isFilled(result, true)) {
    return res.status(codes.notFound).json({ error: errors.questionnaireNotFound(id) });
  }

  if (!isFilled(result.questions)) {
    return res.status(codes.notFound).json({ ...result, error: errors.questionnaireNoQuestions });
  }

  return res.json(result);
}

/**
 * Adds a questionnaire by uploading a given questionnaire file.
 */
function postQuestionnaire(req, res) {
  const validType = 'application/json';

  single(req, res, (err) => {
    const file = req.file;

    if (file.mimetype !== validType) {
      return res.status(codes.badRequest).json({ error: errors.questionnaireFileInvalid });
    }

    if (err) {
      let code;
      let msg;

      if (err.code === 'LIMIT_FILE_SIZE') {
        code = codes.payloadTooLarge;
        msg = errors.questionnaireFileTooLarge;
      } else {
        code = codes.internalServerErr;
        msg = errors.questionnaireFileNotUploaded;
      }

      return res.status(code).json({ error: msg });
    }

    return res.status(codes.created)
      .json({
        success: 'Thank you, your questionnaire has been uploaded.',
        name: file.originalname,
      });
  });
}

/**
 * Removes a questionnaire and its associated database records, using its short
 * ID. Also removes related records, including its responses.
 */
async function deleteQuestionnaire(req, res) {
  const qnrId = req.params.id;

  if (!isFilled(qnrId)) {
    return res.status(codes.badRequest).json({ error: errors.questionnaireNotSelected });
  }

  await qh.deleteQuestionnaire(qnrId);

  return res.status(codes.noContent).send();
}

/**
 * Retrieves all responses for a given questionnaire using its short
 * ID, passed via the request.
 */
async function getResponses(req, res) {
  const qnrId = req.params.id;

  if (!isFilled(qnrId)) {
    return res.status(codes.badRequest).json({ error: errors.questionnaireNotSelected });
  }

  const result = await rh.selectResponses(qnrId);

  if (!isFilled(result, true)) {
    // The questionnaire does not exist
    return res.status(codes.notFound).json({ error: errors.questionnaireNotFound(qnrId) });
  }

  if (result.responses.length === 0) {
    if (!result.hasQuestions) {
      // The questionnaire exists, but no questions were provided
      return res.json({ ...result, warning: warnings.questionnaireNoQuestionsCreator });
    }

    // The questionnaire exists, but no responses have been given yet
    return res.json({ ...result, warning: warnings.responsesNotFound(qnrId) });
  }

  return res.json(result);
}

/**
 * Stores the user's response for a given questionnaire.
 */
async function postResponse(req, res) {
  const qnrId = req.params.id;
  const body = req.body;
  const answers = body.answers;

  if (!isFilled(qnrId)) {
    return res.status(codes.badRequest).json({ error: errors.questionnaireNotSelected });
  }

  if (!isFilled(answers, true)) {
    return res.status(codes.badRequest).json({ error: errors.responseNoAnswers });
  }

  const result = await rh.addResponse(body);

  if (!isFilled(result, true)) {
    return res.status(codes.internalServerErr).json({ error: errors.responseNotSaved });
  }

  return res.status(codes.created)
    .json({ success: 'Thank you, your response has been saved.', result });
}

module.exports = {
  getQuestionnaires,
  getQuestionnaire,
  postQuestionnaire,
  deleteQuestionnaire,
  getResponses,
  postResponse,
};
