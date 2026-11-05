# SmartVend AI – AI Powered Smart Vending Machine & Inventory Management System

A production-grade, full-stack IoT Smart Vending Machine management platform built for an engineering college capstone project. Designed to seamlessly interface with a 3-slot cardboard vending machine powered by an **ESP32 NodeMCU 30-pin CP2102** microcontroller, 3 servo motors, 3 IR obstacle avoidance sensors, and 3 push buttons.

---

## 🚀 Key Features

1. **IoT Hardware Integration & Drop Verification**:
   - Customer presses slot button $\rightarrow$ ESP32 triggers corresponding servo coil.
   - Drop chute IR sensor verifies item physically falls before calling the REST API.
   - **Zero phantom deductions**: If an item jams or slot is empty, the sale is rejected and an alert is raised.
2. **AI-Powered Demand Forecasting (Python Scikit-Learn)**:
   - 7-day multi-step demand predictions using Ridge Regression ($L_2$ Regularization).
   - Engineered features: Day-of-week seasonality, weekend rush indicators, autoregressive lags, 3-day exponential moving window.
   - Evaluated using true **MAE (Mean Absolute Error)** and compared against a Moving Average baseline.
3. **Smart Supply Chain Restocking**:
   - Formula: $\text{Restock Quantity} = \text{Forecast Demand} + \text{Safety Stock} - \text{Current Stock} - \text{Incoming Stock}$.
   - Priority tagging (High, Medium, Normal) based on calculated stockout runway.
   - One-click physical refill execution that updates the SQLite database and clears alerts.
4. **Live Physical Machine Monitoring**:
   - 3-slot visual cabinet representation (Slot 1: Chocolate, Slot 2: Biscuits, Slot 3: Chips).
   - Real-time servo angle status, IR beam occlusion, and Wi-Fi signal strength (RSSI).
   - Interactive hardware test workbench to test drop confirmations and simulate sensor jams.
5. **Global Vending Market Trends**:
   - Published industry research ($19.8B in 2023 $\rightarrow$ $35.2B by 2030 at 8.6% CAGR).
   - Distinctly documented and cited from Grand View Research & Allied Market Research reports.
6. **Sales Analytics & Audit Ledger**:
   - Filterable transaction history with date pickers, slot filters, and search.
   - One-click CSV export (`smartvend_sales_report.csv`).

---

## 🛠 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Recharts, Lucide React |
| **Backend** | Python FastAPI, Uvicorn, SQLite3, Pydantic |
| **AI / ML** | Scikit-learn (Ridge Regression), Pandas, NumPy |
| **Hardware** | ESP32 NodeMCU 30-Pin CP2102, C++ Arduino Firmware |
| **Communication**| Wi-Fi (802.11 b/g/n) + HTTP REST API (JSON) |

---

## 🔌 Hardware Schematics & Pin Mapping

### 1. Pin Configuration (ESP32 NodeMCU 30-Pin)

| Component | Slot 1 (Chocolate) | Slot 2 (Biscuits) | Slot 3 (Potato Chips) | Mode / Voltage |
| :--- | :---: | :---: | :---: | :--- |
| **Push Button** | **GPIO 13** | **GPIO 14** | **GPIO 27** | `INPUT_PULLUP` (Active LOW) |
| **IR Obstacle Sensor** | **GPIO 25** | **GPIO 26** | **GPIO 33** | `INPUT` (Active LOW when beam broken) |
| **Servo Motor (PWM)** | **GPIO 18** | **GPIO 19** | **GPIO 21** | 50Hz PWM (Standard 500-2400µs) |

### 2. Critical Electrical Engineering Rules

> [!WARNING]
> **DO NOT POWER SERVOS DIRECTLY FROM ESP32 3.3V OR VIN PINS!**
> 3 servo motors rotating under mechanical cardboard load draw 1.5A to 2.5A peak current.
> - **External Power Supply**: Use a separate regulated **5V DC (2A or 3A)** adapter for servo VCC (red wires).
> - **Common Ground (MANDATORY)**: Connect the negative (-) terminal of the external 5V power supply to the ESP32 **GND** pin. Without common ground, the servo PWM signal cannot be referenced and servos will jitter uncontrollably.
> - **IR Sensor Voltage**: Power IR sensors from the ESP32 3.3V pin to ensure output levels remain strictly compatible with ESP32 GPIO inputs.

---

## ⚡ Quick Start Guide

### 1. Start the Backend API & AI Engine
```bash
# In project root:
source venv/bin/activate
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
API runs at `http://localhost:8000` (Interactive Swagger docs at `http://localhost:8000/docs`).

### 2. Start the Frontend Dashboard
```bash
cd frontend
npm run dev
```
Open `http://localhost:5173` in your browser.

### 3. Flash ESP32 Firmware
1. Open `esp32/smartvend_esp32.ino` in Arduino IDE.
2. In the sketch, enter your Wi-Fi credentials (`WIFI_SSID`, `WIFI_PASSWORD`).
3. Set `SERVER_BASE_URL` to your laptop's local IP (e.g. `http://192.168.1.100:8000`).
4. Select board **ESP32 Dev Module**, choose the CP2102 COM port, and upload.

---

## 🧪 Simulation / Presentation Mode

If demonstrating the system in a classroom without the physical cardboard box connected:
1. Click **Demo Mode: ENABLED** in the sidebar or settings.
2. Use the **Hardware Test & Dispense** button in the top navigation bar to trigger slot dispenses.
3. Test the IR sensor jam simulation to prove to your evaluators that the software protects against customer loss by refusing to deduct stock when the IR beam is not broken!
