DROP DATABASE IF EXISTS up891791_questionnaire_engine;

CREATE DATABASE up891791_questionnaire_engine;
\c up891791_questionnaire_engine;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS questionnaire (
  id uuid DEFAULT uuid_generate_v4(),
  short_id VARCHAR(8),
  file_path TEXT UNIQUE NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS response (
  id uuid DEFAULT uuid_generate_v4(),
  short_id VARCHAR(8),
  time_submitted TIMESTAMP DEFAULT NOW(),
  questionnaire_id uuid NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (questionnaire_id) REFERENCES questionnaire (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS answer (
  id uuid DEFAULT uuid_generate_v4(),
  question_id VARCHAR(30),
  content TEXT,
  response_id uuid NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (response_id) REFERENCES response (id) ON DELETE CASCADE
);
