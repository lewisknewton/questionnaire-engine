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

/**
 * Prevents elements from carrying out their default behaviours.
 */
export function preventDefault(evt) {
  evt.preventDefault();
  evt.stopPropagation();
}

/**
 * Restricts elements the user can focus on within a given element.
 */
export function trapFocus(el) {
  const focusable = el.querySelectorAll('a, button, textarea');

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
 * Prepares the share area and its children to be used when opened.
 */
export function initialiseShareElements(share, shareLink, shareOutput, shareCopyBtn, shareCloseBtn) {
  handleDialogSupport(share);

  shareCopyBtn.addEventListener('click', () => copyShareLink(shareLink, shareOutput));
  shareCloseBtn.addEventListener('click', () => closeDialog(share));
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
    dialog.classList.add('hidden');
  }
}

/**
 * Copies the URL of the selected questionnaire to the clipboard.
 */
export function copyShareLink(shareLink, shareOutput) {
  shareLink.select();
  document.execCommand('copy');

  shareOutput.value = 'Link copied.';

  setTimeout(() => {
    shareOutput.value = '';
  }, 3000);
}

/**
 * Shares a link to the questionnaire, either via native sharing options for
 * mobile users or through alternative sharing options for other devices.
 */
export async function shareQuestionnaire(q, share, shareLink, shareOutput) {
  const url = window.location;

  const shareText = `Share the link to the ${q.name} questionnaire:`;
  const shareUrl = url.pathname.includes(`take/${q.id}`) ? url.href : `${url.href}take/${q.id}`;

  if (navigator.share) {
    const data = {
      title: q.name,
      text: shareText,
      url: shareUrl,
    };

    try {
      await navigator.share(data);
    } catch (err) {
      console.error(err);
    }
  } else {
    share.querySelector('p').textContent = shareText;
    shareLink.textContent = shareUrl;

    if (isFilled(shareOutput.value)) shareOutput.value = '';

    openDialog(share);
  }
}
