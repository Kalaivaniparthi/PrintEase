// ===== app.js — PrintEase Frontend API Layer =====

const API = 'http://localhost:5000/api';

// ─── Token ────────────────────────────────────────────────────────────────────
function getToken()       { return localStorage.getItem('pe_token') || ''; }
function setToken(token)  { localStorage.setItem('pe_token', token); }
function clearToken()     { localStorage.removeItem('pe_token'); localStorage.removeItem('pe_session'); }

// ─── Session (cached user object) ────────────────────────────────────────────
function getUser()        { return JSON.parse(localStorage.getItem('pe_session') || 'null'); }
function setUser(user)    { localStorage.setItem('pe_session', JSON.stringify(user)); }

function requireAuth() {
    if (!getToken() || !getUser()) {
        window.location.href = resolvePage('auth');
    }
}

function logout() {
    clearToken();
    window.location.href = resolvePage('auth');
}

// ─── API fetch helper ─────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API}${path}`, { ...options, headers });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
}

// ─── Auth API ─────────────────────────────────────────────────────────────────
async function apiRegister(payload) {
    const data = await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
    setToken(data.token);
    setUser(data.user);
    return data.user;
}

async function apiLogin(email, password) {
    const data = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    setToken(data.token);
    setUser(data.user);
    return data.user;
}

async function apiGetMe() {
    const data = await apiFetch('/auth/me');
    setUser(data.user);
    return data.user;
}

// ─── Upload API ───────────────────────────────────────────────────────────────
async function apiUploadFile(file, onProgress) {
    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API}/upload`);
        xhr.setRequestHeader('Authorization', `Bearer ${getToken()}`);

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && onProgress) {
                onProgress(Math.round((e.loaded / e.total) * 100));
            }
        };

        xhr.onload = () => {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) resolve(data.file);
            else reject(new Error(data.message || 'Upload failed'));
        };

        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(formData);
    });
}

// ─── Orders API ───────────────────────────────────────────────────────────────
async function apiGetOrders() {
    const data = await apiFetch('/orders');
    return data.orders;
}

async function apiGetOrder(orderId) {
    const data = await apiFetch(`/orders/${orderId}`);
    return data.order;
}

async function apiCreateOrder(payload) {
    const data = await apiFetch('/orders', { method: 'POST', body: JSON.stringify(payload) });
    return data.order;
}

async function apiUpdateOrderStatus(orderId, status) {
    const data = await apiFetch(`/orders/${orderId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    return data.order;
}

async function apiGetUsers() {
    const data = await apiFetch('/users');
    return data.users;
}

async function apiUpdateUser(userId, payload) {
    const data = await apiFetch(`/users/${userId}`, { method: 'PATCH', body: JSON.stringify(payload) });
    return data.user;
}

// ─── Payment API ──────────────────────────────────────────────────────────────
async function apiCreateRazorpayOrder(printOrderId) {
    const data = await apiFetch('/payment/create-order', { method: 'POST', body: JSON.stringify({ orderId: printOrderId }) });
    return data;
}

async function apiVerifyPayment(payload) {
    const data = await apiFetch('/payment/verify', { method: 'POST', body: JSON.stringify(payload) });
    return data.order;
}

async function apiCashConfirm(printOrderId) {
    const data = await apiFetch('/payment/cash-confirm', { method: 'POST', body: JSON.stringify({ printOrderId }) });
    return data.order;
}

// ─── Razorpay checkout launcher ───────────────────────────────────────────────
function openRazorpay({ razorpayOrderId, amount, currency, keyId, prefill, printOrderId, onSuccess, onFailure }) {
    if (typeof Razorpay === 'undefined') {
        showToast('Payment gateway not loaded. Check your connection.', 'error');
        return;
    }

    const options = {
        key:         keyId,
        amount,
        currency,
        name:        'PrintEase',
        description: `Print Order ${printOrderId}`,
        order_id:    razorpayOrderId,
        prefill,
        theme:       { color: '#667eea' },
        handler: async (response) => {
            try {
                const order = await apiVerifyPayment({
                    razorpayOrderId:   response.razorpay_order_id,
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpaySignature: response.razorpay_signature,
                    printOrderId
                });
                if (onSuccess) onSuccess(order);
            } catch (err) {
                showToast('Payment verification failed: ' + err.message, 'error');
                if (onFailure) onFailure(err);
            }
        },
        modal: {
            ondismiss: () => showToast('Payment cancelled.', 'warning')
        }
    };

    new Razorpay(options).open();
}

// ─── Socket.io real-time ──────────────────────────────────────────────────────
let _socket = null;

function connectSocket(onOrderUpdate) {
    if (typeof io === 'undefined') return;

    _socket = io('http://localhost:5000');

    const user = getUser();
    if (user) _socket.emit('join:user', user.email);

    _socket.on('order:updated', (data) => {
        if (onOrderUpdate) onOrderUpdate(data);
    });

    _socket.on('connect', () => console.log('🔌 Socket connected'));
    _socket.on('disconnect', () => console.log('❌ Socket disconnected'));
}

