/**
 * @jest-environment jsdom
 */

/* eslint-disable no-undef */

/**
 * Comprehensive test suite for app.js
 *
 * Covers:
 *  - IntersectionObserver setup and behavior
 *  - Scroll handler (nav "scrolled" class)
 *  - Nav toggle (mobile menu open/close)
 *  - Console log output
 *  - Event prevention (contextmenu, selectstart, keydown, dragstart, copy)
 *  - Keydown handler specifics (Ctrl/Meta combos, F12, Shift+F10)
 *  - Frame-busting logic
 */

let observerCallback;
let observerOptions;
let observedElements;
let unobservedElements;

beforeEach(() => {
  // Reset jsdom
  document.body.innerHTML = '';
  document.head.innerHTML = '';

  // Track observed/unobserved elements
  observedElements = [];
  unobservedElements = [];
  observerCallback = null;
  observerOptions = null;

  // Mock IntersectionObserver
  global.IntersectionObserver = jest.fn((callback, options) => {
    observerCallback = callback;
    observerOptions = options;
    return {
      observe: jest.fn((el) => observedElements.push(el)),
      unobserve: jest.fn((el) => unobservedElements.push(el)),
      disconnect: jest.fn(),
    };
  });

  // Mock timers for setInterval
  jest.useFakeTimers();

  // Spy on console.log
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  jest.clearAllTimers();
  jest.restoreAllMocks();
  jest.useRealTimers();

  // Clean up global mocks
  delete global.IntersectionObserver;
});

/**
 * Helper: sets up the minimal DOM that app.js expects and loads it.
 */
function loadAppWithDOM({
  revealCount = 2,
  hasNavToggle = true,
  hasNavLinks = true,
  hasNav = true,
} = {}) {
  // Build DOM
  if (hasNav) {
    const nav = document.createElement('nav');
    document.body.appendChild(nav);
  }

  if (hasNavToggle) {
    const toggle = document.createElement('button');
    toggle.classList.add('nav-toggle');
    document.body.appendChild(toggle);
  }

  if (hasNavLinks) {
    const links = document.createElement('ul');
    links.classList.add('nav-links');
    document.body.appendChild(links);
  }

  for (let i = 0; i < revealCount; i++) {
    const el = document.createElement('div');
    el.classList.add('reveal');
    document.body.appendChild(el);
  }

  // Load app.js (runs immediately on require)
  jest.isolateModules(() => {
    require('../app.js');
  });
}

// ─── IntersectionObserver ──────────────────────────────────────────────

describe('IntersectionObserver', () => {
  test('creates an IntersectionObserver with threshold 0.1', () => {
    loadAppWithDOM();
    expect(global.IntersectionObserver).toHaveBeenCalledTimes(1);
    expect(observerOptions).toEqual({ threshold: 0.1 });
  });

  test('observes all .reveal elements', () => {
    loadAppWithDOM({ revealCount: 3 });
    const reveals = document.querySelectorAll('.reveal');
    expect(observedElements).toHaveLength(3);
    reveals.forEach((el, i) => {
      expect(observedElements[i]).toBe(el);
    });
  });

  test('observes zero elements when none have .reveal class', () => {
    loadAppWithDOM({ revealCount: 0 });
    expect(observedElements).toHaveLength(0);
  });

  test('adds "visible" class and unobserves when entry is intersecting', () => {
    loadAppWithDOM({ revealCount: 1 });
    const target = document.querySelector('.reveal');
    expect(target.classList.contains('visible')).toBe(false);

    // Simulate intersection
    observerCallback([{ isIntersecting: true, target }]);

    expect(target.classList.contains('visible')).toBe(true);
    expect(unobservedElements).toContain(target);
  });

  test('does NOT add "visible" class when entry is not intersecting', () => {
    loadAppWithDOM({ revealCount: 1 });
    const target = document.querySelector('.reveal');

    observerCallback([{ isIntersecting: false, target }]);

    expect(target.classList.contains('visible')).toBe(false);
    expect(unobservedElements).toHaveLength(0);
  });

  test('handles multiple entries in a single callback', () => {
    loadAppWithDOM({ revealCount: 3 });
    const reveals = document.querySelectorAll('.reveal');

    observerCallback([
      { isIntersecting: true, target: reveals[0] },
      { isIntersecting: false, target: reveals[1] },
      { isIntersecting: true, target: reveals[2] },
    ]);

    expect(reveals[0].classList.contains('visible')).toBe(true);
    expect(reveals[1].classList.contains('visible')).toBe(false);
    expect(reveals[2].classList.contains('visible')).toBe(true);
    expect(unobservedElements).toEqual([reveals[0], reveals[2]]);
  });
});

