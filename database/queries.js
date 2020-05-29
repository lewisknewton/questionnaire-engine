'use strict';

const queries = {
  addQuestionnaire: `
    INSERT INTO questionnaire (
                short_id,
                file_path
    )
    VALUES (
                $1,
                $2
    )
    RETURNING   short_id AS "shortId",
                file_path AS path
  `,

  addResponse: `
    INSERT INTO response (
                short_id,
                questionnaire_id
    )
    VALUES (
                $1,
                $2
    )
    RETURNING   id,
                short_id AS "shortId",
                questionnaire_id AS questionnaireId,
                time_submitted AS submitted
  `,

  selectResponses: `
    SELECT  short_id AS id,
            time_submitted AS submitted
    FROM    response
    WHERE   questionnaire_id = $1
  `,

  selectQuestionnaireById: `
    SELECT  id,
            short_id AS "shortId",
            file_path AS path
    FROM    questionnaire
    WHERE   short_id = $1
  `,

  selectQuestionnaireByPath: `
    SELECT  id,
            short_id AS "shortId",
            file_path AS path
    FROM    questionnaire
    WHERE   file_path = $1
  `,
};

module.exports = queries;
