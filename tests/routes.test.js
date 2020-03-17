/* global describe, it, expect */

const supertest = require('supertest');
const app = require('../server');
const request = supertest(app);

// Define test data
const testQuestionnaires = require('./data/questionnaires.json');

describe('GET Endpoints', () => {
  it('should retrieve all questionnaires', async done => {
    const res = await request.get('/questionnaires');

    expect(res.statusCode).toStrictEqual(200);
    expect(res.body).toMatchObject(testQuestionnaires);

    done();
  });

  it('should retrieve existent questionnaires by name', async done => {
    for (const q in testQuestionnaires) {
      const res = await request.get(`/questionnaires/${q}`);

      expect(res.statusCode).toStrictEqual(200);
      expect(res.body).toMatchObject(testQuestionnaires[q]);
    }

    done();
  });

  it('should not retrieve non-existent questionnaires by name', async done => {
    const nonExistent = 'does-not-exist-123';
    const expected = { error: `Sorry, no questionnaire named '${nonExistent}' could be found.` };

    const res = await request.get(`/questionnaires/${nonExistent}`);

    expect(res.statusCode).toStrictEqual(404);
    expect(res.body).toMatchObject(expected);

    done();
  });
});
