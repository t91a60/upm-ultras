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

const initAdminShortcut = () => {
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'P') {
      e.preventDefault();
      window.open('./panel/', '_blank');
    }
  });
};

const deferTracking = () => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(
      () => {
        import('./tracking.js').then((mod) => mod.initTracking());
      },
      { timeout: 3000 }
    );
  } else {
    setTimeout(() => {
      import('./tracking.js').then((mod) => mod.initTracking());
    }, 1000);
  }
};

runWhenReady(() => {
  initNav();
  initReveal();
  initImageFallbacks();
  hardenExternalLinks();
  deferTracking();
  initAdminShortcut();
  registerSW();
});
