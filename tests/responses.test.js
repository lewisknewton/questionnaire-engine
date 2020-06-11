/* global afterAll, beforeEach, describe, expect, it, jest */

const supertest = require('supertest');
const dbClient = require('../server/database/db-client');
const { codes, errors, warnings } = require('../server/status');
let server, request;

beforeEach(() => {
  server = require('../app', { bustCache: true });
  request = supertest(server);
});

afterAll(async done => {
  await server.close(done);
});

jest.setTimeout(15000);

describe('GET Endpoints', () => {
  it('should retrieve all responses for a given questionnaire', async done => {
    const testQuestionnaires = await request.get('/api/questionnaires');

    for (const qnr of testQuestionnaires.body) {
      const res = await request.get(`/api/questionnaires/${qnr.id}/responses`);

      if (res.body.responses.length === 0) {
        if (!res.body.hasQuestions) {
          // No questions are available for responses to be given
          const expected = { warning: warnings.questionnaireNoQuestionsCreator };

          expect(res.statusCode).toStrictEqual(codes.ok);
          expect(res.body).toMatchObject(expected);
        } else {
          // Responses have not been provided for the given questionnaire
          const expected = { warning: warnings.responsesNotFound(qnr.id) };

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
  it('should save responses', async done => {
    // Define test data
    const testQuestionnaires = await request.get('/api/questionnaires');
    const answers = { api_routes_test: 'test123' };

    for (const qnr of testQuestionnaires.body) {
      const res = await request
        .post(`/api/questionnaires/${qnr}/responses`)
        .send({ questionnaireId: qnr.id, answers })
        .set('Content-Type', 'application/json');

      expect(res.statusCode).toStrictEqual(codes.created);
      expect(res.body).toEqual(expect.objectContaining({
        result: expect.objectContaining({
          id: expect.any(String),
          submitted: expect.any(String),
          answers: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringMatching(answers['api_routes_test']),
              questionId: expect.stringMatching('api_routes_test'),
            }),
          ]),
        }),
        success: expect.any(String),
      }));
    }

    // Delete test rows
    const query = `
      DELETE
      FROM        response
      USING       answer
      WHERE       question_id = 'api_routes_test' 
                  AND response.id = response_id
    `;
    await dbClient.query(query);

    done();
  });

  it('should reject responses with no answers', async done => {
    const testQuestionnaires = await request.get('/api/questionnaires');
    const answers = null;

    for (const qnr of testQuestionnaires.body) {
      const expected = { error: errors.responseNoAnswers };

      const res = await request
        .post(`/api/questionnaires/${qnr.shortId}/responses`)
        .send({ questionnaireId: qnr.id, answers })
        .set('Content-Type', 'application/json');

      expect(res.statusCode).toStrictEqual(codes.badRequest);
      expect(res.body).toMatchObject(expected);
    }

    done();
  });
});
