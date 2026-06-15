const DB_NAME = 'upm_tracking';
const DB_VERSION = 1;
const STORE_NAME = 'events';
const FLUSH_INTERVAL = 5000;
const SCROLL_DEPTHS = [25, 50, 75, 90, 100];
const MOUSE_SAMPLE_INTERVAL = 1000;

let db = null;
let eventBuffer = [];
let flushTimer = null;
let sessionId = null;
let pageStart = Date.now();
let maxScroll = 0;
let scrollDepthsReported = new Set();
let lastMouseSample = 0;

const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

const openDb = () => {
  if (db) return Promise.resolve(db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const store = req.result.createObjectStore(STORE_NAME, {
        keyPath: 'id',
        autoIncrement: true,
      });
      store.createIndex('type', 'type', { unique: false });
      store.createIndex('timestamp', 'timestamp', { unique: false });
      store.createIndex('session', 'session', { unique: false });
    };
    req.onsuccess = () => {
      db = req.result;
      resolve(db);
    };
    req.onerror = () => reject(req.error);
  });
};

const storeEvents = async (events) => {
  try {
    const database = await openDb();
    const tx = database.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    events.forEach((e) => store.add(e));
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // fallback to localStorage
    try {
      const existing = JSON.parse(localStorage.getItem('upm_events') || '[]');
      existing.push(...events);
      localStorage.setItem('upm_events', JSON.stringify(existing.slice(-10000)));
    } catch {}
  }
};

const flush = async () => {
  if (!eventBuffer.length) return;
  const batch = eventBuffer.splice(0);
  try {
    await storeEvents(batch);
  } catch {}
};

const push = (type, data = {}) => {
  eventBuffer.push({
    id: generateId(),
    session: sessionId,
    timestamp: Date.now(),
    type,
    data,
    page: location.href,
    userAgent: navigator.userAgent,
  });
  if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flushTimer = null;
      flush();
    }, FLUSH_INTERVAL);
  }
};

const collectDeviceInfo = () => {
  const info = {
    screen: `${screen.width}x${screen.height}`,
    availScreen: `${screen.availWidth}x${screen.availHeight}`,
    colorDepth: screen.colorDepth,
    pixelRatio: window.devicePixelRatio,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    platform: navigator.platform,
    language: navigator.language,
    languages: navigator.languages,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    cookiesEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: navigator.deviceMemory,
    touchSupport: 'ontouchstart' in window,
    pdfViewerEnabled: navigator.pdfViewerEnabled,
  };

  if (navigator.connection) {
    const c = navigator.connection;
    info.connectionType = c.effectiveType;
    info.downlink = c.downlink;
    info.rtt = c.rtt;
    info.saveData = c.saveData;
  }

  return info;
};

const getPerformanceData = () => {
  const p = performance;
  const nav = p.getEntriesByType
    ? p.getEntriesByType('navigation')[0]
    : null;
  const timing = p.timing;

  return {
    loadTime: nav ? nav.loadEventEnd - nav.startTime : timing
      ? timing.loadEventEnd - timing.navigationStart
      : null,
    domContentLoaded: nav
      ? nav.domContentLoadedEventEnd - nav.startTime
      : null,
    domInteractive: nav ? nav.domInteractive - nav.startTime : null,
    ttfb: nav
      ? nav.responseStart - nav.requestStart
      : timing
        ? timing.responseStart - timing.requestStart
        : null,
    redirectCount: nav ? nav.redirectCount : null,
    type: nav ? nav.type : null,
    memory: performance.memory
      ? {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        }
      : null,
  };
};

const getLocation = () => {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      push('geolocation', {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        altitude: pos.coords.altitude,
        altitudeAccuracy: pos.coords.altitudeAccuracy,
        heading: pos.coords.heading,
        speed: pos.coords.speed,
      });
    },
    () => {},
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
};

const getBatteryInfo = async () => {
  try {
    const b = await navigator.getBattery();
    push('battery', {
      level: b.level,
      charging: b.charging,
      chargingTime: b.chargingTime,
      dischargingTime: b.dischargingTime,
    });
  } catch {}
};

const getMediaDevices = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    push('media_devices', {
      audioInput: devices.filter((d) => d.kind === 'audioinput').length,
      audioOutput: devices.filter((d) => d.kind === 'audiooutput').length,
      videoInput: devices.filter((d) => d.kind === 'videoinput').length,
    });
  } catch {}
};

