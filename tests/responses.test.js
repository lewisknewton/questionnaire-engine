/* global afterAll, beforeEach, describe, it, expect */

const { generateShortId } = require('../questionnaire-handler');
const supertest = require('supertest');
const { codes, errors, warnings } = require('../status');
let server, request;

beforeEach(() => {
  server = require('../server', { bustCache: true });
  request = supertest(server);
});

afterAll(async done => {
  await server.close(done);
});

describe('GET Endpoints', () => {
  it('should retrieve all responses for a given questionnaire', async done => {
    const testQuestionnaires = await request.get('/api/questionnaires');

    for (const q of testQuestionnaires.body) {
      const res = await request.get(`/api/questionnaires/${q.id}/responses`);

      if (res.body.responses.length === 0) {
        if (!res.body.hasQuestions) {
          // No questions are available for responses to be given
          const expected = { warning: warnings.questionnaireNoQuestionsCreator };

          expect(res.statusCode).toStrictEqual(codes.ok);
          expect(res.body).toMatchObject(expected);
        } else {
          // Responses have not been provided for the given questionnaire
          const expected = { warning: warnings.responsesNotFound(q.id) };

          expect(res.statusCode).toStrictEqual(codes.ok);
          expect(res.body).toMatchObject(expected);
        }
      } else {
        // Responses have been provided for the given questionnaire
        expect(res.statusCode).toStrictEqual(codes.ok);

        expect(res.body).toEqual(expect.objectContaining({
          questionnaireId: expect.any(String),
          name: expect.any(String),
          hasQuestions: expect.any(Boolean),
          responses: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              answers: expect.arrayContaining([
                expect.objectContaining({
                  questionId: expect.any(String),
                  content: expect.anything(),
                }),
              ]),
              submitted: expect.any(String),
            }),
          ]),
        }));
      }
    }

    done();
  });
});

describe('POST endpoints', () => {
  /* it('should save responses', async done => {
    // Define test data
    const testQuestionnaires = await request.get('/api/questionnaires');

    const shortId = generateShortId();
    const answers = { test: 'test123' };

    for (const q in testQuestionnaires) {
      const expected = {
        data: { shortId, answers },
        success: 'Thank you, your response has been saved.',
      };

      const res = await request
        .post(`/api/questionnaires/${q}/responses`)
        .send({ shortId, answers })
        .set('Content-Type', 'application/json');

      expect(res.statusCode).toStrictEqual(codes.created);
      expect(res.body).toMatchObject(expected);
    }

    // Delete test rows
    const query = `DELETE FROM response WHERE data @> '{"shortId": "${shortId}"}'`;
    await dbClient.query(query);

    done();
  }); */

  it('should reject responses with no answers', async done => {
    const testQuestionnaires = await request.get('/api/questionnaires');

    const shortId = generateShortId();
    const answers = null;

    for (const q of testQuestionnaires.body) {
      const expected = { error: errors.responseNoAnswers };

      const res = await request
        .post(`/api/questionnaires/${q.shortId}/responses`)
        .send({ shortId, answers })
        .set('Content-Type', 'application/json');

      expect(res.statusCode).toStrictEqual(codes.badRequest);
      expect(res.body).toMatchObject(expected);
    }

    done();
  });
});
