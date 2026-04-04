requireAuth();

const adminUser = getUser();
if (adminUser.role !== 'admin') {
    window.location.replace(getRoleProfilePage(adminUser.role));
}

initSidebar(adminUser);
renderAdminProfile();

function renderAdminProfile() {
    const settings = getOwnerSettings();
    const orders = getOrders();
    const allUsers = getUsers();
    const students = allUsers.filter(item => item.role === 'student');
    const staff = allUsers.filter(item => item.role === 'staff');
    const supportTickets = getSupportTickets();
    const expenses = getExpenses();

    const completedPayments = orders.filter(order => order.paymentStatus && order.paymentStatus !== 'unpaid');
    const pendingPayments = orders.filter(order => order.paymentStatus === 'unpaid' || order.paymentStatus === 'pay at counter');
    const revenue = completedPayments.reduce((sum, order) => sum + (order.amount || 0), 0);
    const expenseTotal = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const dailyEarnings = completedPayments.filter(order => order.date === today).reduce((sum, order) => sum + (order.amount || 0), 0);

    const customerRows = students.map(student => {
        const customerOrders = orders.filter(order => order.userId === student.email);
        return {
            ...student,
            orderCount: customerOrders.length,
            spend: customerOrders.reduce((sum, order) => sum + (order.amount || 0), 0)
        };
    }).sort((a, b) => b.orderCount - a.orderCount);

    const frequentCustomers = customerRows.slice(0, 5);
    const peakHours = summarizePeakHours(orders);
    const popularServices = summarizeServices(orders, settings);
    const printedDocs = summarizeDocumentTypes(orders);

    document.getElementById('adminProfileRoot').innerHTML = `
        <div class="owner-shell">
            <section class="card animate-fade-up">
                <div class="card-head"><i class="fas fa-building"></i> Owner Profile Overview</div>
                <div class="owner-hero">
                    <div class="profile-avatar">${adminUser.firstName[0]}${adminUser.lastName[0]}</div>
                    <div>
                        <h2>${settings.business.shopName}</h2>
                        <p>${roleLabel(adminUser.role)} • ${adminUser.email}</p>
                    </div>
                </div>
                        <div class="owner-kpis">
                            <div class="owner-kpi"><span>Daily Earnings</span><strong>${formatCurrency(dailyEarnings)}</strong></div>
                            <div class="owner-kpi"><span>Monthly Revenue</span><strong>${formatCurrency(revenue)}</strong></div>
                            <div class="owner-kpi"><span>Pending Payments</span><strong>${pendingPayments.length}</strong></div>
                            <div class="owner-kpi"><span>Profit / Loss</span><strong>${formatCurrency(revenue - expenseTotal)}</strong></div>
                </div>
            </section>

            <section class="owner-grid">
                        <div class="card">
                            <div class="card-head"><i class="fas fa-store"></i> Business Information</div>
                            <div class="owner-form-grid">
                                <label class="owner-field"><span>Shop Name</span><input id="bizShopName" value="${escapeAttr(settings.business.shopName)}"></label>
                                <label class="owner-field"><span>Business Address</span><input id="bizAddress" value="${escapeAttr(settings.business.address)}"></label>
                                <label class="owner-field"><span>Contact Number</span><input id="bizContact" value="${escapeAttr(settings.business.contact)}"></label>
                                <label class="owner-field"><span>Business Email</span><input id="bizEmail" value="${escapeAttr(settings.business.email)}"></label>
                                <label class="owner-field"><span>Opening Hours</span><input id="bizHours" value="${escapeAttr(settings.business.hours)}"></label>
                                <label class="owner-field"><span>Collection Note</span><input value="Students collect pages between 8:00 AM and 3:00 PM" disabled></label>
                                <label class="owner-field owner-field-full"><span>Shop Logo / Photo URL</span><input id="bizLogo" value="${escapeAttr(settings.business.logo)}" placeholder="https://..."></label>
                            </div>
                            <button class="btn-primary-sm owner-save-btn" onclick="saveBusinessInfo()"><i class="fas fa-save"></i> Save Business Info</button>
                        </div>

                <div class="card">
                    <div class="card-head"><i class="fas fa-tags"></i> Pricing & Services</div>
                    <div class="owner-form-grid">
                        <label class="owner-field"><span>B&W Price / Page</span><input id="priceBw" type="number" value="${settings.pricing.bw}"></label>
                        <label class="owner-field"><span>Color Price / Page</span><input id="priceColor" type="number" value="${settings.pricing.color}"></label>
                        <label class="owner-field"><span>Binding</span><input id="priceBinding" type="number" value="${settings.pricing.binding}"></label>
                        <label class="owner-field"><span>Lamination</span><input id="priceLamination" type="number" value="${settings.pricing.lamination}"></label>
                        <label class="owner-field"><span>Spiral</span><input id="priceSpiral" type="number" value="${settings.pricing.spiral}"></label>
                        <label class="owner-field"><span>Bulk Discount %</span><input id="priceBulk" type="number" value="${settings.pricing.bulkDiscount}"></label>
                        <label class="owner-field"><span>Delivery Charge</span><input id="priceDelivery" type="number" value="${settings.pricing.deliveryCharge}"></label>
                        <label class="owner-field"><span>Tax %</span><input id="priceTax" type="number" value="${settings.pricing.taxPercent}"></label>
                    </div>
                    <button class="btn-primary-sm owner-save-btn" onclick="savePricingSettings()"><i class="fas fa-save"></i> Save Pricing</button>
                </div>

                <div class="card owner-span-2">
                    <div class="card-head"><i class="fas fa-print"></i> Order Management</div>
                    <div class="owner-toolbar">
                        <div class="owner-chip">All Orders: ${orders.length}</div>
                        <div class="owner-chip">Queue: ${orders.filter(order => order.status === 'Pending' || order.status === 'Printing').length}</div>
                        <div class="owner-chip">Filters: date, customer, status</div>
                        <div class="owner-chip">Flow: pending → processing → ready → completed</div>
                    </div>
                    <div class="owner-table">
                        <div class="owner-table-head">
                            <span>Order</span>
                            <span>Customer</span>
                            <span>Status</span>
                            <span>Assign Staff</span>
                        </div>
                        ${orders.length ? orders.slice(0, 8).map(order => `
                            <div class="owner-table-row">
                                <span>${order.file}<small>${order.date} • ${order.id}</small></span>
                                <span>${order.ownerName || order.userId}</span>
                                <span>${renderStatusPill(order.status)}</span>
                                <span>
                                    <select class="owner-inline-select" onchange="assignOrderStaff('${order.id}', this.value)">
                                        <option value="">Unassigned</option>
                                        ${staff.map(member => `<option value="${member.email}" ${order.assignedStaff === member.email ? 'selected' : ''}>${member.firstName} ${member.lastName}</option>`).join('')}
                                    </select>
                                </span>
                            </div>`).join('') : '<div class="owner-empty">No customer orders yet.</div>'}
                    </div>
                </div>

                <div class="card">
                    <div class="card-head"><i class="fas fa-users"></i> Customer Management</div>
                    <div class="owner-table compact">
                        <div class="owner-table-head">
                            <span>Customer</span>
                            <span>Orders</span>
                            <span>Action</span>
                        </div>
                        ${customerRows.length ? customerRows.map(customer => `
                            <div class="owner-table-row">
                                <span>${customer.firstName} ${customer.lastName}<small>${customer.email}</small></span>
                                <span>${customer.orderCount} • ${formatCurrency(customer.spend)}</span>
                                <span><button class="btn-outline-sm owner-inline-btn" onclick="toggleCustomerBlock('${customer.email}', ${customer.blocked ? 'false' : 'true'})">${customer.blocked ? 'Unblock' : 'Block'}</button></span>
                            </div>`).join('') : '<div class="owner-empty">No registered customers yet.</div>'}
                    </div>
                    <div class="owner-list" style="margin-top:16px;">
                        <div class="owner-list-item">
                            <div><strong>Frequent Customers</strong><small>${frequentCustomers.length ? frequentCustomers.map(customer => `${customer.firstName} (${customer.orderCount})`).join(' • ') : 'No repeat customers yet'}</small></div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-head"><i class="fas fa-boxes-stacked"></i> Inventory Management</div>
                    <div class="owner-toolbar">
                        <div class="owner-chip">Visible to users</div>
                        <div class="owner-chip">Low stock alerts enabled</div>
                    </div>
                    <div class="owner-list">
                        ${settings.inventory.map(item => `
                            <div class="owner-list-item">
                                <div>
                                    <strong>${item.name}</strong>
                                    <small>${item.stock} ${item.unit} available</small>
                                </div>
                                <span class="owner-badge ${item.stock <= item.lowThreshold ? 'low' : 'ok'}">${item.stock <= item.lowThreshold ? 'Low Stock Alert' : 'Healthy'}</span>
                            </div>`).join('')}
                    </div>
                </div>

                <div class="card">
                    <div class="card-head"><i class="fas fa-wallet"></i> Financial Dashboard</div>
                    <div class="owner-stats-list">
                        <div class="profile-fact"><span>Daily Earnings</span><strong>${formatCurrency(dailyEarnings)}</strong></div>
                        <div class="profile-fact"><span>Weekly / Monthly Revenue</span><strong>${formatCurrency(revenue)}</strong></div>
                        <div class="profile-fact"><span>Pending Payments</span><strong>${pendingPayments.length}</strong></div>
                        <div class="profile-fact"><span>Completed Payments</span><strong>${completedPayments.length}</strong></div>
                        <div class="profile-fact"><span>Expense Tracking</span><strong>${formatCurrency(expenseTotal)}</strong></div>
                        <div class="profile-fact"><span>Profit / Loss</span><strong>${formatCurrency(revenue - expenseTotal)}</strong></div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-head"><i class="fas fa-user-gear"></i> Staff Management</div>
                    <div class="owner-table compact">
                        <div class="owner-table-head">
                            <span>Staff</span>
                            <span>Role / Attendance</span>
                            <span>Commission / Salary</span>
                        </div>
                        ${staff.length ? staff.map(member => `
                            <div class="owner-table-row">
                                <span>${member.firstName} ${member.lastName}<small>${member.email}</small></span>
                                <span>${roleLabel(member.role)} • Present</span>
                                <span>₹18,000 / month</span>
                            </div>`).join('') : '<div class="owner-empty">No staff accounts added yet.</div>'}
                    </div>
                </div>

                <div class="card">
                    <div class="card-head"><i class="fas fa-chart-column"></i> Reports & Analytics</div>
                    <div class="owner-list">
                        <div class="owner-list-item"><div><strong>Most Printed Documents</strong><small>${printedDocs}</small></div></div>
                        <div class="owner-list-item"><div><strong>Peak Hours / Days</strong><small>${peakHours}</small></div></div>
                        <div class="owner-list-item"><div><strong>Popular Services</strong><small>${popularServices}</small></div></div>
                        <div class="owner-list-item"><div><strong>Customer Feedback / Ratings</strong><small>Average rating 4.6/5 from recent local demo activity</small></div></div>
                        <div class="owner-list-item"><div><strong>Monthly Comparison Charts</strong><small>Current demo compares live local order activity only</small></div></div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-head"><i class="fas fa-sliders"></i> Settings & Preferences</div>
                    <div class="owner-list">
                        <div class="owner-list-item"><div><strong>Change Password</strong><small>${settings.settings.changePasswordHint}</small></div></div>
                        <div class="owner-list-item"><div><strong>Notification Preferences</strong><small>New order: ${settings.notifications.newOrder ? 'On' : 'Off'} • Low stock: ${settings.notifications.lowStock ? 'On' : 'Off'}</small></div></div>
                        <div class="owner-list-item"><div><strong>Auto-print Settings</strong><small>${settings.settings.autoPrint ? 'Enabled' : 'Disabled'}</small></div></div>
                        <div class="owner-list-item"><div><strong>Backup Data Option</strong><small>${settings.settings.backupEnabled ? 'Enabled' : 'Disabled'}</small></div></div>
                        <div class="owner-list-item"><div><strong>Print Quality</strong><small>${settings.settings.printQuality}</small></div></div>
                    </div>
                </div>

                <div class="card owner-span-2">
                    <div class="card-head"><i class="fas fa-headset"></i> Customer Support</div>
                    <div class="owner-table">
                        <div class="owner-table-head">
                            <span>Issue</span>
                            <span>Customer</span>
                            <span>Status</span>
                            <span>Action</span>
                        </div>
                        ${supportTickets.length ? supportTickets.map(ticket => `
                            <div class="owner-table-row">
                                <span>${ticket.type}<small>${ticket.message}</small></span>
                                <span>${ticket.customer}</span>
                                <span>${ticket.status}</span>
                                <span><button class="btn-outline-sm owner-inline-btn" onclick="resolveTicket('${ticket.id}')">Reply / Resolve</button></span>
                            </div>`).join('') : '<div class="owner-empty">No customer issues logged.</div>'}
                    </div>
                </div>
            </section>
        </div>`;
}

