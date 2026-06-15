const PASSWORD_HASH = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92';
const STORAGE_KEY = 'upm_admin_auth';

const hash = async (str) => {
  const buf = new TextEncoder().encode(str);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

let allEvents = [];

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
    renderStats();
    renderTable();
    renderLocations();
  } catch (e) {
    console.error('Failed to load tracking data', e);
  }
};

const renderStats = () => {
  const uniqueSessions = new Set(allEvents.map((e) => e.session));
  const clicks = allEvents.filter((e) => e.type === 'click');
  const pageViews = allEvents.filter((e) => e.type === 'page_view');
  const locations = allEvents.filter((e) => e.type === 'geolocation');
  const scrolls = allEvents.filter((e) => e.type === 'scroll_depth');

  document.getElementById('statEvents').textContent = allEvents.length;
  document.getElementById('statSessions').textContent = uniqueSessions.size;
  document.getElementById('statPageViews').textContent = pageViews.length;
  document.getElementById('statClicks').textContent = clicks.length;
  document.getElementById('statLocations').textContent = locations.length;
  document.getElementById('statScrolls').textContent = scrolls.length;
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
    <tr onclick="showDetail('${e.id}')">
      <td><span class="type-badge ${e.type}">${e.type}</span></td>
      <td>${formatTime(e.timestamp)}</td>
      <td style="max-width:80px;font-family:var(--mono);font-size:0.7rem">${(e.session || '').slice(0, 8)}</td>
      <td>${e.data?.path || e.data?.url ? (e.data.path || e.data.url).slice(0, 40) : '-'}</td>
      <td>${e.data?.text || e.data?.depth || e.data?.key || '-'}</td>
    </tr>
  `
    )
    .join('');
};

const renderLocations = () => {
  const container = document.getElementById('locationData');
  const locs = allEvents.filter((e) => e.type === 'geolocation');
  if (!locs.length) {
    container.innerHTML =
      '<p style="color:var(--muted);padding:1rem">Brak danych o lokalizacji</p>';
    return;
  }
  const unique = [];
  const seen = new Set();
  locs.forEach((l) => {
    const key = `${l.data.lat?.toFixed(4)}_${l.data.lng?.toFixed(4)}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(l);
    }
  });
  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Czas</th>
          <th>Szerokość</th>
          <th>Długość</th>
          <th>Dokładność (m)</th>
          <th>Prędkość</th>
        </tr>
      </thead>
      <tbody>
        ${unique
          .map(
            (l) => `
          <tr>
            <td>${formatTime(l.timestamp)}</td>
            <td style="font-family:var(--mono)">${l.data.lat?.toFixed(6) || '-'}</td>
            <td style="font-family:var(--mono)">${l.data.lng?.toFixed(6) || '-'}</td>
            <td style="font-family:var(--mono)">${l.data.accuracy || '-'}</td>
            <td>${l.data.speed != null ? l.data.speed + ' m/s' : '-'}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  `;
};

const showDetail = (id) => {
  const event = allEvents.find((e) => e.id === id);
  if (!event) return;
  document.getElementById('detailTitle').textContent = `Event: ${event.type}`;
  document.getElementById('detailContent').textContent = JSON.stringify(
    event,
    null,
    2
  );
  document.getElementById('eventDetail').classList.add('active');
};

const closeDetail = () => {
  document.getElementById('eventDetail').classList.remove('active');
};

window.showDetail = showDetail;
window.closeDetail = closeDetail;

const exportData = () => {
  const blob = new Blob([JSON.stringify(allEvents, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `upm_tracking_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

const clearData = async () => {
  if (!confirm('Usunąć wszystkie dane trackingowe?')) return;
  try {
    const mod = await import('../tracking.js');
    await mod.clearAllEvents();
    allEvents = [];
    renderStats();
    renderTable();
    renderLocations();
  } catch (e) {
    console.error(e);
  }
};

const applyFilters = () => {
  renderTable();
};

const refreshData = () => {
  loadData();
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
    if (e.key === 'Enter') login();
  });
  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.getElementById('exportBtn').addEventListener('click', exportData);
  document.getElementById('clearBtn').addEventListener('click', clearData);
  document.getElementById('refreshBtn').addEventListener('click', refreshData);
  document.getElementById('filterType').addEventListener('change', applyFilters);
  document.getElementById('filterSession').addEventListener('input', applyFilters);
  document.getElementById('detailClose').addEventListener('click', closeDetail);
  document.getElementById('eventDetail').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeDetail();
  });
});

export { login, logout, exportData, clearData, refreshData };
