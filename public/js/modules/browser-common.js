'use strict';

/**
 * Checks if an array (or string) exists and has at least one item (or character).
 */
export function isFilled(obj) {
  return obj != null && obj.length > 0;
}

/**
 * Checks to see if an array contains one or more objects with a given property,
 * and returns the object(s) if found.
 */
export function isInArray(arr, prop, value) {
  return arr.filter(item => item[prop] === value);
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