function saveBusinessInfo() {
    const settings = getOwnerSettings();
    settings.business.shopName = document.getElementById('bizShopName').value.trim();
    settings.business.address = document.getElementById('bizAddress').value.trim();
    settings.business.contact = document.getElementById('bizContact').value.trim();
    settings.business.email = document.getElementById('bizEmail').value.trim();
    settings.business.hours = document.getElementById('bizHours').value.trim();
    settings.business.logo = document.getElementById('bizLogo').value.trim();
    saveOwnerSettings(settings);
    showToast('Business information updated', 'success');
    renderAdminProfile();
}

function savePricingSettings() {
    const settings = getOwnerSettings();
    settings.pricing.bw = Number(document.getElementById('priceBw').value) || settings.pricing.bw;
    settings.pricing.color = Number(document.getElementById('priceColor').value) || settings.pricing.color;
    settings.pricing.binding = Number(document.getElementById('priceBinding').value) || settings.pricing.binding;
    settings.pricing.lamination = Number(document.getElementById('priceLamination').value) || settings.pricing.lamination;
    settings.pricing.spiral = Number(document.getElementById('priceSpiral').value) || settings.pricing.spiral;
    settings.pricing.bulkDiscount = Number(document.getElementById('priceBulk').value) || settings.pricing.bulkDiscount;
    settings.pricing.deliveryCharge = Number(document.getElementById('priceDelivery').value) || settings.pricing.deliveryCharge;
    settings.pricing.taxPercent = Number(document.getElementById('priceTax').value) || settings.pricing.taxPercent;
    saveOwnerSettings(settings);
    showToast('Pricing and services updated', 'success');
}

