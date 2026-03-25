# ============================================
# KADALAI - Flask Backend Server
# API endpoints for map and dashboard
# ============================================

from flask import Flask, render_template, jsonify, request, redirect, url_for, session
from flask_cors import CORS
import database

app = Flask(__name__)
app.secret_key = 'kadalai_secret_key_2024'
CORS(app)

# Initialize database on startup
database.init_db()
database.generate_sample_data()

print("="*60)
print("🌊 KADALAI BACKEND SERVER")
print("="*60)
print("Server running at: http://localhost:5000")
print("Admin panel: http://localhost:5000/admin")
print("Login: admin / admin123")
print("="*60)

# ============================================
# PAGE ROUTES
# ============================================

@app.route('/')
def index():
    """Main map page"""
    return render_template('index.html')

@app.route('/admin')
def admin():
    """Admin dashboard"""
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    return render_template('admin.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    """Admin login page"""
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        if username == 'admin' and password == 'admin123':
            session['logged_in'] = True
            return redirect(url_for('admin'))
        else:
            return "<h3>Invalid credentials! <a href='/login'>Try again</a></h3>", 401
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    """Logout"""
    session.pop('logged_in', None)
    return redirect(url_for('index'))

# ============================================
# API ENDPOINTS
# ============================================

@app.route('/api/stats')
def api_stats():
    """Get dashboard statistics"""
    return jsonify(database.get_dashboard_stats())

@app.route('/api/boats')
def api_boats():
    """Get all boats"""
    boats = database.get_all_boats()
    boat_list = []
    for boat in boats:
        boat_list.append({
            'id': boat[1],
            'village': boat[2],
            'lat': boat[3],
            'lng': boat[4],
            'risk_score': boat[5],
            'status': boat[6],
            'plastic_dumped': boat[7],
            'plastic_collected': boat[8],
            'reward': boat[9]
        })
    return jsonify(boat_list)

@app.route('/api/dumping-events')
def api_dumping_events():
    """Get recent dumping events"""
    events = database.get_recent_dumping_events()
    event_list = []
    for event in events:
        event_list.append({
            'id': event[0],
            'boat_id': event[1],
            'lat': event[2],
            'lng': event[3],
            'risk_score': event[4],
            'plastic_kg': event[5],
            'detected_at': event[6]
        })
    return jsonify(event_list)

@app.route('/api/rewards')
def api_rewards():
    """Get reward history"""
    rewards = database.get_reward_history()
    reward_list = []
    for reward in rewards:
        reward_list.append({
            'id': reward[0],
            'boat_id': reward[1],
            'plastic_kg': reward[2],
            'amount': reward[3],
            'rewarded_at': reward[4]
        })
    return jsonify(reward_list)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)