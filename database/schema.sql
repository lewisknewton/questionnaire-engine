DROP DATABASE IF EXISTS questionnaire_engine;

CREATE DATABASE questionnaire_engine;
\c questionnaire_engine;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS questionnaire (
  id uuid DEFAULT uuid_generate_v4(),
  short_id VARCHAR(8),
  file_path TEXT UNIQUE NOT NULL,
  author_email VARCHAR(255),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS response (
  id uuid DEFAULT uuid_generate_v4(),
  short_id VARCHAR(8),
  time_submitted TIMESTAMP DEFAULT NOW(),
  questionnaire_id uuid NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (questionnaire_id) REFERENCES questionnaire (id)
);

CREATE TABLE IF NOT EXISTS answer (
  id uuid DEFAULT uuid_generate_v4(),
  question_id VARCHAR(30),
  response_id uuid NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (response_id) REFERENCES response (id)
);
