// ============================================
// OCEAN GUARD - Fisher Portal JavaScript
// ============================================

let map = null;
let fisherData = {
    id: 'FISH-001',
    name: 'Muthu',
    village: 'Nagapattinam',
    totalRewards: 1240,
    totalReports: 5,
    verifiedReports: 3,
    plasticCollected: 15,
    monthPlastic: 15,
    monthRewards: 300
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🌊 Fisher Portal initialized');
    
    // Load fisher data
    loadFisherDashboard();
    loadFisherReports();
    loadLeaderboard();
    
    // Set default date/time to now
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('incidentDate').value = now.toISOString().slice(0, 16);
});

// ============================================
// DASHBOARD
// ============================================

function loadFisherDashboard() {
    fetch('/api/fisher/profile')
        .then(response => response.json())
        .then(data => {
            fisherData = data;
            // Update UI with fisher data
            document.getElementById('fisherName').textContent = data.name;
            document.getElementById('fisherVillage').textContent = data.village;
            document.getElementById('userName').textContent = `Welcome, ${data.name}!`;
            document.getElementById('totalRewards').textContent = data.totalRewards.toLocaleString();
            document.getElementById('totalReports').textContent = data.totalReports;
            document.getElementById('verifiedReports').textContent = data.verifiedReports;
            document.getElementById('plasticCollected').textContent = data.plasticCollected;
            document.getElementById('monthPlastic').textContent = data.monthPlastic;
            document.getElementById('monthRewards').textContent = data.monthRewards;
        })
        .catch(error => console.error('Error loading fisher profile:', error));
}

// ============================================
// SECTION NAVIGATION
// ============================================

function switchSection(sectionName, event) {
    if (event) event.preventDefault();

    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.nav-item').classList.add('active');

    // Update content
    document.querySelectorAll('.fisher-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionName + '-section').classList.add('active');

    // Initialize map if needed
    if (sectionName === 'map' && !map) {
        setTimeout(() => initializeMap(), 100);
    }
}

// ============================================
// REPORT DUMPING
// ============================================

function submitReport(e) {
    e.preventDefault();

    const boatId = document.getElementById('boatId').value.trim();
    const latitude = parseFloat(document.getElementById('latitude').value);
    const longitude = parseFloat(document.getElementById('longitude').value);
    const location = document.getElementById('location').value;
    const incidentDate = document.getElementById('incidentDate').value;
    const description = document.getElementById('description').value.trim();

    // Validation
    if (!boatId || !latitude || !longitude || !location || !incidentDate || !description) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    const reportData = {
        boatId: boatId,
        latitude: latitude,
        longitude: longitude,
        location: location,
        incidentDate: incidentDate,
        description: description
    };

    // Submit report to backend
    fetch('/api/fisher/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            // Show success modal
            document.getElementById('modalTitle').textContent = 'Report Submitted Successfully!';
            document.getElementById('modalMessage').textContent = 'Your dumping report has been submitted and will be reviewed by our team.';
            document.getElementById('referenceId').textContent = data.report_id;
            showModal();

            // Reset form
            document.getElementById('reportForm').reset();

            // Reload reports table after delay
            setTimeout(() => {
                loadFisherReports();
                document.querySelectorAll('.fisher-section').forEach(s => s.classList.remove('active'));
                document.getElementById('my-reports-section').classList.add('active');
                document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                document.querySelector('.nav-item[onclick*="my-reports"]').classList.add('active');
            }, 2000);
        } else {
            showNotification('Error submitting report: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error submitting report', 'error');
    });
}

// ============================================
// FISHER REPORTS
// ============================================

