'use strict';

/**
 * Converts a given Date object into a human-readable format.
 */
export function getFormattedDate(dateObj) {
  const day = dateObj.getDay() < 10 ? `0${dateObj.getDay()}` : dateObj.getDay();
  const month = dateObj.getMonth() + 1 < 10 ? `0${dateObj.getMonth() + 1}` : dateObj.getMonth() + 1;
  const year = dateObj.getFullYear();

  const hours = dateObj.getHours();
  const mins = dateObj.getMinutes();
  const secs = dateObj.getSeconds();

  return `${year}-${month}-${day} ${hours}:${mins}:${secs}`;
}

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