const getFontList = () => {
  try {
    const fonts = document.fonts ? document.fonts.keys() : [];
    const list = [];
    for (const f of fonts) list.push(`${f.family} ${f.style}`);
    if (list.length) push('fonts', { fonts: list.slice(0, 50) });
  } catch {}
};

const getCanvasFingerprint = () => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('UPM', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('canvas', 4, 17);
    push('canvas_fingerprint', { hash: canvas.toDataURL().slice(0, 100) });
  } catch {}
};

const getWebGLInfo = () => {
  try {
    const c = document.createElement('canvas');
    const gl =
      c.getContext('webgl') || c.getContext('experimental-webgl');
    if (gl) {
      push('webgl', {
        vendor: gl.getParameter(gl.VENDOR),
        renderer: gl.getParameter(gl.RENDERER),
        version: gl.getParameter(gl.VERSION),
        shadingLanguageVersion: gl.getParameter(
          gl.SHADING_LANGUAGE_VERSION
        ),
      });
    }
  } catch {}
};

const getIP = async () => {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return data.ip;
  } catch {
    return null;
  }
};

const getNetworkInfo = () => {
  push('network', {
    referrer: document.referrer || '(direct)',
    host: location.hostname,
    protocol: location.protocol,
    origin: location.origin,
    pathname: location.pathname,
  });
};

const initPageView = () => {
  push('page_view', {
    url: location.href,
    path: location.pathname,
    title: document.title,
    referrer: document.referrer || '(direct)',
    timestamp: new Date().toISOString(),
  });

  // performance after full load
  if (document.readyState === 'complete') {
    push('performance', getPerformanceData());
  } else {
    window.addEventListener('load', () => {
      setTimeout(() => {
        push('performance', getPerformanceData());
      }, 100);
    });
  }
};

const initScrollTracking = () => {
  let ticking = false;
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          ticking = false;
          const docEl = document.documentElement;
          const scrollTop = window.scrollY || docEl.scrollTop;
          const scrollHeight = docEl.scrollHeight - window.innerHeight;
          const percent = Math.min(
            100,
            Math.round((scrollTop / scrollHeight) * 100)
          );
          maxScroll = Math.max(maxScroll, percent);

          SCROLL_DEPTHS.forEach((depth) => {
            if (percent >= depth && !scrollDepthsReported.has(depth)) {
              scrollDepthsReported.add(depth);
              push('scroll_depth', { depth, percent, maxScroll });
            }
          });
        });
        ticking = true;
      }
    },
    { passive: true }
  );
};

const initClickTracking = () => {
  document.addEventListener(
    'click',
    (e) => {
      const target = e.target;
      const tag = target.tagName || '';
      const text = (target.textContent || '').trim().slice(0, 80);
      const selector = getSelector(target);
      const rect = target.getBoundingClientRect
        ? target.getBoundingClientRect()
        : null;

      push('click', {
        tag,
        id: target.id || null,
        class: (target.className || '').slice(0, 100),
        text,
        selector,
        x: e.clientX,
        y: e.clientY,
        pageX: e.pageX,
        pageY: e.pageY,
        offsetX: e.offsetX,
        offsetY: e.offsetY,
        rect: rect
          ? {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
            }
          : null,
        href: target.href || null,
        alt: target.alt || null,
        src: target.src ? target.src.slice(0, 200) : null,
      });
    },
    { passive: true }
  );
};

const initMouseTracking = () => {
  document.addEventListener(
    'mousemove',
    (e) => {
      const now = Date.now();
      if (now - lastMouseSample < MOUSE_SAMPLE_INTERVAL) return;
      lastMouseSample = now;
      push('mouse_position', { x: e.clientX, y: e.clientY });
    },
    { passive: true }
  );
};

const initResizeTracking = () => {
  let resizeTimer;
  window.addEventListener(
    'resize',
    () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        push('resize', {
          width: window.innerWidth,
          height: window.innerHeight,
          availWidth: screen.availWidth,
          availHeight: screen.availHeight,
        });
      }, 500);
    },
    { passive: true }
  );
};

