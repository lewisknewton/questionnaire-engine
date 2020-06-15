'use strict';

// Focus control elements
let tabFocus = 0;
const navKeys = ['ArrowLeft', 'ArrowRight'];
const tabs = document.querySelectorAll('button[role="tab"]');
const panels = document.querySelectorAll('section[role="tabpanel"]');
const tabList = document.querySelector('div[role="tablist"]');

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

  const hide = () => {
    if (remove) {
      el.remove();
    } else {
      el.classList.add('hidden');
    }
  };

  if (el.offsetParent !== null || !el.classList.contains('hidden')) {
    if (!reduceMotion) {
      el.style.maxHeight = `${el.offsetHeight}px`;

      setTimeout(() => {
        el.style.transitionDuration = `${duration / 2000}s`;
        el.style.maxHeight = '';
        el.classList.add('smooth-hide');

        setTimeout(hide, duration / 2);
      }, duration);
    } else {
      hide();
    }
  }
}

/**
 * Restricts elements the user can focus on within a given element.
 */
export function trapFocus(el) {
  const focusable = el.querySelectorAll('a, button, input, textarea');

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
 * Attaches event listeners and handlers to the tab elements, allowing them to
 * be navigated through clicking or via the keyboard.
 */
export function handleTabEvents() {
  // Handle clicks
  for (const tab of tabs) tab.addEventListener('click', switchView);

  // Handle keyboard navigation
  tabList.addEventListener('keydown', focusOnTab);
}

/**
 * Sets the focus on the appropriate view tab for keyboard navigation.
 */
export function focusOnTab(e) {
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
 * Changes the current view displayed.
 */
export function switchView(evt) {
  const clicked = evt.target;
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
