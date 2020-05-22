DROP DATABASE IF EXISTS questionnaire_engine;

CREATE DATABASE questionnaire_engine;
\c questionnaire_engine;

DROP TABLE IF EXISTS answer;
DROP TABLE IF EXISTS response;
DROP TABLE IF EXISTS question;
DROP TABLE IF EXISTS questionnaire;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS questionnaire (
  unique_id uuid DEFAULT uuid_generate_v4(),
  id VARCHAR(8),
  file_path TEXT UNIQUE NOT NULL,
  author_email VARCHAR(255),
  PRIMARY KEY (unique_id)
);

CREATE TABLE IF NOT EXISTS question (
  unique_id uuid DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  type VARCHAR(70),
  questionnaire_id uuid NOT NULL,
  PRIMARY KEY (unique_id),
  FOREIGN KEY (questionnaire_id) REFERENCES questionnaire (unique_id)
);

CREATE TABLE IF NOT EXISTS response (
  unique_id uuid DEFAULT uuid_generate_v4(),
  id VARCHAR(8),
  time_submitted TIMESTAMP DEFAULT NOW(),
  questionnaire_id uuid NOT NULL,
  PRIMARY KEY (unique_id),
  FOREIGN KEY (questionnaire_id) REFERENCES questionnaire (unique_id)
);

CREATE TABLE IF NOT EXISTS answer (
  unique_id uuid DEFAULT uuid_generate_v4(),
  content TEXT,
  response_id uuid NOT NULL,
  PRIMARY KEY (unique_id),
  FOREIGN KEY (response_id) REFERENCES response (unique_id)
);