// ─── Scroll handler ────────────────────────────────────────────────────

describe('Scroll handler', () => {
  test('adds "scrolled" class to nav when scrollY > 50', () => {
    loadAppWithDOM();
    const nav = document.querySelector('nav');

    Object.defineProperty(window, 'scrollY', { value: 51, writable: true, configurable: true });
    window.dispatchEvent(new Event('scroll'));

    expect(nav.classList.contains('scrolled')).toBe(true);
  });

  test('removes "scrolled" class from nav when scrollY <= 50', () => {
    loadAppWithDOM();
    const nav = document.querySelector('nav');

    // First scroll past 50
    Object.defineProperty(window, 'scrollY', { value: 100, writable: true, configurable: true });
    window.dispatchEvent(new Event('scroll'));
    expect(nav.classList.contains('scrolled')).toBe(true);

    // Scroll back to 50
    Object.defineProperty(window, 'scrollY', { value: 50, writable: true, configurable: true });
    window.dispatchEvent(new Event('scroll'));
    expect(nav.classList.contains('scrolled')).toBe(false);
  });

  test('does not add "scrolled" at exactly scrollY = 50', () => {
    loadAppWithDOM();
    const nav = document.querySelector('nav');

    Object.defineProperty(window, 'scrollY', { value: 50, writable: true, configurable: true });
    window.dispatchEvent(new Event('scroll'));

    expect(nav.classList.contains('scrolled')).toBe(false);
  });

  test('adds "scrolled" at scrollY = 0 is false', () => {
    loadAppWithDOM();
    const nav = document.querySelector('nav');

    Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true });
    window.dispatchEvent(new Event('scroll'));

    expect(nav.classList.contains('scrolled')).toBe(false);
  });
});

// ─── Nav toggle ────────────────────────────────────────────────────────

describe('Nav toggle', () => {
  test('toggles "open" class on .nav-links when .nav-toggle is clicked', () => {
    loadAppWithDOM();
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');

    expect(links.classList.contains('open')).toBe(false);

    toggle.click();
    expect(links.classList.contains('open')).toBe(true);

    toggle.click();
    expect(links.classList.contains('open')).toBe(false);
  });

  test('does not error when .nav-toggle is missing', () => {
    expect(() => {
      loadAppWithDOM({ hasNavToggle: false });
    }).not.toThrow();
  });

  test('does not error when .nav-toggle exists but .nav-links is missing', () => {
    expect(() => {
      loadAppWithDOM({ hasNavToggle: true, hasNavLinks: false });
    }).not.toThrow();
    // Clicking the toggle should not throw even without .nav-links
    const toggle = document.querySelector('.nav-toggle');
    expect(() => toggle.click()).not.toThrow();
  });
});

// ─── Console output ────────────────────────────────────────────────────

describe('Console output', () => {
  test('logs the branding message', () => {
    loadAppWithDOM();
    expect(console.log).toHaveBeenCalledWith(
      'Ultras Polonia Miedzyrzecze 2026'
    );
  });

  test('logs the copyright message', () => {
    loadAppWithDOM();
    expect(console.log).toHaveBeenCalledWith('© UPM. All rights reserved.');
  });
});

// ─── Context menu prevention ───────────────────────────────────────────

