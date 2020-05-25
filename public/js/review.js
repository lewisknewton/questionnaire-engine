'use strict';

import { getQuestionnaireId } from './modules/browser-questionnaire-handler.js';
import { displayError } from './modules/browser-status.js';
import { setPageTitle } from './modules/browser-common.js';

const main = document.querySelector('main');
const loading = document.querySelector('#loading');
const responsesList = document.querySelector('#responses');
const responseTemplate = document.querySelector('#response');

let id = '';

/**
 * Displays details and responses of a given questionnaire.
 */
function displayDetails(details) {
  const { responses } = details;

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
 * Initialises the web page.
 */
function init() {
  // Load the responses, getting the questionnaire ID after `review/`
  id = getQuestionnaireId('review');
  loadResponses(id);
}

window.addEventListener('load', init);
