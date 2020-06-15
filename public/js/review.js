'use strict';

import { getImmediateTextContent, getQuestionnaireId, isFilled } from './modules/browser-common.js';
import { handleTabEvents, hideElement, setAttributes, setCommonAttributes } from './modules/browser-ui.js';
import { displayStatus, getFormattedDate, setPageTitle } from './modules/browser-status.js';
import { closeDialog, handleDialogSupport, openDialog } from './modules/browser-dialog.js';

const main = document.querySelector('main');
const title = main.querySelector('h1');
const loading = document.querySelector('#loading');
const downloadBtn = document.querySelector('#download');

// Deletion elements
const deleteAllDialog = document.querySelector('#delete-all');
const deleteAllCloseBtn = document.querySelector('#delete-all-close');
const deleteAllCancelBtn = document.querySelector('#delete-all-cancel');
const deleteAllConfirmBtn = document.querySelector('#delete-all-confirm');

const deleteSingleDialog = document.querySelector('#delete-single');
const deleteSingleCloseBtn = document.querySelector('#delete-single-close');
const deleteSingleCancelBtn = document.querySelector('#delete-single-cancel');
const deleteSingleConfirmBtn = document.querySelector('#delete-single-confirm');

const deleteAllBtn = document.querySelector('#delete-all-btn');
let _singleRemove;

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
let qnrId = '';
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
  resetShownResponse();

  // Stop other responses being deleted when clicking the confirm button
  deleteSingleConfirmBtn.removeEventListener('click', _singleRemove);

  // Keep number input up-to-date
  shownResponse.value = index + 1;

  if (responses.length > 0) {
    const response = responses[index];
    const answers = response.answers;
    const submitted = getFormattedDate(new Date(response.submitted));

    const responseEl = responseTemplate.content.cloneNode(true);
    const responseContainer = responseEl.querySelector(':nth-child(1)');
    const currentEl = individualPanel.querySelector('h3 > span#current-response');
    const idEl = responseEl.querySelector('b ~ span');
    const submittedEl = responseEl.querySelector('time');
    const deleteBtn = responseEl.querySelector('.delete');

    responseContainer.setAttribute('data-index', index);
    responseContainer.setAttribute('id', response.id);
    currentEl.textContent = `Response ${index + 1}`;
    idEl.textContent = `${response.id}`;
    submittedEl.textContent = submitted;
    submittedEl.setAttribute('datetime', submitted);

    // Set function for deleting the current response
    _singleRemove = () => removeResponse(response.id);

    deleteBtn.addEventListener('click', () => openDialog(deleteSingleDialog));
    deleteSingleConfirmBtn.addEventListener('click', _singleRemove);

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

    let qnEl = aggregatedPanel.querySelector(`article.question#${qn.id}`);
    let qnAnswers;
    let qnAnswersContents = [];

    // Define and display question details
    if (qnEl != null) {
      qnAnswers = qnEl.querySelectorAll('.answer');
      qnAnswersContents = [...qnAnswers].map(el => getImmediateTextContent(el));
    } else {
      qnEl = qnTemplate.content.cloneNode(true).querySelector(':nth-child(1)');
      const qnHeading = qnEl.querySelector('h4');

      qnEl.setAttribute('id', qn.id);
      qnHeading.textContent = `${qn.text} (${qn.id})`;

      aggregatedPanel.append(qnEl);
    }

    const qnCount = qnEl.querySelector('.count');

    if (qnCount.textContent !== related.length) {
      qnCount.textContent = related.length;
    }

    for (const answer of related) {
      if (qn.type === 'multi-select') {
        // List multiple answers
        if (Array.isArray(answer.content)) {
          answer.content = answer.content.join(', ');
        }
      }

      // Count duplicate answers
      existing[answer.content] = (existing[answer.content] || 0) + 1;
    }

    let correctCount = qnEl.querySelector('.correct-count');

    // Show percentage of correct answers for scored questions
    if (qn.answer) {
      const correct = existing[qn.answer] || 0;
      const percentage = (correct / related.length * 100).toFixed(2);

      if (correctCount == null) {
        const correctContainer = document.createElement('p');
        const correctLabel = document.createElement('b');
        correctCount = document.createElement('span');

        correctLabel.textContent = 'Correct answers: ';
        correctCount.classList.add('correct-count');

        correctContainer.append(correctLabel, correctCount);
        qnEl.append(correctContainer);
      }

      correctCount.textContent = `${correct}/${related.length} (${percentage}%)`;
    }

    for (const answer in existing) {
      const answerCount = existing[answer];
      let countEl;
      let qnAnswer;

      // Define and display answers (with the number of duplicate answers)
      if (qnAnswersContents.includes(answer)) {
        qnAnswer = qnAnswers[qnAnswersContents.indexOf(answer)];
        countEl = qnAnswer.querySelector('span');

        if (countEl != null && answerCount === 1) countEl.remove();
      } else {
        qnAnswer = document.createElement('p');
        qnAnswer.classList.add('answer');
        qnAnswer.textContent = answer;
      }

      if (!qnAnswersContents.includes(answer) || countEl == null) {
        countEl = document.createElement('span');
        setAttributes(countEl, ['aria-label', 'title'], `Answered by ${answerCount} participants`);

      if (qn.answer) {
        qnAnswer.classList.add(answer === String(qn.answer) ? 'correct' : 'incorrect');
      }

      countEl.textContent = answerCount;
      qnEl.append(qnAnswer);
    }

    // Remove answers from deleted responses
    for (const shownAnswer of qnAnswersContents) {
      if (!Object.keys(existing).includes(shownAnswer)) {
        qnAnswers[qnAnswersContents.indexOf(shownAnswer)].remove();
      }
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
  let data = [responseProps.join(sep), originalOrder.join(sep)].join(sep) + newLine;

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
 * Hides and removes all responses shown to users.
 */
function resetResponseElements() {
  hideElement(responsesList);

  const qnBlocks = aggregatedPanel.querySelectorAll('.question');
  const responseBlock = individualPanel.querySelector('.response');

  if (isFilled(qnBlocks)) for (const qnBlock of qnBlocks) qnBlock.remove();
  if (responseBlock != null) responseBlock.remove();
}

/**
 * Removes the response currently shown in the individual view.
 */
function resetShownResponse() {
  const existing = individualPanel.querySelector('article.response');

  if (existing != null) {
    existing.setAttribute('data-index', existing.getAttribute('data-index') - 1);
    existing.remove();
  }
}

/**
 * Removes a given questionnaire's responses.
 */
async function removeResponses() {
  const opts = { method: 'DELETE' };
  const res = await fetch(`/api/questionnaires/${qnrId}/responses`, opts);

  closeDialog(deleteAllDialog);

  let status;

  if (res.ok) {
    loadResponses();
    resetResponseElements();

    const msg = `All responses for questionnaire of ID '${qnrId}' were deleted successfully.`;
    status = 'success';

    displayStatus(msg, status, title);
  } else {
    const data = await res.json();
    status = 'error';

    displayStatus(data.error, status, title);
  }

  setTimeout(() => hideElement(document.querySelector(`.${status}`), true), 5000);
}

/**
 * Remove's a given response.
 */
async function removeResponse(id) {
  const opts = { method: 'DELETE' };
  const res = await fetch(`/api/questionnaires/${qnrId}/responses/${id}`, opts);

  closeDialog(deleteSingleDialog);

  let status;

  if (res.ok) {
    await loadResponses();

    // Show the previous available response, or the first if only one exists
    const newIndex = shownResponse.value > 1 ? shownResponse.value - 1 : 1;
    displayResponse(newIndex - 1);

    const msg = `The response of ID '${id}' was deleted successfully.`;
    status = 'success';

    displayStatus(msg, status, title);
  } else {
    const data = await res.json();
    status = 'error';

    displayStatus(data.error, status, title);
  }

  setTimeout(() => hideElement(document.querySelector(`.${status}`), true), 5000);
}

/**
 * Prepares the delete dialogs and their related elements for
 * handling response deletions.
 */
function initialiseDeletionElements() {
  for (const el of [deleteAllDialog, deleteSingleDialog]) handleDialogSupport(el);

  for (const el of [deleteAllCloseBtn, deleteAllCancelBtn]) {
    el.addEventListener('click', () => closeDialog(deleteAllDialog));
  }

  deleteAllConfirmBtn.addEventListener('click', removeResponses);

  for (const el of [deleteSingleCloseBtn, deleteSingleCancelBtn]) {
    el.addEventListener('click', () => closeDialog(deleteSingleDialog));
  }

  deleteAllBtn.addEventListener('click', () => openDialog(deleteAllDialog));
}

/**
 * Retrieves the responses for a given questionnaire, using its ID.
 */
async function loadResponses() {
  const res = await fetch(`/api/questionnaires/${qnrId}/responses`);
  const data = await res.json();

  // Find any response that is already shown
  const shown = individualPanel.querySelector('.response');

  if (res.ok) {
    if (title.textContent !== data.name) title.textContent = data.name;
    setPageTitle(data.name);

    if (data.warning) {
      // No responses exist
      displayStatus(data.warning, 'warning', title);

      for (const response in responses) delete responses[response];
      responses = [];

      resetResponseElements();
    } else {
      responses = data.responses;

      displayAggregated();
      displayResponseDetails();

      handleUseOfNavigationControls(shownResponse.value - 1);

      // Display the current response
      if (shown == null) {
        responsesList.classList.remove('smooth-hide', 'hidden');
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
  setTimeout(loadResponses, 5000);
}

/**
 * Retrieves the questions for a given questionnaire, using its ID.
 */
async function loadQuestions() {
  const res = await fetch(`/api/questionnaires/${qnrId}`);
  const data = await res.json();

  if (res.ok) qns = data.questions;
}

/**
 * Retrieves a given questionnaire's details and responses.
 */
async function loadData() {
  await loadQuestions();
  await loadResponses();

  hideElement(loading);
}

/**
 * Initialises the web page.
 */
function init() {
  // Load the responses and questionnaire detials, getting the questionnaire ID after `review/`
  qnrId = getQuestionnaireId('review');
  loadData();

  // Add event listeners and handlers
  handleTabEvents();
  handleIndividualResponsesEvents();

  initialiseDeletionElements();
}

window.addEventListener('load', init);
