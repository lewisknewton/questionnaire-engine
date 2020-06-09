'use strict';

/**
 * Adds an event listener for any number of events to a given element,
 * running a common callback on execution.
 */
export function addEventListeners(el, callback, useCapture, ...events) {
  for (const evt of events) el.addEventListener(evt, callback, useCapture);
}

/**
 * Prevents elements from carrying out their default behaviours.
 */
export function preventDefault(evt) {
  evt.preventDefault();
  evt.stopPropagation();
}

/**
 * Sets attributes with common values on a given element.
 */
export function setAttributes(el, attrs, value = true) {
  for (const attr of attrs) el.setAttribute(attr, value);
}

/**
 * Sets common attributes for given elements.
 */
export function setCommonAttributes(els, attr, value = true) {
  for (const el of els) el.setAttribute(attr, value);
}

/**
 * Makes an element disappear smoothly or abruptly, depending on the user's
 * preferences. Also supports removing the element from the DOM and a duration
 * in milliseconds.
 */
export function hideElement(el, remove = false, duration = 500) {
  const { matches: reduceMotion } = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (!reduceMotion) el.classList.add('smooth-hide');

  setTimeout(() => {
    el.classList.add('hidden');
  }, duration / 2);

  if (remove) {
    setTimeout(() => {
      el.remove();
    }, duration);
  }
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
