'use strict';

const questionnaireList = document.querySelector('#questionnaire-list');
const questionnaireSummary = document.querySelector('#questionnaire-summary');

async function loadQuestionnaires() {
  const res = await fetch('questionnaires');
  
  if (res.ok) {
    const questionnaires = await res.json();

    // Add content to questionnaire summary template
    for (const q in questionnaires) {
      const summary = questionnaireSummary.content.cloneNode(true);
      const name = summary.querySelector('h3');
      const count = summary.querySelector('span');
      const takeBtn = summary.querySelector('a.take');
      const editBtn = summary.querySelector('a.edit');
      const deleteBtn = summary.querySelector('a.delete');

      name.textContent = questionnaires[q].name ? questionnaires[q].name : 'Untitled';
      count.textContent = `Questions: ${questionnaires[q].questions ? questionnaires[q].questions.length : 0}`;
      takeBtn.setAttribute('href', `take?name=${questionnaires[q].hyperlink}`);
      editBtn.setAttribute('href', `edit?name=${questionnaires[q].hyperlink}`);
      deleteBtn.setAttribute('href', `delete?name=${questionnaires[q].hyperlink}`);

      questionnaireList.append(summary);
    }
  } else {
    questionnaireList.append('Sorry, there was unexpected error when loading questionnaires.');
  }
}

function init() {
  loadQuestionnaires();
}

window.addEventListener('load', init);
