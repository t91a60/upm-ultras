/**
 * UPM — Ultras Polonia Międzyrzecze
 * Main site JavaScript
 */

/**
 * Initialize IntersectionObserver for reveal animations.
 * Elements with the `.reveal` class get `visible` added when they enter the viewport.
 */
function initRevealObserver() {
  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );
  reveals.forEach((el) => observer.observe(el));
  return observer;
}

/**
 * Initialize scroll handler that toggles the `scrolled` class on `<nav>`.
 */
function initScrollHandler() {
  window.addEventListener('scroll', () => {
    document.querySelector('nav').classList.toggle('scrolled', window.scrollY > 50);
  });
}

/**
 * Initialize the mobile nav toggle.
 * Clicking `.nav-toggle` toggles the `open` class on `.nav-links`.
 */
function initNavToggle() {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
  }
}

/**
 * Keyboard handler that blocks certain dev-tool and save shortcuts.
 * @param {KeyboardEvent} e
 */
function handleKeydown(e) {
  if (
    (e.ctrlKey || e.metaKey) &&
    (e.key === 's' ||
      e.key === 'u' ||
      e.key === 'p' ||
      e.key === 'c' ||
      e.key === 'x' ||
      e.key === 'i' ||
      e.key === 'j')
  ) {
    e.preventDefault();
  }
  if (e.key === 'F12') {
    e.preventDefault();
  }
  if (e.shiftKey && e.key === 'F10') {
    e.preventDefault();
  }
}

/**
 * Register all event-prevention listeners (context menu, select, copy, drag, keydown).
 */
function initProtectionListeners() {
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  document.addEventListener('selectstart', (e) => e.preventDefault());
  document.addEventListener('keydown', handleKeydown);
  window.addEventListener('dragstart', (e) => e.preventDefault());
  document.addEventListener('copy', (e) => e.preventDefault());
}

/**
 * Frame-busting: if the page is loaded inside an iframe, redirect to the top.
 */
function frameBuster() {
  try {
    if (window.top !== window.self) {
      window.top.location.replace(window.self.location.href);
    }
  } catch (_e) {
    window.location.replace(window.location.href);
  }
}

/**
 * Print branded console messages.
 */
function logBranding() {
  console.log(
    '%cUltras Polonia Miedzyrzecze 2026',
    'font-size:24px;font-weight:800;color:#0f3d26;'
  );
  console.log('© UPM. All rights reserved.');
}

/**
 * Bootstrap the entire page.
 */
function init() {
  initRevealObserver();
  initScrollHandler();
  initNavToggle();
  logBranding();
  initProtectionListeners();
  window.addEventListener('load', frameBuster);
  setInterval(frameBuster, 1500);
}

// Auto-run in browser
if (typeof window !== 'undefined' && typeof module === 'undefined') {
  init();
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initRevealObserver,
    initScrollHandler,
    initNavToggle,
    handleKeydown,
    initProtectionListeners,
    frameBuster,
    logBranding,
    init,
  };
}
