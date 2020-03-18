'use strict';

const SUPPORTED_TYPES = ['text', 'number', 'single-select', 'multi-select'];

const main = document.querySelector('main');

function displayError(msg) {
  main.append(msg);
}

function getQuestionnaireName() {
  const params = (new URL(window.location)).searchParams;

  return params.get('name');
}

function copyTemplates(question) {
  // Use elements suitable for the question type
  const inputType = question.type === 'text' ? 'textarea' : 'input';

  // Copy both templates
  const baseTemplate = document.querySelector('#question-base');
  const baseCopy = baseTemplate.content.cloneNode(true);

  const questionTemplate = document.querySelector(`#${question.type}-question`);
  const questionCopy = questionTemplate.content.cloneNode(true);

  const title = baseCopy.querySelector('h2');

  const input = questionCopy.querySelector(inputType);
  const label = questionCopy.querySelector('label');

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

  // Fill copies with relevant details
  title.textContent = question.text || '';
  title.setAttribute('id', question.id);

  // Include question details
  baseCopy.querySelector('section').append(questionCopy);

  return baseCopy;
}

async function displayQuestionnaire(questionnaire) {
  main.querySelector('h1').textContent = questionnaire.name;

  // Display question blocks
  for (const question of questionnaire.questions) {
    if (SUPPORTED_TYPES.includes(question.type)) {
      const questionSection = copyTemplates(question);

      main.append(questionSection);
    }
  }
}

async function loadQuestionnaire() {
  const name = getQuestionnaireName();
  const res = await fetch(`api/questionnaires/${name}`);

  if (res.ok) {
    const questionnaire = await res.json();
    displayQuestionnaire(questionnaire);
  } else if (name) {
    displayError(`Sorry, no questionnaire named '${name}' could be found.`);
  } else {
    displayError('Sorry, no questionnaire was selected. Please try again.');
  }
}

function init() {
  loadQuestionnaire();
}

window.addEventListener('load', init);
