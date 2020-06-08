'use strict';

/**
 * Sets the current document title.
 */
export function setPageTitle(title) {
  if (document.title !== title) document.title = title;
}

/**
 * Adds a visual indicator showing that a given element is being interacted with.
 */
export function highlight(el) {
  el.classList.add('highlighted');
}

/**
 * Removes the visual indicator showing a given element was being interacted with.
 */
export function unhighlight(el) {
  el.classList.remove('highlighted');
}

/**
 * Displays a status message of a given type (success, warning, or error).
 * Also provides the option to display the message after a given element or
 * to append it directly to the main content.
 */
export function displayStatus(msg, type, afterEl = null) {
  const template = document.querySelector(`#${type}-message`);
  const status = template.content.cloneNode(true);

  const statusEl = status.querySelector('p');

  statusEl.textContent = msg;
  statusEl.setAttribute('aria-live', 'assertive');

  const existing =
    [...document.querySelectorAll(`.${type}`)].map(el => el.textContent);

  if (!existing.includes(msg)) {
    if (afterEl != null) {
      afterEl.after(status);
    } else {
      document.querySelector('main').append(status);
    }
  }

  statusEl.scrollIntoView();
}

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
