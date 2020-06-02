'use strict';

import { getQuestionnaireId } from './modules/browser-questionnaire-handler.js';
import { getFormattedDate, setPageTitle } from './modules/browser-common.js';
import { displayError, displayWarning } from './modules/browser-status.js';

const main = document.querySelector('main');
const loading = document.querySelector('#loading');
const responsesList = document.querySelector('#responses');

// Individual responses view elements
const individualPanel = document.querySelector('#individual-panel');
const prevResponseBtn = document.querySelector('#previous-response');
const nextResponseBtn = document.querySelector('#next-response');
const responseSelector = document.querySelector('#current-response-number');
const responseNumbers = document.querySelector('#response-numbers');
const downloadBtn = responsesList.querySelector('#download');

// Reproducible templates
const responseTemplate = document.querySelector('#response');
const answerTemplate = document.querySelector('#answer');

// Focus control elements
let tabFocus = 0;
const navKeys = ['ArrowLeft', 'ArrowRight'];
const tabs = document.querySelectorAll('button[role="tab"]');
const panels = document.querySelectorAll('section[role="tabpanel"]');
const tabList = document.querySelector('div[role="tablist"]');

let responses = [];
let questions = [];

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
 * Enables or disables the previous or next buttons for showing individual
 * responses, using a given index.
 */
function handleUseOfNavigationControls(index) {
  // Control previous (left) navigation
  if (index <= 0) {
    prevResponseBtn.setAttribute('disabled', true);
  } else {
    prevResponseBtn.removeAttribute('disabled');
  }

  // Control next (right) navigation
  if (index >= responses.length - 1) {
    nextResponseBtn.setAttribute('disabled', true);
  } else {
    nextResponseBtn.removeAttribute('disabled');
  }

  // Disable all controls when there is only one response
  if (responses.length === 1) {
    prevResponseBtn.setAttribute('disabled', true);
    nextResponseBtn.setAttribute('disabled', true);
    responseSelector.setAttribute('disabled', true);
  }
}

/**
 * Navigates through individual responses in either a forwards (positive steps)
 * or backwards (negative steps) direction.
 */
function traverseResponses(step) {
  const currentResponse = individualPanel.querySelector('article.response');
  const currentIndex = Number(currentResponse.getAttribute('data-index'));

  // Index of the desired response
  let targetIndex;

  // Determine direction (previous/left or next/right)
  if (step === 1 && currentIndex < responses.length - 1) {
    targetIndex = currentIndex + 1;
  } else if (step === -1 && currentIndex > 0) {
    targetIndex = currentIndex - 1;
  }

  displayResponse(targetIndex);
}

/**
 * Changes the current responses view (aggregated or individual) displayed.
 */
function switchView(e) {
  const clicked = e.target;
  const panel = document.querySelector(`section[aria-labelledby="${clicked.id}"]`);

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
 * Displays a response of the given questionnaire.
 */
function displayResponse(index) {
  const existing = individualPanel.querySelector('article.response');

  // Remove any response already shown
  if (existing != null) existing.remove();

  // Keep number input up-to-date
  responseSelector.value = index + 1;

  const response = responses[index];
  const answers = response.answers;
  const submitted = getFormattedDate(new Date(response.submitted));

  const responseEl = responseTemplate.content.cloneNode(true);
  const titleEl = responseEl.querySelector('h3');
  const idEl = responseEl.querySelector('span:nth-of-type(1)');
  const submittedEl = responseEl.querySelector('time');

  responseEl.querySelector('article').setAttribute('data-index', index);
  titleEl.textContent = `Response ${index + 1} of ${responses.length}`;
  idEl.textContent = `ID: ${response.id}`;
  submittedEl.textContent = submitted;
  submittedEl.setAttribute('datetime', submitted);

  // Add answers
  for (const answer of answers) {
    const answerEl = answerTemplate.content.cloneNode(true);
    const answerTitleEl = answerEl.querySelector('h5');
    const answerContentEl = answerEl.querySelector('span');

    // Find the question to which the answer was given
    const related = questions.filter(q => q.id === answer.questionId)[0];

    answerTitleEl.textContent = `${related.text} (${answer.questionId})`;
    answerContentEl.textContent = `${answer.content} `;

    responseEl.querySelector('section.answers').append(answerEl);
  }

  individualPanel.append(responseEl);

  // Enable or disable the appropriate navigation control(s)
  handleUseOfNavigationControls(index);
}

/**
 * Retrieves the responses for a given questionnaire, using its ID.
 */
async function loadResponses(questionnaireId) {
  const res = await fetch(`/api/questionnaires/${questionnaireId}/responses`);
  const data = await res.json();

  if (res.ok) {
    main.querySelector('h1').textContent = data.name;
    setPageTitle(data.name);

    if (data.warning) {
      displayWarning(data.warning, main.querySelector('h1'));
    } else {
      responses = data.responses;

      responseSelector.value = 1;
      responseSelector.setAttribute('max', responses.length);
      responseNumbers.textContent = `of ${responses.length}`;

      // Enable or disable the appropriate navigation control(s)
      handleUseOfNavigationControls();

      // Display the first response
      main.querySelector('#responses').classList.remove('hidden');
      displayResponse(0);
    }
  } else {
    displayError(data.error, main.querySelector('h1'));
  }
}

/**
 * Retrieves the questions for a given questionnaire, using its ID.
 */
async function loadQuestions(questionnaireId) {
  const res = await fetch(`/api/questionnaires/${questionnaireId}`);
  const data = await res.json();

  if (res.ok) questions = data.questions;
}

/**
 * Retrieves a given questionnaire's details and responses.
 */
async function loadData(questionnaireId) {
  await loadQuestions(questionnaireId);
  await loadResponses(questionnaireId);

  loading.classList.add('hidden');
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
 * Attaches event listeners and handlers to the tab elements, allowing them to
 * be navigated through clicking or via the keyboard.
 */
function handleTabEvents() {
  // Handle clicks
  for (const tab of tabs) tab.addEventListener('click', switchView);

  // Handle keyboard navigation
  tabList.addEventListener('keydown', focusOnTab);
}

/**
 * Attaches event listeners and handlers to elements related to the individual
 * responses view.
 */
function handleIndividualResponsesEvents() {
  // Handle clicks on the navigation controls
  nextResponseBtn.addEventListener('click', () => traverseResponses(+1));
  prevResponseBtn.addEventListener('click', () => traverseResponses(-1));

  // Handle manual response number inputs
  responseSelector.addEventListener('input', (e) => {
    let index = e.target.value - 1;

    // Adjust index when given invalid inputs
    if (index < 0 || isNaN(index)) {
      index = 0;
    } else if (index > responses.length - 1) {
      index = responses.length - 1;
    }

    displayResponse(index);
  });

  // Handle clicks on the download button
  downloadBtn.addEventListener('click', () => downloadResponses());
}

/**
 * Initialises the web page.
 */
function init() {
  // Load the responses and questionnaire detials, getting the questionnaire ID after `review/`
  const id = getQuestionnaireId('review');
  loadData(id);

  // Add event listeners and handlers
  handleTabEvents();
  handleIndividualResponsesEvents();
}

window.addEventListener('load', init);
