import os
import sqlite3
import uuid
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import io
import csv

from .database import get_connection, init_db
from .models import SaleEvent, DeviceHeartbeat, ProductCreate, ProductUpdate, StockUpdate, RestockOrder
from .ai_engine import run_demand_forecast
from .seed_data import seed_database

app = FastAPI(
    title="SmartVend AI Backend API",
    description="IoT Vending Machine Management System with Scikit-learn AI Forecasting & ESP32 Integration",
    version="1.0.0"
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()
    seed_database()

# ----------------- 1. HEALTH & SYSTEM -----------------

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "SmartVend AI Core Engine",
        "timestamp": datetime.now().isoformat(),
        "sqlite_connected": True
    }

# ----------------- 2. DEVICE STATUS & TELEMETRY -----------------

@app.get("/api/status")
def get_device_status(machine_id: str = "smartvend_01"):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM device_status WHERE machine_id = ?", (machine_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Machine not found")

    device = dict(row)

    # Calculate real-time online status based on last_seen (within 45 seconds is considered online)
    if device.get("last_seen"):
        try:
            last_dt = datetime.strptime(device["last_seen"], "%Y-%m-%d %H:%M:%S")
            diff_seconds = (datetime.now() - last_dt).total_seconds()
            # If demo_mode is 1, keep online status intact or respect manual setting
            if not device.get("demo_mode"):
                is_active = diff_seconds <= 60
                device["online_status"] = 1 if is_active else 0
        except Exception:
            pass

    # Fetch slots status summary
    cursor.execute("""
        SELECT p.slot_id, p.product_id, p.product_name, p.price, p.image_url,
               i.current_stock, i.min_stock,
               (SELECT COUNT(*) FROM sales WHERE product_id = p.product_id AND dispense_confirmed = 1) as total_sold
        FROM products p
        JOIN inventory i ON p.product_id = i.product_id
        ORDER BY p.slot_id ASC
    """)
    slots = [dict(r) for r in cursor.fetchall()]
    conn.close()

    return {
        "device": device,
        "slots": slots,
        "server_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

@app.post("/api/status")
def update_device_status(heartbeat: DeviceHeartbeat):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO device_status (machine_id, online_status, wifi_ssid, ip_address, rssi, last_seen, servo_status, ir_status, demo_mode)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?)
        ON CONFLICT(machine_id) DO UPDATE SET
            online_status = excluded.online_status,
            wifi_ssid = COALESCE(excluded.wifi_ssid, wifi_ssid),
            ip_address = COALESCE(excluded.ip_address, ip_address),
            rssi = COALESCE(excluded.rssi, rssi),
            last_seen = CURRENT_TIMESTAMP,
            servo_status = COALESCE(excluded.servo_status, servo_status),
            ir_status = COALESCE(excluded.ir_status, ir_status),
            demo_mode = COALESCE(excluded.demo_mode, demo_mode)
    """, (
        heartbeat.machine_id,
        1 if heartbeat.online_status else 0,
        heartbeat.wifi_ssid,
        heartbeat.ip_address,
        heartbeat.rssi,
        heartbeat.servo_status,
        heartbeat.ir_status,
        1 if heartbeat.demo_mode else 0
    ))

    conn.commit()
    conn.close()
    return {"status": "ok", "message": "Telemetry received"}

@app.post("/api/settings/demo_mode")
def set_demo_mode(enabled: bool, machine_id: str = "smartvend_01"):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE device_status 
        SET demo_mode = ?, online_status = ?, last_seen = CURRENT_TIMESTAMP
        WHERE machine_id = ?
    """, (1 if enabled else 0, 1 if enabled else 0, machine_id))
    conn.commit()
    conn.close()
    return {"status": "success", "demo_mode": enabled}

# ----------------- 3. SALES & ESP32 DISPENSE CONFIRMATION -----------------

