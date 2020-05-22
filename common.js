'use strict';

/**
 * Checks to see if an array exists and has at least one item.
 */
function isFilled(arr) {
  return arr != null && arr.length > 0;
}

/**
 * Checks to see if an array contains an object of a given property.
 */
function isInArray(arr, prop, value) {
  return arr.some(item => item[prop] === value);
}

module.exports = {
  isFilled,
  isInArray,
};
