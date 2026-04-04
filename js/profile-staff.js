requireAuth();

const staffUser = getUser();
if (staffUser.role !== 'staff') {
    window.location.replace(getRoleProfilePage(staffUser.role));
}

initSidebar(staffUser);

const staffOrders = getOrdersForUser(staffUser);
const assignedOrders = staffOrders.filter(order => order.assignedStaff === staffUser.email).length;
const printing = staffOrders.filter(order => order.status === 'Printing').length;
const ready = staffOrders.filter(order => order.status === 'Ready').length;

document.getElementById('staffProfileRoot').innerHTML = `
    <div class="card animate-fade-up">
        <div class="card-head"><i class="fas fa-id-badge"></i> Staff Profile</div>
        <div class="profile-grid">
            <div class="profile-hero">
                <div class="profile-avatar">${staffUser.firstName[0]}${staffUser.lastName[0]}</div>
                <div>
                    <h2>${staffUser.firstName} ${staffUser.lastName}</h2>
                    <p>${roleLabel(staffUser.role)}</p>
                </div>
            </div>
            <div class="profile-facts">
                <div class="profile-fact"><span>Email</span><strong>${staffUser.email}</strong></div>
                <div class="profile-fact"><span>Employee ID</span><strong>${staffUser.employeeId}</strong></div>
                <div class="profile-fact"><span>Assigned Orders</span><strong>${assignedOrders}</strong></div>
                <div class="profile-fact"><span>Printing Now</span><strong>${printing}</strong></div>
                <div class="profile-fact"><span>Ready for Pickup</span><strong>${ready}</strong></div>
                <div class="profile-fact"><span>Attendance</span><strong>Present</strong></div>
            </div>
        </div>
    </div>`;
