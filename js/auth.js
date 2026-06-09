// ── Printease auth.js ──
const SESSION_KEY = 'pe_session';
const USERS_KEY   = 'pe_users';

export function getSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch { return null; }
}
export function setSession(user) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
}
export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function getUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; } catch { return []; }
}
export function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function checkAuth(requiredRole) {
  const s = getSession();
  if (!s) { window.location.href = './login.html'; return null; }
  if (requiredRole && s.role !== requiredRole) {
    window.location.href = './login.html';
    return null;
  }
  return s;
}

export function logout() {
  clearSession();
  window.location.href = './login.html';
}

// ── Toast ──
export function toast(msg, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  el.innerHTML = `<span>${icons[type] || ''}</span><span>${msg}</span>`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ── Dark mode ──
export function initDarkMode(toggleId) {
  const apply = (dark) => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    const btn = document.getElementById(toggleId);
    if (btn) btn.textContent = dark ? '☀️' : '🌙';
  };
  const stored = localStorage.getItem('pe_dark') === 'true';
  apply(stored);
  const btn = document.getElementById(toggleId);
  if (btn) {
    btn.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      localStorage.setItem('pe_dark', String(!isDark));
      apply(!isDark);
    });
  }
}

// ── Orders storage ──
const ORDERS_KEY   = 'pe_orders';
const SETTINGS_KEY = 'pe_settings';
const INVENTORY_KEY = 'pe_inventory';

export function getOrders() {
  try { return JSON.parse(localStorage.getItem(ORDERS_KEY)) || []; } catch { return []; }
}
export function saveOrders(orders) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

export function getSettings() {
  const defaults = { bwPrice: 1.5, colourPrice: 10, bulkThreshold: 50, bulkPercent: 10 };
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    return raw ? { ...defaults, ...raw } : defaults;
  } catch { return defaults; }
}
export function saveSettings(s) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export function getInventory() {
  const defaults = { paperA4: 500, paperA3: 200, tonerBW: 80, tonerColour: 60 };
  try {
    const raw = JSON.parse(localStorage.getItem(INVENTORY_KEY));
    return raw ? { ...defaults, ...raw } : defaults;
  } catch { return defaults; }
}
export function saveInventory(inv) {
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(inv));
}

// ── Token generator ──
export function createToken() {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const rand = String(Math.floor(Math.random() * 9000 + 1000));
  return `PRN-${yy}${mm}${dd}-${rand}`;
}

// ── Status badge helper ──
export function printBadge(status) {
  const map = {
    pending:    ['badge-warn',    'pending'],
    processing: ['badge-blue',    'processing'],
    completed:  ['badge-soft',    'completed'],
    ready:      ['badge-success', 'ready'],
  };
  const [cls, label] = map[status] || map.pending;
  return `<span class="badge ${cls}">${label}</span>`;
}

export function deliveryBadge(status) {
  const map = {
    'not applicable':    ['badge-soft',    'N/A'],
    'order placed':      ['badge-blue',    'order placed'],
    'out for delivery':  ['badge-warn',    'out for delivery'],
    'delivered':         ['badge-success', 'delivered'],
  };
  const [cls, label] = map[status] || ['badge-soft', status];
  return `<span class="badge ${cls}">${label}</span>`;
}

export function priorityBadge(priority) {
  return priority === 'high'
    ? '<span class="badge badge-priority">⚡ High Priority</span>'
    : '<span class="badge badge-soft">Normal</span>';
}

// ── Escape HTML ──
export function esc(str) {
  return String(str ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Real-time clock ──
export function startClock(elId) {
  const el = document.getElementById(elId);
  if (!el) return;
  const tick = () => {
    el.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  tick();
  setInterval(tick, 1000);
}
