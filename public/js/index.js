'use strict';

import { isFilled, initialiseShareElements, shareQuestionnaire } from './modules/browser-common.js';
import { displayStatus } from './modules/browser-status.js';

const loading = document.querySelector('#loading');
const questionnaireList = document.querySelector('#questionnaire-list');
const questionnaireSummary = document.querySelector('#questionnaire-summary');

const share = document.querySelector('#share');
const shareCloseBtn = document.querySelector('#share-close');
const shareCopyBtn = document.querySelector('#share-copy');
const shareLink = document.querySelector('#share-link');
const shareOutput = document.querySelector('#share-output');

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
    const deleteBtn = summary.querySelector('a.delete');
    const shareBtn = summary.querySelector('button.share');

    name.textContent = q.name ? q.name : 'Untitled';
    count.textContent = `Questions: ${q.questions ? q.questions.length : 0}`;

    reviewBtn.setAttribute('href', `review/${q.id}`);
    deleteBtn.setAttribute('href', `?delete=${q.id}`);

    shareBtn.addEventListener('click', () => shareQuestionnaire(q, share, shareLink, shareOutput));

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
    displayStatus(data.error, 'error', questionnaireList);
  }
}

/**
 * Initialises the web page.
 */
function init() {
  loadQuestionnaires();

  initialiseShareElements(share, shareLink, shareOutput, shareCopyBtn, shareCloseBtn);
}

window.addEventListener('load', init);
