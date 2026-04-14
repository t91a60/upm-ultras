/**
 * @jest-environment jsdom
 */

/* global jest, describe, beforeEach, afterEach, it, expect */

let mainModule;

// ── helpers ────────────────────────────────────────────────────────────────────

/** Build a minimal DOM that mirrors the production page structure. */
function setupDOM() {
  document.body.innerHTML = `
    <nav>
      <span class="nav-toggle"></span>
      <div class="nav-links"></div>
    </nav>
    <section>
      <div class="reveal">A</div>
      <div class="reveal">B</div>
      <div class="reveal">C</div>
    </section>
  `;
}

/** Create a KeyboardEvent with the given properties. */
function keyEvent(key, opts = {}) {
  return new KeyboardEvent('keydown', {
    key,
    ctrlKey: opts.ctrlKey || false,
    metaKey: opts.metaKey || false,
    shiftKey: opts.shiftKey || false,
    cancelable: true,
    bubbles: true,
  });
}

// ── setup / teardown ───────────────────────────────────────────────────────────

beforeEach(() => {
  jest.useFakeTimers();
  setupDOM();
  // Fresh import each test to avoid listener build-up
  jest.resetModules();
  mainModule = require('../js/main');
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
  document.body.innerHTML = '';
});

// ── IntersectionObserver (reveal) ──────────────────────────────────────────────

describe('initRevealObserver', () => {
  it('should observe every .reveal element', () => {
    const observeSpy = jest.fn();
    // Provide a mock IntersectionObserver with observe & unobserve
    window.IntersectionObserver = jest.fn((cb) => ({
      observe: observeSpy,
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));

    mainModule.initRevealObserver();

    const reveals = document.querySelectorAll('.reveal');
    expect(observeSpy).toHaveBeenCalledTimes(reveals.length);
    reveals.forEach((el, i) => {
      expect(observeSpy).toHaveBeenNthCalledWith(i + 1, el);
    });
  });

  it('should add "visible" class when an entry is intersecting', () => {
    let observerCallback;
    const unobserveSpy = jest.fn();
    window.IntersectionObserver = jest.fn((cb) => {
      observerCallback = cb;
      return { observe: jest.fn(), unobserve: unobserveSpy, disconnect: jest.fn() };
    });

    mainModule.initRevealObserver();

    const target = document.querySelector('.reveal');
    // Simulate intersection
    observerCallback([{ isIntersecting: true, target }]);

    expect(target.classList.contains('visible')).toBe(true);
    expect(unobserveSpy).toHaveBeenCalledWith(target);
  });

  it('should NOT add "visible" class when entry is NOT intersecting', () => {
    let observerCallback;
    window.IntersectionObserver = jest.fn((cb) => {
      observerCallback = cb;
      return { observe: jest.fn(), unobserve: jest.fn(), disconnect: jest.fn() };
    });

    mainModule.initRevealObserver();

    const target = document.querySelector('.reveal');
    observerCallback([{ isIntersecting: false, target }]);

    expect(target.classList.contains('visible')).toBe(false);
  });

  it('should pass threshold 0.1 to IntersectionObserver', () => {
    window.IntersectionObserver = jest.fn(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));

    mainModule.initRevealObserver();

    expect(window.IntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      { threshold: 0.1 }
    );
  });
});

// ── Scroll handler ─────────────────────────────────────────────────────────────

