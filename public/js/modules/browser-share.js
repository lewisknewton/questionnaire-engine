'use strict';

import { isFilled } from './browser-common.js';
import { closeDialog, handleDialogSupport, openDialog } from './browser-dialog.js';

/**
 * Prepares the share area and its children to be used when opened.
 */
export function initialiseShareElements(share, shareLink, shareOutput, shareCopyBtn, shareCloseBtn) {
  handleDialogSupport(share);

  shareCopyBtn.addEventListener('click', () => copyShareLink(shareLink, shareOutput));
  shareCloseBtn.addEventListener('click', () => closeDialog(share));
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
export async function shareQuestionnaire(qnr, share, shareLink, shareOutput) {
  const url = window.location;

  const shareText = `Share the link to the ${qnr.name} questionnaire:`;
  const shareUrl = url.pathname.includes(`take/${qnr.id}`) ? url.href : `${url.href}take/${qnr.id}`;

  if (navigator.share) {
    const data = {
      title: qnr.name,
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