const getSelector = (el) => {
  if (!el || el === document || el === window) return '';
  let path = [];
  let current = el;
  while (current && current !== document.body && current !== document) {
    let selector = current.tagName.toLowerCase();
    if (current.id) {
      selector = `#${current.id}`;
      path.unshift(selector);
      break;
    }
    if (current.className && typeof current.className === 'string') {
      const classes = current.className
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .join('.');
      if (classes) selector += `.${classes}`;
    }
    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (s) => s.tagName === current.tagName
      );
      if (siblings.length > 1) {
        const idx = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${idx})`;
      }
    }
    path.unshift(selector);
    current = current.parentElement;
  }
  return path.join(' > ');
};

const initVisibilityTracking = () => {
  document.addEventListener('visibilitychange', () => {
    push('visibility', {
      state: document.visibilityState,
      hidden: document.hidden,
      timeOnPage: Date.now() - pageStart,
    });
  });
};

const initBeforeUnload = () => {
  window.addEventListener('beforeunload', () => {
    push('page_leave', {
      timeOnPage: Date.now() - pageStart,
      maxScroll,
      url: location.href,
    });
    flush();
  });

  window.addEventListener('pagehide', () => {
    push('page_leave', {
      timeOnPage: Date.now() - pageStart,
      maxScroll,
      url: location.href,
    });
    flush();
  });
};

const initContextMenuTracking = () => {
  document.addEventListener('contextmenu', (e) => {
    push('contextmenu', { x: e.clientX, y: e.clientY });
  });
};

const initKeyboardTracking = () => {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'F12') {
      push('keydown', { key: e.key, ctrl: e.ctrlKey, alt: e.altKey });
    }
  });
};

export const initTracking = () => {
  sessionId = generateId();
  pageStart = Date.now();

  push('session_start', {
    deviceInfo: collectDeviceInfo(),
  });

  getIP().then(ip => {
    if (ip) push('ip_address', { ip });
  });

  initPageView();
  initScrollTracking();
  initClickTracking();
  initMouseTracking();
  initResizeTracking();
  initVisibilityTracking();
  initBeforeUnload();
  initContextMenuTracking();
  initKeyboardTracking();

  getLocation();
  getBatteryInfo();
  getMediaDevices();
  getFontList();
  getCanvasFingerprint();
  getWebGLInfo();
  getNetworkInfo();

  push('device_info', collectDeviceInfo());
};

const getDbSize = async () => {
  try {
    const database = await openDb();
    const tx = database.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const count = await new Promise((resolve, reject) => {
      const req = store.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return count;
  } catch {
    try {
      const data = JSON.parse(localStorage.getItem('upm_events') || '[]');
      return data.length;
    } catch {
      return 0;
    }
  }
};

const getAllEvents = async (filters = {}) => {
  try {
    const database = await openDb();
    const tx = database.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const all = await new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return applyFilters(all, filters);
  } catch {
    try {
      const data = JSON.parse(localStorage.getItem('upm_events') || '[]');
      return applyFilters(data, filters);
    } catch {
      return [];
    }
  }
};

const applyFilters = (data, filters) => {
  let result = data;
  if (filters.type) {
    result = result.filter((e) => e.type === filters.type);
  }
  if (filters.since) {
    result = result.filter((e) => e.timestamp >= filters.since);
  }
  if (filters.until) {
    result = result.filter((e) => e.timestamp <= filters.until);
  }
  if (filters.session) {
    result = result.filter((e) => e.session === filters.session);
  }
  if (filters.limit) {
    result = result.slice(-filters.limit);
  }
  return result;
};

const clearAllEvents = async () => {
  try {
    const database = await openDb();
    const tx = database.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    localStorage.removeItem('upm_events');
  }
};

const getStats = async () => {
  const events = await getAllEvents();
  const uniqueSessions = new Set(events.map((e) => e.session)).size;
  const uniquePages = new Set(
    events.filter((e) => e.type === 'page_view').map((e) => e.data?.path)
  ).size;
  const clicks = events.filter((e) => e.type === 'click').length;
  const pageViews = events.filter((e) => e.type === 'page_view').length;
  const locations = events.filter((e) => e.type === 'geolocation');
  const deviceInfos = events.filter((e) => e.type === 'device_info');

  return {
    total: events.length,
    uniqueSessions,
    uniquePages,
    clicks,
    pageViews,
    locations,
    deviceInfos,
  };
};

export {
  getAllEvents,
  clearAllEvents,
  getStats,
  getDbSize,
  getPerformanceData,
};