function loadFisherReports() {
    fetch('/api/fisher/reports')
        .then(response => response.json())
        .then(reports => {
            const tbody = document.getElementById('reportsTableBody');
            tbody.innerHTML = '';

            if (reports.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="loading">No reports filed yet</td></tr>';
                return;
            }

            reports.forEach(report => {
                const row = document.createElement('tr');
                const statusClass = report.status === 'verified' ? 'status-verified' : 
                                   report.status === 'rejected' ? 'status-rejected' : 'status-pending';
                
                const rewardContent = report.status === 'verified' 
                    ? `<span class="status-badge reward-badge">₹${report.reward || 500} Claimed</span>`
                    : '-';
                
                row.innerHTML = `
                    <td>#${report.id}</td>
                    <td>${report.boat_id}</td>
                    <td>${report.location}</td>
                    <td>${new Date(report.submitted_at).toLocaleDateString()}</td>
                    <td><span class="status-badge ${statusClass}">${report.status.toUpperCase()}</span></td>
                    <td>${rewardContent}</td>
                    <td>
                        <button class="action-link" onclick="viewReportDetails(${report.id})">View</button>
                    </td>
                `;
                
                tbody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error loading reports:', error);
            document.getElementById('reportsTableBody').innerHTML = 
                '<tr><td colspan="7" class="loading">Error loading reports</td></tr>';
        });
}

function viewReportDetails(reportId) {
    showNotification(`Viewing details for Report #${reportId}`, 'info');
}

// ============================================
// QR REWARDS
// ============================================

function requestQRBags() {
    fetch('/api/fisher/qr-bags/request', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                document.getElementById('modalTitle').textContent = 'QR Bags Requested!';
                document.getElementById('modalMessage').textContent = data.message;
                document.getElementById('referenceId').textContent = data.request_id;
                showModal();
            } else {
                showNotification('Error requesting bags: ' + data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error requesting QR bags', 'error');
        });
}

// ============================================
// MAP
// ============================================

function initializeMap() {
    if (map) return;

    // Initialize Leaflet map - centered on Nagapattinam (default fisherman village)
    map = L.map('fisherMap').setView([9.83, 79.84], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    // Add fisherman's location
    const fishermanLocation = [9.83, 79.84];
    L.circleMarker(fishermanLocation, {
        radius: 10,
        fillColor: '#00d9d9',
        color: '#00d9d9',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
    }).addTo(map).bindPopup('<strong>Your Location</strong><br>Nagapattinam Harbor');

    // Add recent dumping reports
    const dumpingReports = [
        { lat: 9.88, lng: 79.80, boat: 'TN-2024-001', level: 'high' },
        { lat: 9.78, lng: 79.90, boat: 'TN-2024-015', level: 'medium' },
        { lat: 9.85, lng: 79.75, boat: 'TN-2024-008', level: 'high' }
    ];

    dumpingReports.forEach(report => {
        const color = report.level === 'high' ? '#ff6b6b' : '#ffc107';
        L.circleMarker([report.lat, report.lng], {
            radius: 8,
            fillColor: color,
            color: color,
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(map).bindPopup(`<strong>Dumping Report</strong><br>Boat: ${report.boat}<br>Risk Level: ${report.level.toUpperCase()}`);
    });

    // Add safe fishing zones
    const safeZones = [
        { lat: 9.75, lng: 79.70, name: 'Zone A' },
        { lat: 9.95, lng: 79.95, name: 'Zone B' }
    ];

    safeZones.forEach(zone => {
        L.circle([zone.lat, zone.lng], {
            radius: 8000,
            color: '#28a745',
            fillColor: '#28a745',
            fillOpacity: 0.2,
            weight: 2
        }).addTo(map).bindPopup(`<strong>Safe Fishing Zone</strong><br>${zone.name}`);
    });

    // Resize map after adding content
    setTimeout(() => map.invalidateSize(), 100);
}

// ============================================
// LEADERBOARD
// ============================================

function loadLeaderboard() {
    fetch('/api/fisher/leaderboard')
        .then(response => response.json())
        .then(data => {
            // Rewards leaderboard
            const rewardsTbody = document.getElementById('rewardsLeaderboard');
            rewardsTbody.innerHTML = '';
            data.topByRewards.forEach((fisher, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${fisher.name}</td>
                    <td>${fisher.village}</td>
                    <td>₹${fisher.totalRewards.toLocaleString()}</td>
                `;
                rewardsTbody.appendChild(row);
            });

            // Reports leaderboard
            const reportsTbody = document.getElementById('reportsLeaderboard');
            reportsTbody.innerHTML = '';
            data.topByReports.forEach((fisher, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${fisher.name}</td>
                    <td>${fisher.village}</td>
                    <td>${fisher.totalReports}</td>
                `;
                reportsTbody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error loading leaderboard:', error);
            document.getElementById('rewardsLeaderboard').innerHTML = 
                '<tr><td colspan="4" class="loading">Error loading leaderboard</td></tr>';
            document.getElementById('reportsLeaderboard').innerHTML = 
                '<tr><td colspan="4" class="loading">Error loading leaderboard</td></tr>';
        });
}

// ============================================
// MODAL
// ============================================

function showModal() {
    document.getElementById('successModal').classList.add('show');
}

function closeModal() {
    document.getElementById('successModal').classList.remove('show');
}

window.onclick = function(event) {
    const modal = document.getElementById('successModal');
    if (event.target === modal) {
        closeModal();
    }
}

// ============================================
// SIDEBAR TOGGLE
// ============================================

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar-nav');
    sidebar.classList.toggle('show');
}

// ============================================
// NOTIFICATIONS
// ============================================

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 8px;
        font-weight: 600;
        z-index: 3000;
        animation: slideInRight 0.3s ease;
        ${type === 'success' ? 'background: #28a745; color: white;' : 
          type === 'error' ? 'background: #dc3544; color: white;' : 
          'background: #0066cc; color: white;'}
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
`;
document.head.appendChild(style);

console.log('✅ Fisher Portal JavaScript loaded successfully');
