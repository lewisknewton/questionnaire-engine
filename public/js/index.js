'use strict';

import { filled } from './modules/browser-common.js';

const loading = document.querySelector('#loading');
const questionnaireList = document.querySelector('#questionnaire-list');
const questionnaireSummary = document.querySelector('#questionnaire-summary');
const errorTemplate = document.querySelector('#error-message');

/**
 * Displays an error message.
 */
function displayError(msg) {
  const error = errorTemplate.content.cloneNode(true);

  error.querySelector('p').textContent = msg;
  questionnaireList.after(error);
}

/**
 * Displays details about stored questionnaires.
 */
function displayQuestionnaires(questionnaires) {
  // Add content to questionnaire summary template
  for (const q of questionnaires) {
    const summary = questionnaireSummary.content.cloneNode(true);

    const name = summary.querySelector('h3');
    const count = summary.querySelector('span');
    const takeBtn = summary.querySelector('a.take');
    const editBtn = summary.querySelector('a.edit');
    const deleteBtn = summary.querySelector('a.delete');

    name.textContent = q.name ? q.name : 'Untitled';
    count.textContent = `Questions: ${q.questions ? q.questions.length : 0}`;

    takeBtn.setAttribute('href', `take?id=${q.id}`);
    editBtn.setAttribute('href', `edit?id=${q.id}`);
    deleteBtn.setAttribute('href', `delete?id=${q.id}`);

    questionnaireList.append(summary);
  }
}

/**
 * Retrieves all stored questionnaires.
 */
async function loadQuestionnaires() {
  const res = await fetch('api/questionnaires');
  const data = await res.json();

  loading.classList.add('hidden');

  if (res.ok && filled(data)) {
    displayQuestionnaires(data);
  } else {
    displayError(data.error);
  }
}

/**
 * Initialises the web page.
 */
function init() {
  loadQuestionnaires();
}

window.addEventListener('load', init);