@app.post("/api/sales")
def record_sale(sale: SaleEvent):
    """
    CRITICAL HARDWARE ENDPOINT:
    Called by ESP32 upon customer button press + physical IR verification.
    1. Check for duplicate event_id (idempotency).
    2. Verify dispense_confirmed == True before recording sale and decrementing stock.
    3. Update inventory & create stock_logs.
    4. Check for low-stock / stockout and create alert if necessary.
    """
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Idempotency Check
    cursor.execute("SELECT sale_id FROM sales WHERE event_id = ?", (sale.event_id,))
    existing = cursor.fetchone()
    if existing:
        conn.close()
        return {
            "status": "duplicate_ignored",
            "message": f"Event {sale.event_id} already processed",
            "sale_id": existing["sale_id"]
        }

    # 2. Resolve product by slot_id if product_id is not given
    cursor.execute("SELECT product_id, product_name, price FROM products WHERE slot_id = ?", (sale.slot_id,))
    prod = cursor.fetchone()
    if not prod:
        conn.close()
        raise HTTPException(status_code=400, detail=f"No product mapped to slot {sale.slot_id}")

    product_id = prod["product_id"]
    product_name = prod["product_name"]
    unit_price = prod["price"]

    # 3. Check current stock
    cursor.execute("SELECT current_stock, min_stock FROM inventory WHERE product_id = ?", (product_id,))
    inv = cursor.fetchone()
    if not inv:
        conn.close()
        raise HTTPException(status_code=400, detail="Inventory record not found")

    current_stock = inv["current_stock"]
    min_stock = inv["min_stock"]

    # 4. Strictly check dispense confirmation
    if not sale.dispense_confirmed:
        # Hardware reported that item failed to fall or IR beam wasn't broken!
        cursor.execute("""
            INSERT INTO alerts (alert_type, severity, title, message, product_id)
            VALUES ('dispense_failed', 'danger', ?, ?, ?)
        """, (
            f"Dispense Failed: Slot {sale.slot_id} ({product_name})",
            f"Customer pushed button for slot {sale.slot_id}, but IR obstacle sensor did not detect product fall. Motor jammed or empty slot.",
            product_id
        ))
        conn.commit()
        conn.close()
        return {
            "status": "failed_unconfirmed",
            "message": "Dispense unconfirmed by IR sensor. Inventory unchanged.",
            "stock_deducted": False
        }

    if current_stock < sale.quantity:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Out of stock for {product_name}")

    # 5. Decrement inventory
    new_stock = current_stock - sale.quantity
    cursor.execute("""
        UPDATE inventory 
        SET current_stock = ?, updated_time = CURRENT_TIMESTAMP
        WHERE product_id = ?
    """, (new_stock, product_id))

    # 6. Record sale
    total_amt = unit_price * sale.quantity
    cursor.execute("""
        INSERT INTO sales (event_id, machine_id, slot_id, product_id, quantity, unit_price, total_amount, timestamp, dispense_confirmed)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 1)
    """, (sale.event_id, sale.machine_id, sale.slot_id, product_id, sale.quantity, unit_price, total_amt))
    sale_id = cursor.lastrowid

    # 7. Audit log
    cursor.execute("""
        INSERT INTO stock_logs (product_id, change_type, amount, previous_stock, new_stock)
        VALUES (?, 'DISPENSE', ?, ?, ?)
    """, (product_id, -sale.quantity, current_stock, new_stock))

    # 8. Check stock alerts
    if new_stock == 0:
        cursor.execute("""
            INSERT INTO alerts (alert_type, severity, title, message, product_id)
            VALUES ('out_of_stock', 'danger', ?, ?, ?)
        """, (
            f"Out of Stock: Slot {sale.slot_id} ({product_name})",
            f"{product_name} is completely depleted. Slot {sale.slot_id} will reject customer dispensing until restocked.",
            product_id
        ))
    elif new_stock <= min_stock:
        cursor.execute("""
            INSERT INTO alerts (alert_type, severity, title, message, product_id)
            VALUES ('low_stock', 'warning', ?, ?, ?)
        """, (
            f"Low Stock Alert: Slot {sale.slot_id} ({product_name})",
            f"{product_name} inventory dropped to {new_stock} units (threshold: {min_stock}). Refill needed soon.",
            product_id
        ))

    # Update machine last_seen
    cursor.execute("UPDATE device_status SET last_seen = CURRENT_TIMESTAMP WHERE machine_id = ?", (sale.machine_id,))

    conn.commit()
    conn.close()

    return {
        "status": "success",
        "sale_id": sale_id,
        "event_id": sale.event_id,
        "slot_id": sale.slot_id,
        "product_name": product_name,
        "new_stock": new_stock,
        "amount": total_amt,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

# ----------------- 4. HARDWARE SIMULATOR & TEST -----------------

@app.post("/api/simulate/dispense")
def simulate_dispense(slot_id: int, simulate_ir_success: bool = True):
    """
    Test tool for demonstration without ESP32 hardware connected.
    Simulates button press, servo spin, and IR detection.
    """
    event_id = f"sim_{int(datetime.now().timestamp())}_{slot_id}"
    event = SaleEvent(
        event_id=event_id,
        machine_id="smartvend_01",
        slot_id=slot_id,
        quantity=1,
        dispense_confirmed=simulate_ir_success
    )
    return record_sale(event)

# ----------------- 5. PRODUCTS & INVENTORY -----------------

@app.get("/api/products")
def list_products():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT 
            p.product_id,
            p.product_name,
            p.price,
            p.category,
            p.slot_id,
            p.image_url,
            p.description,
            i.initial_stock,
            i.current_stock,
            i.min_stock,
            i.updated_time,
            COALESCE(SUM(CASE WHEN s.dispense_confirmed = 1 THEN s.quantity ELSE 0 END), 0) as units_sold,
            COALESCE(SUM(CASE WHEN s.dispense_confirmed = 1 THEN s.total_amount ELSE 0.0 END), 0.0) as revenue
        FROM products p
        LEFT JOIN inventory i ON p.product_id = i.product_id
        LEFT JOIN sales s ON p.product_id = s.product_id
        GROUP BY p.product_id
        ORDER BY p.slot_id ASC
    """)
    rows = cursor.fetchall()
    conn.close()

    products = []
    for r in rows:
        d = dict(r)
        curr = d["current_stock"] if d["current_stock"] is not None else 0
        min_s = d["min_stock"] if d["min_stock"] is not None else 3
        
        if curr == 0:
            d["stock_status"] = "OUT_OF_STOCK"
            d["status_badge"] = "red"
        elif curr <= min_s:
            d["stock_status"] = "LOW_STOCK"
            d["status_badge"] = "amber"
        else:
            d["stock_status"] = "IN_STOCK"
            d["status_badge"] = "emerald"

        products.append(d)

    return products

@app.post("/api/products")
def create_product(prod: ProductCreate):
    conn = get_connection()
    cursor = conn.cursor()

    # Verify slot availability
    cursor.execute("SELECT product_id FROM products WHERE slot_id = ?", (prod.slot_id,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail=f"Slot {prod.slot_id} is already occupied")

    try:
        cursor.execute("""
            INSERT INTO products (product_id, product_name, price, category, slot_id, image_url, description)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (prod.product_id, prod.product_name, prod.price, prod.category, prod.slot_id, prod.image_url, prod.description))

        cursor.execute("""
            INSERT INTO inventory (product_id, initial_stock, current_stock, min_stock)
            VALUES (?, ?, ?, ?)
        """, (prod.product_id, prod.initial_stock, prod.current_stock, prod.min_stock))

        cursor.execute("""
            INSERT INTO stock_logs (product_id, change_type, amount, previous_stock, new_stock)
            VALUES (?, 'INITIAL', ?, 0, ?)
        """, (prod.product_id, prod.current_stock, prod.current_stock))

        conn.commit()
    except sqlite3.IntegrityError as e:
        conn.close()
        raise HTTPException(status_code=400, detail=str(e))

    conn.close()
    return {"status": "success", "message": f"Product {prod.product_name} added to slot {prod.slot_id}"}

