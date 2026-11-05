/*
  =====================================================================================
  SmartVend AI – AI Powered Smart Vending Machine Firmware
  Target Board: ESP32 NodeMCU 30-Pin CP2102
  Author: SmartVend Engineering Team
  Hardware Components:
    - 3x Push Buttons (Active LOW with internal PULLUP)
    - 3x Servo Motors (SG90 / MG995 180° or 360° continuous rotation)
    - 3x IR Obstacle Avoidance Sensors (Active LOW when beam broken)
    - 1x ESP32 NodeMCU 30-Pin Dev Board
  =====================================================================================
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <ESP32Servo.h>
#include <ArduinoJson.h> // Requires ArduinoJson v6 or v7

// ================= CONFIGURATION =================
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Backend Server URL (Replace with your computer's local IP where FastAPI is running)
// e.g. "http://192.168.1.100:8000"
const char* SERVER_BASE_URL = "http://192.168.1.100:8000";
const char* MACHINE_ID      = "smartvend_01";

// ================= PIN DEFINITIONS =================
// Push Buttons (Customer slot selection)
const int BTN_PIN_1 = 13;
const int BTN_PIN_2 = 14;
const int BTN_PIN_3 = 27;

// IR Obstacle Detection Sensors (Verify item physically drops)
const int IR_PIN_1  = 25;
const int IR_PIN_2  = 26;
const int IR_PIN_3  = 33;

// Servo Motor PWM Signal Pins
const int SERVO_PIN_1 = 18;
const int SERVO_PIN_2 = 19;
const int SERVO_PIN_3 = 21;

// Status LED (Built-in LED on GPIO 2)
const int LED_PIN = 2;

// ================= SERVO OBJECTS =================
Servo servo1;
Servo servo2;
Servo servo3;

// Timing variables
unsigned long lastHeartbeatTime = 0;
const unsigned long HEARTBEAT_INTERVAL = 30000; // Telemetry ping every 30 seconds
unsigned long lastDebounceTime[3] = {0, 0, 0};
const unsigned long DEBOUNCE_DELAY = 250; // 250ms debounce

bool isDispensing = false;

// ================= SETUP =================
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n==========================================");
  Serial.println("  SmartVend AI - ESP32 Vending Controller ");
  Serial.println("==========================================");

  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  // Configure Button pins with internal Pullup (Pressed = LOW)
  pinMode(BTN_PIN_1, INPUT_PULLUP);
  pinMode(BTN_PIN_2, INPUT_PULLUP);
  pinMode(BTN_PIN_3, INPUT_PULLUP);

  // Configure IR Sensor pins (Active LOW when obstacle detected)
  pinMode(IR_PIN_1, INPUT);
  pinMode(IR_PIN_2, INPUT);
  pinMode(IR_PIN_3, INPUT);

  // Allocate hardware timers and attach servos
  ESP32PWM::allocateTimer(0);
  ESP32PWM::allocateTimer(1);
  ESP32PWM::allocateTimer(2);
  ESP32PWM::allocateTimer(3);

  servo1.setPeriodHertz(50); // Standard 50Hz servo
  servo2.setPeriodHertz(50);
  servo3.setPeriodHertz(50);

  servo1.attach(SERVO_PIN_1, 500, 2400);
  servo2.attach(SERVO_PIN_2, 500, 2400);
  servo3.attach(SERVO_PIN_3, 500, 2400);

  // Center or reset initial servo angles
  resetServos();

  // Connect to Wi-Fi
  connectWiFi();

  // Send initial device registration telemetry
  sendHeartbeat();
}

// ================= MAIN LOOP =================
void loop() {
  // Reconnect WiFi if disconnected
  if (WiFi.status() != WL_CONNECTED) {
    digitalWrite(LED_PIN, LOW);
    connectWiFi();
  }

  // Periodic Telemetry Heartbeat
  if (millis() - lastHeartbeatTime > HEARTBEAT_INTERVAL) {
    sendHeartbeat();
    lastHeartbeatTime = millis();
  }

  // Check buttons only if not currently executing a dispense cycle
  if (!isDispensing) {
    checkButtonAndDispense(1, BTN_PIN_1, 0);
    checkButtonAndDispense(2, BTN_PIN_2, 1);
    checkButtonAndDispense(3, BTN_PIN_3, 2);
  }

  delay(20);
}

// ================= WIFI CONNECTION =================
void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(500);
    Serial.print(".");
    digitalWrite(LED_PIN, !digitalRead(LED_PIN)); // Blink while connecting
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(LED_PIN, HIGH); // Solid ON when connected
    Serial.println("\nWiFi Connected successfully!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("RSSI Signal: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("\nWiFi connection failed! Will retry in background.");
  }
}

// ================= BUTTON SCANNING & DISPENSE ROUTINE =================
void checkButtonAndDispense(int slotId, int btnPin, int debounceIdx) {
  int reading = digitalRead(btnPin);

  // Button pressed is LOW (active LOW with pullup)
  if (reading == LOW && (millis() - lastDebounceTime[debounceIdx] > DEBOUNCE_DELAY)) {
    lastDebounceTime[debounceIdx] = millis();
    Serial.print("\n>>> Button Pressed for Slot ");
    Serial.println(slotId);

    executeDispenseSequence(slotId);
  }
}

// ================= DISPENSE & IR VERIFICATION SEQUENCE =================
void executeDispenseSequence(int slotId) {
  isDispensing = true;
  digitalWrite(LED_PIN, LOW);

  Serial.println("==========================================");
  Serial.printf("STARTING DISPENSE SEQUENCE - SLOT %d\n", slotId);
  Serial.println("==========================================");

  // 1. Determine Servo and IR pins
  Servo* targetServo = nullptr;
  int irPin = -1;
  const char* prodId = "";

  if (slotId == 1) {
    targetServo = &servo1;
    irPin = IR_PIN_1;
    prodId = "prod_choc";
  } else if (slotId == 2) {
    targetServo = &servo2;
    irPin = IR_PIN_2;
    prodId = "prod_bisc";
  } else if (slotId == 3) {
    targetServo = &servo3;
    irPin = IR_PIN_3;
    prodId = "prod_chip";
  }

  if (targetServo == nullptr) {
    isDispensing = false;
    return;
  }

  // 2. Activate Servo Motor (Rotates helix coil or pushes cardboard flap)
  Serial.printf("[SERVO %d] Activating motor to dispense item...\n", slotId);
  
  // Rotate forward
  targetServo->write(180);
  delay(1400); // Dispense travel time

  // Return to idle position
  targetServo->write(0);
  delay(300);

  // 3. Verify Item Fall via IR Obstacle Sensor
  // Standard IR Obstacle modules output LOW when infrared light reflects from falling object
  Serial.printf("[IR %d] Monitoring drop chute for verification...\n", slotId);
  bool itemDetected = false;
  unsigned long waitStart = millis();
  const unsigned long IR_TIMEOUT = 3000; // 3 second detection window

  while (millis() - waitStart < IR_TIMEOUT) {
    if (digitalRead(irPin) == LOW) { // Object intercepted the beam
      itemDetected = true;
      Serial.printf("[SUCCESS] IR Sensor %d detected item drop!\n", slotId);
      break;
    }
    delay(20);
  }

  // 4. Send Event to Backend API
  String eventId = "esp_" + String(MACHINE_ID) + "_" + String(millis()) + "_s" + String(slotId);

  if (itemDetected) {
    Serial.println("[STATUS] Dispense successfully CONFIRMED by IR beam.");
    postSaleToBackend(eventId, slotId, prodId, true);
  } else {
    Serial.println("[WARNING] Item NOT detected by IR sensor! Motor jam or empty slot.");
    postSaleToBackend(eventId, slotId, prodId, false);
  }

  digitalWrite(LED_PIN, HIGH);
  isDispensing = false;
  Serial.println("==========================================\n");
}

// ================= RESET SERVOS =================
void resetServos() {
  servo1.write(0);
  servo2.write(0);
  servo3.write(0);
  delay(300);
}

// ================= HTTP POST SALE TO BACKEND =================
void postSaleToBackend(String eventId, int slotId, const char* productId, bool confirmed) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP ERROR] WiFi not connected. Cannot send sale log.");
    return;
  }

  HTTPClient http;
  String url = String(SERVER_BASE_URL) + "/api/sales";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  // Create JSON payload
  // {"event_id": "...", "machine_id": "...", "slot_id": 1, "product_id": "...", "quantity": 1, "dispense_confirmed": true}
  String payload = "{";
  payload += "\"event_id\":\"" + eventId + "\",";
  payload += "\"machine_id\":\"" + String(MACHINE_ID) + "\",";
  payload += "\"slot_id\":" + String(slotId) + ",";
  payload += "\"product_id\":\"" + String(productId) + "\",";
  payload += "\"quantity\":1,";
  payload += "\"dispense_confirmed\":" + String(confirmed ? "true" : "false");
  payload += "}";

  Serial.print("[HTTP POST] Sending to ");
  Serial.println(url);
  Serial.print("[PAYLOAD] ");
  Serial.println(payload);

  int httpCode = http.POST(payload);

  if (httpCode > 0) {
    String response = http.getString();
    Serial.printf("[HTTP RESPONSE %d]: %s\n", httpCode, response.c_str());
  } else {
    Serial.printf("[HTTP ERROR] Failed with error: %s\n", http.errorToString(httpCode).c_str());
  }

  http.end();
}

// ================= HTTP HEARTBEAT / TELEMETRY =================
void sendHeartbeat() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(SERVER_BASE_URL) + "/api/status";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  String payload = "{";
  payload += "\"machine_id\":\"" + String(MACHINE_ID) + "\",";
  payload += "\"online_status\":true,";
  payload += "\"wifi_ssid\":\"" + String(WiFi.SSID()) + "\",";
  payload += "\"ip_address\":\"" + WiFi.localIP().toString() + "\",";
  payload += "\"rssi\":" + String(WiFi.RSSI()) + ",";
  payload += "\"servo_status\":\"READY\",";
  payload += "\"ir_status\":\"CALIBRATED\",";
  payload += "\"demo_mode\":false";
  payload += "}";

  int httpCode = http.POST(payload);
  if (httpCode > 0) {
    Serial.printf("[HEARTBEAT] Ping sent. Code: %d\n", httpCode);
  }
  http.end();
}
