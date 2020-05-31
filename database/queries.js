'use strict';

const queries = {
  // Questionnaires
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

  selectQuestionnaireByShortId: `
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

  // Responses
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
    SELECT    short_id AS id,
              time_submitted AS submitted,
              JSON_OBJECT_AGG(
                question_id, 
                content
              ) AS answers
    FROM      response
    LEFT JOIN answer
    ON        response.id = answer.response_id
    WHERE     questionnaire_id = $1
    GROUP BY  response.id
    `,

  // Answers
  addAnswer: `
    INSERT INTO answer (
                question_id,
                content,
                response_id
    )
    VALUES (
                $1,
                $2,
                $3
    )
    RETURNING   question_id AS "questionId",
                content,
                response_id AS "responseId"
  `,
};

module.exports = queries;
