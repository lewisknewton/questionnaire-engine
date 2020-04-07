'use strict';

const main = document.querySelector('main');
const loading = document.querySelector('#loading');
const questionsSection = document.querySelector('#questions');

const questionTypes = {
  'text': {
    input: 'textarea',
  },
  'number': {
    input: 'input[type="number"]',
  },
  'single-select': {
    input: 'input[type="radio"]',
  },
  'multi-select': {
    input: 'input[type="checkbox"]',
  },
};

/**
 * Displays an error message.
 */
function displayError(msg) {
  const errorTemplate = document.querySelector('#error-message');
  const error = errorTemplate.content.cloneNode(true);

  error.querySelector('p').textContent = msg;
  main.querySelector('h1').after(error);
}

/**
 * Retrieves the name of the selected questionnaire.
 */
function getQuestionnaireName() {
  const params = (new URL(window.location)).searchParams;

  return params.get('name');
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

  // Add inputs for multi-select questions
  if (question.options) {
    const input = questionCopy.querySelector(questionTypes[type].input);
    const label = questionCopy.querySelector('label');

    // Remove placeholder input and label
    questionCopy.textContent = '';

    for (let i = 0; i <= question.options.length - 1; i += 1) {
      // Create ID without whitespace for referencing in code
      const opaqueId = question.options[i].replace(/\s/g, '-');

      const inputCopy = input.cloneNode(false);
      inputCopy.setAttribute('id', opaqueId);
      inputCopy.setAttribute('value', opaqueId);
      inputCopy.setAttribute('name', question.id);

      const labelCopy = label.cloneNode(false);
      labelCopy.setAttribute('for', opaqueId);
      labelCopy.textContent = question.options[i];

      // Append labels and inputs not already present
      questionCopy.append(inputCopy, labelCopy);
    }
  } else {
    input.setAttribute('name', question.id);
    input.setAttribute('aria-labelledby', question.id);
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

    displayError(`Sorry, the '${question.text}' question could not be loaded. Please ensure it is supported and in the correct format.`);
  }

  return baseCopy;
}

/**
 * Displays a given questionnaire's details and questions.
 */
async function displayQuestionnaire(questionnaire) {
  main.querySelector('h1').textContent = questionnaire.name;

  // Display question blocks
  for (const question of questionnaire.questions) {
    const questionBlock = copyTemplates(question);

    questionsSection.append(questionBlock);
  }
}

/**
 * Retrieves the questionnaire with the given name.
 */
async function loadQuestionnaire(name) {
  const res = await fetch(`api/questionnaires/${name}`);
  const data = await res.json();

  loading.classList.add('hidden');

  if (res.ok) {
    displayQuestionnaire(data);
  } else {
    displayError(data.error);
  }
}

function init() {
  const name = getQuestionnaireName();
  loadQuestionnaire(name);
}

window.addEventListener('load', init);
