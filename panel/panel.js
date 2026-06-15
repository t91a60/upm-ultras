const PASSWORD_HASH = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92';
const STORAGE_KEY = 'upm_admin_auth';

const hash = async (str) => {
  const buf = new TextEncoder().encode(str);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

const esc = (s) => {
  const el = document.createElement('span');
  el.textContent = s;
  return el.innerHTML;
};

let allEvents = [];
let sessions = [];

const parseUA = (ua) => {
  if (!ua) {
    return { browser: '-', os: '-', device: 'Unknown' };
  }
  let browser = 'Inna',
    os = 'Inny',
    device = 'Desktop';

  if (ua.includes('Edg/') || ua.includes('Edge/')) {
    browser = 'Edge';
  } else if (ua.includes('Chrome/') && !ua.includes('OPR/') && !ua.includes('Chromium/')) {
    browser = 'Chrome';
  } else if (ua.includes('Firefox/') && !ua.includes('Seamonkey/')) {
    browser = 'Firefox';
  } else if (/Version\/[\d.]+.*Safari/.test(ua) && !/Chrome|OPR/.test(ua)) {
    browser = 'Safari';
  } else if (ua.includes('OPR/') || ua.includes('Opera/')) {
    browser = 'Opera';
  } else if (ua.includes('Trident/') || ua.includes('MSIE')) {
    browser = 'IE';
  }

  if (/Windows NT 10|Windows NT 11/i.test(ua)) {
    os = 'Windows 10/11';
  } else if (/Windows NT 6\.3/i.test(ua)) {
    os = 'Windows 8.1';
  } else if (/Windows NT 6\.1/i.test(ua)) {
    os = 'Windows 7';
  } else if (/Windows NT/i.test(ua)) {
    os = 'Windows';
  } else if (/Mac OS X/i.test(ua)) {
    os = 'macOS';
  } else if (/CrOS/i.test(ua)) {
    os = 'ChromeOS';
  } else if (/Android/i.test(ua)) {
    os = 'Android';
  } else if (/Linux/i.test(ua) && !/Android/i.test(ua)) {
    os = 'Linux';
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    os = 'iOS';
  }

  if (/iPhone/i.test(ua)) {
    device = 'iPhone';
  } else if (/iPad/i.test(ua)) {
    device = 'iPad';
  } else if (/Android/i.test(ua)) {
    device = /Mobile/i.test(ua) ? 'Telefon' : 'Tablet';
  } else if (/Mobile|Mobile Safari/i.test(ua)) {
    device = 'Telefon';
  }

  return { browser, os, device };
};

const formatTime = (ts) => {
  const d = new Date(ts);
  return d.toLocaleString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const formatDuration = (ms) => {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h) {
    return `${h}g ${m % 60}m`;
  }
  if (m) {
    return `${m}m ${s % 60}s`;
  }
  return `${s}s`;
};

const login = async () => {
  const input = document.getElementById('password');
  const error = document.getElementById('loginError');
  const entered = await hash(input.value);
  if (entered === PASSWORD_HASH) {
    sessionStorage.setItem(STORAGE_KEY, '1');
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboard').classList.add('active');
    await loadData();
    return;
  }
  error.textContent = 'Nieprawidłowe hasło';
};

const logout = () => {
  sessionStorage.removeItem(STORAGE_KEY);
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('dashboard').classList.remove('active');
};

const loadData = async () => {
  try {
    const mod = await import('../tracking.js');
    allEvents = await mod.getAllEvents();
    buildSessions();
    renderStats();
    renderSessions();
    renderDevices();
    renderLocations();
    renderTable();
  } catch (e) {
    console.error('Failed to load tracking data', e);
  }
};

const buildSessions = () => {
  const map = new Map();
  allEvents.forEach((e) => {
    const sid = e.session;
    if (!sid) {
      return;
    }
    if (!map.has(sid)) {
      map.set(sid, {
        id: sid,
        events: [],
        start: e.timestamp,
        end: e.timestamp,
        pageViews: [],
        clicks: 0,
        maxScroll: 0,
        ip: null,
        ua: e.userAgent || null,
        deviceInfo: null,
      });
    }
    const s = map.get(sid);
    s.events.push(e);
    if (e.timestamp < s.start) {
      s.start = e.timestamp;
    }
    if (e.timestamp > s.end) {
      s.end = e.timestamp;
    }
    if (e.type === 'page_view') {
      s.pageViews.push(e);
    }
    if (e.type === 'click') {
      s.clicks++;
    }
    if (e.type === 'scroll_depth') {
      s.maxScroll = Math.max(s.maxScroll, e.data?.depth || 0);
    }
    if (e.type === 'ip_address' && e.data?.ip) {
      s.ip = e.data.ip;
    }
    if (e.type === 'session_start' && e.data?.deviceInfo) {
      s.deviceInfo = e.data.deviceInfo;
    }
    if (e.type === 'session_start' && e.userAgent) {
      s.ua = e.userAgent;
    }
  });
  sessions = Array.from(map.values()).sort((a, b) => b.start - a.start);
};

const renderStats = () => {
  const uniqueBrowsers = new Set(sessions.map((s) => parseUA(s.ua).browser));
  const uniqueDevices = new Set(sessions.map((s) => parseUA(s.ua).device));
  const clicks = allEvents.filter((e) => e.type === 'click');
  const pageViews = allEvents.filter((e) => e.type === 'page_view');
  document.getElementById('statEvents').textContent = allEvents.length;
  document.getElementById('statSessions').textContent = sessions.length;
  document.getElementById('statPageViews').textContent = pageViews.length;
  document.getElementById('statClicks').textContent = clicks.length;
  document.getElementById('statBrowsers').textContent = uniqueBrowsers.size;
  document.getElementById('statDevices').textContent = uniqueDevices.size;
};

const renderSessions = () => {
  const grid = document.getElementById('sessionGrid');
  if (!sessions.length) {
    grid.innerHTML = '<p style="color:var(--muted);padding:2rem">Brak sesji</p>';
    return;
  }
  grid.innerHTML = sessions
    .map((s) => {
      const { browser, os, device } = parseUA(s.ua);
      const duration = s.end - s.start;
      const dd = s.deviceInfo;
      return `<div class="session-card" data-sid="${esc(s.id)}">
      <div class="session-head">
        <div class="session-badge ${device === 'Desktop' ? 'badge-desktop' : 'badge-mobile'}">
          ${device === 'Desktop' ? '🖥' : '📱'} ${esc(device)}
        </div>
        <div class="session-ip">${esc(s.ip || '-')}</div>
        <div class="session-time">${esc(formatTime(s.start))}</div>
      </div>
      <div class="session-body">
        <div class="session-meta">
          <span class="meta-chip browser-${esc(browser.toLowerCase())}">${esc(browser)}</span>
          <span class="meta-chip">${esc(os)}</span>
          ${dd ? `<span class="meta-chip">${esc(dd.screen || '')}</span>` : ''}
        </div>
        <div class="session-stats">
          <span>📄 ${esc(String(s.pageViews.length))} stron</span>
          <span>🖱 ${esc(String(s.clicks))} kliknięć</span>
          <span>📏 ${esc(String(s.maxScroll))}% scroll</span>
          <span>⏱ ${duration > 0 ? esc(formatDuration(duration)) : '-'}</span>
        </div>
        ${
          dd
            ? `<div class="session-extras">
          ${dd.platform ? `<span>${esc(dd.platform)}</span>` : ''}
          ${dd.language ? `<span>${esc(dd.language)}</span>` : ''}
          ${dd.timezone ? `<span>${esc(dd.timezone)}</span>` : ''}
          ${dd.connectionType ? `<span>${esc(dd.connectionType)} ${dd.downlink ? `(${esc(String(dd.downlink))} Mbps)` : ''}</span>` : ''}
          ${dd.hardwareConcurrency ? `<span>${esc(String(dd.hardwareConcurrency))} rdzeni</span>` : ''}
          ${dd.deviceMemory ? `<span>${esc(String(dd.deviceMemory))}GB RAM</span>` : ''}
        </div>`
            : ''
        }
      </div>
    </div>`;
    })
    .join('');
};

const showSessionDetail = (sid) => {
  const s = sessions.find((x) => x.id === sid);
  if (!s) {
    return;
  }
  document.getElementById('detailTitle').textContent = `Sesja: ${s.id.slice(0, 12)}...`;
  document.getElementById('detailContent').textContent = JSON.stringify(
    {
      session: s.id,
      ip: s.ip,
      start: new Date(s.start).toISOString(),
      end: new Date(s.end).toISOString(),
      duration: s.end - s.start,
      userAgent: s.ua,
      deviceInfo: s.deviceInfo,
      pagesVisited: s.pageViews.map((p) => p.data?.path || p.data?.url),
      clicks: s.clicks,
      maxScrollDepth: s.maxScroll,
      eventCount: s.events.length,
    },
    null,
    2
  );
  document.getElementById('eventDetail').classList.add('active');
};

const renderDevices = () => {
  const container = document.getElementById('deviceGrid');
  if (!sessions.length) {
    container.innerHTML = '<p style="color:var(--muted);padding:2rem">Brak danych</p>';
    return;
  }

  const countBy = (arr, fn) => {
    const counts = {};
    arr.forEach((s) => {
      const key = fn(s);
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  };

  const browsers = countBy(sessions, (s) => parseUA(s.ua).browser);
  const oss = countBy(sessions, (s) => parseUA(s.ua).os);
  const devices = countBy(sessions, (s) => parseUA(s.ua).device);
  const screens = countBy(
    sessions.filter((s) => s.deviceInfo?.screen),
    (s) => s.deviceInfo.screen
  );

  const renderBar = (entries) => {
    const max = Math.max(...entries.map((e) => e[1]), 1);
    return entries
      .map(
        ([k, v]) => `
      <div class="bar-row">
        <span class="bar-label">${esc(k || '-')}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${(v / max) * 100}%"></div></div>
        <span class="bar-count">${v}</span>
      </div>
    `
      )
      .join('');
  };

  container.innerHTML = `
    <div class="device-cols">
      <div class="device-col">
        <h3 class="col-title">Przeglądarki</h3>
        <div class="bar-chart">${renderBar(browsers)}</div>
      </div>
      <div class="device-col">
        <h3 class="col-title">Systemy</h3>
        <div class="bar-chart">${renderBar(oss)}</div>
      </div>
      <div class="device-col">
        <h3 class="col-title">Urządzenia</h3>
        <div class="bar-chart">${renderBar(devices)}</div>
      </div>
      <div class="device-col">
        <h3 class="col-title">Rozdzielczości</h3>
        <div class="bar-chart">${renderBar(screens)}</div>
      </div>
    </div>
  `;
};

const renderLocations = () => {
  const container = document.getElementById('locationContent');
  const ipEvents = allEvents.filter((e) => e.type === 'ip_address');
  const geoEvents = allEvents.filter((e) => e.type === 'geolocation');
  const uniqueIPs = [...new Set(ipEvents.map((e) => e.data?.ip).filter(Boolean))];
  const uniqueGeo = [];
  const seen = new Set();
  geoEvents.forEach((l) => {
    const key = `${l.data.lat?.toFixed(4)}_${l.data.lng?.toFixed(4)}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueGeo.push(l);
    }
  });

  if (!uniqueIPs.length && !uniqueGeo.length) {
    container.innerHTML =
      '<p style="color:var(--muted);padding:2rem">Brak danych o lokalizacji</p>';
    return;
  }

  let html = '';
  if (uniqueIPs.length) {
    html += `<div class="loc-section">
      <h3 class="col-title">Adresy IP</h3>
      <div class="location-table"><table>
        <thead><tr><th>Adres IP</th><th>Sesji</th><th>Ostatnio</th></tr></thead>
        <tbody>${uniqueIPs
          .map((ip) => {
            const related = sessions.filter((s) => s.ip === ip);
            const last = Math.max(...related.map((s) => s.end));
            return `<tr><td style="font-family:var(--mono)">${esc(ip)}</td><td>${related.length}</td><td>${esc(formatTime(last))}</td></tr>`;
          })
          .join('')}</tbody>
      </table></div>
    </div>`;
  }

  if (uniqueGeo.length) {
    const mapsUrl = uniqueGeo.map((l) => `${l.data.lat},${l.data.lng}`).join('/');
    html += `<div class="loc-section">
      <h3 class="col-title">GPS (dokładna lokalizacja)</h3>
      <div class="location-table"><table>
        <thead><tr><th>Czas</th><th>Szerokość</th><th>Długość</th><th>Dokładność</th><th>Wysokość</th><th>Prędkość</th></tr></thead>
        <tbody>${uniqueGeo
          .map(
            (l) => `
          <tr>
            <td>${esc(formatTime(l.timestamp))}</td>
            <td style="font-family:var(--mono)">${esc(l.data.lat?.toFixed(6) || '-')}</td>
            <td style="font-family:var(--mono)">${esc(l.data.lng?.toFixed(6) || '-')}</td>
            <td style="font-family:var(--mono)">${esc(l.data.accuracy ? l.data.accuracy + 'm' : '-')}</td>
            <td>${esc(l.data.altitude ? l.data.altitude + 'm' : '-')}</td>
            <td>${esc(l.data.speed !== null ? l.data.speed + ' m/s' : '-')}</td>
          </tr>`
          )
          .join('')}</tbody>
      </table></div>
      <p style="margin-top:0.5rem">
        <a href="https://www.google.com/maps/dir/${esc(mapsUrl)}" target="_blank" rel="noopener" class="map-link">→ Otwórz w Google Maps</a>
      </p>
    </div>`;
  }

  container.innerHTML = html;
};

const renderTable = () => {
  const tbody = document.getElementById('eventBody');
  const typeFilter = document.getElementById('filterType').value;
  const sessionFilter = document.getElementById('filterSession').value.trim();

  let filtered = [...allEvents];
  if (typeFilter) {
    filtered = filtered.filter((e) => e.type === typeFilter);
  }
  if (sessionFilter) {
    filtered = filtered.filter((e) => e.session?.includes(sessionFilter));
  }
  filtered = filtered.slice(-200).reverse();

  tbody.innerHTML = filtered
    .map(
      (e) => `
    <tr data-eid="${esc(e.id)}">
      <td><span class="type-badge ${esc(e.type)}">${esc(e.type)}</span></td>
      <td>${esc(formatTime(e.timestamp))}</td>
      <td style="max-width:80px;font-family:var(--mono);font-size:0.7rem">${esc((e.session || '').slice(0, 8))}</td>
      <td>${esc(e.data?.path || e.data?.url ? (e.data.path || e.data.url).slice(0, 40) : '-')}</td>
      <td>${esc(e.data?.ip || e.data?.text || e.data?.depth || e.data?.key || '-')}</td>
    </tr>`
    )
    .join('');
};

const showEventDetail = (id) => {
  const event = allEvents.find((e) => e.id === id);
  if (!event) {
    return;
  }
  document.getElementById('detailTitle').textContent = `Event: ${event.type}`;
  document.getElementById('detailContent').textContent = JSON.stringify(event, null, 2);
  document.getElementById('eventDetail').classList.add('active');
};

const closeDetail = () => {
  document.getElementById('eventDetail').classList.remove('active');
};

const exportData = () => {
  const data = {
    sessions: sessions.map((s) => ({
      id: s.id,
      ip: s.ip,
      start: s.start,
      end: s.end,
      ua: s.ua,
      deviceInfo: s.deviceInfo,
      pageViews: s.pageViews.length,
      clicks: s.clicks,
      maxScroll: s.maxScroll,
    })),
    events: allEvents,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `upm_tracking_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

const clearData = async () => {
  if (!confirm('Usunąć wszystkie dane trackingowe?')) {
    return;
  }
  try {
    const mod = await import('../tracking.js');
    await mod.clearAllEvents();
    allEvents = [];
    sessions = [];
    renderStats();
    renderSessions();
    renderDevices();
    renderLocations();
    renderTable();
  } catch (e) {
    console.error(e);
  }
};

const applyFilters = () => renderTable();
const refreshData = () => loadData();

const switchTab = (tab) => {
  document
    .querySelectorAll('.tab')
    .forEach((t) => t.classList.toggle('active', t.dataset.tab === tab));
  document
    .querySelectorAll('.tab-content')
    .forEach((c) =>
      c.classList.toggle('active', c.id === `tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`)
    );
};

const checkAuth = () => {
  if (sessionStorage.getItem(STORAGE_KEY) === '1') {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboard').classList.add('active');
    loadData();
    return true;
  }
  return false;
};

document.addEventListener('DOMContentLoaded', () => {
  if (!checkAuth()) {
    document.getElementById('loginScreen').style.display = 'flex';
  }

  document.getElementById('loginBtn').addEventListener('click', login);
  document.getElementById('password').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      login();
    }
  });
  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.getElementById('exportBtn').addEventListener('click', exportData);
  document.getElementById('clearBtn').addEventListener('click', clearData);
  document.getElementById('refreshBtn').addEventListener('click', refreshData);
  document.getElementById('filterType').addEventListener('change', applyFilters);
  document.getElementById('filterSession').addEventListener('input', applyFilters);
  document.getElementById('detailClose').addEventListener('click', closeDetail);
  document.getElementById('eventDetail').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      closeDetail();
    }
  });

  document.querySelectorAll('.tab').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.getElementById('sessionGrid').addEventListener('click', (e) => {
    const card = e.target.closest('[data-sid]');
    if (card) {
      showSessionDetail(card.dataset.sid);
    }
  });

  document.getElementById('eventBody').addEventListener('click', (e) => {
    const row = e.target.closest('[data-eid]');
    if (row) {
      showEventDetail(row.dataset.eid);
    }
  });
});

export { login, logout, exportData, clearData, refreshData };