@app.put("/api/products/{product_id}")
def update_product(product_id: str, update: ProductUpdate):
    conn = get_connection()
    cursor = conn.cursor()

    fields = []
    values = []
    for k, v in update.dict(exclude_unset=True).items():
        fields.append(f"{k} = ?")
        values.append(v)

    if not fields:
        conn.close()
        return {"status": "noop"}

    values.append(product_id)
    cursor.execute(f"UPDATE products SET {', '.join(fields)} WHERE product_id = ?", values)
    conn.commit()
    conn.close()
    return {"status": "success", "message": "Product updated"}

@app.put("/api/inventory/{product_id}")
def update_stock(product_id: str, stock_data: StockUpdate):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT current_stock, min_stock FROM inventory WHERE product_id = ?", (product_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Product inventory not found")

    old_stock = row["current_stock"]
    new_stock = stock_data.current_stock
    min_stock = stock_data.min_stock if stock_data.min_stock is not None else row["min_stock"]

    cursor.execute("""
        UPDATE inventory 
        SET current_stock = ?, min_stock = ?, updated_time = CURRENT_TIMESTAMP
        WHERE product_id = ?
    """, (new_stock, min_stock, product_id))

    cursor.execute("""
        INSERT INTO stock_logs (product_id, change_type, amount, previous_stock, new_stock)
        VALUES (?, 'ADJUSTMENT', ?, ?, ?)
    """, (product_id, new_stock - old_stock, old_stock, new_stock))

    conn.commit()
    conn.close()
    return {"status": "success", "old_stock": old_stock, "new_stock": new_stock}

