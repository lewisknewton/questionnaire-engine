'use strict';

import { isFilled } from './modules/browser-common.js';
import { displayError } from './modules/browser-status.js';

const loading = document.querySelector('#loading');
const questionnaireList = document.querySelector('#questionnaire-list');
const questionnaireSummary = document.querySelector('#questionnaire-summary');

/**
 * Displays details about stored questionnaires.
 */
function displayQuestionnaires(questionnaires) {
  // Add content to questionnaire summary template
  for (const q of questionnaires) {
    const summary = questionnaireSummary.content.cloneNode(true);

    const name = summary.querySelector('h3');
    const count = summary.querySelector('span');
    const reviewBtn = summary.querySelector('a.review');
    const takeBtn = summary.querySelector('a.take');
    const deleteBtn = summary.querySelector('a.delete');

    name.textContent = q.name ? q.name : 'Untitled';
    count.textContent = `Questions: ${q.questions ? q.questions.length : 0}`;

    reviewBtn.setAttribute('href', `review/${q.id}`);
    takeBtn.setAttribute('href', `take/${q.id}`);
    deleteBtn.setAttribute('href', `?delete=${q.id}`);

    questionnaireList.append(summary);
  }
}

/**
 * Retrieves all stored questionnaires.
 */
async function loadQuestionnaires() {
  const res = await fetch('/api/questionnaires');
  const data = await res.json();

  loading.classList.add('hidden');

  if (res.ok && isFilled(data)) {
    displayQuestionnaires(data);
  } else {
    displayError(data.error, questionnaireList);
  }
}

/**
 * Initialises the web page.
 */
function init() {
  loadQuestionnaires();
}

window.addEventListener('load', init);