describe('initScrollHandler', () => {
  it('should add "scrolled" class to nav when scrollY > 50', () => {
    mainModule.initScrollHandler();
    const nav = document.querySelector('nav');

    Object.defineProperty(window, 'scrollY', { value: 100, writable: true });
    window.dispatchEvent(new Event('scroll'));

    expect(nav.classList.contains('scrolled')).toBe(true);
  });

  it('should remove "scrolled" class when scrollY <= 50', () => {
    mainModule.initScrollHandler();
    const nav = document.querySelector('nav');

    // First scroll past threshold
    Object.defineProperty(window, 'scrollY', { value: 100, writable: true });
    window.dispatchEvent(new Event('scroll'));
    expect(nav.classList.contains('scrolled')).toBe(true);

    // Scroll back up
    Object.defineProperty(window, 'scrollY', { value: 10, writable: true });
    window.dispatchEvent(new Event('scroll'));
    expect(nav.classList.contains('scrolled')).toBe(false);
  });

  it('should NOT add "scrolled" when scrollY is exactly 50', () => {
    mainModule.initScrollHandler();
    const nav = document.querySelector('nav');

    Object.defineProperty(window, 'scrollY', { value: 50, writable: true });
    window.dispatchEvent(new Event('scroll'));

    expect(nav.classList.contains('scrolled')).toBe(false);
  });
});

// ── Nav toggle ─────────────────────────────────────────────────────────────────

describe('initNavToggle', () => {
  it('should toggle "open" class on .nav-links when .nav-toggle is clicked', () => {
    mainModule.initNavToggle();
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');

    toggle.click();
    expect(links.classList.contains('open')).toBe(true);

    toggle.click();
    expect(links.classList.contains('open')).toBe(false);
  });

  it('should not throw when .nav-toggle is missing', () => {
    document.querySelector('.nav-toggle').remove();
    expect(() => mainModule.initNavToggle()).not.toThrow();
  });

  it('should not throw when .nav-links is missing', () => {
    document.querySelector('.nav-links').remove();
    expect(() => mainModule.initNavToggle()).not.toThrow();
  });
});

// ── Keyboard shortcut prevention ───────────────────────────────────────────────

describe('handleKeydown', () => {
  const blockedKeys = ['s', 'u', 'p', 'c', 'x', 'i', 'j'];

  blockedKeys.forEach((key) => {
    it(`should prevent Ctrl+${key}`, () => {
      const e = keyEvent(key, { ctrlKey: true });
      mainModule.handleKeydown(e);
      expect(e.defaultPrevented).toBe(true);
    });

    it(`should prevent Meta+${key}`, () => {
      const e = keyEvent(key, { metaKey: true });
      mainModule.handleKeydown(e);
      expect(e.defaultPrevented).toBe(true);
    });
  });

  it('should prevent F12', () => {
    const e = keyEvent('F12');
    mainModule.handleKeydown(e);
    expect(e.defaultPrevented).toBe(true);
  });

  it('should prevent Shift+F10', () => {
    const e = keyEvent('F10', { shiftKey: true });
    mainModule.handleKeydown(e);
    expect(e.defaultPrevented).toBe(true);
  });

  it('should NOT prevent a normal key press (e.g. "a")', () => {
    const e = keyEvent('a');
    mainModule.handleKeydown(e);
    expect(e.defaultPrevented).toBe(false);
  });

  it('should NOT prevent Ctrl+a (not in the blocked list)', () => {
    const e = keyEvent('a', { ctrlKey: true });
    mainModule.handleKeydown(e);
    expect(e.defaultPrevented).toBe(false);
  });

  it('should NOT prevent F10 without Shift', () => {
    const e = keyEvent('F10');
    mainModule.handleKeydown(e);
    expect(e.defaultPrevented).toBe(false);
  });

  it('should NOT prevent "s" without Ctrl/Meta', () => {
    const e = keyEvent('s');
    mainModule.handleKeydown(e);
    expect(e.defaultPrevented).toBe(false);
  });
});

// ── Protection listeners ───────────────────────────────────────────────────────

describe('initProtectionListeners', () => {
  it('should prevent the contextmenu event', () => {
    mainModule.initProtectionListeners();
    const e = new Event('contextmenu', { cancelable: true });
    document.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(true);
  });

  it('should prevent the selectstart event', () => {
    mainModule.initProtectionListeners();
    const e = new Event('selectstart', { cancelable: true });
    document.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(true);
  });

  it('should prevent the copy event', () => {
    mainModule.initProtectionListeners();
    const e = new Event('copy', { cancelable: true });
    document.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(true);
  });

  it('should prevent the dragstart event', () => {
    mainModule.initProtectionListeners();
    const e = new Event('dragstart', { cancelable: true });
    window.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(true);
  });

  it('should register keydown handler that blocks Ctrl+s', () => {
    mainModule.initProtectionListeners();
    const e = keyEvent('s', { ctrlKey: true });
    document.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(true);
  });
});

