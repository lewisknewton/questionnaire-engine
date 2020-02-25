'use strict';

async function loadQuestionnaires() {
  const res = await fetch('questionnaires');
  
  if (res.ok) {
    console.log(await res.json());
  }
}

function init() {
  loadQuestionnaires();
}

window.addEventListener('load', init);
