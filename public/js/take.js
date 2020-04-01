'use strict';

const main = document.querySelector('main');
const loading = document.querySelector('#loading');

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

function displayError(msg) {
  const errorTemplate = document.querySelector('#error-message');
  const error = errorTemplate.content.cloneNode(true);

  error.querySelector('p').textContent = msg;
  main.querySelector('h1').after(error);
}

function getQuestionnaireName() {
  const params = (new URL(window.location)).searchParams;

  return params.get('name');
}

function copyTemplates(question) {
  const baseTemplate = document.querySelector('#question-base');
  const baseCopy = baseTemplate.content.cloneNode(true);

  const type = question.type;
  const title = baseCopy.querySelector('h2');

  // Fill copies with relevant details
  title.textContent = question.text || '';
  title.setAttribute('id', question.id);

  if (type in questionTypes) {
    const questionTemplate = document.querySelector(`#${type}-question`);
    const questionCopy = questionTemplate.content.cloneNode(true);

    const input = questionCopy.querySelector(questionTypes[type].input);
    const label = questionCopy.querySelector('label');

    console.log(label);

    // Add inputs for select-based questions
    if (question.options) {
      const inputs = [input];
      const labels = [label];

      for (let i = 0; i <= question.options.length - 1; i += 1) {
        // Create string without whitespace for referencing in code
        const opaqueId = question.options[i].replace(/\s/g, '-');

        const inputCopy = input.cloneNode(false);
        const labelCopy = label.cloneNode(false);

        inputs.push(inputCopy);
        labels.push(labelCopy);

        if (i < question.options.length) {
          inputs[i].setAttribute('id', opaqueId);
          inputs[i].setAttribute('value', opaqueId);
          inputs[i].setAttribute('name', question.id);

          labels[i].setAttribute('for', opaqueId);
          labels[i].textContent = question.options[i];
        }

        // Append labels and inputs not already present
        if (i < question.options.length - 1) questionCopy.append(inputCopy, labelCopy);
      }
    }

    const questionSection = baseCopy.querySelector('section');

    // Include question details
    questionSection.append(questionCopy);
    questionSection.classList.add(`${question.type}-question`);
  } else {
    baseCopy.textContent = '';

    displayError(`Sorry, the '${question.text}' question could not be loaded. Please ensure it is supported and in the correct format.`);
  }

  return baseCopy;
}

async function displayQuestionnaire(questionnaire) {
  main.querySelector('h1').textContent = questionnaire.name;

  // Display question blocks
  for (const question of questionnaire.questions) {
    const questionSection = copyTemplates(question);

    main.append(questionSection);
  }
}

async function loadQuestionnaire() {
  const name = getQuestionnaireName();
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
  loadQuestionnaire();
}

window.addEventListener('load', init);
