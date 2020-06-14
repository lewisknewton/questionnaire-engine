'use strict';

import { displayStatus, highlight, unhighlight } from './modules/browser-status.js';
import { initialiseShareElements, shareQuestionnaire } from './modules/browser-share.js';
import { closeDialog, handleDialogSupport, openDialog } from './modules/browser-dialog.js';
import { hideElement, preventDefault } from './modules/browser-ui.js';
import { isFilled, isInArray } from './modules/browser-common.js';

const loading = document.querySelector('#loading');
const header = document.querySelector('header');
const questionnaireList = document.querySelector('#questionnaire-list');
const questionnaireSummary = document.querySelector('#questionnaire-summary');

const uploadBtn = document.querySelector('#add');
const uploadCloseBtn = document.querySelector('#upload-close');
const uploadArea = document.querySelector('#upload');
const uploadInput = document.querySelector('#upload-file');
const uploadSubmitBtn = document.querySelector('#upload-submit');

const share = document.querySelector('#share');
const shareCloseBtn = document.querySelector('#share-close');
const shareCopyBtn = document.querySelector('#share-copy');
const shareLink = document.querySelector('#share-link');
const shareOutput = document.querySelector('#share-output');

/**
 * Displays details about stored questionnaires.
 */
function displayQuestionnaires(qnrs) {
  const existingIds =
    [...new Set(document.querySelectorAll('.summary'))].map(el => el.getAttribute('data-id'));

  for (const id of existingIds) {
    const inArray = isInArray(qnrs, 'id', id)[0];
    const existing = document.querySelector(`.summary[data-id=${id}]`);

    if (inArray == null) {
      // Remove deleted questionnaires so that they are not shown to authors
      hideElement(existing, true);
    } else {
      // Update questionnaire details if its file has changed
      const qnr = qnrs[qnrs.indexOf(inArray)];
      const name = existing.querySelector('h3');
      const count = existing.querySelector('span');

      name.textContent = qnr.name ? qnr.name : 'Untitled';
      count.textContent = `Questions: ${qnr.questions ? qnr.questions.length : 0}`;
    }
  }

  // Add content to questionnaire summary template
  for (const qnr of qnrs) {
    if (!existingIds.includes(qnr.id)) {
      const summary = questionnaireSummary.content.cloneNode(true);

      const name = summary.querySelector('h3');
      const count = summary.querySelector('span');
      const reviewLink = summary.querySelector('a.review');
      const deleteBtn = summary.querySelector('button.delete');
      const shareBtn = summary.querySelector('button.share');

      summary.querySelector(':nth-child(1)').setAttribute('data-id', qnr.id);
      name.textContent = qnr.name ? qnr.name : 'Untitled';
      count.textContent = `Questions: ${qnr.questions ? qnr.questions.length : 0}`;

      reviewLink.setAttribute('href', `review/${qnr.id}`);

      deleteBtn.addEventListener('click', () => removeQuestionnaire(qnr.id));
      shareBtn.addEventListener('click', () => shareQuestionnaire(qnr, share, shareLink, shareOutput));

      questionnaireList.append(summary);
    }
  }
}

/**
 * Removes a given questionnaire and its responses.
 */
async function removeQuestionnaire(id) {
  const opts = { method: 'DELETE' };
  const res = await fetch(`/api/questionnaires/${id}`, opts);

  let status;

  if (res.ok) {
    // Remove the questionnaire already shown to users
    hideElement(document.querySelector(`.summary[data-id=${id}]`), true);

    const msg = `The questionnaire of ID '${id}' was deleted successfully.`;
    status = 'success';

    displayStatus(msg, status, header);
  } else {
    const data = await res.json();
    status = 'error';

    displayStatus(data.error, status, header);
  }

  setTimeout(() => hideElement(document.querySelector(`.${status}`), true), 5000);
}

/**
 * Retrieves all stored questionnaires.
 */
async function loadQuestionnaires() {
  const res = await fetch('/api/questionnaires');
  const data = await res.json();

  hideElement(loading);

  if (res.ok && isFilled(data)) {
    displayQuestionnaires(data);

    const error = document.querySelector('.error');
    if (error != null) hideElement(error, true, 0);
  } else {
    displayStatus(data.error, 'error', header);
  }

  // Poll for new questionnaires every 5 seconds
  setTimeout(loadQuestionnaires, 5000);
}

/**
 * Uploads a given questionnaire file.
 */
async function addQuestionnaire(file) {
  const formData = new FormData();
  formData.append('questionnaire', file, file.name);

  const opts = {
    method: 'POST',
    body: formData,
  };

  const res = await fetch('/api/questionnaires', opts);
  const data = await res.json();

  if (res.ok) {
    displayStatus(data.success, 'success', header);
    setTimeout(() => hideElement(document.querySelector('.success'), true), 5000);
  } else {
    displayStatus(data.error, 'error', header);
    setTimeout(() => hideElement(document.querySelector('.error'), true), 5000);
  }
}

/**
 * Checks if a questionnaire file is in the correct format and under
 * the maximum file size limit (default: 5MB) before uploading.
 */
function validated(file) {
  const maxSize = 5242880;
  const validType = 'application/json';

  if (file.size > maxSize || file.type !== validType) return false;

  return true;
}

/**
 * Checks one or more questionnaire files are valid before uploading.
 */
function handleFiles(files) {
  if (isFilled(files)) {
    for (const file of files) {
      if (validated(file)) {
        addQuestionnaire(file);
      } else {
        const msg =
          `Sorry, '${file.name}' is not a valid questionnaire JSON file. Please try uploading again with a valid file.`;

        displayStatus(msg, 'error', header);
        setTimeout(() => hideElement(document.querySelector('.error'), true), 5000);
      }
    }
  } else {
    const msg = 'Sorry, no files were selected. Please try uploading again.';

    displayStatus(msg, 'error', header);
    setTimeout(() => hideElement(document.querySelector('.error', true)), 5000);
  }

  closeDialog(uploadArea);
}

/**
 * Prepares the upload area and its related elements for handling
 * added questionnaires.
 */
function initialiseUploadElements() {
  handleDialogSupport(uploadArea);

  for (const evtType of ['dragenter', 'dragleave', 'dragover', 'drop']) {
    uploadArea.addEventListener(evtType, preventDefault, false);
  }

  for (const evtType of ['dragenter', 'dragover']) {
    uploadArea.addEventListener(evtType, (evt) => highlight(evt.currentTarget), false);
  }

  for (const evtType of ['dragleave', 'drop']) {
    uploadArea.addEventListener(evtType, (evt) => unhighlight(evt.currentTarget), false);
  }

  uploadArea.addEventListener('drop', evt => {
    handleFiles(evt.dataTransfer.files);
  }, false);

  uploadBtn.addEventListener('click', () => openDialog(uploadArea));
  uploadCloseBtn.addEventListener('click', () => closeDialog(uploadArea));
  uploadSubmitBtn.addEventListener('click', (evt) => {
    preventDefault(evt);
    handleFiles(uploadInput.files);
  });
}

/**
 * Initialises the web page.
 */
function init() {
  loadQuestionnaires();

  initialiseShareElements(share, shareLink, shareOutput, shareCopyBtn, shareCloseBtn);
  initialiseUploadElements();
}

window.addEventListener('load', init);
