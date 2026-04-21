import sqlite3, random, string
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash

DATABASE = 'ocean_guard.db'

def get_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection(); c = conn.cursor()
    c.executescript('''
        CREATE TABLE IF NOT EXISTS boats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            boat_id TEXT UNIQUE NOT NULL, village TEXT NOT NULL,
            lat REAL NOT NULL, lng REAL NOT NULL,
            risk_score INTEGER DEFAULT 50, status TEXT DEFAULT 'warning',
            plastic_dumped REAL DEFAULT 0, plastic_collected REAL DEFAULT 0,
            transmission_type TEXT DEFAULT 'AIS',
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP);

        CREATE TABLE IF NOT EXISTS dumping_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            boat_id TEXT NOT NULL, lat REAL NOT NULL, lng REAL NOT NULL,
            risk_score INTEGER NOT NULL, plastic_kg REAL NOT NULL,
            detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);

        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            boat_id TEXT, reporter_name TEXT NOT NULL,
            location TEXT NOT NULL, description TEXT NOT NULL,
            status TEXT DEFAULT 'pending', reward_status TEXT DEFAULT 'pending',
            lat REAL, lng REAL,
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);

        CREATE TABLE IF NOT EXISTS patrols (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patrol_id TEXT UNIQUE NOT NULL, assigned_area TEXT NOT NULL,
            boats_assigned INTEGER DEFAULT 0, status TEXT DEFAULT 'active',
            officer_name TEXT,
            deployed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);

        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY,
            reward_per_kg INTEGER DEFAULT 20,
            high_risk_threshold INTEGER DEFAULT 71,
            medium_risk_threshold INTEGER DEFAULT 40,
            email_alerts INTEGER DEFAULT 1, sms_alerts INTEGER DEFAULT 1,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);

        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL);
    ''')

    # Insert hashed admin users
    for username, password, role in [('admin', 'admin123', 'admin'), ('fisheries', 'fisheries123', 'fisher')]:
        c.execute("SELECT id FROM users WHERE username=?", (username,))
        if not c.fetchone():
            c.execute("INSERT INTO users (username, password_hash, role) VALUES (?,?,?)",
                      (username, generate_password_hash(password), role))

    c.execute("INSERT OR IGNORE INTO settings (id) VALUES (1)")
    conn.commit(); conn.close()
    print("[OK] Database initialized")

def verify_user(username, password):
    conn = get_connection(); c = conn.cursor()
    c.execute("SELECT password_hash, role FROM users WHERE username=?", (username,))
    row = c.fetchone(); conn.close()
    if row and check_password_hash(row['password_hash'], password):
        return row['role']
    return None

def generate_sample_data():
    conn = get_connection(); c = conn.cursor()
    c.execute("SELECT COUNT(*) as n FROM boats")
    if c.fetchone()['n'] > 0:
        conn.close(); print("[INFO] Sample data exists"); return

    villages = [
        {'name': 'Nagapattinam', 'lat': 10.7649, 'lng': 79.8428},
        {'name': 'Thoothukudi',  'lat': 8.7642,  'lng': 78.1348},
        {'name': 'Rameswaram',   'lat': 9.2876,  'lng': 79.3129},
        {'name': 'Kanyakumari',  'lat': 8.0883,  'lng': 77.5385},
        {'name': 'Mandapam',     'lat': 9.2833,  'lng': 79.1167}
    ]

    for i in range(35):
        v = random.choice(villages)
        risk = random.randint(10, 95)
        if risk > 70:
            status, pd, pc = 'high_risk', random.randint(15, 70), 0
        elif risk > 40:
            status, pd, pc = 'warning', random.randint(3, 20), 0
        else:
            pc = random.randint(8, 40)
            status, pd = 'safe', 0
        c.execute('''INSERT INTO boats (boat_id,village,lat,lng,risk_score,status,plastic_dumped,plastic_collected)
                     VALUES (?,?,?,?,?,?,?,?)''',
                  (f"TN-{v['name'][:3].upper()}{i+1:03d}", v['name'],
                   v['lat'] + random.uniform(-0.5, 0.5),
                   v['lng'] + random.uniform(-0.5, 0.5),
                   risk, status, pd, pc))

    reporters = ['Murugan K', 'Selvam R', 'Rajan P', 'Priya S', 'Arjun T', 'Deepa V']
    locations  = ['Off Tuticorin', 'Gulf of Mannar', 'Mandapam Reef', 'Kanyakumari Coast', 'Rameswaram Channel']
    for i in range(12):
        c.execute('''INSERT INTO reports (boat_id,reporter_name,location,description,status,reward_status)
                     VALUES (?,?,?,?,?,?)''',
                  (f"TN-NAG{i+1:03d}", random.choice(reporters), random.choice(locations),
                   f"Suspicious dumping activity observed at {random.choice(locations)}",
                   random.choice(['pending', 'verified', 'rejected']),
                   random.choice(['pending', 'distributed'])))

    patrol_areas = ['Tuticorin Zone', 'Gulf of Mannar', 'Mandapam Area', 'Kanyakumari Waters']
    officers     = ['Officer Vijay', 'Officer Priya', 'Officer Ravi', 'Officer Sheela']
    for i in range(4):
        c.execute('''INSERT INTO patrols (patrol_id,assigned_area,boats_assigned,status,officer_name)
                     VALUES (?,?,?,?,?)''',
                  (f"PATROL-{i+1:03d}", patrol_areas[i], random.randint(2, 5), 'active', officers[i]))

    conn.commit(); conn.close()
    print("[OK] Sample data generated")

