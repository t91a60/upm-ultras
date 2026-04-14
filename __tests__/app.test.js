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
 *  - Mobile menu close behavior (link click, Escape)
 *  - Body class toggle for mobile menu lock
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

  // Spy on console.log
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();

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
  navLinkCount = 0,
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

    for (let i = 0; i < navLinkCount; i++) {
      const link = document.createElement('a');
      link.href = `#section-${i}`;
      link.textContent = `Section ${i}`;
      links.appendChild(link);
    }

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
    expect(document.body.classList.contains('menu-open')).toBe(true);

    toggle.click();
    expect(links.classList.contains('open')).toBe(false);
    expect(document.body.classList.contains('menu-open')).toBe(false);
  });

  test('closes menu when nav link is clicked', () => {
    loadAppWithDOM({ navLinkCount: 1 });
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');
    const link = links.querySelector('a');

    toggle.click();
    expect(links.classList.contains('open')).toBe(true);

    link.click();
    expect(links.classList.contains('open')).toBe(false);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  test('closes menu on Escape key press', () => {
    loadAppWithDOM();
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');

    toggle.click();
    expect(links.classList.contains('open')).toBe(true);

    const event = new KeyboardEvent('keydown', {
      cancelable: true,
      bubbles: true,
      key: 'Escape',
    });
    document.dispatchEvent(event);

    expect(links.classList.contains('open')).toBe(false);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
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

  test('has robots index/follow meta tag', () => {
    expect(htmlContent).toMatch(/name="robots".*index, follow/);
  });

  test('has og:title meta tag', () => {
    expect(htmlContent).toMatch(/property="og:title"/);
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

  test('has user-select text on body', () => {
    expect(cssContent).toMatch(/user-select:\s*text/);
  });

  test('has reduced motion media query', () => {
    expect(cssContent).toMatch(/prefers-reduced-motion:\s*reduce/);
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

  test('does not block regular keyboard shortcuts anymore', () => {
    loadAppWithDOM();
    const event = new KeyboardEvent('keydown', {
      cancelable: true,
      bubbles: true,
      key: 'i',
      ctrlKey: true,
      shiftKey: true,
    });
    document.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });
});
