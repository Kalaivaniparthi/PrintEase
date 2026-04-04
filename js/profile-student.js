requireAuth();

const studentUser = getUser();
if (studentUser.role !== 'student') {
    window.location.replace(getRoleProfilePage(studentUser.role));
}

initSidebar(studentUser);

const studentOrders = getOrdersForUser(studentUser);
const readyOrders = studentOrders.filter(order => order.status === 'Ready').length;
const totalSpent = studentOrders.reduce((sum, order) => sum + (order.amount || 0), 0);
const totalCopies = studentOrders.reduce((sum, order) => sum + (order.copies || 0), 0);

document.getElementById('studentProfileRoot').innerHTML = `
    <div class="card animate-fade-up">
        <div class="card-head"><i class="fas fa-id-badge"></i> Student Profile</div>
        <div class="profile-grid">
            <div class="profile-hero">
                <div class="profile-avatar">${studentUser.firstName[0]}${studentUser.lastName[0]}</div>
                <div>
                    <h2>${studentUser.firstName} ${studentUser.lastName}</h2>
                    <p>${roleLabel(studentUser.role)}</p>
                </div>
            </div>
            <div class="profile-facts">
                <div class="profile-fact"><span>Email</span><strong>${studentUser.email}</strong></div>
                <div class="profile-fact"><span>Student ID</span><strong>${studentUser.studentId}</strong></div>
                <div class="profile-fact"><span>Total Orders</span><strong>${studentOrders.length}</strong></div>
                <div class="profile-fact"><span>Ready for Pickup</span><strong>${readyOrders}</strong></div>
                <div class="profile-fact"><span>Total Spent</span><strong>${formatCurrency(totalSpent)}</strong></div>
                <div class="profile-fact"><span>Copies Requested</span><strong>${totalCopies}</strong></div>
            </div>
        </div>
    </div>`;