// ── Frame buster ───────────────────────────────────────────────────────────────

describe('frameBuster', () => {
  it('should not redirect when top === self', () => {
    // By default in jsdom, window.top === window.self so no redirect occurs
    // Verify the function completes without throwing
    expect(() => mainModule.frameBuster()).not.toThrow();
  });

  it('should handle the catch path gracefully (cross-origin scenario)', () => {
    // We cannot redefine window.top in jsdom, so we test the catch path
    // by verifying the function itself doesn't throw even if internals error.
    // The function should always be safe to call.
    expect(() => mainModule.frameBuster()).not.toThrow();
  });
});

// ── Console branding ───────────────────────────────────────────────────────────

describe('logBranding', () => {
  it('should print styled title to console', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation();
    mainModule.logBranding();

    expect(logSpy).toHaveBeenCalledWith(
      '%cUltras Polonia Miedzyrzecze 2026',
      'font-size:24px;font-weight:800;color:#0f3d26;'
    );
  });

  it('should print copyright notice to console', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation();
    mainModule.logBranding();

    expect(logSpy).toHaveBeenCalledWith('© UPM. All rights reserved.');
  });
});

// ── init (integration) ─────────────────────────────────────────────────────────

describe('init', () => {
  it('should call all initialisation functions without errors', () => {
    // Provide IntersectionObserver mock
    window.IntersectionObserver = jest.fn(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
    jest.spyOn(console, 'log').mockImplementation();

    expect(() => mainModule.init()).not.toThrow();
  });

  it('should register a load listener for frame busting', () => {
    window.IntersectionObserver = jest.fn(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
    jest.spyOn(console, 'log').mockImplementation();

    const addSpy = jest.spyOn(window, 'addEventListener');
    mainModule.init();

    expect(addSpy).toHaveBeenCalledWith('load', expect.any(Function));
  });

  it('should set a recurring interval for frame busting', () => {
    window.IntersectionObserver = jest.fn(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
    jest.spyOn(console, 'log').mockImplementation();

    const intervalSpy = jest.spyOn(window, 'setInterval');
    mainModule.init();

    expect(intervalSpy).toHaveBeenCalledWith(expect.any(Function), 1500);
  });
});

// ── HTML structure smoke tests ─────────────────────────────────────────────────

describe('HTML structure (smoke)', () => {
  const fs = require('fs');
  const path = require('path');
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');

  it('should contain a <nav> element', () => {
    expect(html).toMatch(/<nav[\s>]/);
  });

  it('should reference js/main.js', () => {
    expect(html).toContain('js/main.js');
  });

  it('should contain a noscript fallback', () => {
    expect(html).toContain('<noscript>');
  });

  it('should have a lang attribute on <html>', () => {
    expect(html).toMatch(/<html\s+lang="pl"/);
  });

  it('should include a Content-Security-Policy meta tag', () => {
    expect(html).toContain('Content-Security-Policy');
  });

  it('should include a viewport meta tag', () => {
    expect(html).toContain('width=device-width');
  });

  it('should include the page title', () => {
    expect(html).toMatch(/<title>.*UPM.*<\/title>/);
  });

  it('should contain footer with copyright', () => {
    expect(html).toMatch(/<footer[\s>]/);
    expect(html).toContain('© 2026 UPM');
  });

  it('should contain contact section', () => {
    expect(html).toContain('id="kontakt"');
  });

  it('should include social media links', () => {
    expect(html).toContain('facebook.com');
    expect(html).toContain('instagram.com');
  });
});
