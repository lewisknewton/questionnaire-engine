'use strict';

import { closeDialog, handleDialogSupport, initialiseShareElements, isFilled, isInArray, openDialog, preventDefault, shareQuestionnaire } from './modules/browser-common.js';
import { displayStatus, highlight, unhighlight } from './modules/browser-status.js';

const loading = document.querySelector('#loading');
const header = document.querySelector('header');
const questionnaireList = document.querySelector('#questionnaire-list');
const questionnaireSummary = document.querySelector('#questionnaire-summary');

const uploadBtn = document.querySelector('#add');
const uploadCloseBtn = document.querySelector('#upload-close');
const uploadArea = document.querySelector('#upload');
const uploadInput = document.querySelector('#questionnaire-file');

const share = document.querySelector('#share');
const shareCloseBtn = document.querySelector('#share-close');
const shareCopyBtn = document.querySelector('#share-copy');
const shareLink = document.querySelector('#share-link');
const shareOutput = document.querySelector('#share-output');

/**
 * Displays details about stored questionnaires.
 */
function displayQuestionnaires(qnrs) {
  const existing =
    [...new Set(document.querySelectorAll('.summary'))].map(el => el.getAttribute('data-id'));

  for (const id of existing) {
    // Remove deleted questionnaires so that they are not shown to authors
    const inArray = isInArray(qnrs, 'id', id)[0];

    if (inArray == null) document.querySelector(`.summary[data-id=${id}]`).remove();
  }

  // Add content to questionnaire summary template
  for (const qnr of qnrs) {
    if (!existing.includes(qnr.id)) {
      const summary = questionnaireSummary.content.cloneNode(true);

      const name = summary.querySelector('h3');
      const count = summary.querySelector('span');
      const reviewBtn = summary.querySelector('a.review');
      const deleteBtn = summary.querySelector('a.delete');
      const shareBtn = summary.querySelector('button.share');

      summary.querySelector(':nth-child(1)').setAttribute('data-id', qnr.id);
      name.textContent = qnr.name ? qnr.name : 'Untitled';
      count.textContent = `Questions: ${qnr.questions ? qnr.questions.length : 0}`;

      reviewBtn.setAttribute('href', `review/${qnr.id}`);
      deleteBtn.setAttribute('href', `?delete=${qnr.id}`);

      shareBtn.addEventListener('click', () => shareQuestionnaire(qnr, share, shareLink, shareOutput));

      questionnaireList.append(summary);
    }
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
  } else {
    displayStatus(data.error, 'error', header);
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
  for (const file of files) {
    if (validated(file)) {
      addQuestionnaire(file);
    } else {
      const msg =
        `Sorry, '${file.name}' is not a valid questionnaire JSON file. Please try uploading again with a valid file.`;
      displayStatus(msg, 'error', header);
    }
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
  uploadInput.addEventListener('change', evt => handleFiles(evt.target.files));
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