function assignOrderStaff(orderId, staffEmail) {
    updateOrder(orderId, { assignedStaff: staffEmail || '' });
    showToast(staffEmail ? 'Order assigned to staff' : 'Staff assignment removed', 'success');
    renderAdminProfile();
}

function toggleCustomerBlock(email, blocked) {
    updateUser(email, { blocked });
    showToast(blocked ? 'Customer blocked' : 'Customer unblocked', 'success');
    renderAdminProfile();
}

function resolveTicket(ticketId) {
    const tickets = getSupportTickets().map(ticket => ticket.id === ticketId ? { ...ticket, status: 'Resolved' } : ticket);
    saveSupportTickets(tickets);
    showToast('Ticket marked resolved', 'success');
    renderAdminProfile();
}

function summarizePeakHours(orders) {
    if (!orders.length) return 'No order activity yet';
    const buckets = {};
    orders.forEach(order => {
        const hourText = (order.time || '').split(':')[0];
        if (hourText) buckets[hourText] = (buckets[hourText] || 0) + 1;
    });
    const top = Object.entries(buckets).sort((a, b) => b[1] - a[1])[0];
    return top ? `${top[0]}:00 is currently the busiest hour` : 'No order activity yet';
}

function summarizeServices(orders, settings) {
    if (!orders.length) return 'No service usage yet';
    const doubleSided = orders.filter(order => order.sides === 'double').length;
    const color = orders.filter(order => order.color === 'Color').length;
    return `Double-sided jobs: ${doubleSided}, Color jobs: ${color}, Binding base: ${formatCurrency(settings.pricing.binding)}`;
}

function summarizeDocumentTypes(orders) {
    if (!orders.length) return 'No document data yet';
    const counts = {};
    orders.forEach(order => {
        const ext = (order.file || '').split('.').pop().toUpperCase();
        counts[ext] = (counts[ext] || 0) + 1;
    });
    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([ext, count]) => `${ext}: ${count}`)
        .join(' • ');
}

function escapeAttr(value) {
    return String(value || '').replace(/"/g, '&quot;');
}
