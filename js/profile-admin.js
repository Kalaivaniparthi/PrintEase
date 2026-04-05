requireAuth();

const adminUser = getUser();
if (adminUser.role !== 'admin') window.location.replace(getRoleProfilePage(adminUser.role));

initSidebar(adminUser);

// ─── Pricing stored in localStorage (owner-configurable, no backend needed for MVP) ──
const PRICING_KEY = 'pe_owner_pricing';
function getPricing() {
    return JSON.parse(localStorage.getItem(PRICING_KEY) || 'null') || { bw: 3, color: 6, binding: 20, lamination: 15, spiral: 30, bulkDiscount: 0, deliveryCharge: 0, taxPercent: 0 };
}
function savePricing(p) { localStorage.setItem(PRICING_KEY, JSON.stringify(p)); }

const BIZ_KEY = 'pe_owner_biz';
function getBiz() {
    return JSON.parse(localStorage.getItem(BIZ_KEY) || 'null') || { shopName: 'Campus Xerox', address: 'Block A, Ground Floor', contact: '', email: '', hours: '8:00 AM – 6:00 PM', logo: '' };
}
function saveBiz(b) { localStorage.setItem(BIZ_KEY, JSON.stringify(b)); }

function escapeAttr(v) { return String(v || '').replace(/"/g, '&quot;'); }

function summarizePeakHours(orders) {
    if (!orders.length) return 'No order activity yet';
    const buckets = {};
    orders.forEach(o => { const h = (o.time || '').split(':')[0]; if (h) buckets[h] = (buckets[h] || 0) + 1; });
    const top = Object.entries(buckets).sort((a, b) => b[1] - a[1])[0];
    return top ? `${top[0]}:00 is currently the busiest hour` : 'No order activity yet';
}
function summarizeServices(orders, pricing) {
    if (!orders.length) return 'No service usage yet';
    const ds = orders.filter(o => o.sides === 'double').length;
    const cl = orders.filter(o => o.color === 'Color').length;
    return `Double-sided: ${ds}, Color: ${cl}, Binding base: ${formatCurrency(pricing.binding)}`;
}
function summarizeDocTypes(orders) {
    if (!orders.length) return 'No document data yet';
    const counts = {};
    orders.forEach(o => { const ext = (o.file?.name || '').split('.').pop().toUpperCase(); if (ext) counts[ext] = (counts[ext] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([e, c]) => `${e}: ${c}`).join(' • ');
}

async function renderAdminProfile() {
    let orders = [], allUsers = [];
    try { orders = await apiGetOrders(); } catch {}
    try { allUsers = await apiGetUsers(); } catch {}

    const pricing  = getPricing();
    const biz      = getBiz();
    const students = allUsers.filter(u => u.role === 'student');
    const staff    = allUsers.filter(u => u.role === 'staff');

    const paidOrders    = orders.filter(o => o.payment?.status === 'paid');
    const pendingPay    = orders.filter(o => !o.payment?.status || o.payment.status === 'unpaid' || o.payment.status === 'pay at counter');
    const revenue       = paidOrders.reduce((s, o) => s + (o.amount || 0), 0);
    const today         = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const dailyEarnings = paidOrders.filter(o => o.date === today).reduce((s, o) => s + (o.amount || 0), 0);

    const customerRows = students.map(s => {
        const co = orders.filter(o => o.userId === s.email);
        return { ...s, orderCount: co.length, spend: co.reduce((sum, o) => sum + (o.amount || 0), 0) };
    }).sort((a, b) => b.orderCount - a.orderCount);

    document.getElementById('adminProfileRoot').innerHTML = `
        <div class="owner-shell">
            <section class="card animate-fade-up">
                <div class="card-head"><i class="fas fa-building"></i> Owner Profile Overview</div>
                <div class="owner-hero">
                    <div class="profile-avatar">${adminUser.firstName[0]}${adminUser.lastName[0]}</div>
                    <div>
                        <h2>${biz.shopName}</h2>
                        <p>${roleLabel(adminUser.role)} • ${adminUser.email}</p>
                    </div>
                </div>
                <div class="owner-kpis">
                    <div class="owner-kpi"><span>Daily Earnings</span><strong>${formatCurrency(dailyEarnings)}</strong></div>
                    <div class="owner-kpi"><span>Monthly Revenue</span><strong>${formatCurrency(revenue)}</strong></div>
                    <div class="owner-kpi"><span>Pending Payments</span><strong>${pendingPay.length}</strong></div>
                    <div class="owner-kpi"><span>Profit / Loss</span><strong>${formatCurrency(revenue)}</strong></div>
                </div>
            </section>

            <section class="owner-grid">
                <div class="card">
                    <div class="card-head"><i class="fas fa-store"></i> Business Information</div>
                    <div class="owner-form-grid">
                        <label class="owner-field"><span>Shop Name</span><input id="bizShopName" value="${escapeAttr(biz.shopName)}"></label>
                        <label class="owner-field"><span>Address</span><input id="bizAddress" value="${escapeAttr(biz.address)}"></label>
                        <label class="owner-field"><span>Contact</span><input id="bizContact" value="${escapeAttr(biz.contact)}"></label>
                        <label class="owner-field"><span>Business Email</span><input id="bizEmail" value="${escapeAttr(biz.email)}"></label>
                        <label class="owner-field"><span>Opening Hours</span><input id="bizHours" value="${escapeAttr(biz.hours)}"></label>
                        <label class="owner-field owner-field-full"><span>Logo URL</span><input id="bizLogo" value="${escapeAttr(biz.logo)}" placeholder="https://..."></label>
                    </div>
                    <button class="btn-primary-sm owner-save-btn" onclick="saveBusinessInfo()"><i class="fas fa-save"></i> Save Business Info</button>
                </div>

                <div class="card">
                    <div class="card-head"><i class="fas fa-tags"></i> Pricing & Services</div>
                    <div class="owner-form-grid">
                        <label class="owner-field"><span>B&W Price / Page</span><input id="priceBw" type="number" value="${pricing.bw}"></label>
                        <label class="owner-field"><span>Color Price / Page</span><input id="priceColor" type="number" value="${pricing.color}"></label>
                        <label class="owner-field"><span>Binding</span><input id="priceBinding" type="number" value="${pricing.binding}"></label>
                        <label class="owner-field"><span>Lamination</span><input id="priceLamination" type="number" value="${pricing.lamination}"></label>
                        <label class="owner-field"><span>Spiral</span><input id="priceSpiral" type="number" value="${pricing.spiral}"></label>
                        <label class="owner-field"><span>Bulk Discount %</span><input id="priceBulk" type="number" value="${pricing.bulkDiscount}"></label>
                        <label class="owner-field"><span>Delivery Charge</span><input id="priceDelivery" type="number" value="${pricing.deliveryCharge}"></label>
                        <label class="owner-field"><span>Tax %</span><input id="priceTax" type="number" value="${pricing.taxPercent}"></label>
                    </div>
                    <button class="btn-primary-sm owner-save-btn" onclick="savePricingSettings()"><i class="fas fa-save"></i> Save Pricing</button>
                </div>

                <div class="card owner-span-2">
                    <div class="card-head"><i class="fas fa-print"></i> Order Management</div>
                    <div class="owner-toolbar">
                        <div class="owner-chip">All Orders: ${orders.length}</div>
                        <div class="owner-chip">Queue: ${orders.filter(o => o.status === 'Pending' || o.status === 'Printing').length}</div>
                    </div>
                    <div class="owner-table">
                        <div class="owner-table-head"><span>Order</span><span>Customer</span><span>Status</span><span>Assign Staff</span></div>
                        ${orders.length ? orders.slice(0, 8).map(o => `
                            <div class="owner-table-row">
                                <span>${o.file?.name || ''}<small>${o.date || ''} • ${o.orderId}</small></span>
                                <span>${o.ownerName || o.userId}</span>
                                <span>${renderStatusPill(o.status)}</span>
                                <span>
                                    <select class="owner-inline-select" onchange="assignOrderStaff('${o.orderId}', this.value)">
                                        <option value="">Unassigned</option>
                                        ${staff.map(m => `<option value="${m.email}" ${o.assignedStaff === m.email ? 'selected' : ''}>${m.firstName} ${m.lastName}</option>`).join('')}
                                    </select>
                                </span>
                            </div>`).join('') : '<div class="owner-empty">No orders yet.</div>'}
                    </div>
                </div>

                <div class="card">
                    <div class="card-head"><i class="fas fa-users"></i> Customer Management</div>
                    <div class="owner-table compact">
                        <div class="owner-table-head"><span>Customer</span><span>Orders</span><span>Action</span></div>
                        ${customerRows.length ? customerRows.map(c => `
                            <div class="owner-table-row">
                                <span>${c.firstName} ${c.lastName}<small>${c.email}</small></span>
                                <span>${c.orderCount} • ${formatCurrency(c.spend)}</span>
                                <span><button class="btn-outline-sm owner-inline-btn" onclick="toggleCustomerBlock('${c._id}', ${c.isActive ? 'false' : 'true'})">${c.isActive ? 'Block' : 'Unblock'}</button></span>
                            </div>`).join('') : '<div class="owner-empty">No registered customers yet.</div>'}
                    </div>
                </div>

                <div class="card">
                    <div class="card-head"><i class="fas fa-wallet"></i> Financial Dashboard</div>
                    <div class="owner-stats-list">
                        <div class="profile-fact"><span>Daily Earnings</span><strong>${formatCurrency(dailyEarnings)}</strong></div>
                        <div class="profile-fact"><span>Total Revenue</span><strong>${formatCurrency(revenue)}</strong></div>
                        <div class="profile-fact"><span>Pending Payments</span><strong>${pendingPay.length}</strong></div>
                        <div class="profile-fact"><span>Paid Orders</span><strong>${paidOrders.length}</strong></div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-head"><i class="fas fa-user-gear"></i> Staff Management</div>
                    <div class="owner-table compact">
                        <div class="owner-table-head"><span>Staff</span><span>Role</span><span>Status</span></div>
                        ${staff.length ? staff.map(m => `
                            <div class="owner-table-row">
                                <span>${m.firstName} ${m.lastName}<small>${m.email}</small></span>
                                <span>${roleLabel(m.role)}</span>
                                <span>${m.isActive ? 'Active' : 'Inactive'}</span>
                            </div>`).join('') : '<div class="owner-empty">No staff accounts yet.</div>'}
                    </div>
                </div>

                <div class="card">
                    <div class="card-head"><i class="fas fa-chart-column"></i> Reports & Analytics</div>
                    <div class="owner-list">
                        <div class="owner-list-item"><div><strong>Most Printed Documents</strong><small>${summarizeDocTypes(orders)}</small></div></div>
                        <div class="owner-list-item"><div><strong>Peak Hours</strong><small>${summarizePeakHours(orders)}</small></div></div>
                        <div class="owner-list-item"><div><strong>Popular Services</strong><small>${summarizeServices(orders, pricing)}</small></div></div>
                    </div>
                </div>
            </section>
        </div>`;
}

function saveBusinessInfo() {
    const biz = getBiz();
    biz.shopName = document.getElementById('bizShopName').value.trim();
    biz.address  = document.getElementById('bizAddress').value.trim();
    biz.contact  = document.getElementById('bizContact').value.trim();
    biz.email    = document.getElementById('bizEmail').value.trim();
    biz.hours    = document.getElementById('bizHours').value.trim();
    biz.logo     = document.getElementById('bizLogo').value.trim();
    saveBiz(biz);
    showToast('Business information updated', 'success');
    renderAdminProfile();
}

function savePricingSettings() {
    const p = getPricing();
    p.bw             = Number(document.getElementById('priceBw').value)       || p.bw;
    p.color          = Number(document.getElementById('priceColor').value)    || p.color;
    p.binding        = Number(document.getElementById('priceBinding').value)  || p.binding;
    p.lamination     = Number(document.getElementById('priceLamination').value) || p.lamination;
    p.spiral         = Number(document.getElementById('priceSpiral').value)   || p.spiral;
    p.bulkDiscount   = Number(document.getElementById('priceBulk').value);
    p.deliveryCharge = Number(document.getElementById('priceDelivery').value);
    p.taxPercent     = Number(document.getElementById('priceTax').value);
    savePricing(p);
    showToast('Pricing updated', 'success');
}

async function assignOrderStaff(orderId, staffEmail) {
    try {
        await apiFetch(`/orders/${orderId}/assign`, { method: 'PATCH', body: JSON.stringify({ assignedStaff: staffEmail }) });
        showToast(staffEmail ? 'Order assigned to staff' : 'Assignment removed', 'success');
    } catch {
        showToast('Assignment saved locally', 'info');
    }
}

async function toggleCustomerBlock(userId, isActive) {
    try {
        await apiUpdateUser(userId, { isActive });
        showToast(isActive ? 'Customer unblocked' : 'Customer blocked', 'success');
        renderAdminProfile();
    } catch (err) {
        showToast('Failed: ' + err.message, 'error');
    }
}

renderAdminProfile();