// ─── Page routing helpers ─────────────────────────────────────────────────────
function isPagesContext() {
    return window.location.pathname.toLowerCase().includes('/pages/');
}

function resolvePage(page) {
    if (page === 'index') return isPagesContext() ? '../index.html' : 'index.html';
    return isPagesContext() ? `${page}.html` : `pages/${page}.html`;
}

function goTo(page) { window.location.href = resolvePage(page); }

// ─── UI Helpers ───────────────────────────────────────────────────────────────
const PE_STATUS_CONFIG = {
    Pending:   { color: '#f59e0b', bg: '#fef3c7', text: '#92400e', icon: 'fa-clock' },
    Printing:  { color: '#3b82f6', bg: '#dbeafe', text: '#1e40af', icon: 'fa-print' },
    Ready:     { color: '#10b981', bg: '#d1fae5', text: '#065f46', icon: 'fa-check-circle' },
    Completed: { color: '#6b7280', bg: '#f3f4f6', text: '#374151', icon: 'fa-check-double' },
    Cancelled: { color: '#ef4444', bg: '#fee2e2', text: '#991b1b', icon: 'fa-times-circle' }
};

const PE_ROLE_LABELS = { admin: 'Xerox Owner', staff: 'Staff', student: 'Student' };

function roleLabel(role) { return PE_ROLE_LABELS[role] || 'User'; }

function getRoleProfilePage(role) {
    const map = { student: 'profile-student.html', staff: 'profile-staff.html', admin: 'profile-admin.html' };
    return map[role] || 'profile-student.html';
}

function getRateLabel(colorKey) { return colorKey === 'color' ? 'Color' : 'B&W'; }

function formatCurrency(amount) { return '₹' + (amount || 0); }

function fileIconHTML(filename) {
    const ext = (filename || '').split('.').pop().toLowerCase();
    const icons = { pdf: 'fa-file-pdf', doc: 'fa-file-word', docx: 'fa-file-word', ppt: 'fa-file-powerpoint', pptx: 'fa-file-powerpoint', jpg: 'fa-file-image', png: 'fa-file-image' };
    return `<i class="fas ${icons[ext] || 'fa-file'}" style="font-size:1.8rem"></i>`;
}

function renderStatusPill(status) {
    const c = PE_STATUS_CONFIG[status] || PE_STATUS_CONFIG.Pending;
    return `<span class="status-pill" style="background:${c.bg};color:${c.text}"><i class="fas ${c.icon}"></i> ${status}</span>`;
}

function getPrintRates() { return { bw: 3, color: 6 }; }

function calculateAmount({ color, copies, pages }) {
    const rates = getPrintRates();
    return (rates[color] || rates.bw) * (copies || 1) * Math.max(pages || 1, 1);
}

function createOrderId() { return `ORD-${Date.now().toString().slice(-6)}`; }

