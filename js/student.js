// ── student.js ──
import {
  checkAuth, logout, toast, initDarkMode, startClock,
  getOrders, saveOrders, getSettings, createToken,
  getUsers, saveUsers,
  printBadge, deliveryBadge, priorityBadge, esc
} from './auth.js';

const session = checkAuth('student');
if (!session) throw new Error('not authenticated');

document.addEventListener('DOMContentLoaded', () => {
initDarkMode('darkToggle');
startClock('clockEl');

document.getElementById('welcomeName').textContent = session.fullName;
document.getElementById('logoutBtn').addEventListener('click', logout);

// ── Sections toggle
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
// PDF.js page count
// ──────────────────────────────────────────
const pdfWorkerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

const fileInput     = document.getElementById('fileInput');
const pagesInput    = document.getElementById('pages');
const pagesSpinner  = document.getElementById('pagesSpinner');
const fileNameEl    = document.getElementById('fileName');

fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  fileNameEl.textContent = file.name;

  if (file.type === 'application/pdf') {
    pagesSpinner.hidden = false;
    pagesInput.disabled = true;
    try {
      const pdfjsLib = window.pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;
      const arrayBuffer = await file.arrayBuffer();
      const pdf  = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      pagesInput.value = pdf.numPages;
      pagesInput.disabled = false;
    } catch {
      toast('Could not read PDF page count. Enter manually.', 'info');
      pagesInput.disabled = false;
    } finally {
      pagesSpinner.hidden = true;
    }
  } else {
    pagesInput.disabled = false;
  }
  updatePrice();
});

// ── Delivery toggle
const deliveryRadios   = document.querySelectorAll('input[name="deliveryMethod"]');
const deliverySection  = document.getElementById('deliverySection');

deliveryRadios.forEach(r => r.addEventListener('change', () => {
  const isCampus = document.querySelector('input[name="deliveryMethod"]:checked')?.value === 'campus';
  deliverySection.classList.toggle('show', isCampus);
  updatePrice();
}));

// ── Price calculator
const calcInputs = ['copies', 'pages'].map(id => document.getElementById(id));
calcInputs.forEach(el => { if (el) { el.addEventListener('input', updatePrice); el.addEventListener('change', updatePrice); } });
document.querySelectorAll('input[name="colourMode"], input[name="sideMode"], input[name="binding"]').forEach(el => el.addEventListener('change', updatePrice));

function updatePrice() {
  const s        = getSettings();
  const mode     = document.querySelector('input[name="colourMode"]:checked')?.value || 'bw';
  const sides    = document.querySelector('input[name="sideMode"]:checked')?.value || 'single';
  const binding  = document.querySelector('input[name="binding"]:checked')?.value || 'none';
  const copies   = Math.max(1, Number(document.getElementById('copies')?.value) || 1);
  const pages    = Math.max(1, Number(document.getElementById('pages')?.value) || 1);
  const isCampus = document.querySelector('input[name="deliveryMethod"]:checked')?.value === 'campus';

  const pricePerPage   = mode === 'bw' ? s.bwPrice : s.colourPrice;
  const effectivePages = sides === 'double' ? Math.ceil(pages / 2) : pages;
  let   subtotal       = effectivePages * copies * pricePerPage;
  const totalUnits     = pages * copies;
  const discount       = totalUnits > s.bulkThreshold ? s.bulkPercent : 0;
  subtotal             = subtotal * (1 - discount / 100);
  const deliveryFee    = isCampus ? 30 : 0;
  const bindingFee     = binding === 'spiral' ? 10 : 0;
  const total          = subtotal + deliveryFee + bindingFee;

  document.getElementById('priceMain').textContent = `₹${total.toFixed(2)}`;
  document.getElementById('priceBreak').innerHTML  =
    `${effectivePages} eff.pages × ${copies} copies × ₹${pricePerPage}/page` +
    (discount ? ` <b>−${discount}% bulk</b>` : '') +
    (bindingFee ? ` + ₹10 spiral binding` : '') +
    (deliveryFee ? ` + ₹30 campus delivery` : '');

  document.getElementById('submitBtn').disabled = !validForm();
  return { subtotal, discount, deliveryFee, bindingFee, total, binding };
}

function validForm() {
  const docName  = document.getElementById('docName').value.trim();
  const copies   = Number(document.getElementById('copies').value);
  const pages    = Number(document.getElementById('pages').value);
  const isCampus = document.querySelector('input[name="deliveryMethod"]:checked')?.value === 'campus';
  if (!docName || copies < 1 || pages < 1) return false;
  if (isCampus) {
    const block  = document.getElementById('block').value.trim();
    const roomNo = document.getElementById('roomNo').value.trim();
    if (!block || !roomNo) return false;
  }
  return true;
}

['docName','copies','pages','block','roomNo'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', updatePrice);
});

updatePrice();

