// ===== app.js - Shared Utilities =====

const PE_STORAGE_VERSION = '3';
const PE_ROLE_LABELS = {
    admin: 'Xerox Owner',
    staff: 'Staff',
    student: 'Student'
};
const PE_STATUS_CONFIG = {
    Pending:   { color: '#f59e0b', bg: '#fef3c7', text: '#92400e', icon: 'fa-clock' },
    Printing:  { color: '#3b82f6', bg: '#dbeafe', text: '#1e40af', icon: 'fa-print' },
    Ready:     { color: '#10b981', bg: '#d1fae5', text: '#065f46', icon: 'fa-check-circle' },
    Completed: { color: '#6b7280', bg: '#f3f4f6', text: '#374151', icon: 'fa-check-double' }
};
const PE_RATES = { bw: 3, color: 6 };

ensureAppData();

function ensureAppData() {
    const version = localStorage.getItem('pe_storage_version');
    if (version !== PE_STORAGE_VERSION) {
        localStorage.removeItem('pe_orders');
        localStorage.removeItem('pe_owner_settings');
        localStorage.removeItem('pe_support_tickets');
        localStorage.removeItem('pe_expenses');
        localStorage.removeItem('pe_session');
        localStorage.setItem('pe_storage_version', PE_STORAGE_VERSION);
    }
    ensureDefaults();
}

function ensureDefaults() {
    if (!localStorage.getItem('pe_owner_settings')) {
        localStorage.setItem('pe_owner_settings', JSON.stringify(defaultOwnerSettings()));
    }
    if (!localStorage.getItem('pe_support_tickets')) {
        localStorage.setItem('pe_support_tickets', JSON.stringify(defaultSupportTickets()));
    }
    if (!localStorage.getItem('pe_expenses')) {
        localStorage.setItem('pe_expenses', JSON.stringify(defaultExpenses()));
    }
}

function defaultOwnerSettings() {
    return {
        business: {
            shopName: 'PrintEase Xerox Hub',
            address: 'Campus Main Block, Ground Floor',
            contact: '+91 98765 43210',
            email: 'owner@printease.local',
            gst: '',
            hours: 'Collection Hours: 8:00 AM - 3:00 PM',
            logo: ''
        },
        pricing: {
            bw: 3,
            color: 6,
            binding: 40,
            lamination: 25,
            spiral: 55,
            bulkDiscount: 10,
            deliveryCharge: 20,
            taxPercent: 5
        },
        inventory: [
            { id: 'inv-a4', name: 'A4 Paper', stock: 24, unit: 'reams', lowThreshold: 8 },
            { id: 'inv-a3', name: 'A3 Paper', stock: 9, unit: 'reams', lowThreshold: 4 },
            { id: 'inv-legal', name: 'Legal Paper', stock: 7, unit: 'reams', lowThreshold: 4 },
            { id: 'inv-black', name: 'Black Toner', stock: 42, unit: '%', lowThreshold: 20 },
            { id: 'inv-color', name: 'Color Toner', stock: 36, unit: '%', lowThreshold: 20 },
            { id: 'inv-spiral', name: 'Spiral Binding Sets', stock: 18, unit: 'packs', lowThreshold: 10 }
        ],
        notifications: {
            lowStock: true,
            newOrder: true,
            payment: true
        },
        settings: {
            autoPrint: false,
            backupEnabled: true,
            printQuality: 'High',
            changePasswordHint: 'Managed locally in this demo build'
        },
        staffMeta: {}
    };
}

function defaultSupportTickets() {
    return [
        {
            id: 'SUP-101',
            customer: 'student@college.edu',
            type: 'Refund Request',
            message: 'Paid twice for the same upload by mistake.',
            status: 'Open'
        },
        {
            id: 'SUP-102',
            customer: 'demo@college.edu',
            type: 'Customer Query',
            message: 'Can my ready print be held till tomorrow morning?',
            status: 'Pending Reply'
        }
    ];
}

