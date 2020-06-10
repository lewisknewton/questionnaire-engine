'use strict';

import { trapFocus } from './browser-ui.js';

/**
 * Uses a fallback for browsers that do not support the <dialog> element.
 */
export function handleDialogSupport(dialog) {
  if (typeof HTMLDialogElement !== 'function') {
    dialog.classList.add('hidden');
    dialog.setAttribute('aria-hidden', 'true');
    dialog.setAttribute('role', 'dialog');
  }
}

/**
 * Shows a given hidden (closed) dialog.
 */
export function openDialog(dialog) {
  if (typeof dialog.showModal === 'function') {
    dialog.showModal();
  } else {
    dialog.removeAttribute('aria-hidden');
    dialog.classList.remove('hidden');
    dialog.classList.add('fallback');

    const focusable = dialog.querySelectorAll('a[href], button, input, textarea');

    // Set focus to be inside the dialog
    focusable[0].focus();
    trapFocus(dialog);
  }
}

/**
 * Hides a given shown (open) dialog.
 */
export function closeDialog(dialog) {
  if (typeof dialog.close === 'function') {
    dialog.close();
  } else {
    dialog.setAttribute('aria-hidden', 'true');
    dialog.classList.remove('fallback');
    dialog.classList.add('hidden');
  }
}