# ── Boats ─────────────────────────────────────────────

def get_all_boats():
    conn = get_connection(); c = conn.cursor()
    c.execute("SELECT * FROM boats ORDER BY risk_score DESC")
    rows = [dict(r) for r in c.fetchall()]; conn.close(); return rows

def get_boats_by_status(status):
    conn = get_connection(); c = conn.cursor()
    c.execute("SELECT * FROM boats WHERE status=? ORDER BY risk_score DESC", (status,))
    rows = [dict(r) for r in c.fetchall()]; conn.close(); return rows

def get_top_risk_boats():
    conn = get_connection(); c = conn.cursor()
    c.execute("SELECT boat_id,village,risk_score,status,plastic_dumped FROM boats ORDER BY risk_score DESC LIMIT 10")
    rows = [dict(r) for r in c.fetchall()]; conn.close(); return rows

# ── Stats ─────────────────────────────────────────────

def get_dashboard_stats():
    conn = get_connection(); c = conn.cursor()
    def q(sql, *args):
        c.execute(sql, args); return c.fetchone()[0]
    stats = {
        'total_boats':      q("SELECT COUNT(*) FROM boats"),
        'high_risk_boats':  q("SELECT COUNT(*) FROM boats WHERE status='high_risk'"),
        'pending_reports':  q("SELECT COUNT(*) FROM reports WHERE status='pending'"),
        'active_patrols':   q("SELECT COUNT(*) FROM patrols WHERE status='active'"),
        'plastic_collected':int(q("SELECT COALESCE(SUM(plastic_collected),0) FROM boats")),
        'total_rewards':    int(q("SELECT COALESCE(SUM(plastic_collected)*20,0) FROM boats")),
    }
    conn.close(); return stats

def get_risk_distribution():
    conn = get_connection(); c = conn.cursor()
    def q(s): c.execute(s); return c.fetchone()[0]
    result = {
        'high':   q("SELECT COUNT(*) FROM boats WHERE status='high_risk'"),
        'medium': q("SELECT COUNT(*) FROM boats WHERE status='warning'"),
        'low':    q("SELECT COUNT(*) FROM boats WHERE status='safe'"),
    }
    conn.close(); return result

def get_dumping_trend():
    return [{'date': (datetime.now() - timedelta(days=6-i)).strftime('%Y-%m-%d'),
             'incidents': random.randint(2, 8)} for i in range(7)]

# ── Reports ───────────────────────────────────────────

def get_all_reports():
    conn = get_connection(); c = conn.cursor()
    c.execute("SELECT * FROM reports ORDER BY submitted_at DESC")
    rows = [dict(r) for r in c.fetchall()]; conn.close(); return rows

def update_report_status(report_id, status):
    conn = get_connection(); c = conn.cursor()
    c.execute("UPDATE reports SET status=? WHERE id=?", (status, report_id))
    conn.commit(); conn.close()

def verify_report(report_id):
    conn = get_connection(); c = conn.cursor()
    c.execute("UPDATE reports SET status='verified', reward_status='distributed' WHERE id=?", (report_id,))
    conn.commit(); conn.close()

# ── Patrols ───────────────────────────────────────────

def get_all_patrols():
    conn = get_connection(); c = conn.cursor()
    c.execute("SELECT * FROM patrols ORDER BY deployed_at DESC")
    rows = [dict(r) for r in c.fetchall()]; conn.close(); return rows