function defaultExpenses() {
    return [
        { id: 'EXP-1', label: 'Paper restock', amount: 3200, category: 'Supplies' },
        { id: 'EXP-2', label: 'Machine maintenance', amount: 1800, category: 'Maintenance' }
    ];
}

function isPagesContext() {
    return window.location.pathname.toLowerCase().includes('/pages/');
}

function resolvePage(page) {
    if (page === 'index') return isPagesContext() ? '../index.html' : 'index.html';
    return isPagesContext() ? `${page}.html` : `pages/${page}.html`;
}

function goTo(page) {
    window.location.href = resolvePage(page);
}

function getRoleProfilePage(role) {
    const page = role === 'admin' ? 'profile-admin' : role === 'staff' ? 'profile-staff' : 'profile-student';
    return resolvePage(page);
}

function goToRoleProfile(role) {
    window.location.href = getRoleProfilePage(role);
}

function getUsers() {
    return JSON.parse(localStorage.getItem('pe_users') || '[]').map(normalizeUser);
}

function saveUsers(users) {
    localStorage.setItem('pe_users', JSON.stringify(users.map(normalizeUser)));
}

function getUser() {
    const session = JSON.parse(localStorage.getItem('pe_session') || 'null');
    return session ? normalizeUser(session) : null;
}

function setUserSession(user) {
    localStorage.setItem('pe_session', JSON.stringify(normalizeUser(user)));
}

function requireAuth() {
    if (!getUser()) window.location.href = resolvePage('auth');
}

function logout() {
    localStorage.removeItem('pe_session');
    window.location.href = resolvePage('auth');
}

function normalizeUser(user) {
    return {
        ...user,
        role: user.role || 'student',
        employeeId: user.employeeId || '',
        studentId: user.studentId || ''
    };
}

function getOrders() {
    return JSON.parse(localStorage.getItem('pe_orders') || '[]');
}

function saveOrders(orders) {
    localStorage.setItem('pe_orders', JSON.stringify(orders));
}

function saveOrder(order) {
    const orders = getOrders();
    orders.unshift(order);
    saveOrders(orders);
}

function getOwnerSettings() {
    return JSON.parse(localStorage.getItem('pe_owner_settings') || JSON.stringify(defaultOwnerSettings()));
}

function saveOwnerSettings(settings) {
    localStorage.setItem('pe_owner_settings', JSON.stringify(settings));
}

function getSupportTickets() {
    return JSON.parse(localStorage.getItem('pe_support_tickets') || '[]');
}

function saveSupportTickets(tickets) {
    localStorage.setItem('pe_support_tickets', JSON.stringify(tickets));
}

function getExpenses() {
    return JSON.parse(localStorage.getItem('pe_expenses') || '[]');
}

function saveExpenses(expenses) {
    localStorage.setItem('pe_expenses', JSON.stringify(expenses));
}

function getOrdersForUser(user) {
    const orders = getOrders();
    return user.role === 'student' ? orders.filter(order => order.userId === user.email) : orders;
}

function updateOrder(orderId, updates) {
    const orders = getOrders();
    const order = orders.find(item => item.id === orderId);
    if (!order) return null;
    Object.assign(order, updates);
    saveOrders(orders);
    return order;
}

function updateUser(email, updates) {
    const users = getUsers();
    const user = users.find(item => item.email === email);
    if (!user) return null;
    Object.assign(user, updates);
    saveUsers(users);
    const current = getUser();
    if (current && current.email === email) setUserSession(user);
    return user;
}

function formatCurrency(amount) {
    return String.fromCharCode(8377) + (amount || 0);
}

function getPrintRates() {
    const pricing = getOwnerSettings().pricing || {};
    return {
        bw: Number(pricing.bw) || PE_RATES.bw,
        color: Number(pricing.color) || PE_RATES.color
    };
}

function roleLabel(role) {
    return PE_ROLE_LABELS[role] || 'User';
}

