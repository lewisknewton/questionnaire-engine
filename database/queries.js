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
                time_submitted AS submitted
  `,

  selectResponses: `
    SELECT    short_id AS id,
              time_submitted AS submitted,
              COALESCE(
                JSON_AGG(
                  JSON_BUILD_OBJECT(
                    'questionId', question_id, 
                    'content', content
                  )
                )
                FILTER (
                  WHERE answer.response_id IS NOT NULL
                ),
                '{}'
              ) AS answers
    FROM      response
    LEFT JOIN answer
    ON        response.id = answer.response_id
    WHERE     questionnaire_id = $1
    GROUP BY  response.id
    ORDER BY  time_submitted
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
                content
  `,
};

module.exports = queries;
