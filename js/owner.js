// ── owner.js ──
import {
  checkAuth, logout, toast, initDarkMode,
  getOrders, saveOrders, getSettings, saveSettings,
  getInventory, saveInventory,
  printBadge, deliveryBadge, priorityBadge, esc
} from './auth.js';

const session = checkAuth('owner');
if (!session) throw new Error('not authenticated');
initDarkMode('darkToggle');
document.getElementById('logoutBtn').addEventListener('click', logout);

// ── Section nav ──
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const target = link.dataset.section;
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    document.querySelectorAll('.section').forEach(s => s.hidden = s.id !== target);
  });
});

// ──────────────────────────────────────────
// Stats
// ──────────────────────────────────────────
function renderStats() {
  const orders = getOrders();
  const today  = new Date().toDateString();
  const todayO = orders.filter(o => new Date(o.createdAt).toDateString() === today);
  const inv    = getInventory();

  document.getElementById('statTotal').textContent     = todayO.length;
  document.getElementById('statHighPending').textContent =
    orders.filter(o => o.printStatus === 'pending' && o.priority === 'high').length;
  document.getElementById('statNormPending').textContent =
    orders.filter(o => o.printStatus === 'pending' && o.priority !== 'high').length;
  document.getElementById('statDone').textContent      =
    todayO.filter(o => o.printStatus === 'completed' || o.printStatus === 'ready').length;
  document.getElementById('statRevenue').textContent   =
    `₹${todayO.reduce((s, o) => s + (o.totalPrice || 0), 0).toFixed(0)}`;
  const lowStock = inv.paperA4 < 50 || inv.paperA3 < 20 || inv.tonerBW < 10 || inv.tonerColour < 10;
  document.getElementById('statStock').textContent     = lowStock ? '⚠️ Low' : '✅ OK';
}

// ──────────────────────────────────────────
// Orders table
// ──────────────────────────────────────────
function sortOrders(list, sortVal) {
  return list.slice().sort((a, b) => {
    // High priority always first
    const pa = a.priority === 'high' ? 0 : 1;
    const pb = b.priority === 'high' ? 0 : 1;
    if (pa !== pb) return pa - pb;
    // Then by date
    return sortVal === 'asc' ? a.createdAt - b.createdAt : b.createdAt - a.createdAt;
  });
}

function renderOrders() {
  renderStats();
  const all    = getOrders();
  const fPrint = document.getElementById('ownerFilterPrint').value;
  const fDel   = document.getElementById('ownerFilterDel').value;
  const fPri   = document.getElementById('ownerFilterPriority').value;
  const search = document.getElementById('ownerSearch').value.trim().toLowerCase();
  const sort   = document.getElementById('ownerSort').value;

  let list = all.filter(o =>
    (fPrint === 'all' || o.printStatus === fPrint) &&
    (fDel   === 'all' || o.deliveryStatus === fDel) &&
    (fPri   === 'all' || o.priority === fPri || (fPri === 'normal' && !o.priority)) &&
    (!search || o.token.toLowerCase().includes(search) || o.studentName.toLowerCase().includes(search))
  );

  list = sortOrders(list, sort);

  document.getElementById('ownerOrderCount').textContent = `${list.length} orders`;
  const tbody = document.getElementById('ownerOrdersTbody');

  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="13" class="muted small" style="padding:20px;text-align:center">No orders found.</td></tr>';
    return;
  }

  tbody.innerHTML = list.map(o => {
    const d  = o.deliveryDetails;
    const isHigh = o.priority === 'high';
    const locationCell = d
      ? `<span class="small">${esc(d.block)}, Rm ${esc(d.roomNo)}</span>`
      : '<span class="muted small">Pickup</span>';

    return `
    <tr data-id="${o.id}" class="${isHigh ? 'priority-row' : ''}">
      <td>${priorityBadge(o.priority || 'normal')}</td>
      <td class="mono">${esc(o.token)}</td>
      <td>${esc(o.studentName)}<br><span class="small muted">${esc(o.role || 'student')}</span></td>
      <td>${esc(o.fileName)}</td>
      <td>${o.pages}</td>
      <td class="mono">₹${Number(o.totalPrice).toFixed(2)}</td>
      <td><span class="badge ${o.deliveryMethod === 'campus' ? 'badge-blue' : 'badge-soft'}">${o.deliveryMethod || 'pickup'}</span></td>
      <td>${locationCell}</td>
      <td>${printBadge(o.printStatus)}</td>
      <td>${deliveryBadge(o.deliveryStatus)}</td>
      <td class="small muted">${esc(o.deliverySlot || '—')}</td>
      <td>
        <div style="display:flex;gap:4px;align-items:center;flex-direction:column">
          <div style="display:flex;gap:4px">
            <select class="inline-sel print-sel" aria-label="Print status">
              ${['pending','processing','completed','ready'].map(v =>
                `<option value="${v}"${o.printStatus===v?' selected':''}>${v}</option>`
              ).join('')}
            </select>
            <button class="btn btn-sm btn-primary print-update-btn">Print</button>
          </div>
          <div style="display:flex;gap:4px">
            <select class="inline-sel del-sel" aria-label="Delivery status" ${o.deliveryMethod !== 'campus' ? 'disabled' : ''}>
              ${['not applicable','order placed','out for delivery','delivered'].map(v =>
                `<option value="${v}"${o.deliveryStatus===v?' selected':''}>${v}</option>`
              ).join('')}
            </select>
            <button class="btn btn-sm btn-ghost del-update-btn" ${o.deliveryMethod !== 'campus' ? 'disabled' : ''}>Del</button>
          </div>
        </div>
      </td>
    </tr>
  `;
  }).join('');

  // Print status update
  tbody.querySelectorAll('.print-update-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tr     = btn.closest('tr');
      const id     = tr.dataset.id;
      const newSt  = tr.querySelector('.print-sel').value;
      const orders = getOrders();
      const idx    = orders.findIndex(o => o.id === id);
      if (idx === -1) return;
      const prev   = orders[idx].printStatus;
      orders[idx].printStatus = newSt;
      saveOrders(orders);
      tr.style.background = 'rgba(245,158,11,0.12)';
      setTimeout(() => { tr.style.background = ''; }, 500);
      toast(`Print: ${prev} → ${newSt}`, 'success');
      renderOrders();
    });
  });

  // Delivery status update
  tbody.querySelectorAll('.del-update-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tr     = btn.closest('tr');
      const id     = tr.dataset.id;
      const newSt  = tr.querySelector('.del-sel').value;
      const orders = getOrders();
      const idx    = orders.findIndex(o => o.id === id);
      if (idx === -1) return;
      const prev   = orders[idx].deliveryStatus;
      orders[idx].deliveryStatus = newSt;
      saveOrders(orders);
      toast(`Delivery: ${prev} → ${newSt}`, 'success');
      renderOrders();
    });
  });
}

