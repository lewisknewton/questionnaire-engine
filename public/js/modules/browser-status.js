'use strict';

/**
 * Displays an error message. Also provides the option to display the
 * message after a given element.
 */
export function displayError(msg, afterEl = null) {
  const errorTemplate = document.querySelector('#error-message');
  const error = errorTemplate.content.cloneNode(true);

  error.querySelector('p').textContent = msg;

  if (afterEl != null) afterEl.after(error);
}

/**
 * Displays a warning message. Also provides the option to display the
 * message after a given element.
 */
export function displayWarning(msg, afterEl = null) {
  const warningTemplate = document.querySelector('#warning-message');
  const warning = warningTemplate.content.cloneNode(true);

  warning.querySelector('p').textContent = msg;

  if (afterEl != null) afterEl.after(warning);
}

/**
 * Displays a success message. Also provides the option to display the
 * message after a given element.
 */
export function displaySuccess(msg, afterEl = null) {
  const successTemplate = document.querySelector('#success-message');
  const success = successTemplate.content.cloneNode(true);

  success.querySelector('p').textContent = msg;

  if (afterEl != null) afterEl.after(success);
}
