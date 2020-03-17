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
  const res = await fetch(`questionnaires/${name}`);

  if (res.ok) {
    const questionnaire = await res.json();
    displayQuestionnaire(questionnaire);
  } else {
    displayError(`Sorry, no questionnaire named '${name}' could be found.`);
  }
}

function init() {
  loadQuestionnaire();
}

window.addEventListener('load', init);