['ownerFilterPrint','ownerFilterDel','ownerFilterPriority','ownerSort'].forEach(id => {
  document.getElementById(id).addEventListener('change', renderOrders);
});
document.getElementById('ownerSearch').addEventListener('input', renderOrders);
document.getElementById('ownerRefreshBtn').addEventListener('click', () => { renderOrders(); toast('Refreshed.', 'info'); });

renderOrders();

// ──────────────────────────────────────────
// Pricing
// ──────────────────────────────────────────
function syncPricingUI() {
  const s = getSettings();
  document.getElementById('bwPrice').value       = s.bwPrice;
  document.getElementById('colourPrice').value   = s.colourPrice;
  document.getElementById('bulkThreshold').value = s.bulkThreshold;
  document.getElementById('bulkPercent').value   = s.bulkPercent;
}
syncPricingUI();

document.getElementById('savePricingBtn').addEventListener('click', () => {
  const bw  = Number(document.getElementById('bwPrice').value);
  const col = Number(document.getElementById('colourPrice').value);
  const thr = Number(document.getElementById('bulkThreshold').value);
  const pct = Number(document.getElementById('bulkPercent').value);
  if ([bw,col,thr,pct].some(v => !Number.isFinite(v) || v < 0)) {
    toast('Invalid pricing values.', 'error'); return;
  }
  saveSettings({ bwPrice: bw, colourPrice: col, bulkThreshold: thr, bulkPercent: pct });
  toast('Pricing saved.', 'success');
});

// ──────────────────────────────────────────
// Inventory
// ──────────────────────────────────────────
function syncInventoryUI() {
  const inv = getInventory();
  document.getElementById('paperA4').value     = inv.paperA4;
  document.getElementById('paperA3').value     = inv.paperA3;
  document.getElementById('tonerBW').value     = inv.tonerBW;
  document.getElementById('tonerColour').value = inv.tonerColour;
}
syncInventoryUI();

document.getElementById('saveInventoryBtn').addEventListener('click', () => {
  saveInventory({
    paperA4:     Number(document.getElementById('paperA4').value),
    paperA3:     Number(document.getElementById('paperA3').value),
    tonerBW:     Number(document.getElementById('tonerBW').value),
    tonerColour: Number(document.getElementById('tonerColour').value),
  });
  toast('Inventory saved.', 'success');
  renderStats();
});

// ──────────────────────────────────────────
// CSV Export
// ──────────────────────────────────────────
document.getElementById('exportCsvBtn').addEventListener('click', () => {
  const orders = getOrders();
  const fPrint = document.getElementById('ownerFilterPrint').value;
  const fDel   = document.getElementById('ownerFilterDel').value;
  const fPri   = document.getElementById('ownerFilterPriority').value;
  const list   = orders.filter(o =>
    (fPrint === 'all' || o.printStatus === fPrint) &&
    (fDel   === 'all' || o.deliveryStatus === fDel) &&
    (fPri   === 'all' || o.priority === fPri || (fPri === 'normal' && !o.priority))
  );

  const headers = ['Priority','Role','Token','Student','File','Pages','Copies','Colour','Sides','PageSize',
    'DeliveryMethod','Block','RoomNo','Subtotal','Discount%','DeliveryFee','Total',
    'PrintStatus','DeliveryStatus','DeliverySlot','CreatedAt'];
  const rows = list.map(o => [
    o.priority || 'normal', o.role || 'student',
    o.token, o.studentName, o.fileName, o.pages, o.copies,
    o.colourMode, o.sideMode, o.pageSize,
    o.deliveryMethod,
    o.deliveryDetails?.block || '', o.deliveryDetails?.roomNo || '',
    o.subtotal?.toFixed(2), o.discount, o.deliveryFee, o.totalPrice?.toFixed(2),
    o.printStatus, o.deliveryStatus, o.deliverySlot || '',
    new Date(o.createdAt).toISOString()
  ].map(v => `"${String(v ?? '').replace(/"/g,'""')}"`).join(','));

  const csv  = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `printease_orders_${Date.now()}.csv`;
  a.click(); URL.revokeObjectURL(url);
  toast('CSV exported.', 'success');
});
