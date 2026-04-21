// ============================================
// OCEAN GUARD - Admin Dashboard JavaScript
// ============================================

let map = null;
let boatMarkers = [];
let dumpingZones = [];
let riskChart = null;
let trendChart = null;

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🌊 Ocean Guard Admin Dashboard initialized');
    loadDashboardStats();
    initializeCharts();
    loadMapData();
    loadReportsData();
    loadPatrolsData();
    loadTopRiskBoats();
});

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
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionName + '-section').classList.add('active');

    // Initialize map if needed
    if (sectionName === 'map' && !map) {
        setTimeout(() => initializeMap(), 100);
    }
}

// ============================================
// DASHBOARD STATISTICS
// ============================================

function loadDashboardStats() {
    fetch('/api/dashboard/stats')
        .then(response => response.json())
        .then(data => {
            document.querySelector('[data-stat="total_boats"]').textContent = data.total_boats;
            document.querySelector('[data-stat="high_risk_boats"]').textContent = data.high_risk_boats;
            document.querySelector('[data-stat="pending_reports"]').textContent = data.pending_reports;
            document.querySelector('[data-stat="active_patrols"]').textContent = data.active_patrols;
            document.querySelector('[data-stat="total_rewards"]').textContent = '₹' + data.total_rewards.toLocaleString();
            document.querySelector('[data-stat="plastic_collected"]').textContent = data.plastic_collected + ' kg';
        })
        .catch(error => console.error('Error loading stats:', error));
}

// ============================================
// CHARTS INITIALIZATION
// ============================================

function initializeCharts() {
    loadRiskDistributionChart();
    loadDumpingTrendChart();
}

function loadRiskDistributionChart() {
    fetch('/api/charts/risk-distribution')
        .then(response => response.json())
        .then(data => {
            const ctx = document.getElementById('riskChart');
            if (riskChart) riskChart.destroy();
            
            riskChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: data.labels,
                    datasets: [{
                        data: data.data,
                        backgroundColor: data.colors,
                        borderColor: 'white',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        });
}

function loadDumpingTrendChart() {
    fetch('/api/charts/dumping-trend')
        .then(response => response.json())
        .then(data => {
            const ctx = document.getElementById('trendChart');
            if (trendChart) trendChart.destroy();
            
            trendChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: 'Dumping Incidents',
                        data: data.data,
                        borderColor: '#ff6b6b',
                        backgroundColor: 'rgba(255, 107, 107, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            labels: {
                                usePointStyle: true
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 10
                        }
                    }
                }
            });
        });
}

// ============================================
// MAP FUNCTIONALITY
// ============================================

function initializeMap() {
    if (map) return;

    // Initialize Leaflet map
    map = L.map('liveMap').setView([9.0, 79.0], 8);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    // Add dumping zones
    addDumpingZones();
    
    // Load and add boats
    loadboatMarkers();
}

function addDumpingZones() {
    const zones = [
        { name: 'Tuticorin Offshore', lat: 8.95, lng: 78.55 },
        { name: 'Gulf of Mannar Core', lat: 9.45, lng: 79.65 },
        { name: 'Mandapam Reef', lat: 9.35, lng: 79.40 },
        { name: 'Kanyakumari Waters', lat: 8.65, lng: 78.30 },
        { name: 'Nagai Basin', lat: 10.65, lng: 80.30 }
    ];

    zones.forEach(zone => {
        L.circle([zone.lat, zone.lng], {
            color: '#dc3544',
            fillColor: '#dc3544',
            fillOpacity: 0.2,
            radius: 15000,
            weight: 2,
            popup: `⚠️ ${zone.name} - High Risk Zone`
        }).addTo(map);
    });
}

function loadboatMarkers() {
    const status = document.getElementById('riskFilter')?.value || 'all';
    
    // Clear existing markers
    boatMarkers.forEach(marker => map.removeLayer(marker));
    boatMarkers = [];

    fetch(`/api/boats?status=${status}`)
        .then(response => response.json())
        .then(boats => {
            boats.forEach(boat => {
                const color = boat.status === 'high_risk' ? '#dc3544' : 
                             boat.status === 'warning' ? '#ffc107' : '#28a745';
                
                const icon = L.icon({
                    iconUrl: `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='${color}' d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z'/></svg>`,
                    iconSize: [30, 30],
                    popupAnchor: [0, -15]
                });

                const marker = L.marker([boat.lat, boat.lng], { icon })
                    .bindPopup(`
                        <div style="width: 250px;">
                            <strong>Boat ID:</strong> ${boat.boat_id}<br>
                            <strong>Village:</strong> ${boat.village}<br>
                            <strong>Risk Score:</strong> ${boat.risk_score}%<br>
                            <strong>Status:</strong> <span style="color: ${color}; font-weight: bold;">${boat.status.toUpperCase()}</span><br>
                            <strong>Plastic Dumped:</strong> ${boat.plastic_dumped} kg<br>
                            <strong>Plastic Collected:</strong> ${boat.plastic_collected} kg<br>
                            <button onclick="deployPatrolForBoat('${boat.boat_id}')">Deploy Patrol</button>
                        </div>
                    `)
                    .addTo(map);
                
                boatMarkers.push(marker);
            });
        });
}

function filterBoats() {
    if (map) {
        loadboatMarkers();
    }
}

// ============================================
// TOP RISK BOATS
// ============================================

