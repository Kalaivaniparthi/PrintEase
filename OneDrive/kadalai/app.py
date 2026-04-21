from flask import Flask, render_template, jsonify, request, session, redirect, url_for, send_from_directory
from flask_cors import CORS
import database
import json
import os

app = Flask(__name__, template_folder='templates', static_folder='static')
app.secret_key = os.environ.get('SECRET_KEY', 'og-dev-key-change-in-production')
CORS(app)

# Initialize database
database.init_db()
database.generate_sample_data()

# ============================================
# Authentication Routes
# ============================================

@app.route('/')
def index():
    return redirect(url_for('login'))

@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    role = database.verify_user(username, password)
    if role:
        session['logged_in'] = True
        session['user'] = role
        return jsonify({'role': role})
    return jsonify({'role': None, 'error': 'Invalid credentials'}), 401

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()
        role = database.verify_user(username, password)
        if role == 'admin':
            session['logged_in'] = True
            session['user'] = 'admin'
            return redirect(url_for('admin_dashboard'))
        elif role == 'fisher':
            session['logged_in'] = True
            session['user'] = 'fisher'
            return redirect(url_for('fisher_portal'))
        return render_template('index.html', error='Invalid username or password')
    return render_template('index.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

# ============================================
# Admin Dashboard Routes
# ============================================

@app.route('/admin')
def admin_dashboard():
    if not session.get('logged_in') or session.get('user') != 'admin':
        return redirect(url_for('login'))
    return render_template('admin_dashboard.html')

@app.route('/fisher')
def fisher_portal():
    if not session.get('logged_in') or session.get('user') != 'fisher':
        return redirect(url_for('login'))
    return render_template('fisher_portal.html')

# ============================================
# API Routes for Dashboard Data
# ============================================

@app.route('/api/dashboard/stats')
def api_dashboard_stats():
    """Get dashboard statistics"""
    stats = database.get_dashboard_stats()
    return jsonify(stats)

@app.route('/api/boats')
def api_boats():
    """Get all boats"""
    status = request.args.get('status', 'all')
    
    if status == 'all':
        boats = database.get_all_boats()
    else:
        boats = database.get_boats_by_status(status)
    
    return jsonify(boats)

@app.route('/api/charts/risk-distribution')
def api_risk_distribution():
    """Get risk distribution data"""
    data = database.get_risk_distribution()
    return jsonify({
        'labels': ['High Risk', 'Medium Risk', 'Low Risk'],
        'data': [data['high'], data['medium'], data['low']],
        'colors': ['#dc3544', '#ffc107', '#28a745']
    })

@app.route('/api/charts/dumping-trend')
def api_dumping_trend():
    """Get dumping trend data"""
    trend = database.get_dumping_trend()
    return jsonify({
        'labels': [item['date'] for item in trend],
        'data': [item['incidents'] for item in trend]
    })

@app.route('/api/boats/top-risk')
def api_top_risk_boats():
    """Get top 10 high-risk boats"""
    boats = database.get_top_risk_boats()
    return jsonify(boats)

@app.route('/api/reports')
def api_reports():
    """Get all community reports"""
    reports = database.get_all_reports()
    return jsonify(reports)

@app.route('/api/reports/<int:report_id>/verify', methods=['POST'])
def api_verify_report(report_id):
    """Verify a report and distribute reward"""
    database.verify_report(report_id)
    return jsonify({'status': 'success', 'message': 'Report verified and ₹500 reward distributed'})

@app.route('/api/reports/<int:report_id>/dismiss', methods=['POST'])
def api_dismiss_report(report_id):
    """Dismiss a report"""
    database.update_report_status(report_id, 'rejected')
    return jsonify({'status': 'success', 'message': 'Report dismissed'})

@app.route('/api/patrols')
def api_patrols():
    """Get all patrols"""
    patrols = database.get_all_patrols()
    return jsonify(patrols)

@app.route('/api/patrols/deploy', methods=['POST'])
def api_deploy_patrol():
    """Deploy a new patrol"""
    data = request.get_json()
    area = data.get('area', 'General Area')
    database.deploy_patrol(area)
    return jsonify({'status': 'success', 'message': f'Patrol deployed to {area}'})

@app.route('/api/settings')
def api_get_settings():
    """Get application settings"""
    settings = database.get_settings()
    return jsonify(settings)

@app.route('/api/settings', methods=['POST'])
def api_update_settings():
    """Update application settings"""
    data = request.get_json()
    database.update_settings(
        data.get('reward_per_kg', 20),
        data.get('high_threshold', 71),
        data.get('medium_threshold', 40),
        data.get('email_alerts', 1),
        data.get('sms_alerts', 1)
    )
    return jsonify({'status': 'success', 'message': 'Settings updated'})

@app.route('/api/analysis/run', methods=['POST'])
def api_run_analysis():
    """Run AI analysis (simulated)"""
    # In production, this would run actual ML models
    return jsonify({
        'status': 'success',
        'message': 'AI analysis completed',
        'timestamp': __import__('datetime').datetime.now().isoformat(),
        'insights': [
            'High concentration of dumping in Tuticorin area',
            'Risk scores trending upward in Gulf of Mannar',
            'Community reports increasing by 15% this week'
        ]
    })

# ============================================
# FISHER PORTAL API ROUTES
# ============================================

@app.route('/api/fisher/profile')
def api_fisher_profile():
    """Get fisher profile"""
    if not session.get('logged_in') or session.get('user') != 'fisher':
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 401
    
    fisher_id = session.get('fisher_id', 'FISH-001')
    profile = database.get_fisher_profile(fisher_id)
    return jsonify(profile)

@app.route('/api/fisher/report', methods=['POST'])
def api_create_fisher_report():
    """Create a new fisher report"""
    if not session.get('logged_in') or session.get('user') != 'fisher':
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 401
    
    data = request.get_json()
    fisher_id = session.get('fisher_id', 'FISH-001')
    
    result = database.create_fisher_report(
        fisher_id=fisher_id,
        boat_id=data.get('boatId'),
        location=data.get('location'),
        latitude=data.get('latitude'),
        longitude=data.get('longitude'),
        description=data.get('description'),
        incident_date=data.get('incidentDate')
    )
    
    return jsonify(result)

@app.route('/api/fisher/reports')
def api_fisher_reports():
    """Get fisher's reports"""
    if not session.get('logged_in') or session.get('user') != 'fisher':
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 401
    
    fisher_id = session.get('fisher_id', 'FISH-001')
    reports = database.get_fisher_reports(fisher_id)
    return jsonify(reports)

@app.route('/api/fisher/qr-bags/request', methods=['POST'])
def api_request_qr_bags():
    """Request QR bags for plastic collection"""
    if not session.get('logged_in') or session.get('user') != 'fisher':
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 401
    
    fisher_id = session.get('fisher_id', 'FISH-001')
    result = database.create_qr_bag_request(fisher_id)
    return jsonify(result)

@app.route('/api/fisher/leaderboard')
def api_fisher_leaderboard():
    """Get fisher leaderboard data"""
    leaderboard = database.get_fisher_leaderboard()
    return jsonify(leaderboard)

if __name__ == '__main__':
    print("=" * 60)
    print("🌊 OCEAN GUARD - Admin Dashboard")
    print("=" * 60)
    print("Server: http://localhost:5000")
    print("Admin: admin / admin123")
    print("Fisher: fisheries / fisheries123")
    print("=" * 60)
    app.run(debug=True, host='0.0.0.0', port=5000)

