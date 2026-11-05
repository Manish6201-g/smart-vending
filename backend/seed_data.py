import sqlite3
from datetime import datetime
from .database import get_connection, init_db
from .ai_engine import generate_sample_historical_data

def seed_database():
    init_db()
    conn = get_connection()
    cursor = conn.cursor()

    # Seed products
    products = [
        (
            "prod_choc",
            "Cadbury Dairy Milk",
            2.50,
            "Chocolates & Confectionery",
            1,
            "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&q=80",
            "Rich and smooth milk chocolate bar, 50g."
        ),
        (
            "prod_bisc",
            "Oreo Cream Biscuits",
            1.75,
            "Biscuits & Cookies",
            2,
            "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80",
            "Chocolate sandwich cookies with sweet cream filling, 120g."
        ),
        (
            "prod_chip",
            "Lay's Classic Salted Chips",
            2.00,
            "Salty Snacks & Chips",
            3,
            "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80",
            "Crispy golden potato chips with sea salt, 50g."
        ),
    ]

    for p in products:
        cursor.execute("""
            INSERT OR REPLACE INTO products (product_id, product_name, price, category, slot_id, image_url, description)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, p)

    # Seed initial inventory
    inventories = [
        ("prod_choc", 30, 18, 4),
        ("prod_bisc", 25, 12, 3),
        ("prod_chip", 30, 5, 4), # low stock trigger
    ]

    for inv in inventories:
        cursor.execute("""
            INSERT OR REPLACE INTO inventory (product_id, initial_stock, current_stock, min_stock, updated_time)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, inv)

    # Seed initial machine status
    cursor.execute("""
        INSERT OR REPLACE INTO device_status (
            machine_id, online_status, wifi_ssid, ip_address, rssi, last_seen, servo_status, ir_status, firmware_version, demo_mode
        ) VALUES (
            'smartvend_01', 1, 'College_Lab_IoT', '192.168.1.105', -54, CURRENT_TIMESTAMP, 'ALL_3_SERVOS_READY', 'ALL_3_IR_CALIBRATED', 'v1.0.4-ESP32', 0
        )
    """)

    # Seed default alerts
    cursor.execute("SELECT COUNT(*) FROM alerts")
    if cursor.fetchone()[0] == 0:
        alerts = [
            ("low_stock", "warning", "Low Stock Alert: Slot 3", "Lay's Classic Salted Chips has reached 5 units remaining (threshold: 4). Restock recommended.", "prod_chip"),
            ("hardware_health", "info", "ESP32 NodeMCU Online", "Board connected to WiFi 'College_Lab_IoT' (IP: 192.168.1.105, RSSI: -54 dBm). All 3 Servos and IR Obstacle sensors verified.", None),
            ("ai_insight", "info", "Weekend Demand Spike Predicted", "AI Ridge model forecasts a 38% increase in snack demand for upcoming weekend. Ensure Slot 1 and Slot 3 are refilled.", "prod_choc")
        ]
        for a in alerts:
            cursor.execute("""
                INSERT INTO alerts (alert_type, severity, title, message, product_id)
                VALUES (?, ?, ?, ?, ?)
            """, a)

    conn.commit()

    # Generate historical sales for AI model
    generate_sample_historical_data(conn)
    conn.close()
    print("Database seeded successfully with initial products, inventory, alerts, and 30-day historical sales.")

if __name__ == "__main__":
    seed_database()