// ── Submit order
document.getElementById('orderForm').addEventListener('submit', e => {
  e.preventDefault();
  if (!validForm()) return;

  const { subtotal, discount, deliveryFee, bindingFee, total, binding } = updatePrice();
  const isCampus = document.querySelector('input[name="deliveryMethod"]:checked')?.value === 'campus';
  const token    = createToken();

  const order = {
    id:             crypto.randomUUID(),
    token,
    studentId:      session.id,
    studentName:    session.fullName,
    fileName:       document.getElementById('docName').value.trim(),
    pages:          Number(document.getElementById('pages').value),
    copies:         Number(document.getElementById('copies').value),
    colourMode:     document.querySelector('input[name="colourMode"]:checked')?.value || 'bw',
    sideMode:       document.querySelector('input[name="sideMode"]:checked')?.value || 'single',
    pageSize:       document.getElementById('pageSize').value,
    specialInstructions: document.getElementById('specialInstr').value.trim(),
    subtotal, discount, deliveryFee, totalPrice: total,
    deliveryMethod:  isCampus ? 'campus' : 'pickup',
    deliveryDetails: isCampus ? {
      block:    document.getElementById('block').value.trim(),
      roomNo:   document.getElementById('roomNo').value.trim(),
      landmark: document.getElementById('landmark').value.trim(),
    } : null,
    deliverySlot:   isCampus ? document.getElementById('deliverySlot').value : '',
    binding:         binding,
    bindingFee:      bindingFee,
    priority:        'normal',
    printStatus:    'pending',
    deliveryStatus: isCampus ? 'order placed' : 'not applicable',
    createdAt: Date.now(),
  };

  const orders = getOrders();
  orders.unshift(order);
  saveOrders(orders);

  toast(`Order placed! Token: ${token}`, 'success');
  document.getElementById('orderForm').reset();
  deliverySection.classList.remove('show');
  updatePrice();
  renderMyOrders();
});

// ── My Orders table
function renderMyOrders() {
  const all      = getOrders().filter(o => o.studentId === session.id);
  const fPrint   = document.getElementById('filterPrint').value;
  const fDel     = document.getElementById('filterDelivery').value;
  const filtered = all.filter(o =>
    (fPrint === 'all' || o.printStatus === fPrint) &&
    (fDel   === 'all' || o.deliveryStatus === fDel)
  );

  document.getElementById('ordersCount').textContent = `${all.length} total`;
  const tbody = document.getElementById('ordersTbody');

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="10" class="muted small" style="padding:20px;text-align:center">No orders found.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(o => {
    const d = o.deliveryDetails;
    const locationCell = d
      ? `${esc(d.block)}, Room ${esc(d.roomNo)}${d.landmark ? ` (${esc(d.landmark)})` : ''}<br><span class="small muted">${esc(o.deliverySlot)}</span>`
      : '<span class="muted small">Pickup</span>';
    const cancelBtn = o.printStatus === 'pending'
      ? `<button class="btn btn-sm btn-danger cancel-btn" data-id="${o.id}">Cancel</button>`
      : '';
    return `<tr>
      <td>${priorityBadge(o.priority || 'normal')}</td>
      <td class="mono">${esc(o.token)}</td>
      <td>${esc(o.fileName)}</td>
      <td>${o.pages}</td>
      <td class="mono">₹${Number(o.totalPrice).toFixed(2)}</td>
      <td><span class="small muted">${o.binding || 'none'}</span></td>
      <td>${printBadge(o.printStatus)}</td>
      <td>${deliveryBadge(o.deliveryStatus)}</td>
      <td>${locationCell}</td>
      <td>${cancelBtn}</td>
    </tr>`;
  }).join('');

  tbody.querySelectorAll('.cancel-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const orders = getOrders();
      const idx    = orders.findIndex(o => o.id === btn.dataset.id);
      if (idx === -1) return;
      orders[idx].printStatus = 'cancelled';
      saveOrders(orders);
      toast('Order cancelled.', 'info');
      renderMyOrders();
    });
  });
}

document.getElementById('filterPrint').addEventListener('change', renderMyOrders);
document.getElementById('filterDelivery').addEventListener('change', renderMyOrders);
document.getElementById('refreshOrdersBtn').addEventListener('click', () => { renderMyOrders(); toast('Refreshed.', 'info'); });

renderMyOrders();

// ── Profile
document.getElementById('profilePhone').value   = session.phone   || '';
document.getElementById('profileCollege').value = session.college || '';

document.getElementById('profileForm').addEventListener('submit', e => {
  e.preventDefault();
  const users = getUsers();
  const idx   = users.findIndex(u => u.id === session.id);
  if (idx === -1) return;
  users[idx].phone   = document.getElementById('profilePhone').value.trim();
  users[idx].college = document.getElementById('profileCollege').value.trim();
  saveUsers(users);
  Object.assign(session, users[idx]);
  sessionStorage.setItem('pe_session', JSON.stringify(session));
  toast('Profile updated.', 'success');
});

}); // end DOMContentLoaded
