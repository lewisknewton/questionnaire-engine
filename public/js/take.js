'use strict';

import { displayStatus, setPageTitle } from './modules/browser-status.js';
import { getQuestionnaireId, isFilled } from './modules/browser-common.js';
import { addEventListeners, hideElement, setAttributes } from './modules/browser-ui.js';
import { initialiseShareElements, shareQuestionnaire } from './modules/browser-share.js';

const main = document.querySelector('main');
const mainHeading = main.querySelector('h1');
const loading = document.querySelector('#loading');

const qnSection = document.querySelector('#questions');
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

const qnTypes = {
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
 * Checks if answers are complete and in a valid format.
 */
function validateResponse() {
  const invalid = [];

  for (const qn of qnr.questions) {
    // Check required questions
    if (qn.required && answers[qn.id] == null) {
      if (!invalid.includes(qn.id)) invalid.push(qn.id);
    }

    // Check number questions
    if (qn.type === 'number' && isNaN(Number(answers[qn.id]))) {
      if (!invalid.includes(qn.id)) invalid.push(qn.id);
    }
  }

  const valid = invalid.length === 0;

  return { valid, invalid };
}

/**
 * Orders answers to retain the original order of the questions.
 */
function orderResponse() {
  const sorted = {};

  for (const qn of qnr.questions) sorted[qn.id] = null;
  Object.assign(sorted, answers);

  return sorted;
}

/**
 * Stores all answers given in a questionnaire.
 */
async function saveResponse() {
  const { valid, invalid } = validateResponse();
  const sorted = orderResponse();

  if (valid) {
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

      hideElement(mainHeading.nextElementSibling, true);
      hideElement(submitBtn, true);
      hideElement(qnSection, true, 750);

      displayStatus(data.success, 'success', mainHeading);
      setTimeout(() => hideElement(document.querySelector('.success'), true), 5000);
    } else {
      displayStatus(data.error, 'error', mainHeading);
      setTimeout(() => hideElement(document.querySelector('.error'), true), 5000);
    }
  } else {
    const msg = 'Sorry, your response is invalid. Please ensure you answer all required questions and use the expected format.';

    displayStatus(msg, 'error', mainHeading);
    setTimeout(() => hideElement(document.querySelector('.error'), true), 5000);

    for (const id of invalid) {
      const invalidQn = document.querySelector(`#${id}`).parentElement;
      invalidQn.classList.add('invalid');
    }
  }
}

/**
 * Stores the value given to a question.
 */
function storeAnswer(evt) {
  const input = evt.target;
  const qnBlock = input.parentElement;
  let answer = input.value;

  if (qnBlock.classList.contains('invalid')) qnBlock.classList.remove('invalid');

  if (input.type === 'checkbox') {
    // Handle saving of multiple values for multi-select questions
    const checked = [];
    const checkboxes = input.parentElement.querySelectorAll('input');

    for (const checkbox of checkboxes) {
      answer = checkbox.value;

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
function copyBaseTemplate(qn) {
  const baseTemplate = document.querySelector('#question-base');
  const baseCopy = baseTemplate.content.cloneNode(true);
  const title = baseCopy.querySelector('h3');

  // Fill copied question with relevant details
  title.textContent = qn.text || '';
  title.setAttribute('id', qn.id);

  if (qn.required) {
    title.setAttribute('title', 'Required question');
    baseCopy.querySelector(':nth-child(1)').classList.add('required');
  }

  return baseCopy;
}

/**
 * Duplicates and populates the template for a specific question.
 */
function copyQuestionTemplate(qn) {
  const type = qn.type;
  const questionTemplate = document.querySelector(`#${type}-question`);
  const questionCopy = questionTemplate.content.cloneNode(true);

  const input = questionCopy.querySelector(qnTypes[type].input);
  const label = questionCopy.querySelector('label');

  // Add inputs for multi-select questions
  if (qn.options) {
    // Remove placeholder input and label
    questionCopy.textContent = '';

    for (let i = 0; i <= qn.options.length - 1; i += 1) {
      // Create ID without whitespace or brackets for referencing in code
      const opaqueId = qn.options[i].replace(/[\])[(]/g, '').replace(/\s/g, '_');

      const inputCopy = input.cloneNode(false);
      inputCopy.setAttribute('id', `${qn.id}_${opaqueId}`);
      inputCopy.setAttribute('value', qn.options[i]);
      setAttributes(inputCopy, ['name', 'aria-describedby'], qn.id);

      if (qn.required) inputCopy.setAttribute('required', '');

      addEventListeners(inputCopy, storeAnswer, false, ...qnTypes[type].events);

      const labelCopy = label.cloneNode(false);
      labelCopy.textContent = qn.options[i];

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
    setAttributes(input, ['name', 'aria-labelledby'], qn.id);
    addEventListeners(input, storeAnswer, false, ...qnTypes[type].events);

    if (qn.required) input.setAttribute('required', '');
  }

  return questionCopy;
}

/**
 * Duplicates and populates the templates for each question.
 */
function copyTemplates(qn) {
  const baseCopy = copyBaseTemplate(qn);

  if (qn.type in qnTypes) {
    const questionCopy = copyQuestionTemplate(qn);
    const questionBlock = baseCopy.querySelector(':nth-child(1)');

    // Include question details
    questionBlock.append(questionCopy);
    questionBlock.classList.add(`${qn.type}-question`);
  } else {
    baseCopy.textContent = '';
    const questionNotLoadedError =
      `Sorry, the '${qn.text}' question could not be loaded. Please ensure it is supported and in the correct format.`;

    displayStatus(questionNotLoadedError, 'error', mainHeading);
  }

  return baseCopy;
}

/**
 * Displays a given questionnaire's details and questions.
 */
function displayQuestionnaire() {
  const qns = qnr.questions;

  setPageTitle(qnr.name);
  mainHeading.textContent = qnr.name;
  qnSection.classList.remove('hidden');
  submitBtn.classList.remove('hidden');

  // Display question blocks
  for (const qn of qns) {
    const qnBlock = copyTemplates(qn);

    if (qn.answer != null) {
      const pointsCount = document.createElement('p');
      pointsCount.textContent = `Points: ${isFilled(qn.points) ? qn.points : 1}`;

      qnBlock.querySelector(':nth-child(1)').append(pointsCount);
    }

    qnSection.append(qnBlock);
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
    displayStatus(data.error, 'error', mainHeading);
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
