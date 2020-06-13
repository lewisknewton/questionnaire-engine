'use strict';

import { getImmediateTextContent, getQuestionnaireId, isFilled } from './modules/browser-common.js';
import { handleTabEvents, hideElement, setAttributes, setCommonAttributes } from './modules/browser-ui.js';
import { displayStatus, getFormattedDate, setPageTitle } from './modules/browser-status.js';

const main = document.querySelector('main');
const loading = document.querySelector('#loading');
const downloadBtn = document.querySelector('#download');

const responsesList = document.querySelector('#responses');

const aggregatedPanel = document.querySelector('#aggregated-panel');

// Individual responses view elements
const individualPanel = document.querySelector('#individual-panel');
const prevBtn = document.querySelector('#previous-response');
const nextBtn = document.querySelector('#next-response');
const shownResponse = document.querySelector('#current-response-number');
const responseNums = document.querySelector('#response-numbers');

// Reproducible templates
const responseTemplate = document.querySelector('#response');
const answerTemplate = document.querySelector('#answer');
const qnTemplate = document.querySelector('#aggregated-question');

let responses = [];
let qns = [];

/**
 * Enables or disables the previous or next buttons for showing individual
 * responses, using a given index.
 */
function handleUseOfNavigationControls(index) {
  // Control previous (left) navigation
  if (index <= 0) {
    prevBtn.setAttribute('disabled', true);
  } else {
    prevBtn.removeAttribute('disabled');
  }

  // Control next (right) navigation
  if (index >= responses.length - 1) {
    nextBtn.setAttribute('disabled', true);
  } else {
    nextBtn.removeAttribute('disabled');
  }

  // Disable all controls when there is only one response
  if (responses.length === 1) setCommonAttributes([prevBtn, nextBtn, shownResponse], 'disabled');
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
 * Handles number inputs to only show responses within the index range.
 */
function handleIndexInput(evt) {
  let index = evt.target.value - 1;

  // Adjust index when given invalid inputs
  if (index < 0 || isNaN(index)) {
    index = 0;
  } else if (index > responses.length - 1) {
    index = responses.length - 1;
  }

  displayResponse(index);
}

/**
 * Displays a response of the given questionnaire.
 */
function displayResponse(index) {
  const existing = individualPanel.querySelector('article.response');

  // Remove any response already shown
  if (existing != null) existing.remove();

  // Keep number input up-to-date
  shownResponse.value = index + 1;

  const response = responses[index];
  const answers = response.answers;
  const submitted = getFormattedDate(new Date(response.submitted));

  const responseEl = responseTemplate.content.cloneNode(true);
  const currentEl = individualPanel.querySelector('h3 > span#current-response');
  const idEl = responseEl.querySelector('b ~ span');
  const submittedEl = responseEl.querySelector('time');

  responseEl.querySelector(':nth-child(1)').setAttribute('data-index', index);
  currentEl.textContent = `Response ${index + 1}`;
  idEl.textContent = `${response.id}`;
  submittedEl.textContent = submitted;
  submittedEl.setAttribute('datetime', submitted);

  // Add answers
  for (const answer of answers) {
    const answerEl = answerTemplate.content.cloneNode(true);
    const answerTitleEl = answerEl.querySelector('h4');
    const answerContentEl = answerEl.querySelector('span');

    // Find the question to which the answer was given
    const related = qns.filter(qn => qn.id === answer.questionId)[0];

    // Show the correct answer and score if the answer was marked as part of a quiz
    if (related.answer != null) {
      const correct = String(related.answer);
      const points = related.points != null ? Number(related.points) : 1;
      const same = answer.content === correct;

      const correctEl = document.createElement('b');
      const correctText = document.createElement('span');
      const pointsEl = document.createElement('b');
      const pointsText = document.createElement('span');

      correctEl.textContent = 'Correct answer:';
      correctText.textContent = correct;
      pointsEl.textContent = 'Points scored:';
      pointsText.textContent = `${same ? points : 0}/${points}`;

      answerContentEl.setAttribute('title', same ? 'Correct answer' : 'Incorrect answer');
      answerContentEl.classList.add(same ? 'correct' : 'incorrect');

      answerEl.append(correctEl, correctText, pointsEl, pointsText);
    }

    answerTitleEl.textContent = `${related.text} (${answer.questionId})`;
    answerContentEl.textContent = Array.isArray(answer.content) ? answer.content.join(', ') : answer.content || '(Unanswered)';
    answerContentEl.classList.add('answer');

    responseEl.querySelector('section.answers').append(answerEl);
  }

  individualPanel.append(responseEl);

  handleUseOfNavigationControls(index);
}

/**
 * Displays aggregated answers from all the responses of the given questionnaire.
 */
function displayAggregated() {
  // Collate all answers (excluding empty answers)
  const answers = responses
    .flatMap(response => response.answers)
    .filter(answer => answer.content != null);

  for (const qn of qns) {
    // Find answers for the current question
    const related = answers.filter(answer => answer.questionId === qn.id);
    const existing = {};

    let qnEl = aggregatedPanel.querySelector(`article.question[id=${qn.id}`);
    let qnCount;
    let qnAnswers;
    let qnAnswersContents = [];

    if (qnEl != null) {
      qnCount = qnEl.querySelector('b ~ span');
      qnAnswers = qnEl.querySelectorAll('.answer');
      qnAnswersContents = [...qnAnswers].map(el => getImmediateTextContent(el));
    } else {
      qnEl = qnTemplate.content.cloneNode(true).querySelector(':nth-child(1)');
      qnCount = qnEl.querySelector('b ~ span');

      const qnHeading = qnEl.querySelector('h4');

      qnEl.setAttribute('id', qn.id);
      qnHeading.textContent = `${qn.text} (${qn.id})`;

      aggregatedPanel.append(qnEl);
    }

    if (qnCount.textContent !== related.length) {
      qnCount.textContent = related.length;
    }

    for (const answer of related) {
      if (qn.type === 'multi-select') {
        if (Array.isArray(answer.content)) {
          answer.content = answer.content.join(', ');
        }
      }

      // Count duplicate answers
      existing[answer.content] = (existing[answer.content] || 0) + 1;
    }

    for (const answer in existing) {
      const count = existing[answer];
      let countEl;
      let qnAnswer;

      if (qnAnswersContents.includes(answer)) {
        qnAnswer = qnAnswers[qnAnswersContents.indexOf(answer)];
        countEl = qnAnswer.querySelector('span');
      } else {
        qnAnswer = document.createElement('p');
        qnAnswer.classList.add('answer');
        qnAnswer.textContent = answer;
      }

      if (!qnAnswersContents.includes(answer) || countEl == null) {
        countEl = document.createElement('span');
        setAttributes(countEl, ['aria-label', 'title'], `Answered by ${count} participants`);
      }

      qnEl.append(qnAnswer);
      if (count > 1) qnAnswer.append(countEl);

      countEl.textContent = count;
    }
  }
}

/**
 * Shows basic information about individual responses.
 */
function displayResponseDetails() {
  const maxResponses = individualPanel.querySelector('h3 > span#max-responses');

  shownResponse.value = shownResponse.value || 1;
  shownResponse.setAttribute('max', responses.length);

  for (const el of [responseNums, maxResponses]) el.textContent = `of ${responses.length}`;
}

/**
 * Retrieves the responses for a given questionnaire, using its ID.
 */
async function loadResponses(qnrId) {
  const res = await fetch(`/api/questionnaires/${qnrId}/responses`);
  const data = await res.json();

  const title = main.querySelector('h1');

  if (res.ok) {
    if (title.textContent !== data.name) title.textContent = data.name;
    setPageTitle(data.name);

    if (data.warning) {
      displayStatus(data.warning, 'warning', title);
    } else {
      responses = data.responses;

      displayAggregated();
      displayResponseDetails();

      handleUseOfNavigationControls(shownResponse.value - 1);

      // Display the current response
      if (document.querySelector('.response') == null) {
        responsesList.classList.remove('hidden');
        displayResponse(shownResponse.value - 1);
      }

      for (const msg of ['.error', '.warning']) {
        const status = document.querySelector(msg);

        if (status) hideElement(status, true);
      }
    }
  } else {
    displayStatus(data.error, 'error', title);
  }

  // Poll for new responses every 5 seconds
  setTimeout(loadResponses, 5000, qnrId);
}

/**
 * Retrieves the questions for a given questionnaire, using its ID.
 */
async function loadQuestions(qnrId) {
  const res = await fetch(`/api/questionnaires/${qnrId}`);
  const data = await res.json();

  if (res.ok) qns = data.questions;
}

/**
 * Retrieves a given questionnaire's details and responses.
 */
async function loadData(qnrId) {
  await loadQuestions(qnrId);
  await loadResponses(qnrId);

  hideElement(loading);
}

/**
 * Retrieves the selected options to be applied to a downloaded responses file.
 */
function getDownloadOptions() {
  const options = {};
  const downloadOpts =
    document.querySelectorAll('input[name="format"]:checked, input[name="included"]:checked');

  for (const input of downloadOpts) {
    if (input.type === 'radio') {
      options[input.name] = input.id;
    } else {
      if (!isFilled(options[input.name])) {
        options[input.name] = [input.id];
      } else {
        options[input.name].push(input.id);
      }
    }
  }

  return options;
}

/**
 * Converts the responses object into separated values using a given separator,
 * suitable for CSV or TSV files.
 */
function convertToSeparatedValues(sep) {
  const responseProps = Object.keys(responses[0]).filter(a => a !== 'answers');
  const originalOrder = qns.map(qn => qn.id);

  const newLine = '\r\n';
  let data = [responseProps, originalOrder.join(sep)].join(sep) + newLine;

  for (const response of responses) {
    let row = '';

    for (const prop in response) {
      // Add top-level properties (i.e. id and time submitted)
      if (prop !== 'answers') row += `${response[prop]}${sep}`;
    }

    for (const qn of originalOrder) {
      // Compare question IDs to those questions actually answered
      const answered = response.answers.map(answer => answer.questionId);

      for (const answer of response.answers) {
        if (answer.questionId !== qn) {
          // Skip the answered question for now to retain the correct order
          if (answered.includes(qn)) continue;

          // Add empty records for unanswered questions
          row += sep;
          break;
        } else {
          row += `${Array.isArray(answer.content) ? answer.content.join('; ') : answer.content || ''}${sep}`;
        }
      }
    }

    data += `${row}${newLine}`;
  }

  return data;
}

/**
 * Converts responses data into the correct format for downloading, using a
 * given file format (i.e. CSV, JSON).
 */
function convertResponses(format) {
  let data;
  let type;

  if (format === 'csv') {
    data = convertToSeparatedValues(',');
    type = 'text/csv';
  } else if (format === 'json') {
    data = JSON.stringify(responses);
    type = 'application/json';
  } else if (format === 'tsv') {
    data = convertToSeparatedValues('\t');
    type = 'text/tab-separated-values';
  }

  const blob = new Blob([data], { type });

  return blob;
}

/**
 * Downloads all responses in the given file format.
 */
function downloadResponses() {
  const { format } = getDownloadOptions();

  // Define data to be downloaded
  const blob = convertResponses(format);
  const url = URL.createObjectURL(blob);

  // Create a temporary anchor to download the file using the correct details
  const tempAnchor = document.createElement('a');
  tempAnchor.setAttribute('download', `responses.${format}`);
  tempAnchor.setAttribute('href', url);
  tempAnchor.setAttribute('target', '_blank');

  tempAnchor.click();

  // Remove reference to the URL reference
  URL.revokeObjectURL(url);
}

/**
 * Attaches event listeners and handlers to elements related to the individual
 * responses view.
 */
function handleIndividualResponsesEvents() {
  downloadBtn.addEventListener('click', downloadResponses);
  nextBtn.addEventListener('click', () => traverseResponses(+1));
  prevBtn.addEventListener('click', () => traverseResponses(-1));

  shownResponse.addEventListener('input', handleIndexInput);
}

/**
 * Initialises the web page.
 */
function init() {
  // Load the responses and questionnaire detials, getting the questionnaire ID after `review/`
  const qnrId = getQuestionnaireId('review');
  loadData(qnrId);

  // Add event listeners and handlers
  handleTabEvents();
  handleIndividualResponsesEvents();
}

window.addEventListener('load', init);
