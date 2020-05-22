'use strict';

/**
 * Checks to see if an object (including arrays and strings) exists and has at
 * least one item (or character). Allows counting the number of keys or values.
 */
function isFilled(obj, countKeys = false) {
  return (obj != null && obj !== 'null' && (!countKeys ? obj.length > 0 : Object.keys(obj).length > 0));
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
