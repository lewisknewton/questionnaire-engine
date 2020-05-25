'use strict';

import { getQuestionnaireId } from './modules/browser-questionnaire-handler.js';
import { displayError } from './modules/browser-status.js';
import { setPageTitle } from './modules/browser-common.js';

const main = document.querySelector('main');
const loading = document.querySelector('#loading');
const responsesList = document.querySelector('#responses');
const downloadBtn = responsesList.querySelector('#download');
const responseTemplate = document.querySelector('#response');

let id = '';
let responses = [];

/**
 * Displays details and responses of a given questionnaire.
 */
function displayDetails(details) {
  responses = details.responses;

  setPageTitle(details.name);

  main.querySelector('h1').textContent = details.name;
  main.querySelector('#responses').classList.remove('hidden');

  for (const response of responses) {
    const submitted = new Date(response.submitted).toLocaleString();

    const responseEl = responseTemplate.content.cloneNode(true);

    const title = responseEl.querySelector('h3');
    const idEl = responseEl.querySelector('span:nth-of-type(1)');
    const submittedEl = responseEl.querySelector('span:nth-of-type(2)');

    title.textContent = `${responses.indexOf(response) + 1} of ${responses.length} (${response.id})`;
    idEl.textContent = `ID: ${response.id}`;
    submittedEl.textContent = `Time submitted: ${submitted}`;

    responsesList.append(responseEl);
  }
}

/**
 * Retrieves the responses for the questionnaire of the given ID.
 */
async function loadResponses(questionnaireId) {
  const res = await fetch(`/api/questionnaires/${questionnaireId}/responses`);
  const data = await res.json();

  loading.classList.add('hidden');

  if (res.ok) {
    displayDetails(data);
  } else {
    displayError(data.error, main.querySelector('h1'));
  }
}

/**
 * Downloads all responses in the given file format.
 */
function downloadResponses(format = 'json') {
  // Convert responses to JSON for download
  const toDownload = encodeURIComponent(JSON.stringify(responses));
  const dataStr = `data:text/json;charset=utf-8,${toDownload}`;

  // Create a hidden, temporary anchor to download the file using the correct details
  const tempAnchor = document.createElement('a');
  tempAnchor.setAttribute('download', `responses.${format}`);
  tempAnchor.setAttribute('href', dataStr);

  document.body.append(tempAnchor);
  tempAnchor.click();
  document.body.remove(tempAnchor);
}

/**
 * Initialises the web page.
 */
function init() {
  // Load the responses, getting the questionnaire ID after `review/`
  id = getQuestionnaireId('review');
  loadResponses(id);

  downloadBtn.addEventListener('click', () => downloadResponses());
}

window.addEventListener('load', init);
