/* global afterAll, beforeEach, describe, it, expect */

const { isFilled } = require('../common');
const supertest = require('supertest');
const { codes, errors } = require('../status');
let server, request;

beforeEach(() => {
  server = require('../server', { bustCache: true });
  request = supertest(server);
});

afterAll(async done => {
  await server.close(done);
});

describe('GET Endpoints', () => {
  it('should retrieve all questionnaires', async done => {
    const res = await request.get('/api/questionnaires');

    if (Array.isArray(res.body) && isFilled(res.body)) {
      // Questionnaires exist in the `questionnaires` directory
      expect(res.statusCode).toStrictEqual(codes.ok);
      expect(res.body).toEqual(expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          questions: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              text: expect.any(String),
              type: expect.any(String),
              options: expect.arrayContaining([
                expect.any(String),
              ]),
            }),
          ]),
        }),
      ]));
    } else {
      // Questionnaires do not exist in the `questionnaires` directory
      const expected = { error: errors.questionnairesNotFound };

      expect(res.statusCode).toStrictEqual(codes.notFound);
      expect(res.body).toMatchObject(expected);
    }

    done();
  });

  it('should retrieve existent questionnaires by ID', async done => {
    const testQuestionnaires = await request.get('/api/questionnaires');

    for (const q of testQuestionnaires.body) {
      const res = await request.get(`/api/questionnaires/${q.id}`);
      const questions = res.body.questions;

      if (isFilled(questions)) {
        expect(res.statusCode).toStrictEqual(codes.ok);
        expect(res.body).toMatchObject(q);
      }
    }

    done();
  });

  it('should not retrieve non-existent questionnaires by ID', async done => {
    const nonExistent = 'does-not-exist-123';
    const expected = { error: errors.questionnaireNotFound(nonExistent) };

    const res = await request.get(`/api/questionnaires/${nonExistent}`);

    expect(res.statusCode).toStrictEqual(codes.notFound);
    expect(res.body).toMatchObject(expected);

    done();
  });

  it('should not retrieve empty questionnaire IDs', async done => {
    const nonExistent = null;
    const expected = { error: errors.questionnaireNotSelected };

    const res = await request.get(`/api/questionnaires/${nonExistent}`);

    expect(res.statusCode).toStrictEqual(codes.badRequest);
    expect(res.body).toMatchObject(expected);

    done();
  });

  it('should not display questionnaires with no questions', async done => {
    const testQuestionnaires = await request.get('/api/questionnaires');

    for (const q of testQuestionnaires.body) {
      const res = await request.get(`/api/questionnaires/${q.id}`);
      const questions = res.body.questions;

      const expected = { ...res.body, error: errors.questionnaireNoQuestions };

      if (!isFilled(questions)) {
        expect(res.statusCode).toStrictEqual(codes.notFound);
        expect(res.body).toMatchObject(expected);
      }
    }

    done();
  });
});