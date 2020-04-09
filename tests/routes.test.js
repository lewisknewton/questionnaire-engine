/* global afterAll, beforeEach, describe, it, expect */

const supertest = require('supertest');
const { codes } = require('../status');
const dbClient = require('../db-client');
let server, request;

beforeEach(() => {
  server = require('../server', { bustCache: true });
  request = supertest(server);
});

afterAll(async done => {
  await server.close(done);
});

// Define test data
const testQuestionnaires = require('./data/questionnaires.json');

describe('GET Endpoints', () => {
  it('should retrieve all questionnaires', async done => {
    const res = await request.get('/api/questionnaires');

    expect(res.statusCode).toStrictEqual(codes.ok);
    expect(res.body).toMatchObject(testQuestionnaires);

    done();
  });

  it('should retrieve existent questionnaires by name', async done => {
    for (const q in testQuestionnaires) {
      const res = await request.get(`/api/questionnaires/${q}`);

      expect(res.statusCode).toStrictEqual(codes.ok);
      expect(res.body).toMatchObject(testQuestionnaires[q]);
    }

    done();
  });

  it('should not retrieve non-existent questionnaires by name', async done => {
    const nonExistent = 'does-not-exist-123';
    const expected = { error: `Sorry, no questionnaire named '${nonExistent}' could be found.` };

    const res = await request.get(`/api/questionnaires/${nonExistent}`);

    expect(res.statusCode).toStrictEqual(codes.notFound);
    expect(res.body).toMatchObject(expected);

    done();
  });

  it('should not retrieve empty questionnaire names', async done => {
    const nonExistent = null;
    const expected = { error: 'Sorry, no questionnaire was selected. Please try again.' };

    const res = await request.get(`/api/questionnaires/${nonExistent}`);

    expect(res.statusCode).toStrictEqual(codes.badRequest);
    expect(res.body).toMatchObject(expected);

    done();
  });
});
