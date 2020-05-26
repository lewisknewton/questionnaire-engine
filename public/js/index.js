'use strict';

import { isFilled } from './modules/browser-common.js';
import { displayError } from './modules/browser-status.js';

const loading = document.querySelector('#loading');
const questionnaireList = document.querySelector('#questionnaire-list');
const questionnaireSummary = document.querySelector('#questionnaire-summary');

const shareDialog = document.querySelector('#share-dialog');
const shareDialogCloseBtn = document.querySelector('#close-dialog');
const shareDialogCopyBtn = document.querySelector('#copy-link');
const shareDialogLinkText = document.querySelector('#link-text');
const shareDialogOutput = document.querySelector('#share-dialog > output');

/**
 * Closes the open share dialog.
 */
function closeShareDialog() {
  shareDialog.classList.add('hidden');
}

/**
 * Copies the URL of the selected questionnaire to the clipboard.
 */
function copyShareLink() {
  shareDialogLinkText.select();
  document.execCommand('copy');

  shareDialogOutput.value = 'Link copied.';
}

/**
 * Shares a link to the questionnaire, either via native sharing options for
 * mobile users or through alternative sharing options for other devices.
 */
async function shareQuestionnaire(q) {
  const shareText = `Please take my ${q.name} questionnaire:`;
  const shareUrl = `${window.location}take/${q.id}`;

  if (navigator.share) {
    const data = {
      title: q.name,
      text: shareText,
      url: shareUrl,
    };

    try {
      await navigator.share(data);
    } catch (err) {
      console.error(err);
    }
  } else {
    shareDialog.querySelector('p').textContent = shareText;
    shareDialogLinkText.textContent = shareUrl;

    if (isFilled(shareDialogOutput.value)) shareDialogOutput.value = '';

    shareDialog.classList.remove('hidden');
  }
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
    const reviewBtn = summary.querySelector('a.review');
    const deleteBtn = summary.querySelector('a.delete');
    const shareBtn = summary.querySelector('button.share');

    name.textContent = q.name ? q.name : 'Untitled';
    count.textContent = `Questions: ${q.questions ? q.questions.length : 0}`;

    reviewBtn.setAttribute('href', `review/${q.id}`);
    deleteBtn.setAttribute('href', `?delete=${q.id}`);

    shareBtn.addEventListener('click', () => shareQuestionnaire(q));

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

  shareDialogCopyBtn.addEventListener('click', copyShareLink);
  shareDialogCloseBtn.addEventListener('click', closeShareDialog);
}

window.addEventListener('load', init);
