'use strict';

/**
 * Checks if an array (or string) exists and has at least one item (or character).
 */
export function isFilled(obj) {
  return obj != null && obj.length > 0;
}

/**
 * Retrieves the ID of the selected questionnaire, using a given string
 * at which to divide the URL path (e.g. after `take` or after `review`).
 */
export function getQuestionnaireId(pathDivider) {
  const urlParts = window.location.pathname.split('/');
  const id = urlParts[urlParts.indexOf(pathDivider) + 1];

  if (isFilled(id)) return id;

  return null;
}

/**
 * Restricts elements the user can focus on within a given element.
 */
export function trapFocus(el) {
  const focusable = el.querySelectorAll('a, button, textarea');

  // Define first and last focusable elements
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  el.addEventListener('keydown', evt => {
    const focused = document.activeElement;

    // Only run if TAB key is pressed
    if (evt.key !== 'Tab') return;

    if (evt.shiftKey) {
      // Handle SHIFT + TAB combinations
      if (first === focused) {
        last.focus();
        evt.preventDefault();
      }
    } else {
      if (last === focused) {
        first.focus();
        evt.preventDefault();
      }
    }
  });
}
