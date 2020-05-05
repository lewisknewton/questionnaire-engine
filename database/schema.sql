DROP DATABASE IF EXISTS questionnaire_engine;

CREATE DATABASE questionnaire_engine;
\c questionnaire_engine;

DROP TABLE IF EXISTS questionnaire;
DROP TABLE IF EXISTS question;
DROP TABLE IF EXISTS response;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS questionnaire (
  id uuid DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  scored BOOLEAN DEFAULT FALSE,
  file_path TEXT,
  author_email VARCHAR(255),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS question_type (
  id INT,
  name VARCHAR(30),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS question (
  id uuid DEFAULT uuid_generate_v4(),
  readable_id VARCHAR(30) NOT NULL,
  text TEXT,
  questionnaire_id uuid,
  PRIMARY KEY (id),
  FOREIGN KEY (questionnaire_id) REFERENCES questionnaire (id)
);

CREATE TABLE IF NOT EXISTS response (
  id uuid DEFAULT uuid_generate_v4(),
  time_submitted TIMESTAMP DEFAULT NOW(),
  questionnaire_id VARCHAR(36),
  data JSONB,
  PRIMARY KEY (id)
);
