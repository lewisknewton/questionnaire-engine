'use strict';

import { setPageTitle, isFilled } from './modules/browser-common.js';
import { displayError, displaySuccess, displayWarning } from './modules/browser-status.js';
import { getQuestionnaireId } from './modules/browser-questionnaire-handler.js';

const main = document.querySelector('main');
const loading = document.querySelector('#loading');
const questionsSection = document.querySelector('#questions');
const submit = document.querySelector('#submit');

let id = '';
const answers = {};

const questionTypes = {
  'text': {
    input: 'textarea',
    events: ['keyup'],
  },
  'number': {
    input: 'input[type="number"]',
    events: ['click', 'keyup'],
  },
  'single-select': {
    input: 'input[type="radio"]',
    events: ['click'],
  },
  'multi-select': {
    input: 'input[type="checkbox"]',
    events: ['click'],
  },
};

/**
 * Stores all answers given in a questionnaire.
 */
async function saveResponse() {
  const payload = { questionnaireId: id, answers };

  const res = await fetch(`/api/questionnaires/${id}/responses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (res.ok) {
    displaySuccess(data.success, main.querySelector('h1'));
  } else {
    displayError(data.error, main.querySelector('h1'));
  }
}

/**
 * Stores the value given to a question.
 */
function storeAnswer(evt) {
  answers[evt.target.name] = evt.target.value.replace(/_/g, ' ');
}

/**
 * Adds an event listener for any number of events to a given input.
 */
function addInputEventListeners(input, ...events) {
  for (const evt of events) {
    input.addEventListener(evt, storeAnswer);
  }
}

/**
 * Duplicates and populates the template shared by all questions.
 */
function copyBaseTemplate(question) {
  const baseTemplate = document.querySelector('#question-base');
  const baseCopy = baseTemplate.content.cloneNode(true);
  const title = baseCopy.querySelector('h3');

  // Fill copied question with relevant details
  title.textContent = question.text || '';
  title.setAttribute('id', question.id);

  return baseCopy;
}

/**
 * Duplicates and populates the template for a specific question.
 */
function copyQuestionTemplate(question) {
  const type = question.type;
  const questionTemplate = document.querySelector(`#${type}-question`);
  const questionCopy = questionTemplate.content.cloneNode(true);

  const input = questionCopy.querySelector(questionTypes[type].input);
  const label = questionCopy.querySelector('label');

  // Add inputs for multi-select questions
  if (question.options) {
    // Remove placeholder input and label
    questionCopy.textContent = '';

    for (let i = 0; i <= question.options.length - 1; i += 1) {
      // Create ID without whitespace for referencing in code
      const opaqueId = question.options[i].replace(/\s/g, '_');

      const inputCopy = input.cloneNode(false);
      inputCopy.setAttribute('id', opaqueId);
      inputCopy.setAttribute('value', opaqueId);
      inputCopy.setAttribute('name', question.id);

      addInputEventListeners(inputCopy, ...questionTypes[type].events);

      const labelCopy = label.cloneNode(false);
      labelCopy.setAttribute('for', opaqueId);
      labelCopy.textContent = question.options[i];

      // Append labels and inputs not already present
      questionCopy.append(inputCopy, labelCopy);
    }
  } else {
    input.setAttribute('name', question.id);
    input.setAttribute('aria-labelledby', question.id);

    addInputEventListeners(input, ...questionTypes[type].events);
  }

  return questionCopy;
}

/**
 * Duplicates and populates the templates for each question.
 */
function copyTemplates(question) {
  const baseCopy = copyBaseTemplate(question);

  if (question.type in questionTypes) {
    const questionCopy = copyQuestionTemplate(question);
    const questionBlock = baseCopy.querySelector('article');

    // Include question details
    questionBlock.append(questionCopy);
    questionBlock.classList.add(`${question.type}-question`);
  } else {
    baseCopy.textContent = '';
    const questionNotLoadedError =
      `Sorry, the '${question.text}' question could not be loaded. Please ensure it is supported and in the correct format.`;

    displayError(questionNotLoadedError, main.querySelector('h1'));
  }

  return baseCopy;
}

/**
 * Displays a given questionnaire's details and questions.
 */
function displayQuestionnaire(questionnaire) {
  setPageTitle(questionnaire.name);
  const questions = questionnaire.questions;

  main.querySelector('h1').textContent = questionnaire.name;
  main.querySelector('#questions').classList.remove('hidden');
  main.querySelector('#submit').classList.remove('hidden');

  // Display question blocks
  for (const question of questions) {
    const questionBlock = copyTemplates(question);

    questionsSection.append(questionBlock);
  }
}

/**
 * Retrieves the questionnaire with the given ID.
 */
async function loadQuestionnaire(id) {
  const res = await fetch(`/api/questionnaires/${id}`);
  const data = await res.json();

  loading.classList.add('hidden');

  if (res.ok) {
    if (data.warning) {
      displayWarning(data.warning, main.querySelector('h1'));
    } else {
      displayQuestionnaire(data);
    }
  } else {
    displayError(data.error, main.querySelector('h1'));
  }
}

/**
 * Initialises the web page.
 */
function init() {
  // Load the questionnaire, getting its ID after `take/`
  id = getQuestionnaireId('take');
  loadQuestionnaire(id);

  submit.addEventListener('click', saveResponse);
}

window.addEventListener('load', init);