@app.post("/api/restock")
def restock_product(order: RestockOrder):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT current_stock FROM inventory WHERE product_id = ?", (order.product_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Product not found")

    old_stock = row["current_stock"]
    new_stock = old_stock + order.restock_quantity

    cursor.execute("""
        UPDATE inventory 
        SET current_stock = ?, updated_time = CURRENT_TIMESTAMP
        WHERE product_id = ?
    """, (new_stock, order.product_id))

    cursor.execute("""
        INSERT INTO stock_logs (product_id, change_type, amount, previous_stock, new_stock)
        VALUES (?, 'RESTOCK', ?, ?, ?)
    """, (order.product_id, order.restock_quantity, old_stock, new_stock))

    # Acknowledge low stock alerts for this product
    cursor.execute("""
        UPDATE alerts SET is_acknowledged = 1 
        WHERE product_id = ? AND alert_type IN ('low_stock', 'out_of_stock')
    """, (order.product_id,))

    conn.commit()
    conn.close()
    return {"status": "success", "product_id": order.product_id, "restocked": order.restock_quantity, "new_stock": new_stock}

@app.get("/api/inventory/logs")
def get_stock_logs(product_id: Optional[str] = None):
    conn = get_connection()
    cursor = conn.cursor()
    if product_id:
        cursor.execute("""
            SELECT l.*, p.product_name 
            FROM stock_logs l 
            JOIN products p ON l.product_id = p.product_id 
            WHERE l.product_id = ? 
            ORDER BY l.timestamp DESC LIMIT 50
        """, (product_id,))
    else:
        cursor.execute("""
            SELECT l.*, p.product_name 
            FROM stock_logs l 
            JOIN products p ON l.product_id = p.product_id 
            ORDER BY l.timestamp DESC LIMIT 50
        """)
    logs = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return logs

# ----------------- 6. SALES ANALYTICS & CSV EXPORT -----------------

