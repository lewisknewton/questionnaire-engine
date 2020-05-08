DROP DATABASE IF EXISTS questionnaire_engine;

CREATE DATABASE questionnaire_engine;
\c questionnaire_engine;

DROP TABLE IF EXISTS questionnaire;
DROP TABLE IF EXISTS question;
DROP TABLE IF EXISTS response;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS questionnaire (
  unique_id uuid DEFAULT uuid_generate_v4(),
  id VARCHAR(8),
  name VARCHAR(255) NOT NULL,
  scored BOOLEAN DEFAULT FALSE,
  file_path TEXT,
  author_email VARCHAR(255),
  PRIMARY KEY (unique_id)
);

CREATE TABLE IF NOT EXISTS question_type (
  id SERIAL,
  name VARCHAR(30),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS question (
  unique_id uuid DEFAULT uuid_generate_v4(),
  id VARCHAR(30) NOT NULL,
  text TEXT,
  questionnaire_id uuid NOT NULL,
  PRIMARY KEY (unique_id),
  FOREIGN KEY (questionnaire_id) REFERENCES questionnaire (unique_id)
);

CREATE TABLE IF NOT EXISTS question_option (
  unique_id uuid DEFAULT uuid_generate_v4(),
  id VARCHAR(8),
  text TEXT,
  question_id uuid NOT NULL,
  PRIMARY KEY (unique_id),
  FOREIGN KEY (question_id) REFERENCES question (unique_id)
);

CREATE TABLE IF NOT EXISTS response (
  unique_id uuid DEFAULT uuid_generate_v4(),
  id VARCHAR(8),
  time_submitted TIMESTAMP DEFAULT NOW(),
  questionnaire_id uuid NOT NULL,
  data JSONB,
  PRIMARY KEY (unique_id),
  FOREIGN KEY (questionnaire_id) REFERENCES questionnaire (unique_id)
);
