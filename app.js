import { hardenExternalLinks } from './links.js';
import { initNav } from './nav.js';
import { initReveal, initImageFallbacks } from './ui.js';
import { registerSW } from './sw-register.js';

const runWhenReady = (callback) => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback, { once: true });
    return;
  }

  callback();
};

runWhenReady(() => {
  initNav();
  initReveal();
  initImageFallbacks();
  hardenExternalLinks();
  registerSW();
});