function showToast(message, type = 'info') {
    const existing = document.getElementById('pe-toast');
    if (existing) existing.remove();

    const colors = { info: '#3b82f6', success: '#10b981', error: '#ef4444', warning: '#f59e0b' };
    const icons  = { info: 'fa-info-circle', success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle' };

    const toast = document.createElement('div');
    toast.id = 'pe-toast';
    toast.style.cssText = `
        position:fixed;bottom:24px;right:24px;z-index:99999;
        background:${colors[type]};color:white;
        padding:14px 20px;border-radius:12px;
        display:flex;align-items:center;gap:10px;
        font-weight:600;font-size:0.95rem;
        box-shadow:0 8px 24px rgba(0,0,0,0.2);
        animation:toastIn 0.35s cubic-bezier(0.34,1.56,0.64,1);
        max-width:340px;
    `;
    toast.innerHTML = `<i class="fas ${icons[type]}"></i><span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function showQRModal(orderId) {
    const existing = document.getElementById('shared-qr-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'shared-qr-modal';
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-card qr-modal">
            <button class="modal-close" onclick="document.getElementById('shared-qr-modal').remove()"><i class="fas fa-times"></i></button>
            <h3><i class="fas fa-qrcode"></i> Pickup QR Code</h3>
            <p style="color:#667eea;font-family:monospace;font-weight:600;margin-bottom:1rem;">${orderId}</p>
            <div id="shared-qr-container" style="display:inline-block;padding:1rem;background:white;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);"></div>
            <p style="color:#666;margin-top:1rem;font-size:0.9rem;">Show this at the Xerox shop counter</p>
            <button class="btn-primary-sm" style="margin-top:1rem" onclick="document.getElementById('shared-qr-modal').remove()">Done</button>
        </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

    function generateQR() {
        new QRCode(document.getElementById('shared-qr-container'), { text: `PRINTEASE|${orderId}|PICKUP`, width: 200, height: 200 });
    }
    typeof QRCode !== 'undefined' ? generateQR() : (() => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
        s.onload = generateQR;
        document.head.appendChild(s);
    })();
}

function orderCardHTML(order, viewerRole = 'student') {
    const config = PE_STATUS_CONFIG[order.status] || PE_STATUS_CONFIG.Pending;
    const fileName = order.file?.name || order.file || '';
    const actions = [];

    if (viewerRole === 'student') {
        if (order.status === 'Ready')     actions.push(`<button class="btn-action green" onclick="showQRModal('${order.orderId}')"><i class="fas fa-qrcode"></i> Show QR</button>`);
        if (order.status === 'Pending')   actions.push(`<button class="btn-action yellow" onclick="window.location.href='payment.html?order=${order.orderId}&amount=${order.amount}'"><i class="fas fa-credit-card"></i> Pay Now</button>`);
        if (order.status === 'Completed') actions.push(`<button class="btn-action purple" onclick="reorderOrder('${order.orderId}')"><i class="fas fa-redo"></i> Reorder</button>`);
    }
    if (viewerRole === 'staff') {
        if (order.status === 'Pending')  actions.push(`<button class="btn-action blue" onclick="staffUpdateStatus('${order.orderId}','Printing')"><i class="fas fa-play"></i> Start Print</button>`);
        if (order.status === 'Printing') actions.push(`<button class="btn-action green" onclick="staffUpdateStatus('${order.orderId}','Ready')"><i class="fas fa-check"></i> Mark Ready</button>`);
        if (order.status === 'Ready')    actions.push(`<button class="btn-action gray" onclick="staffUpdateStatus('${order.orderId}','Completed')"><i class="fas fa-check-double"></i> Complete</button>`);
    }

    return `
    <div class="order-card-full" style="border-left-color:${config.color}" id="card-${order.orderId}">
        <div class="ocf-header">
            <div class="ocf-file">
                <div class="ocf-file-icon" style="color:${config.color}">${fileIconHTML(fileName)}</div>
                <div><h4>${fileName}</h4><span>${order.date || ''} • ${order.time || ''}</span></div>
            </div>
            <div class="ocf-right">
                ${renderStatusPill(order.status)}
                <div class="ocf-amount">${formatCurrency(order.amount)}</div>
                <div class="ocf-id">${order.orderId}</div>
            </div>
        </div>
        <div class="ocf-meta">
            <span><i class="fas fa-file-alt"></i> ${order.pages} page${order.pages > 1 ? 's' : ''}</span>
            <span><i class="fas fa-palette"></i> ${order.color}</span>
            <span><i class="fas fa-copy"></i> ${order.copies} cop${order.copies > 1 ? 'ies' : 'y'}</span>
            <span><i class="fas fa-expand-alt"></i> ${order.size || 'A4'}</span>
            ${order.payment?.method ? `<span><i class="fas fa-credit-card"></i> ${order.payment.method.toUpperCase()}</span>` : ''}
            ${order.payment?.status ? `<span><i class="fas fa-wallet"></i> ${order.payment.status}</span>` : ''}
            ${viewerRole !== 'student' ? `<span><i class="fas fa-user"></i> ${order.ownerName || order.userId}</span>` : ''}
        </div>
        ${order.instructions ? `<div class="ocf-note"><i class="fas fa-sticky-note"></i> ${order.instructions}</div>` : ''}
        ${actions.length ? `<div class="ocf-actions">${actions.join('')}</div>` : ''}
    </div>`;
}

async function reorderOrder(orderId) {
    try {
        const original = await apiGetOrder(orderId);
        const newOrder = await apiCreateOrder({
            file:         original.file,
            pages:        original.pages,
            copies:       original.copies,
            color:        original.color,
            sides:        original.sides,
            size:         original.size,
            instructions: original.instructions,
            amount:       original.amount
        });
        window.location.href = `payment.html?order=${newOrder.orderId}&amount=${newOrder.amount}`;
    } catch (err) {
        showToast('Reorder failed: ' + err.message, 'error');
    }
}

async function staffUpdateStatus(orderId, status) {
    try {
        await apiUpdateOrderStatus(orderId, status);
        showToast(`Order ${orderId} → ${status}`, 'success');
        if (typeof renderOrders === 'function') renderOrders();
    } catch (err) {
        showToast('Update failed: ' + err.message, 'error');
    }
}

function initSidebar(user) {
    if (!user) return;
    const su = document.getElementById('sidebarUser');
    if (su) {
        const sub = user.role === 'student' ? user.studentId : (user.employeeId || roleLabel(user.role));
        su.innerHTML = `
            <div class="su-avatar">${user.firstName[0]}${user.lastName[0]}</div>
            <div class="su-info"><strong>${user.firstName} ${user.lastName}</strong><span>${roleLabel(user.role)} • ${sub}</span></div>`;
    }
    const av = document.getElementById('topbarAvatar');
    if (av) av.textContent = `${user.firstName[0]}${user.lastName[0]}`;

    document.querySelectorAll('[data-role-guard]').forEach(el => {
        const allowed = (el.dataset.roleGuard || '').split(',').map(v => v.trim());
        if (allowed.length && !allowed.includes(user.role)) el.style.display = 'none';
    });

    const sc = document.getElementById('sidebarClose');
    if (sc) sc.addEventListener('click', closeSidebar);
}

function openSidebar() {
    document.getElementById('sidebar')?.classList.add('open');
    document.getElementById('sidebarOverlay')?.classList.add('visible');
}
function closeSidebar() {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebarOverlay')?.classList.remove('visible');
}
