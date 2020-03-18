'use strict';

const questionnaireSection = document.querySelector('#questionnaire');
// const textQuestion = document.querySelector('#text-question');

function displayError(msg) {
  questionnaireSection.append(msg);
}

function getQuestionnaireName() {
  const params = (new URL(window.location)).searchParams;

  return params.get('name');
}

async function displayQuestionnaire(q) {
  // Display question blocks
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
