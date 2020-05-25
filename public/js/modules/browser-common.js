'use strict';

/**
 * Checks to see if an array (or string) exists and has at least one item (or character).
 */
export function isFilled(obj) {
  return obj != null && obj.length > 0;
}

/**
 * Sets the current document title.
 */
export function setPageTitle(title) {
  if (document.title !== title) document.title = title;
}
