DROP DATABASE IF EXISTS questionnaire_engine;

CREATE DATABASE questionnaire_engine;
\c questionnaire_engine;

DROP TABLE IF EXISTS user_account;
DROP TABLE IF EXISTS questionnaire;
DROP TABLE IF EXISTS taking;
DROP TABLE IF EXISTS section;
DROP TABLE IF EXISTS question_type;
DROP TABLE IF EXISTS question;
DROP TABLE IF EXISTS response;
DROP TABLE IF EXISTS option_type;
DROP TABLE IF EXISTS question_option;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS user_account (
  id INT,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS questionnaire (
  id INT,
  title VARCHAR (70),
  code VARCHAR (20),
  scored BOOLEAN,
  creator_id INT,
  PRIMARY KEY (id),
  FOREIGN KEY (creator_id) REFERENCES user_account (id)
);

CREATE TABLE IF NOT EXISTS taking (
  id INT,
  participant_id INT,
  questionnaire_id INT,
  PRIMARY KEY (id),
  FOREIGN KEY (participant_id) REFERENCES user_account (id),
  FOREIGN KEY (questionnaire_id) REFERENCES questionnaire (id)
);

CREATE TABLE IF NOT EXISTS section (
  id INT,
  questionnaire_id INT,
  PRIMARY KEY (id),
  FOREIGN KEY (questionnaire_id) REFERENCES questionnaire (id)
);

CREATE TABLE IF NOT EXISTS question_type (
  id INT,
  type_description VARCHAR (70),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS question (
  id INT,
  section_id INT,
  type_id INT,
  PRIMARY KEY (id),
  FOREIGN KEY (section_id) REFERENCES section (id),
  FOREIGN KEY (type_id) REFERENCES question_type (id)
);

CREATE TABLE IF NOT EXISTS response (
  id uuid DEFAULT uuid_generate_v4(),
  time_submitted TIMESTAMP DEFAULT NOW(),
  questionnaire VARCHAR(255),
  data JSONB,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS option_type (
  id INT,
  type_description VARCHAR (70),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS question_option (
  id INT,
  question_id INT,
  type_id INT,
  PRIMARY KEY (id),
  FOREIGN KEY (question_id) REFERENCES question (id),
  FOREIGN KEY (type_id) REFERENCES option_type (id)
);

INSERT INTO user_account (id) VALUES (1);