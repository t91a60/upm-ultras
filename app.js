import { hardenExternalLinks } from './links.js';
import { initNav } from './nav.js';
import { initReveal } from './ui.js';

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
  hardenExternalLinks();
});
