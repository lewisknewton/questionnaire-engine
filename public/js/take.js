'use strict';

import { displayStatus, setPageTitle } from './modules/browser-status.js';
import { getQuestionnaireId, isFilled } from './modules/browser-common.js';
import { addEventListeners, hideElement, setAttributes } from './modules/browser-ui.js';
import { initialiseShareElements, shareQuestionnaire } from './modules/browser-share.js';

const main = document.querySelector('main');
const loading = document.querySelector('#loading');

const questionsSection = document.querySelector('#questions');
const submitBtn = document.querySelector('#submit');

const finishedSection = document.querySelector('#finished');
const shareBtn = document.querySelector('#finished > .share');

const share = document.querySelector('#share');
const shareCloseBtn = document.querySelector('#share-close');
const shareCopyBtn = document.querySelector('#share-copy');
const shareLink = document.querySelector('#share-link');
const shareOutput = document.querySelector('#share-output');

let id = '';
let qnr = {};
const answers = {};

const questionTypes = {
  'free-form': {
    input: 'textarea',
    events: ['keyup'],
  },
  'likert': {
    input: 'input[type="radio"]',
    events: ['click'],
  },
  'multi-select': {
    input: 'input[type="checkbox"]',
    events: ['click'],
  },
  'number': {
    input: 'input[type="number"]',
    events: ['click', 'keyup'],
  },
  'single-select': {
    input: 'input[type="radio"]',
    events: ['click'],
  },
  'text': {
    input: 'input[type="text"]',
    events: ['keyup'],
  },
};

/**
 * Stores all answers given in a questionnaire.
 */
async function saveResponse() {
  const sorted = {};
  const order = qnr.questions.map(question => question.id);

  // Retain the original question order in answers
  for (const id of order) sorted[id] = null;
  Object.assign(sorted, answers);

  const payload = { questionnaireId: id, answers: sorted };

  const opts = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  };

  const res = await fetch(`/api/questionnaires/${id}/responses`, opts);
  const data = await res.json();

  if (res.ok) {
    submitBtn.setAttribute('disabled', true);
    finishedSection.classList.remove('hidden');

    hideElement(submitBtn, true);
    hideElement(questionsSection, true, 1000);

    displayStatus(data.success, 'success', main.querySelector('h1'));

    setTimeout(() => {
      hideElement(document.querySelector('.success'), true);
    }, 5000);
  } else {
    displayStatus(data.error, 'error', main.querySelector('h1'));

    setTimeout(() => {
      hideElement(document.querySelector('.error'), true);
    }, 5000);
  }
}

/**
 * Stores the value given to a question.
 */
function storeAnswer(evt) {
  const input = evt.target;

  // Extract formatted answer (without separators)
  const formatAnswer = el => el.value.replace(/_/g, ' ');
  let answer = formatAnswer(input);

  if (input.type === 'checkbox') {
    // Handle saving of multiple values for multi-select questions
    const checked = [];
    const checkboxes = input.parentElement.querySelectorAll('input');

    for (const checkbox of checkboxes) {
      answer = formatAnswer(checkbox);

      if (checkbox.checked) {
        checked.push(answer);
      } else {
        delete answers[input.name];
      }
    }

    // Add answers of all checked inputs
    if (isFilled(checked)) answers[input.name] = [...checked];
  } else {
    // Save single values for all other question types
    if (isFilled(answer)) {
      answers[input.name] = answer;
    } else {
      delete answers[input.name];
    }
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
      // Create ID without whitespace or brackets for referencing in code
      const opaqueId = question.options[i].replace(/[\])[(]/g, '').replace(/\s/g, '_');

      const inputCopy = input.cloneNode(false);
      inputCopy.setAttribute('id', `${question.id}_${opaqueId}`);
      inputCopy.setAttribute('value', opaqueId);
      setAttributes(inputCopy, ['name', 'aria-describedby'], question.id);

      addEventListeners(inputCopy, storeAnswer, false, ...questionTypes[type].events);

      const labelCopy = label.cloneNode(false);
      labelCopy.textContent = question.options[i];

      // Append labels and inputs not already present
      if (type === 'likert') {
        labelCopy.append(inputCopy);
        questionCopy.append(labelCopy);
      } else {
        labelCopy.setAttribute('for', inputCopy.getAttribute('id'));
        questionCopy.append(inputCopy, labelCopy);
      }
    }
  } else {
    setAttributes(input, ['name', 'aria-labelledby'], question.id);
    addEventListeners(input, storeAnswer, false, ...questionTypes[type].events);
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
    const questionBlock = baseCopy.querySelector(':nth-child(1)');

    // Include question details
    questionBlock.append(questionCopy);
    questionBlock.classList.add(`${question.type}-question`);
  } else {
    baseCopy.textContent = '';
    const questionNotLoadedError =
      `Sorry, the '${question.text}' question could not be loaded. Please ensure it is supported and in the correct format.`;

    displayStatus(questionNotLoadedError, 'error', main.querySelector('h1'));
  }

  return baseCopy;
}

/**
 * Displays a given questionnaire's details and questions.
 */
function displayQuestionnaire() {
  setPageTitle(qnr.name);
  const questions = qnr.questions;

  main.querySelector('h1').textContent = qnr.name;
  questionsSection.classList.remove('hidden');
  submitBtn.classList.remove('hidden');

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

  hideElement(loading);

  if (res.ok) {
    qnr = data;
    displayQuestionnaire();
  } else {
    displayStatus(data.error, 'error', main.querySelector('h1'));
  }
}

/**
 * Initialises the web page.
 */
function init() {
  // Load the questionnaire, getting its ID after `take/`
  id = getQuestionnaireId('take');
  loadQuestionnaire(id);

  submitBtn.addEventListener('click', saveResponse);
  shareBtn.addEventListener('click', () => shareQuestionnaire(qnr, share, shareLink, shareOutput));

  initialiseShareElements(share, shareLink, shareOutput, shareCopyBtn, shareCloseBtn);
}

window.addEventListener('load', init);
