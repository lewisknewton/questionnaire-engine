'use strict';

import { getQuestionnaireId } from './modules/browser-questionnaire-handler.js';
import { displayError } from './modules/browser-status.js';

const main = document.querySelector('main');
const loading = document.querySelector('#loading');

let id = '';

function displayResponses(responses) {
  console.log(responses);
}

/**
 * Retrieves the responses for the questionnaire of the given ID.
 */
async function loadResponses(questionnaireId) {
  const res = await fetch(`/api/questionnaires/${questionnaireId}/responses`);
  const data = await res.json();

  loading.classList.add('hidden');

  if (res.ok) {
    displayResponses(data);
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
