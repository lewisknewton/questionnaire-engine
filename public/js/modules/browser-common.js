'use strict';

/**
 * Converts a given Date object into a human-readable format.
 */
export function getFormattedDate(dateObj) {
  const day = dateObj.getDate() < 10 ? `0${dateObj.getDate()}` : dateObj.getDate();
  const month = dateObj.getMonth() + 1 < 10 ? `0${dateObj.getMonth() + 1}` : dateObj.getMonth() + 1;
  const year = dateObj.getFullYear();

  const hours = dateObj.getHours() < 10 ? `0${dateObj.getHours()}` : dateObj.getHours();
  const mins = dateObj.getMinutes() < 10 ? `0${dateObj.getMinutes()}` : dateObj.getMinutes();
  const secs = dateObj.getSeconds() < 10 ? `0${dateObj.getSeconds()}` : dateObj.getSeconds();

  return `${year}-${month}-${day} ${hours}:${mins}:${secs}`;
}

/**
 * Checks to see if an array (or string) exists and has at least one item (or character).
 */
export function isFilled(obj) {
  return obj != null && obj.length > 0;
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

/**
 * Sets the current document title.
 */
export function setPageTitle(title) {
  if (document.title !== title) document.title = title;
}
