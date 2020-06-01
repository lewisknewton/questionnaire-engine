'use strict';

import { getQuestionnaireId } from './modules/browser-questionnaire-handler.js';
import { getFormattedDate, setPageTitle } from './modules/browser-common.js';
import { displayError, displayWarning } from './modules/browser-status.js';

const main = document.querySelector('main');
const loading = document.querySelector('#loading');
const responsesList = document.querySelector('#responses');
const downloadBtn = responsesList.querySelector('#download');
const responseTemplate = document.querySelector('#response');

const navKeys = ['ArrowLeft', 'ArrowRight'];

let tabFocus = 0;
const tabs = document.querySelectorAll('button[role="tab"]');
const panels = document.querySelectorAll('article[role="tabpanel"');
const tabList = document.querySelector('div[role="tablist"]');

let id = '';
let responses = [];

/**
 * Sets the focus on the appropriate responses view tab for keyboard navigation.
 */
function focusOnTab(e) {
  console.log(e.target);

  if (navKeys.includes(e.key)) {
    // Remove focus on the current tab
    tabs[tabFocus].setAttribute('tabindex', -1);

    if (e.key === navKeys[0]) {
      tabFocus -= 1;

      // Move to the last tab if on the first tab
      if (tabFocus < 0) tabFocus = tabs.length - 1;
    } else if (e.key === navKeys[1]) {
      tabFocus += 1;

      // Move to the first tab if on the last tab
      if (tabFocus >= tabFocus.length) tabFocus = 0;
    }

    // Focus on the new tab
    tabs[tabFocus].setAttribute('tabindex', 0);
    tabs[tabFocus].focus();
  }
}

/**
 * Changes the current responses view (aggregated or individual) displayed.
 */
function switchView(e) {
  const clicked = e.target;
  const panel = document.querySelector(`article[aria-labelledby="${clicked.id}"]`);

  // Deselect the tab of the currently shown view
  for (const tab of tabs) {
    if (tab.getAttribute('aria-selected')) tab.setAttribute('aria-selected', false);
  }

  // Hide the currently shown view
  for (const panel of panels) {
    if (panel.getAttribute('hidden') == null) panel.setAttribute('hidden', true);
  }

  // Show the relevant view
  clicked.setAttribute('aria-selected', true);
  panel.removeAttribute('hidden');
}

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

  // Handle clicks on the responses views tabs
  for (const tab of tabs) {
    tab.addEventListener('click', switchView);
  }

  // Handle keypresses for navigating tabs via the keyboard
  tabList.addEventListener('keydown', focusOnTab);

  // Handle clicks on the download button
  downloadBtn.addEventListener('click', () => downloadResponses());
}

window.addEventListener('load', init);
