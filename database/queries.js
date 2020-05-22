'use strict';

const queries = {
  addQuestionnaire: `
    INSERT INTO questionnaire (
                id,
                file_path
    )
    VALUES (
                $1,
                $2
    )
    RETURNING   id,
                file_path AS path
  `,

  addResponse: `
    INSERT INTO response (
                id
    )
    VALUES (
                $1
    )
    RETURNING   id,
                time_submitted AS submitted
  `,

  selectQuestionnaireByID: `
    SELECT  id,
            file_path AS path
    FROM    questionnaire
    WHERE   id = $1
  `,

  selectQuestionnaireByPath: `
    SELECT  id,
            file_path AS path
    FROM    questionnaire
    WHERE   file_path = $1
  `,
};

module.exports = queries;
