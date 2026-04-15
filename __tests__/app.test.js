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
  extraAnchors = [],
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

  extraAnchors.forEach((anchorConfig) => {
    const anchor = document.createElement('a');

    if (anchorConfig.href !== undefined) {
      anchor.setAttribute('href', anchorConfig.href);
    }

    if (anchorConfig.target) {
      anchor.setAttribute('target', anchorConfig.target);
    }

    if (anchorConfig.rel) {
      anchor.setAttribute('rel', anchorConfig.rel);
    }

    document.body.appendChild(anchor);
  });

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

// ─── Link hardening ───────────────────────────────────────────────────

describe('Link hardening', () => {
  test('removes javascript: URLs from anchors', () => {
    loadAppWithDOM({
      extraAnchors: [{ href: 'javascript:alert(1)', target: '_blank' }],
    });

    const link = document.querySelector('a[target="_blank"]');
    expect(link.getAttribute('href')).toBe('#');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  test('adds rel and referrerpolicy to external _blank links', () => {
    loadAppWithDOM({
      extraAnchors: [{ href: 'https://example.com', target: '_blank' }],
    });

    const link = document.querySelector('a[target="_blank"]');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    expect(link.getAttribute('referrerpolicy')).toBe('no-referrer');
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

  test('has skip-link for accessibility', () => {
    expect(htmlContent).toMatch(/class="skip-link"/);
  });

  test('has main landmark element', () => {
    expect(htmlContent).toMatch(/<main\s+id="main-content">/);
  });

  test('has nav-toggle button with aria attributes', () => {
    expect(htmlContent).toMatch(/class="nav-toggle".*aria-label/s);
    expect(htmlContent).toMatch(/aria-expanded="false"/);
    expect(htmlContent).toMatch(/aria-controls="nav-links"/);
  });

  test('has canonical link', () => {
    expect(htmlContent).toMatch(/rel="canonical"/);
  });

  test('has twitter card meta tags', () => {
    expect(htmlContent).toMatch(/name="twitter:card"/);
    expect(htmlContent).toMatch(/name="twitter:title"/);
    expect(htmlContent).toMatch(/name="twitter:description"/);
  });

  test('has og:type and og:locale meta tags', () => {
    expect(htmlContent).toMatch(/property="og:type"/);
    expect(htmlContent).toMatch(/property="og:locale"/);
  });

  test('has Referrer-Policy http-equiv meta tag', () => {
    expect(htmlContent).toMatch(/http-equiv="Referrer-Policy"/);
  });

  test('has Permissions-Policy http-equiv meta tag', () => {
    expect(htmlContent).toMatch(/http-equiv="Permissions-Policy"/);
  });

  test('has X-Content-Type-Options meta tag', () => {
    expect(htmlContent).toMatch(/http-equiv="X-Content-Type-Options"/);
  });

  test('external links have rel="noopener noreferrer"', () => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const blankLinks = doc.querySelectorAll('a[target="_blank"]');
    expect(blankLinks.length).toBeGreaterThan(0);
    blankLinks.forEach((link) => {
      const rel = (link.getAttribute('rel') || '').split(/\s+/);
      expect(rel).toContain('noopener');
      expect(rel).toContain('noreferrer');
    });
  });

  test('images have alt attributes', () => {
    const imgsWithoutAlt = (htmlContent.match(/<img(?![^>]*alt=)[^>]*>/g) || []);
    expect(imgsWithoutAlt).toHaveLength(0);
  });

  test('has manifesto section', () => {
    expect(htmlContent).toContain('id="manifesto"');
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

  test('has .skip-link styles for accessibility', () => {
    expect(cssContent).toMatch(/\.skip-link\s*\{/);
  });

  test('has focus-visible styles for interactive elements', () => {
    expect(cssContent).toMatch(/focus-visible/);
  });

  test('has body.menu-open overflow hidden', () => {
    expect(cssContent).toMatch(/body\.menu-open\s*\{/);
    expect(cssContent).toMatch(/overflow:\s*hidden/);
  });

  test('has hero section styles', () => {
    expect(cssContent).toMatch(/#hero\s*\{/);
  });

  test('has sticker/shop section styles', () => {
    expect(cssContent).toMatch(/\.sticker-hero\s*\{/);
    expect(cssContent).toMatch(/\.shop-btn-big\s*\{/);
  });

  test('has contact grid styles', () => {
    expect(cssContent).toMatch(/\.contact-grid\s*\{/);
  });

  test('has nav.scrolled border transition', () => {
    expect(cssContent).toMatch(/transition.*border/);
  });

  test('has .nav-links.open display flex on mobile', () => {
    expect(cssContent).toMatch(/\.nav-links\.open\s*\{/);
  });

  test('has 480px breakpoint for small devices', () => {
    expect(cssContent).toMatch(/max-width:\s*480px/);
  });

  test('has 768px breakpoint for tablets', () => {
    expect(cssContent).toMatch(/max-width:\s*768px/);
  });

  test('has 900px breakpoint for medium screens', () => {
    expect(cssContent).toMatch(/max-width:\s*900px/);
  });
});

// ─── Link hardening — additional protocol/edge cases ──────────────────

describe('Link hardening — protocol edge cases', () => {
  test('allows mailto: links without setting referrerpolicy', () => {
    loadAppWithDOM({
      extraAnchors: [{ href: 'mailto:test@example.com' }],
    });

    const link = document.querySelector('a[href="mailto:test@example.com"]');
    expect(link.getAttribute('href')).toBe('mailto:test@example.com');
    expect(link.hasAttribute('referrerpolicy')).toBe(false);
  });

  test('blocks data: URLs and replaces with #', () => {
    loadAppWithDOM({
      extraAnchors: [{ href: 'data:text/html,<h1>hi</h1>' }],
    });

    const link = document.querySelector('a');
    expect(link.getAttribute('href')).toBe('#');
  });

  test('blocks ftp: URLs and replaces with #', () => {
    loadAppWithDOM({
      extraAnchors: [{ href: 'ftp://files.example.com/file.txt' }],
    });

    const link = document.querySelector('a');
    expect(link.getAttribute('href')).toBe('#');
  });

  test('handles anchor with empty href attribute', () => {
    loadAppWithDOM({
      extraAnchors: [{ href: '' }],
    });

    // Empty href is falsy, so sanitizeLinkHref returns false early (line 14)
    const link = document.querySelector('a[href=""]');
    expect(link).not.toBeNull();
    expect(link.getAttribute('href')).toBe('');
  });

  test('handles anchor with no href attribute at all', () => {
    loadAppWithDOM({
      extraAnchors: [{}],
    });

    // No href means sanitizeLinkHref returns false early (line 14)
    const link = document.querySelector('a:not([href])');
    expect(link).not.toBeNull();
  });

  test('handles malformed/invalid URLs gracefully (catch branch)', () => {
    loadAppWithDOM({
      extraAnchors: [{ href: 'http://' }],
    });

    // Invalid URL 'http://' triggers catch block (lines 27-28), href set to #
    const link = document.querySelector('a');
    expect(link.getAttribute('href')).toBe('#');
  });

  test('allows relative URLs (resolved against window.location)', () => {
    loadAppWithDOM({
      extraAnchors: [{ href: '/page' }],
    });

    const link = document.querySelector('a[href="/page"]');
    // Relative URLs resolve to http:// in jsdom, so they remain valid
    expect(link.getAttribute('href')).toBe('/page');
  });

  test('allows https: links and sets referrerpolicy', () => {
    loadAppWithDOM({
      extraAnchors: [{ href: 'https://example.com/path' }],
    });

    const link = document.querySelector('a[href="https://example.com/path"]');
    expect(link.getAttribute('referrerpolicy')).toBe('no-referrer');
  });

  test('does not add referrerpolicy to mailto: links with _blank target', () => {
    loadAppWithDOM({
      extraAnchors: [{ href: 'mailto:test@example.com', target: '_blank' }],
    });

    const link = document.querySelector('a[href="mailto:test@example.com"]');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    expect(link.hasAttribute('referrerpolicy')).toBe(false);
  });

  test('preserves existing rel attributes and appends noopener noreferrer', () => {
    loadAppWithDOM({
      extraAnchors: [
        { href: 'https://example.com', target: '_blank', rel: 'external' },
      ],
    });

    const link = document.querySelector('a[target="_blank"]');
    const rel = link.getAttribute('rel');
    expect(rel).toContain('external');
    expect(rel).toContain('noopener');
    expect(rel).toContain('noreferrer');
  });

  test('does not duplicate existing noopener in rel', () => {
    loadAppWithDOM({
      extraAnchors: [
        { href: 'https://example.com', target: '_blank', rel: 'noopener' },
      ],
    });

    const link = document.querySelector('a[target="_blank"]');
    const relParts = link.getAttribute('rel').split(/\s+/);
    const noopenerCount = relParts.filter((r) => r === 'noopener').length;
    expect(noopenerCount).toBe(1);
  });

  test('does not add rel to links without target="_blank"', () => {
    loadAppWithDOM({
      extraAnchors: [{ href: 'https://example.com' }],
    });

    const link = document.querySelector('a[href="https://example.com"]');
    expect(link.hasAttribute('rel')).toBe(false);
    expect(link.getAttribute('referrerpolicy')).toBe('no-referrer');
  });
});

// ─── Document click handler (onDocumentClick) ─────────────────────────

describe('Document click handler', () => {
  test('closes menu when clicking outside nav-links and nav-toggle', () => {
    loadAppWithDOM({ navLinkCount: 1 });
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');

    // Open the menu
    toggle.click();
    expect(links.classList.contains('open')).toBe(true);

    // Click on a separate element outside nav
    const outsideEl = document.createElement('div');
    document.body.appendChild(outsideEl);
    outsideEl.click();

    expect(links.classList.contains('open')).toBe(false);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(document.body.classList.contains('menu-open')).toBe(false);
  });

  test('does not close menu when clicking inside nav-links', () => {
    loadAppWithDOM({ navLinkCount: 1 });
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');

    toggle.click();
    expect(links.classList.contains('open')).toBe(true);

    // Click inside nav-links (on the UL itself, not a link)
    links.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(links.classList.contains('open')).toBe(true);
  });

  test('does not close menu via document click handler when clicking nav-toggle', () => {
    loadAppWithDOM({ navLinkCount: 1 });
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');

    // Open the menu
    toggle.click();
    expect(links.classList.contains('open')).toBe(true);

    // Simulate a document click with the toggle as target.
    // The onDocumentClick handler should not close the menu for toggle clicks.
    const clickEvent = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(clickEvent, 'target', { value: toggle });
    document.dispatchEvent(clickEvent);

    // Menu should still be open because onDocumentClick skips toggle clicks
    expect(links.classList.contains('open')).toBe(true);
  });

  test('does nothing when menu is already closed', () => {
    loadAppWithDOM({ navLinkCount: 1 });
    const links = document.querySelector('.nav-links');
    expect(links.classList.contains('open')).toBe(false);

    // Click outside — should not throw or change anything
    const outsideEl = document.createElement('div');
    document.body.appendChild(outsideEl);
    outsideEl.click();

    expect(links.classList.contains('open')).toBe(false);
  });

  test('does not close menu when click event target is not an Element', () => {
    loadAppWithDOM({ navLinkCount: 1 });
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');

    toggle.click();
    expect(links.classList.contains('open')).toBe(true);

    // Dispatch a click event with a non-Element target (e.g., null)
    const clickEvent = new Event('click', { bubbles: true });
    Object.defineProperty(clickEvent, 'target', { value: null });
    document.dispatchEvent(clickEvent);

    // Menu should remain open because the handler returns early for non-Element targets
    expect(links.classList.contains('open')).toBe(true);
  });
});

// ─── Window resize handler (onResize) ─────────────────────────────────

describe('Window resize handler', () => {
  test('closes menu when window is wider than 768px', () => {
    loadAppWithDOM({ navLinkCount: 1 });
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');

    toggle.click();
    expect(links.classList.contains('open')).toBe(true);

    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true, configurable: true });
    window.dispatchEvent(new Event('resize'));

    expect(links.classList.contains('open')).toBe(false);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(document.body.classList.contains('menu-open')).toBe(false);
  });

  test('does not close menu when window is 768px or narrower', () => {
    loadAppWithDOM({ navLinkCount: 1 });
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');

    toggle.click();
    expect(links.classList.contains('open')).toBe(true);

    Object.defineProperty(window, 'innerWidth', { value: 768, writable: true, configurable: true });
    window.dispatchEvent(new Event('resize'));

    expect(links.classList.contains('open')).toBe(true);
  });

  test('closes menu at exactly 769px (above 768 threshold)', () => {
    loadAppWithDOM({ navLinkCount: 1 });
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');

    toggle.click();
    expect(links.classList.contains('open')).toBe(true);

    Object.defineProperty(window, 'innerWidth', { value: 769, writable: true, configurable: true });
    window.dispatchEvent(new Event('resize'));

    expect(links.classList.contains('open')).toBe(false);
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

  test('scroll handler does not throw when nav element is absent', () => {
    loadAppWithDOM({ hasNav: false });

    Object.defineProperty(window, 'scrollY', { value: 100, writable: true, configurable: true });
    expect(() => {
      window.dispatchEvent(new Event('scroll'));
    }).not.toThrow();
  });

  test('non-Escape keys do not close the menu', () => {
    loadAppWithDOM();
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');

    toggle.click();
    expect(links.classList.contains('open')).toBe(true);

    const event = new KeyboardEvent('keydown', {
      cancelable: true,
      bubbles: true,
      key: 'Enter',
    });
    document.dispatchEvent(event);

    expect(links.classList.contains('open')).toBe(true);
  });

  test('all nav links close the menu when clicked', () => {
    loadAppWithDOM({ navLinkCount: 3 });
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');
    const navAnchors = links.querySelectorAll('a');

    navAnchors.forEach((anchor) => {
      toggle.click();
      expect(links.classList.contains('open')).toBe(true);

      anchor.click();
      expect(links.classList.contains('open')).toBe(false);
    });
  });

  test('aria-expanded is set correctly on toggle', () => {
    loadAppWithDOM();
    const toggle = document.querySelector('.nav-toggle');

    toggle.click();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');

    toggle.click();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  test('body menu-open class toggles with menu state', () => {
    loadAppWithDOM();
    const toggle = document.querySelector('.nav-toggle');

    expect(document.body.classList.contains('menu-open')).toBe(false);

    toggle.click();
    expect(document.body.classList.contains('menu-open')).toBe(true);

    toggle.click();
    expect(document.body.classList.contains('menu-open')).toBe(false);
  });

  test('closeMenu is idempotent when called multiple times', () => {
    loadAppWithDOM();
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');

    toggle.click();
    expect(links.classList.contains('open')).toBe(true);

    // Close via Escape twice
    const escape1 = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    document.dispatchEvent(escape1);
    expect(links.classList.contains('open')).toBe(false);

    const escape2 = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    expect(() => document.dispatchEvent(escape2)).not.toThrow();
    expect(links.classList.contains('open')).toBe(false);
  });
});
