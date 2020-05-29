DROP DATABASE IF EXISTS questionnaire_engine;

CREATE DATABASE questionnaire_engine;
\c questionnaire_engine;

DROP TABLE IF EXISTS answer;
DROP TABLE IF EXISTS response;
DROP TABLE IF EXISTS question;
DROP TABLE IF EXISTS questionnaire;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS questionnaire (
  id uuid DEFAULT uuid_generate_v4(),
  short_id VARCHAR(8),
  file_path TEXT UNIQUE NOT NULL,
  author_email VARCHAR(255),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS question (
  id uuid DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  type VARCHAR(70),
  questionnaire_id uuid NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (questionnaire_id) REFERENCES questionnaire (id)
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
  content TEXT,
  response_id uuid NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (response_id) REFERENCES response (id)
);