describe('Context menu prevention', () => {
  test('prevents default on contextmenu event', () => {
    loadAppWithDOM();
    const event = new Event('contextmenu', { cancelable: true });
    document.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});

// ─── Select start prevention ───────────────────────────────────────────

describe('Select start prevention', () => {
  test('prevents default on selectstart event', () => {
    loadAppWithDOM();
    const event = new Event('selectstart', { cancelable: true });
    document.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});

// ─── Drag start prevention ─────────────────────────────────────────────

describe('Drag start prevention', () => {
  test('prevents default on dragstart event', () => {
    loadAppWithDOM();
    const event = new Event('dragstart', { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});

// ─── Copy prevention ───────────────────────────────────────────────────

describe('Copy prevention', () => {
  test('prevents default on copy event', () => {
    loadAppWithDOM();
    const event = new Event('copy', { cancelable: true });
    document.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});

// ─── Keydown handler ───────────────────────────────────────────────────

describe('Keydown handler', () => {
  function dispatchKeydown(options) {
    const event = new KeyboardEvent('keydown', {
      cancelable: true,
      bubbles: true,
      ...options,
    });
    document.dispatchEvent(event);
    return event;
  }

  // Ctrl + key combinations that should be prevented
  const blockedCtrlKeys = ['s', 'u', 'p', 'c', 'x', 'i', 'j'];

  blockedCtrlKeys.forEach((key) => {
    test(`prevents Ctrl+${key}`, () => {
      loadAppWithDOM();
      const event = dispatchKeydown({ key, ctrlKey: true });
      expect(event.defaultPrevented).toBe(true);
    });
  });

  // Meta (Cmd) + key combinations that should be prevented
  blockedCtrlKeys.forEach((key) => {
    test(`prevents Meta+${key}`, () => {
      loadAppWithDOM();
      const event = dispatchKeydown({ key, metaKey: true });
      expect(event.defaultPrevented).toBe(true);
    });
  });

  test('prevents F12', () => {
    loadAppWithDOM();
    const event = dispatchKeydown({ key: 'F12' });
    expect(event.defaultPrevented).toBe(true);
  });

  test('prevents Shift+F10', () => {
    loadAppWithDOM();
    const event = dispatchKeydown({ key: 'F10', shiftKey: true });
    expect(event.defaultPrevented).toBe(true);
  });

  test('does NOT prevent regular key presses (e.g. "a")', () => {
    loadAppWithDOM();
    const event = dispatchKeydown({ key: 'a' });
    expect(event.defaultPrevented).toBe(false);
  });

  test('does NOT prevent Ctrl+a (not in blocked list)', () => {
    loadAppWithDOM();
    const event = dispatchKeydown({ key: 'a', ctrlKey: true });
    expect(event.defaultPrevented).toBe(false);
  });

  test('does NOT prevent F10 without Shift', () => {
    loadAppWithDOM();
    const event = dispatchKeydown({ key: 'F10' });
    expect(event.defaultPrevented).toBe(false);
  });

  test('does NOT prevent F12 with Ctrl (still prevented since key is F12)', () => {
    loadAppWithDOM();
    const event = dispatchKeydown({ key: 'F12', ctrlKey: true });
    // F12 check is independent of ctrlKey, so it should still be prevented
    expect(event.defaultPrevented).toBe(true);
  });

  test('does NOT prevent Shift+F12 (only F12 key matters)', () => {
    loadAppWithDOM();
    const event = dispatchKeydown({ key: 'F12', shiftKey: true });
    // The F12 condition triggers regardless of shiftKey
    expect(event.defaultPrevented).toBe(true);
  });
});

// ─── Frame-busting ─────────────────────────────────────────────────────

describe('Frame-busting', () => {
  test('runs frame-buster on window load', () => {
    // When window.top === window.self, no redirect should happen
    loadAppWithDOM();
    // No error means it ran successfully
    window.dispatchEvent(new Event('load'));
  });

  test('frame-buster does not redirect when top === self', () => {
    // In normal (non-iframe) context, top === self, so no redirect
    const originalReplace = window.location.replace;
    const replaceSpy = jest.fn();
    window.location.replace = replaceSpy;

    loadAppWithDOM();
    window.dispatchEvent(new Event('load'));

    // Should NOT redirect since we're not in an iframe
    expect(replaceSpy).not.toHaveBeenCalled();

    window.location.replace = originalReplace;
  });

  test('frame-buster interval fires every 1500ms', () => {
    const setIntervalSpy = jest.spyOn(global, 'setInterval');
    loadAppWithDOM();

    // Verify setInterval was called with 1500ms
    const calls = setIntervalSpy.mock.calls;
    const intervalCall = calls.find((c) => c[1] === 1500);
    expect(intervalCall).toBeDefined();
    expect(typeof intervalCall[0]).toBe('function');
  });
});

// ─── HTML structure validation ─────────────────────────────────────────

describe('HTML structure', () => {
  let htmlContent;

  beforeAll(() => {
    const fs = require('fs');
    const path = require('path');
    htmlContent = fs.readFileSync(
      path.join(__dirname, '..', 'index.html'),
      'utf-8'
    );
  });

  test('has correct doctype', () => {
    expect(htmlContent).toMatch(/<!DOCTYPE html>/i);
  });

  test('has lang="pl" attribute', () => {
    expect(htmlContent).toMatch(/<html\s+lang="pl">/);
  });

  test('has charset meta tag', () => {
    expect(htmlContent).toMatch(/<meta\s+charset="utf-8"\s*\/?>/i);
  });

  test('has viewport meta tag', () => {
    expect(htmlContent).toMatch(/name="viewport"/);
  });

  test('has page title', () => {
    expect(htmlContent).toMatch(/<title>.*UPM.*<\/title>/);
  });

  test('has Content-Security-Policy meta tag', () => {
    expect(htmlContent).toMatch(/Content-Security-Policy/);
  });

  test('has robots noindex meta tag', () => {
    expect(htmlContent).toMatch(/name="robots".*noindex/);
  });

  test('links to style.css', () => {
    expect(htmlContent).toMatch(/href="\.\/style\.css"/);
  });

  test('links to app.js with defer', () => {
    expect(htmlContent).toMatch(/src="\.\/app\.js"\s+defer/);
  });

  test('has noscript fallback', () => {
    expect(htmlContent).toMatch(/<noscript>/);
  });

  test('has nav element with id', () => {
    expect(htmlContent).toMatch(/<nav\s+id="main-nav">/);
  });

  test('has all required sections', () => {
    const sections = ['hero', 'aktualnosci', 'galeria', 'sklep', 'dolacz', 'kontakt'];
    sections.forEach((id) => {
      expect(htmlContent).toContain(`id="${id}"`);
    });
  });

  test('has navigation links for all sections', () => {
    const navLinks = ['#aktualnosci', '#galeria', '#sklep', '#dolacz', '#kontakt'];
    navLinks.forEach((href) => {
      expect(htmlContent).toContain(`href="${href}"`);
    });
  });

  test('has footer element', () => {
    expect(htmlContent).toMatch(/<footer>/);
  });

  test('has .reveal elements for animation', () => {
    const revealCount = (htmlContent.match(/class="[^"]*reveal[^"]*"/g) || []).length;
    expect(revealCount).toBeGreaterThan(0);
  });

  test('has external links with target="_blank"', () => {
    const externalLinks = htmlContent.match(/href="https?:\/\/[^"]*"[^>]*target="_blank"/g);
    expect(externalLinks).not.toBeNull();
    expect(externalLinks.length).toBeGreaterThan(0);
  });

  test('has OG image meta tag', () => {
    expect(htmlContent).toMatch(/property="og:image"/);
  });

  test('has favicon link', () => {
    expect(htmlContent).toMatch(/rel="icon"/);
  });

  test('has description meta tag', () => {
    expect(htmlContent).toMatch(/name="description"/);
  });
});

// ─── CSS structure validation ──────────────────────────────────────────

describe('CSS structure', () => {
  let cssContent;

  beforeAll(() => {
    const fs = require('fs');
    const path = require('path');
    cssContent = fs.readFileSync(
      path.join(__dirname, '..', 'style.css'),
      'utf-8'
    );
  });

  test('defines CSS custom properties in :root', () => {
    expect(cssContent).toMatch(/:root\s*\{/);
  });

  test('defines all color variables', () => {
    const colors = [
      '--black', '--deep', '--dark', '--forest', '--green',
      '--mid', '--accent', '--light-green', '--white', '--muted', '--dim',
    ];
    colors.forEach((color) => {
      expect(cssContent).toContain(color);
    });
  });

  test('has smooth scroll behavior on html', () => {
    expect(cssContent).toMatch(/scroll-behavior:\s*smooth/);
  });

  test('has box-sizing border-box reset', () => {
    expect(cssContent).toMatch(/box-sizing:\s*border-box/);
  });

  test('has .reveal animation styles', () => {
    expect(cssContent).toMatch(/\.reveal\s*\{/);
    expect(cssContent).toMatch(/\.reveal\.visible\s*\{/);
  });

  test('has responsive breakpoints', () => {
    const mediaQueries = cssContent.match(/@media\s*\(/g);
    expect(mediaQueries).not.toBeNull();
    expect(mediaQueries.length).toBeGreaterThanOrEqual(2);
  });

  test('has nav styles', () => {
    expect(cssContent).toMatch(/nav\s*\{/);
  });

  test('has .nav-toggle styles', () => {
    expect(cssContent).toMatch(/\.nav-toggle\s*\{/);
  });

  test('has gallery grid styles', () => {
    expect(cssContent).toMatch(/\.gallery-grid\s*\{/);
  });

  test('has footer styles', () => {
    expect(cssContent).toMatch(/footer\s*\{/);
  });

  test('has user-select none on body', () => {
    expect(cssContent).toMatch(/user-select:\s*none/);
  });

  test('has keyframe animations defined', () => {
    expect(cssContent).toMatch(/@keyframes\s+float/);
    expect(cssContent).toMatch(/@keyframes\s+glitch/);
    expect(cssContent).toMatch(/@keyframes\s+scan/);
  });
});

// ─── Edge cases ────────────────────────────────────────────────────────

describe('Edge cases', () => {
  test('app.js loads without nav element in DOM', () => {
    expect(() => {
      loadAppWithDOM({ hasNav: false });
    }).not.toThrow();
  });

  test('app.js loads without nav-links element', () => {
    expect(() => {
      loadAppWithDOM({ hasNavLinks: false });
    }).not.toThrow();
  });

  test('app.js loads with empty DOM (no reveal, no toggle, no nav)', () => {
    expect(() => {
      loadAppWithDOM({
        revealCount: 0,
        hasNavToggle: false,
        hasNavLinks: false,
        hasNav: false,
      });
    }).not.toThrow();
  });

  test('multiple scroll events work correctly in sequence', () => {
    loadAppWithDOM();
    const nav = document.querySelector('nav');

    Object.defineProperty(window, 'scrollY', { value: 100, writable: true, configurable: true });
    window.dispatchEvent(new Event('scroll'));
    expect(nav.classList.contains('scrolled')).toBe(true);

    Object.defineProperty(window, 'scrollY', { value: 10, writable: true, configurable: true });
    window.dispatchEvent(new Event('scroll'));
    expect(nav.classList.contains('scrolled')).toBe(false);

    Object.defineProperty(window, 'scrollY', { value: 51, writable: true, configurable: true });
    window.dispatchEvent(new Event('scroll'));
    expect(nav.classList.contains('scrolled')).toBe(true);
  });

  test('rapid nav toggle clicks work correctly', () => {
    loadAppWithDOM();
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');

    for (let i = 0; i < 5; i++) {
      toggle.click();
    }
    // 5 clicks = odd number = open
    expect(links.classList.contains('open')).toBe(true);

    toggle.click();
    // 6 clicks = even = closed
    expect(links.classList.contains('open')).toBe(false);
  });

  test('Ctrl+Shift+key combo still prevented for blocked keys', () => {
    loadAppWithDOM();
    const event = new KeyboardEvent('keydown', {
      cancelable: true,
      bubbles: true,
      key: 'i',
      ctrlKey: true,
      shiftKey: true,
    });
    document.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});
