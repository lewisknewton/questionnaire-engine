'use strict';

/**
 * Checks to see if an array (or string) exists and has at least one item (or character).
 */
export function filled(obj) {
  return obj != null && obj.length > 0;
}
