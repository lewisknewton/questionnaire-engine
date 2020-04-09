'use strict';

const loading = document.querySelector('#loading');
const questionnaireList = document.querySelector('#questionnaire-list');
const questionnaireSummary = document.querySelector('#questionnaire-summary');
const errorTemplate = document.querySelector('#error-message');

/**
 * Displays an error message.
 */
function displayError(msg) {
  const error = errorTemplate.content.cloneNode(true);

  error.querySelector('p').textContent = msg;
  questionnaireList.after(error);
}

/**
 * Displays details about stored questionnaires.
 */
function displayQuestionnaires(questionnaires) {
  // Add content to questionnaire summary template
  for (const q in questionnaires) {
    const summary = questionnaireSummary.content.cloneNode(true);
    const name = summary.querySelector('h3');
    const count = summary.querySelector('span');
    const takeBtn = summary.querySelector('a.take');
    const editBtn = summary.querySelector('a.edit');
    const deleteBtn = summary.querySelector('a.delete');

    name.textContent = questionnaires[q].name ? questionnaires[q].name : `Untitled (${q})`;
    count.textContent = `Questions: ${questionnaires[q].questions ? questionnaires[q].questions.length : 0}`;
    takeBtn.setAttribute('href', `take?name=${q}`);
    editBtn.setAttribute('href', `edit?name=${q}`);
    deleteBtn.setAttribute('href', `delete?name=${q}`);

    questionnaireList.append(summary);
  }
}

/**
 * Retrieves all stored questionnaires.
 */
async function loadQuestionnaires() {
  const res = await fetch('api/questionnaires');
  const data = await res.json();

  loading.classList.add('hidden');

  if (res.ok) {
    if (Object.keys(data).length) {
      displayQuestionnaires(data);
    }
  } else {
    displayError(data.error);
  }
}

function init() {
  loadQuestionnaires();
}

window.addEventListener('load', init);
