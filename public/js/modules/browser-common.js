'use strict';

/**
 * Checks if an array (or string) exists and has at least one item (or character).
 */
export function isFilled(obj) {
  return obj != null && obj.length > 0;
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
 * Prepares the share area and its children to be used when opened.
 */
export function initialiseShareElements(share, shareLink, shareOutput, shareCopyBtn, shareCloseBtn) {
  // Use fallback for <dialog> if unsupported
  if (typeof HTMLDialogElement !== 'function') {
    share.classList.add('hidden');
    share.setAttribute('aria-hidden', 'true');
    share.setAttribute('role', 'dialog');
  }

  shareCopyBtn.addEventListener('click', () => copyShareLink(shareLink, shareOutput));
  shareCloseBtn.addEventListener('click', () => closeShareArea(share));
}

/**
 * Closes the open share dialog.
 */
export function closeShareArea(share) {
  if (typeof share.close === 'function') {
    share.close();
  } else {
    share.setAttribute('aria-hidden', 'true');
    share.classList.add('hidden');
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
export async function shareQuestionnaire(q, share, shareLink, shareOutput, shareCloseBtn) {
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

    if (typeof share.showModal === 'function') {
      share.showModal();
    } else {
      share.removeAttribute('aria-hidden');
      share.classList.remove('hidden');

      // Set focus to be inside the dialog
      shareCloseBtn.focus();
      trapFocus(share);
    }
  }
}