function fileIconHTML(filename) {
    const ext = (filename || '').split('.').pop().toLowerCase();
    const icons = {
        pdf: 'fa-file-pdf',
        doc: 'fa-file-word',
        docx: 'fa-file-word',
        ppt: 'fa-file-powerpoint',
        pptx: 'fa-file-powerpoint',
        jpg: 'fa-file-image',
        png: 'fa-file-image'
    };
    return `<i class="fas ${icons[ext] || 'fa-file'}" style="font-size:1.8rem"></i>`;
}

function renderStatusPill(status) {
    const config = PE_STATUS_CONFIG[status] || PE_STATUS_CONFIG.Pending;
    return `
        <span class="status-pill" style="background:${config.bg};color:${config.text}">
            <i class="fas ${config.icon}"></i> ${status}
        </span>`;
}

function orderCardHTML(order, viewerRole = 'student') {
    const config = PE_STATUS_CONFIG[order.status] || PE_STATUS_CONFIG.Pending;
    const actions = [];

    if (viewerRole === 'student') {
        if (order.status === 'Ready') actions.push(`<button class="btn-action green" onclick="showQRModal('${order.id}')"><i class="fas fa-qrcode"></i> Show QR</button>`);
        if (order.status === 'Pending') actions.push(`<button class="btn-action yellow" onclick="window.location.href='payment.html?order=${order.id}&amount=${order.amount}'"><i class="fas fa-credit-card"></i> Pay Now</button>`);
        if (order.status === 'Completed') actions.push(`<button class="btn-action purple" onclick="reorderOrder('${order.id}')"><i class="fas fa-redo"></i> Reorder</button>`);
    }

    if (viewerRole === 'staff') {
        if (order.status === 'Pending') actions.push(`<button class="btn-action blue" onclick="setOrderStatus('${order.id}', 'Printing', 'Order moved to printing')"><i class="fas fa-play"></i> Start Print</button>`);
        if (order.status === 'Printing') actions.push(`<button class="btn-action green" onclick="setOrderStatus('${order.id}', 'Ready', 'Order is ready for pickup')"><i class="fas fa-check"></i> Mark Ready</button>`);
        if (order.status === 'Ready') actions.push(`<button class="btn-action gray" onclick="setOrderStatus('${order.id}', 'Completed', 'Order marked collected')"><i class="fas fa-check-double"></i> Complete</button>`);
    }

    if (viewerRole === 'admin') {
        actions.push(`<button class="btn-action blue" onclick="goTo('orders')"><i class="fas fa-chart-line"></i> Review Ops</button>`);
    }

    return `
    <div class="order-card-full" style="border-left-color:${config.color}">
        <div class="ocf-header">
            <div class="ocf-file">
                <div class="ocf-file-icon" style="color:${config.color}">${fileIconHTML(order.file)}</div>
                <div>
                    <h4>${order.file}</h4>
                    <span>${order.date} • ${order.time}</span>
                </div>
            </div>
            <div class="ocf-right">
                ${renderStatusPill(order.status)}
                <div class="ocf-amount">${formatCurrency(order.amount)}</div>
                <div class="ocf-id">${order.id}</div>
            </div>
        </div>
        <div class="ocf-meta">
            ${order.pages ? `<span><i class="fas fa-file-lines"></i> ${order.pages} page${order.pages > 1 ? 's' : ''}</span>` : ''}
            <span><i class="fas fa-palette"></i> ${order.color}</span>
            <span><i class="fas fa-copy"></i> ${order.copies} cop${order.copies > 1 ? 'ies' : 'y'}</span>
            <span><i class="fas fa-expand-alt"></i> ${order.size || 'A4'}</span>
            <span><i class="fas fa-clone"></i> ${order.sides}</span>
            ${viewerRole !== 'student' ? `<span><i class="fas fa-user"></i> ${order.ownerName || order.userId}</span>` : ''}
            ${order.paymentMethod ? `<span><i class="fas fa-credit-card"></i> ${order.paymentMethod.toUpperCase()}</span>` : ''}
            ${order.paymentStatus ? `<span><i class="fas fa-wallet"></i> ${order.paymentStatus}</span>` : ''}
        </div>
        ${order.instructions ? `<div class="ocf-note"><i class="fas fa-sticky-note"></i> ${order.instructions}</div>` : ''}
        ${actions.length ? `<div class="ocf-actions">${actions.join('')}</div>` : ''}
    </div>`;
}

