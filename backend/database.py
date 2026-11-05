import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "smartvend.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Products table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS products (
        product_id TEXT PRIMARY KEY,
        product_name TEXT NOT NULL,
        price REAL NOT NULL,
        category TEXT NOT NULL,
        slot_id INTEGER UNIQUE NOT NULL,
        image_url TEXT,
        description TEXT
    )
    """)

    # 2. Inventory table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS inventory (
        product_id TEXT PRIMARY KEY,
        initial_stock INTEGER NOT NULL,
        current_stock INTEGER NOT NULL,
        min_stock INTEGER NOT NULL DEFAULT 3,
        updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(product_id)
    )
    """)

    # 3. Sales table (with unique event_id to prevent duplicates)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sales (
        sale_id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id TEXT UNIQUE NOT NULL,
        machine_id TEXT NOT NULL,
        slot_id INTEGER NOT NULL,
        product_id TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price REAL NOT NULL,
        total_amount REAL NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        dispense_confirmed INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (product_id) REFERENCES products(product_id)
    )
    """)

    # 4. Device status table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS device_status (
        machine_id TEXT PRIMARY KEY,
        online_status INTEGER NOT NULL DEFAULT 0,
        wifi_ssid TEXT,
        ip_address TEXT,
        rssi INTEGER,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        servo_status TEXT DEFAULT 'OK',
        ir_status TEXT DEFAULT 'OK',
        firmware_version TEXT DEFAULT 'v1.0.4',
        demo_mode INTEGER DEFAULT 0
    )
    """)

    # 5. Forecasts table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS forecasts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id TEXT NOT NULL,
        forecast_date DATE NOT NULL,
        predicted_units REAL NOT NULL,
        model_version TEXT NOT NULL,
        mae_score REAL,
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(product_id)
    )
    """)

    # 6. Alerts table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        alert_type TEXT NOT NULL,
        severity TEXT NOT NULL, -- info, warning, danger
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        product_id TEXT,
        is_acknowledged INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 7. Stock history logs (for audit and restock logs)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS stock_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id TEXT NOT NULL,
        change_type TEXT NOT NULL, -- 'DISPENSE', 'RESTOCK', 'ADJUSTMENT'
        amount INTEGER NOT NULL,
        previous_stock INTEGER NOT NULL,
        new_stock INTEGER NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    conn.commit()
    conn.close()