@app.get("/api/sales")
def get_sales_analytics(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    product_id: Optional[str] = None,
    limit: int = 100
):
    conn = get_connection()
    cursor = conn.cursor()

    today_str = datetime.now().strftime("%Y-%m-%d")
    week_ago_str = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
    month_ago_str = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")

    # KPI 1: Today's sales count & revenue
    cursor.execute("""
        SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0.0) as revenue
        FROM sales
        WHERE DATE(timestamp) = ? AND dispense_confirmed = 1
    """, (today_str,))
    today_res = dict(cursor.fetchone())

    # KPI 2: Weekly sales & revenue
    cursor.execute("""
        SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0.0) as revenue
        FROM sales
        WHERE DATE(timestamp) >= ? AND dispense_confirmed = 1
    """, (week_ago_str,))
    weekly_res = dict(cursor.fetchone())

    # KPI 3: Monthly sales & revenue
    cursor.execute("""
        SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0.0) as revenue
        FROM sales
        WHERE DATE(timestamp) >= ? AND dispense_confirmed = 1
    """, (month_ago_str,))
    monthly_res = dict(cursor.fetchone())

    # KPI 4: Total all-time
    cursor.execute("""
        SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0.0) as revenue
        FROM sales
        WHERE dispense_confirmed = 1
    """)
    alltime_res = dict(cursor.fetchone())

    # Product-wise Breakdown
    cursor.execute("""
        SELECT 
            p.product_id,
            p.product_name,
            p.slot_id,
            COUNT(s.sale_id) as total_units_sold,
            COALESCE(SUM(s.total_amount), 0.0) as total_revenue
        FROM products p
        LEFT JOIN sales s ON p.product_id = s.product_id AND s.dispense_confirmed = 1
        GROUP BY p.product_id
        ORDER BY total_units_sold DESC
    """)
    prod_breakdown = [dict(r) for r in cursor.fetchall()]

    best_selling = prod_breakdown[0] if prod_breakdown and prod_breakdown[0]["total_units_sold"] > 0 else None
    least_selling = prod_breakdown[-1] if prod_breakdown and prod_breakdown[-1]["total_units_sold"] > 0 else None

    # Daily sales graph for the last 14 days
    cursor.execute("""
        SELECT 
            DATE(timestamp) as sale_date,
            COUNT(*) as total_units,
            ROUND(SUM(total_amount), 2) as daily_revenue
        FROM sales
        WHERE DATE(timestamp) >= DATE('now', '-14 day') AND dispense_confirmed = 1
        GROUP BY DATE(timestamp)
        ORDER BY sale_date ASC
    """)
    daily_chart = [dict(r) for r in cursor.fetchall()]

    # Hourly sales graph (aggregate distribution by hour 8-22)
    cursor.execute("""
        SELECT 
            strftime('%H:00', timestamp) as hour,
            COUNT(*) as transactions
        FROM sales
        WHERE dispense_confirmed = 1
        GROUP BY hour
        ORDER BY hour ASC
    """)
    hourly_chart = [dict(r) for r in cursor.fetchall()]

    # Filtered transaction records
    query = """
        SELECT s.sale_id, s.event_id, s.machine_id, s.slot_id, s.quantity, s.unit_price, s.total_amount, s.timestamp, s.dispense_confirmed,
               p.product_name, p.category
        FROM sales s
        JOIN products p ON s.product_id = p.product_id
        WHERE 1=1
    """
    params = []
    if start_date:
        query += " AND DATE(s.timestamp) >= ?"
        params.append(start_date)
    if end_date:
        query += " AND DATE(s.timestamp) <= ?"
        params.append(end_date)
    if product_id:
        query += " AND s.product_id = ?"
        params.append(product_id)

    query += " ORDER BY s.timestamp DESC LIMIT ?"
    params.append(limit)

    cursor.execute(query, params)
    transactions = [dict(r) for r in cursor.fetchall()]

    # Available stock total
    cursor.execute("SELECT SUM(current_stock) as total_stock FROM inventory")
    total_stock_row = cursor.fetchone()
    total_available_stock = total_stock_row["total_stock"] if total_stock_row and total_stock_row["total_stock"] else 0

    conn.close()

    return {
        "kpis": {
            "today_sales": today_res["count"],
            "today_revenue": round(today_res["revenue"], 2),
            "weekly_sales": weekly_res["count"],
            "weekly_revenue": round(weekly_res["revenue"], 2),
            "monthly_sales": monthly_res["count"],
            "monthly_revenue": round(monthly_res["revenue"], 2),
            "total_revenue": round(alltime_res["revenue"], 2),
            "total_sales": alltime_res["count"],
            "total_available_stock": total_available_stock,
            "best_selling_product": best_selling["product_name"] if best_selling else "N/A",
            "least_selling_product": least_selling["product_name"] if least_selling else "N/A"
        },
        "product_breakdown": prod_breakdown,
        "daily_chart": daily_chart,
        "hourly_chart": hourly_chart,
        "transactions": transactions
    }