function loadTopRiskBoats() {
    fetch('/api/boats/top-risk')
        .then(response => response.json())
        .then(boats => {
            const tbody = document.getElementById('topRiskTable');
            tbody.innerHTML = '';

            boats.forEach(boat => {
                const row = document.createElement('tr');
                const statusClass = boat.status === 'high_risk' ? 'status-high-risk' : 'status-warning';
                
                row.innerHTML = `
                    <td><strong>${boat.boat_id}</strong></td>
                    <td>${boat.village}</td>
                    <td><strong>${boat.risk_score}%</strong></td>
                    <td><span class="status-badge ${statusClass}">${boat.status.toUpperCase()}</span></td>
                    <td>${boat.plastic_dumped}</td>
                    <td>
                        <button class="btn btn-danger btn-sm" onclick="deployPatrolForBoat('${boat.boat_id}')">
                            Deploy Patrol
                        </button>
                    </td>
                `;
                
                tbody.appendChild(row);
            });
        });
}

// ============================================
// REPORTS MANAGEMENT
// ============================================

function loadReportsData() {
    fetch('/api/reports')
        .then(response => response.json())
        .then(reports => {
            const tbody = document.getElementById('reportsTable');
            tbody.innerHTML = '';

            reports.forEach(report => {
                const row = document.createElement('tr');
                const statusClass = report.status === 'verified' ? 'status-verified' : 
                                   report.status === 'rejected' ? 'status-danger' : 'status-pending';
                
                row.innerHTML = `
                    <td>#${report.id}</td>
                    <td>${report.reporter_name}</td>
                    <td>${report.location}</td>
                    <td>${report.description.substring(0, 30)}...</td>
                    <td><span class="status-badge ${statusClass}">${report.status.toUpperCase()}</span></td>
                    <td><span class="status-badge ${report.reward_status === 'distributed' ? 'status-verified' : 'status-pending'}">${report.reward_status.toUpperCase()}</span></td>
                    <td>${new Date(report.submitted_at).toLocaleDateString()}</td>
                    <td>
                        ${report.status === 'pending' ? `
                            <div class="action-buttons">
                                <button class="btn btn-success btn-sm" onclick="verifyReport(${report.id})">Verify</button>
                                <button class="btn btn-danger btn-sm" onclick="dismissReport(${report.id})">Dismiss</button>
                            </div>
                        ` : '-'}
                    </td>
                `;
                
                tbody.appendChild(row);
            });
        });
}

function verifyReport(reportId) {
    fetch(`/api/reports/${reportId}/verify`, { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            showNotification(data.message, 'success');
            loadReportsData();
            loadDashboardStats();
        });
}

function dismissReport(reportId) {
    fetch(`/api/reports/${reportId}/dismiss`, { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            showNotification(data.message, 'success');
            loadReportsData();
        });
}

// ============================================
// PATROL MANAGEMENT
// ============================================

function loadPatrolsData() {
    fetch('/api/patrols')
        .then(response => response.json())
        .then(patrols => {
            const tbody = document.getElementById('patrolsTable');
            tbody.innerHTML = '';

            patrols.forEach(patrol => {
                const row = document.createElement('tr');
                
                row.innerHTML = `
                    <td><strong>${patrol.patrol_id}</strong></td>
                    <td>${patrol.assigned_area}</td>
                    <td>${patrol.boats_assigned}</td>
                    <td>${patrol.officer_name}</td>
                    <td><span class="status-badge status-verified">${patrol.status.toUpperCase()}</span></td>
                    <td>${new Date(patrol.deployed_at).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-primary btn-sm" onclick="editPatrol(${patrol.id})">Details</button>
                    </td>
                `;
                
                tbody.appendChild(row);
            });
        });
}

function deployPatrolForBoat(boatId) {
    showNotification(`Patrol deployment for ${boatId} initiated`, 'info');
}

function showDeployPatrolModal() {
    document.getElementById('deployPatrolModal').classList.add('show');
}

function closeDeployPatrolModal() {
    document.getElementById('deployPatrolModal').classList.remove('show');
}

function deployPatrol(e) {
    e.preventDefault();
    
    const area = document.getElementById('patrolArea').value;
    
    if (!area) {
        showNotification('Please select an area', 'error');
        return;
    }

    fetch('/api/patrols/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ area })
    })
    .then(response => response.json())
    .then(data => {
        showNotification(data.message, 'success');
        closeDeployPatrolModal();
        loadPatrolsData();
        loadDashboardStats();
    });
}

// ============================================
// AI ANALYSIS
// ============================================

function runAnalysis() {
    fetch('/api/analysis/run', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            showNotification(data.message, 'success');
            
            const insightsList = document.getElementById('insightsList');
            insightsList.innerHTML = '';
            
            data.insights.forEach(insight => {
                const div = document.createElement('div');
                div.className = 'insight-item';
                div.innerHTML = `<i class="fas fa-lightbulb"></i> ${insight}`;
                insightsList.appendChild(div);
            });

            // Refresh charts
            loadRiskDistributionChart();
            loadDumpingTrendChart();
            loadTopRiskBoats();
        });
}

// ============================================
// SETTINGS
// ============================================

function saveAllSettings() {
    const settings = {
        reward_per_kg: parseInt(document.getElementById('rewardPerKg').value),
        high_threshold: parseInt(document.getElementById('highThreshold').value),
        medium_threshold: parseInt(document.getElementById('mediumThreshold').value),
        email_alerts: document.getElementById('emailAlerts').checked ? 1 : 0,
        sms_alerts: document.getElementById('smsAlerts').checked ? 1 : 0
    };

    fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
    })
    .then(response => response.json())
    .then(data => {
        showNotification(data.message, 'success');
        loadDashboardStats();
    });
}

// ============================================
// UTILITY FUNCTIONS
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
        z-index: 2000;
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

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar-nav');
    sidebar.classList.toggle('show');
}

// Close modals when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('deployPatrolModal');
    if (event.target === modal) {
        closeDeployPatrolModal();
    }
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

console.log('✅ Admin Dashboard JavaScript loaded successfully');