function createOrderId() {
    return `ORD-${Date.now().toString().slice(-6)}`;
}

function getRateLabel(color) {
    return color === 'bw' ? 'B&W' : 'Color';
}

function calculateAmount({ color, copies, pages = 1 }) {
    const rates = getPrintRates();
    return (rates[color] || rates.bw) * copies * Math.max(pages || 1, 1);
}

function showToast(message, type = 'info') {
    const existing = document.getElementById('pe-toast');
    if (existing) existing.remove();

    const colors = { info: '#3b82f6', success: '#10b981', error: '#ef4444', warning: '#f59e0b' };
    const icons = { info: 'fa-info-circle', success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle' };

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
    }, 3000);
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
            <button class="modal-close" onclick="document.getElementById('shared-qr-modal').remove()">
                <i class="fas fa-times"></i>
            </button>
            <h3><i class="fas fa-qrcode"></i> Pickup QR Code</h3>
            <p style="color:#667eea;font-family:monospace;font-weight:600;margin-bottom:1rem;">${orderId}</p>
            <div id="shared-qr-container" style="display:inline-block;padding:1rem;background:white;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);"></div>
            <p style="color:#666;margin-top:1rem;font-size:0.9rem;">Show this QR code at the Xerox shop counter</p>
            <button class="btn-primary-sm" style="margin-top:1rem" onclick="document.getElementById('shared-qr-modal').remove()">Done</button>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', event => { if (event.target === modal) modal.remove(); });

    function generateQR() {
        new QRCode(document.getElementById('shared-qr-container'), {
            text: `PRINTEASE|${orderId}|PICKUP`,
            width: 200,
            height: 200
        });
    }

    if (typeof QRCode !== 'undefined') {
        generateQR();
    } else {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
        script.onload = generateQR;
        document.head.appendChild(script);
    }
}

function initSidebar(user) {
    if (!user) return;

    const sidebarUser = document.getElementById('sidebarUser');
    if (sidebarUser) {
        const subline = user.role === 'student' ? user.studentId : (user.employeeId || roleLabel(user.role));
        sidebarUser.innerHTML = `
            <div class="su-avatar">${user.firstName[0]}${user.lastName[0]}</div>
            <div class="su-info">
                <strong>${user.firstName} ${user.lastName}</strong>
                <span>${roleLabel(user.role)} • ${subline}</span>
            </div>
        `;
    }

    const avatar = document.getElementById('topbarAvatar');
    if (avatar) avatar.textContent = `${user.firstName[0]}${user.lastName[0]}`;

    const links = document.querySelectorAll('[data-role-guard]');
    links.forEach(link => {
        const allowedRoles = (link.dataset.roleGuard || '').split(',').map(value => value.trim()).filter(Boolean);
        if (allowedRoles.length && !allowedRoles.includes(user.role)) link.style.display = 'none';
    });
}

function openSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.add('open');
    if (overlay) overlay.classList.add('visible');
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('visible');
}

function reorderOrder(orderId) {
    const orders = getOrders();
    const original = orders.find(order => order.id === orderId);
    if (!original) return;

    const clone = {
        ...original,
        id: createOrderId(),
        status: 'Pending',
        paymentMethod: '',
        paymentStatus: 'unpaid',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    };

    orders.unshift(clone);
    saveOrders(orders);
    window.location.href = `payment.html?order=${clone.id}&amount=${clone.amount}`;
}

function setOrderStatus(orderId, status, message) {
    updateOrder(orderId, { status });
    if (message) showToast(message, 'success');
    if (typeof renderOrders === 'function') renderOrders();
}