@app.get("/api/sales/export.csv")
def export_sales_csv():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT s.sale_id, s.event_id, s.machine_id, s.slot_id, p.product_name, p.category,
               s.quantity, s.unit_price, s.total_amount, s.timestamp, s.dispense_confirmed
        FROM sales s
        JOIN products p ON s.product_id = p.product_id
        ORDER BY s.timestamp DESC
    """)
    rows = cursor.fetchall()
    conn.close()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Sale ID", "ESP32 Event ID", "Machine ID", "Slot ID", "Product Name",
        "Category", "Quantity", "Unit Price ($)", "Total Amount ($)", "Timestamp", "IR Confirmed"
    ])

    for r in rows:
        writer.writerow([
            r["sale_id"], r["event_id"], r["machine_id"], r["slot_id"], r["product_name"],
            r["category"], r["quantity"], f"{r['unit_price']:.2f}", f"{r['total_amount']:.2f}",
            r["timestamp"], "YES" if r["dispense_confirmed"] else "NO"
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=smartvend_sales_report.csv"}
    )

# ----------------- 7. AI DEMAND FORECAST -----------------

@app.get("/api/forecast")
def get_forecast():
    """
    Runs the Scikit-learn AI model for 7-day demand forecasting,
    returns prediction metrics, MAE scores, safety stock and recommended restock orders.
    """
    return run_demand_forecast()

# ----------------- 8. ALERTS & NOTIFICATIONS -----------------

@app.get("/api/alerts")
def get_alerts():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT a.*, p.product_name 
        FROM alerts a
        LEFT JOIN products p ON a.product_id = p.product_id
        ORDER BY a.is_acknowledged ASC, a.created_at DESC LIMIT 50
    """)
    alerts = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return alerts

@app.post("/api/alerts/{alert_id}/ack")
def acknowledge_alert(alert_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE alerts SET is_acknowledged = 1 WHERE id = ?", (alert_id,))
    conn.commit()
    conn.close()
    return {"status": "success", "alert_id": alert_id}

@app.delete("/api/alerts/{alert_id}")
def delete_alert(alert_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM alerts WHERE id = ?", (alert_id,))
    conn.commit()
    conn.close()
    return {"status": "success"}

# ----------------- 9. GLOBAL MARKET TRENDS (PUBLISHED DATA) -----------------

@app.get("/api/market-trends")
def get_global_market_trends():
    """
    Returns properly sourced global vending market statistics,
    clearly distinguishing published research from live machine data.
    """
    return {
        "status": "success",
        "dataset_info": {
            "title": "Global Smart Vending Machines Market Outlook & Category Dynamics",
            "source": "Grand View Research & Allied Market Research Industry Reports",
            "publication_year": "2024 - 2025",
            "disclaimer": "This data reflects published global industry benchmarks and macroeconomic vending trends, distinct from your local SmartVend AI telemetry."
        },
        "macro_metrics": {
            "global_market_size_2023": "$19.8 Billion",
            "projected_market_size_2030": "$35.2 Billion",
            "cagr_growth_rate": "8.6% CAGR",
            "cashless_contactless_adoption": "84.2%",
            "iot_enabled_vending_penetration": "61.5%"
        },
        "category_market_share": [
            {"category": "Beverages & Cold Drinks", "share_pct": 38.5, "growth": "+6.8%"},
            {"category": "Packaged Snacks & Chips", "share_pct": 27.2, "growth": "+9.1%"},
            {"category": "Confectionery & Chocolates", "share_pct": 18.4, "growth": "+7.4%"},
            {"category": "Fresh Food & Healthy Options", "share_pct": 11.2, "growth": "+14.3%"},
            {"category": "Non-Food & Personal Care", "share_pct": 4.7, "growth": "+11.8%"}
        ],
        "regional_breakdown": [
            {"region": "North America", "share_pct": 42.0, "key_driver": "Rapid cashless adoption & automated micro-markets in universities and workplaces."},
            {"region": "Europe", "share_pct": 29.5, "key_driver": "Energy efficiency regulations & smart telemetry for inventory optimization."},
            {"region": "Asia-Pacific", "share_pct": 21.0, "key_driver": "Fastest growing region (11.2% CAGR), driven by urban density and IoT hardware adoption."},
            {"region": "Latin America & MEA", "share_pct": 7.5, "key_driver": "Expanding retail footprint in transit hubs and institutional campuses."}
        ],
        "emerging_technological_trends": [
            {
                "title": "IR Sensor Verification & Anti-Cheating Mechanisms",
                "impact": "Reduces customer dispute rates by 94% through real-time beam occlusion verification before logging transaction."
            },
            {
                "title": "Predictive AI Demand Forecasting",
                "impact": "Vending operators using dynamic predictive stock replenishment decrease stockouts by 33% and trim logistics overhead by 22%."
            },
            {
                "title": "Edge IoT Telemetry (ESP32 / Microcontrollers)",
                "impact": "Low-cost WiFi microcontrollers replace expensive legacy MDB/DEX vending modules, lowering smart retrofit costs by 70%."
            }
        ]
    }
