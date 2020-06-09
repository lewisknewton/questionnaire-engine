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
    RETURNING   short_id AS id,
                file_path AS path
  `,

  selectQuestionnaireByShortId: `
    SELECT  id,
            short_id AS "shortId",
            file_path AS path
    FROM    questionnaire
    WHERE   short_id = $1
  `,

  selectQuestionnaireRecords: `
    SELECT  id,
            short_id AS "shortId",
            file_path AS path
    FROM    questionnaire
  `,

  deleteQuestionnaire: `
    DELETE
    FROM      questionnaire
    WHERE     id = $1
    RETURNING id,
              short_id AS "shortId",
              file_path AS path
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
    RETURNING   id AS "uniqueId",
                short_id AS id,
                time_submitted AS submitted
  `,

  selectResponses: `
    SELECT      short_id AS id,
                time_submitted AS submitted,
                JSON_AGG(answers) AS answers
    FROM (
                SELECT    response_id,
                          JSON_BUILD_OBJECT(
                            'questionId', question_id,
                            'content', JSON_AGG(content)
                          ) AS answers
                FROM      answer
                GROUP BY  response_id,
                          question_id
    ) answers_sub
    RIGHT JOIN  response
    ON          response.id = answers_sub.response_id
    WHERE       questionnaire_id = $1
    GROUP BY    response.id
    ORDER BY    submitted
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
