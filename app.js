import { hardenExternalLinks } from './links.js';
import { initNav } from './nav.js';
import { initReveal, initImageFallbacks } from './ui.js';
import { initTracking } from './tracking.js';

const runWhenReady = (callback) => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback, { once: true });
    return;
  }

  callback();
};

const initAdminShortcut = () => {
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'P') {
      e.preventDefault();
      window.open('./panel/', '_blank');
    }
  });
};

runWhenReady(() => {
  initNav();
  initReveal();
  initImageFallbacks();
  hardenExternalLinks();
  initTracking();
  initAdminShortcut();
});
