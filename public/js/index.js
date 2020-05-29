'use strict';

import { isFilled } from './modules/browser-common.js';
import { displayError } from './modules/browser-status.js';

const loading = document.querySelector('#loading');
const questionnaireList = document.querySelector('#questionnaire-list');
const questionnaireSummary = document.querySelector('#questionnaire-summary');

const shareDialog = document.querySelector('#share');
const shareDialogCloseBtn = document.querySelector('#share-close');
const shareDialogCopyBtn = document.querySelector('#share-copy');
const shareDialogLinkText = document.querySelector('#share-link');
const shareDialogOutput = document.querySelector('#share-output');

/**
 * Closes the open share dialog.
 */
function closeShareDialog() {
  if (typeof shareDialog.close === 'function') {
    shareDialog.close();
  } else {
    shareDialog.setAttribute('aria-hidden', 'true');
    shareDialog.classList.add('hidden');
  }
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

    if (typeof shareDialog.showModal === 'function') {
      shareDialog.showModal();
    } else {
      shareDialog.setAttribute('aria-hidden', 'false');
      shareDialog.classList.remove('hidden');

      // Set focus to be inside the dialog
      shareDialogCloseBtn.focus();
    }
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

  // Use fallback for <dialog> if unsupported
  if (typeof HTMLDialogElement !== 'function') {
    shareDialog.classList.add('hidden');
    shareDialog.setAttribute('aria-hidden', 'true');
    shareDialog.setAttribute('role', 'dialog');
  }

  shareDialogCopyBtn.addEventListener('click', copyShareLink);
  shareDialogCloseBtn.addEventListener('click', closeShareDialog);
}

window.addEventListener('load', init);
