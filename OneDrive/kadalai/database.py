# ============================================
# KADALAI - Database Layer
# Stores all boats, events, rewards
# ============================================

import sqlite3
import random
from datetime import datetime

DATABASE = 'kadalai.db'

def init_db():
    """Initialize database with all tables"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Boats table - stores all fishing boats
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS boats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            boat_id TEXT UNIQUE NOT NULL,
            village TEXT NOT NULL,
            lat REAL,
            lng REAL,
            risk_score INTEGER,
            status TEXT,
            plastic_dumped INTEGER DEFAULT 0,
            plastic_collected INTEGER DEFAULT 0,
            reward INTEGER DEFAULT 0,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Dumping events table - records every detection
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS dumping_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            boat_id TEXT,
            lat REAL,
            lng REAL,
            risk_score INTEGER,
            plastic_kg INTEGER,
            detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (boat_id) REFERENCES boats(boat_id)
        )
    ''')
    
    # Rewards table - tracks payments to fishermen
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS rewards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            boat_id TEXT,
            plastic_kg INTEGER,
            amount INTEGER,
            rewarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (boat_id) REFERENCES boats(boat_id)
        )
    ''')
    
    # Users table - for admin login
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'user'
        )
    ''')
    
    # Insert default admin user
    cursor.execute("SELECT * FROM users WHERE username = 'admin'")
    if not cursor.fetchone():
        cursor.execute("INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
                      ('admin', 'admin123', 'admin'))
    
    conn.commit()
    conn.close()
    print("✅ Database initialized!")

def get_all_boats():
    """Get all boats from database"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM boats ORDER BY risk_score DESC")
    boats = cursor.fetchall()
    conn.close()
    return boats

def add_boat(boat_id, village, lat, lng, risk_score, status, plastic_dumped=0, plastic_collected=0, reward=0):
    """Add or update a boat"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT OR REPLACE INTO boats (boat_id, village, lat, lng, risk_score, status, plastic_dumped, plastic_collected, reward)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (boat_id, village, lat, lng, risk_score, status, plastic_dumped, plastic_collected, reward))
    conn.commit()
    conn.close()

def add_dumping_event(boat_id, lat, lng, risk_score, plastic_kg):
    """Record a dumping event"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO dumping_events (boat_id, lat, lng, risk_score, plastic_kg)
        VALUES (?, ?, ?, ?, ?)
    ''', (boat_id, lat, lng, risk_score, plastic_kg))
    conn.commit()
    conn.close()

def add_reward(boat_id, plastic_kg, amount):
    """Record a reward payment and update boat stats"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO rewards (boat_id, plastic_kg, amount)
        VALUES (?, ?, ?)
    ''', (boat_id, plastic_kg, amount))
    
    # Update boat's collected plastic and reward
    cursor.execute('''
        UPDATE boats 
        SET plastic_collected = plastic_collected + ?, reward = reward + ?
        WHERE boat_id = ?
    ''', (plastic_kg, amount, boat_id))
    
    conn.commit()
    conn.close()

def get_dashboard_stats():
    """Get statistics for dashboard"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM boats")
    total_boats = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM boats WHERE status = 'dumping'")
    dumping_boats = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM boats WHERE status = 'warning'")
    warning_boats = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM boats WHERE status = 'clean'")
    clean_boats = cursor.fetchone()[0]
    
    cursor.execute("SELECT SUM(reward) FROM boats")
    total_rewards = cursor.fetchone()[0] or 0
    
    cursor.execute("SELECT SUM(plastic_collected) FROM boats")
    plastic_collected = cursor.fetchone()[0] or 0
    
    cursor.execute("SELECT SUM(plastic_dumped) FROM boats")
    plastic_dumped = cursor.fetchone()[0] or 0
    
    conn.close()
    
    return {
        'total_boats': total_boats,
        'dumping_boats': dumping_boats,
        'warning_boats': warning_boats,
        'clean_boats': clean_boats,
        'total_rewards': total_rewards,
        'plastic_collected': plastic_collected,
        'plastic_dumped': plastic_dumped,
        'animals_saved': int(plastic_collected / 2)
    }

def get_recent_dumping_events(limit=10):
    """Get recent dumping events"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM dumping_events 
        ORDER BY detected_at DESC LIMIT ?
    ''', (limit,))
    events = cursor.fetchall()
    conn.close()
    return events

def get_reward_history(limit=10):
    """Get reward payment history"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM rewards 
        ORDER BY rewarded_at DESC LIMIT ?
    ''', (limit,))
    rewards = cursor.fetchall()
    conn.close()
    return rewards

def generate_sample_data():
    """Generate sample boat data for demo"""
    villages = ['Nagapattinam', 'Thoothukudi', 'Rameswaram', 'Kanyakumari', 'Mandapam']
    
    # Check if boats already exist
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM boats")
    count = cursor.fetchone()[0]
    conn.close()
    
    if count > 0:
        print("Sample data already exists")
        return
    
    for i in range(30):
        village = random.choice(villages)
        boat_id = f"TN-{village[:3]}{i+1:03d}"
        lat = 8.5 + random.random() * 2.5
        lng = 78.0 + random.random() * 2.5
        risk_score = random.randint(10, 95)
        
        if risk_score > 70:
            status = 'dumping'
            plastic_dumped = random.randint(15, 70)
            plastic_collected = 0
            reward = 0
        elif risk_score > 40:
            status = 'warning'
            plastic_dumped = random.randint(3, 20)
            plastic_collected = 0
            reward = 0
        else:
            status = 'clean'
            plastic_dumped = 0
            plastic_collected = random.randint(8, 40)
            reward = plastic_collected * 20
        
        add_boat(boat_id, village, lat, lng, risk_score, status, plastic_dumped, plastic_collected, reward)
    
    print("✅ Sample data generated!")

if __name__ == '__main__':
    init_db()
    generate_sample_data()
    print("✅ Database ready!")