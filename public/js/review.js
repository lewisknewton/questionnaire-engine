'use strict';

import { getQuestionnaireId } from './modules/browser-questionnaire-handler.js';
import { getFormattedDate, setPageTitle } from './modules/browser-common.js';
import { displayError, displayWarning } from './modules/browser-status.js';

const main = document.querySelector('main');
const loading = document.querySelector('#loading');
const responsesList = document.querySelector('#responses');
const downloadBtn = responsesList.querySelector('#download');
const responseTemplate = document.querySelector('#response');

let id = '';
let responses = [];

/**
 * Displays the responses of the given questionnaire.
 */
function displayResponses() {
  main.querySelector('#responses').classList.remove('hidden');

  for (const response of responses) {
    const submitted = getFormattedDate(new Date(response.submitted));

    const responseEl = responseTemplate.content.cloneNode(true);

    const title = responseEl.querySelector('h3');
    const idEl = responseEl.querySelector('span:nth-of-type(1)');
    const submittedEl = responseEl.querySelector('span:nth-of-type(2)');

    title.textContent = `${responses.indexOf(response) + 1} of ${responses.length}`;
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
    main.querySelector('h1').textContent = data.name;
    setPageTitle(data.name);

    if (data.warning) {
      displayWarning(data.warning, main.querySelector('h1'));
    } else {
      responses = data.responses;
      displayResponses();
    }
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
  tempAnchor.setAttribute('target', '_blank');

  tempAnchor.click();
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