def deploy_patrol(area):
    conn = get_connection(); c = conn.cursor()
    c.execute("SELECT COUNT(*) as n FROM patrols"); n = c.fetchone()['n'] + 1
    officers = ['Officer Vijay', 'Officer Priya', 'Officer Ravi', 'Officer Sheela', 'Officer Kumar']
    c.execute("INSERT INTO patrols (patrol_id,assigned_area,boats_assigned,status,officer_name) VALUES (?,?,?,?,?)",
              (f"PATROL-{n:03d}", area, random.randint(2, 5), 'active', random.choice(officers)))
    conn.commit(); conn.close()

# ── Settings ──────────────────────────────────────────

def get_settings():
    conn = get_connection(); c = conn.cursor()
    c.execute("SELECT * FROM settings WHERE id=1")
    row = c.fetchone(); conn.close()
    return dict(row) if row else {}

def update_settings(reward_per_kg, high_threshold, medium_threshold, email_alerts, sms_alerts):
    conn = get_connection(); c = conn.cursor()
    c.execute('''UPDATE settings SET reward_per_kg=?,high_risk_threshold=?,medium_risk_threshold=?,
                 email_alerts=?,sms_alerts=? WHERE id=1''',
              (reward_per_kg, high_threshold, medium_threshold, email_alerts, sms_alerts))
    conn.commit(); conn.close()

# ── Fisher Portal ─────────────────────────────────────

def get_fisher_profile(fisher_id='FISH-001'):
    conn = get_connection(); c = conn.cursor()
    c.execute("SELECT COUNT(*) as n FROM reports WHERE reporter_name='Fisherman'")
    total = c.fetchone()['n']
    c.execute("SELECT COUNT(*) as n FROM reports WHERE reporter_name='Fisherman' AND status='verified'")
    verified = c.fetchone()['n']
    conn.close()
    return {'id': fisher_id, 'name': 'Muthu', 'village': 'Nagapattinam',
            'totalRewards': 1240, 'totalReports': total or 5,
            'verifiedReports': verified or 3, 'plasticCollected': 15,
            'monthPlastic': 15, 'monthRewards': 300}

def create_fisher_report(fisher_id, boat_id, location, latitude, longitude, description, incident_date):
    conn = get_connection(); c = conn.cursor()
    c.execute('''INSERT INTO reports (boat_id,reporter_name,location,description,status,reward_status,lat,lng,submitted_at)
                 VALUES (?,?,?,?,?,?,?,?,?)''',
              (boat_id, 'Fisherman', location, description, 'pending', 'pending', latitude, longitude, incident_date))
    conn.commit(); rid = c.lastrowid; conn.close()
    return {'status': 'success', 'report_id': f'REPORT-{rid:06d}',
            'message': 'Report submitted successfully!'}

def get_fisher_reports(fisher_id='FISH-001'):
    conn = get_connection(); c = conn.cursor()
    c.execute("SELECT * FROM reports WHERE reporter_name='Fisherman' ORDER BY submitted_at DESC")
    rows = []
    for r in c.fetchall():
        d = dict(r)
        if d['status'] == 'verified': d['reward'] = 500
        rows.append(d)
    conn.close(); return rows

def create_qr_bag_request(fisher_id):
    rid = f"QR-REQ-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    return {'status': 'success', 'request_id': rid,
            'message': f'QR bags requested! ID: {rid}. Delivery in 2-3 days.'}

def get_fisher_leaderboard():
    return {
        'topByRewards': [
            {'name': 'Muthu',  'village': 'Nagapattinam', 'totalRewards': 1240},
            {'name': 'Rajan',  'village': 'Thoothukudi',  'totalRewards': 1180},
            {'name': 'Selvam', 'village': 'Rameswaram',   'totalRewards': 980},
            {'name': 'Arjun',  'village': 'Mandapam',     'totalRewards': 820},
            {'name': 'Deepa',  'village': 'Kanyakumari',  'totalRewards': 750},
        ],
        'topByReports': [
            {'name': 'Selvam', 'village': 'Rameswaram',   'totalReports': 12},
            {'name': 'Priya',  'village': 'Kanyakumari',  'totalReports': 8},
            {'name': 'Rajan',  'village': 'Thoothukudi',  'totalReports': 7},
            {'name': 'Arjun',  'village': 'Mandapam',     'totalReports': 6},
            {'name': 'Muthu',  'village': 'Nagapattinam', 'totalReports': 5},
        ]
    }
