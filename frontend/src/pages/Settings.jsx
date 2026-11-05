import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Cpu, 
  Wifi, 
  Sliders, 
  ShieldCheck, 
  Save, 
  Copy, 
  Check, 
  AlertTriangle, 
  Terminal, 
  User, 
  FileCode,
  FlaskConical,
  Radio
} from 'lucide-react';
import { setDemoMode } from '../api';

export default function Settings({ deviceStatus, demoMode, onToggleDemo, onRefresh }) {
  const [machineId, setMachineId] = useState(deviceStatus?.machine_id || 'smartvend_01');
  const [wifiSsid, setWifiSsid] = useState(deviceStatus?.wifi_ssid || 'College_Lab_IoT');
  const [serverHost, setServerHost] = useState('http://192.168.1.100:8000');
  const [copiedCode, setCopiedCode] = useState(false);
  const [savedSettings, setSavedSettings] = useState(false);

  const isOnline = Boolean(deviceStatus?.online_status);

  const sampleArduinoSnippet = `// SmartVend AI ESP32 Pin Setup
const int BTN_PIN_1 = 13;   const int BTN_PIN_2 = 14;   const int BTN_PIN_3 = 27;
const int IR_PIN_1  = 25;   const int IR_PIN_2  = 26;   const int IR_PIN_3  = 33;
const int SERVO_1   = 18;   const int SERVO_2   = 19;   const int SERVO_3   = 21;

// Post verified sale to backend:
// POST http://<SERVER_IP>:8000/api/sales
// Payload: {"event_id":"...", "slot_id": 1, "dispense_confirmed": true}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sampleArduinoSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSavedSettings(true);
    setTimeout(() => setSavedSettings(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Machine Architecture & Configuration</h2>
          <p className="text-xs text-slate-500">Hardware pin definitions, IoT network binding, and AI model parameters</p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Demo Mode Toggle */}
          <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
            <FlaskConical className="w-4 h-4 text-amber-500" />
            <span className="font-semibold text-slate-700">Demo / Simulation Mode:</span>
            <button
              type="button"
              onClick={onToggleDemo}
              className={`px-2.5 py-0.5 rounded font-bold transition-all ${
                demoMode 
                  ? 'bg-amber-500 text-white shadow-2xs' 
                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              }`}
            >
              {demoMode ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>
        </div>
      </div>

      {/* Demo Mode Notice */}
      {demoMode && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Simulation Mode is ON:</strong> Allows testing all dashboard features, dispenser actuations, and forecasts without physical ESP32 board attached. When presenting physical machine, turn Demo Mode OFF to read live ESP32 telemetry.
          </span>
        </div>
      )}

      {/* 2. ESP32 GPIO PINOUT & ELECTRICAL SCHEMATICS */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-2.5 mb-4 pb-3 border-b border-slate-100">
          <Cpu className="w-5 h-5 text-brand-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">ESP32 NodeMCU 30-Pin CP2102 GPIO Assignment</h3>
            <p className="text-xs text-slate-500">Hardware wiring mapping for cardboard coils, sensors and tactile buttons</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Slot 1 Wiring */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-900">Slot 1 (Cadbury Chocolate)</span>
              <span className="px-1.5 py-0.5 rounded bg-brand-100 text-brand-800 font-bold font-mono text-[10px]">
                SLOT #1
              </span>
            </div>
            <ul className="space-y-1.5 text-slate-600 text-[11px]">
              <li className="flex justify-between">
                <span>Push Button:</span>
                <span className="font-mono font-semibold text-slate-800">GPIO 13 (Pullup)</span>
              </li>
              <li className="flex justify-between">
                <span>IR Obstacle Sensor:</span>
                <span className="font-mono font-semibold text-slate-800">GPIO 25 (Active LOW)</span>
              </li>
              <li className="flex justify-between">
                <span>Servo Signal (PWM):</span>
                <span className="font-mono font-semibold text-brand-700">GPIO 18</span>
              </li>
            </ul>
          </div>

          {/* Slot 2 Wiring */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-900">Slot 2 (Oreo Biscuits)</span>
              <span className="px-1.5 py-0.5 rounded bg-brand-100 text-brand-800 font-bold font-mono text-[10px]">
                SLOT #2
              </span>
            </div>
            <ul className="space-y-1.5 text-slate-600 text-[11px]">
              <li className="flex justify-between">
                <span>Push Button:</span>
                <span className="font-mono font-semibold text-slate-800">GPIO 14 (Pullup)</span>
              </li>
              <li className="flex justify-between">
                <span>IR Obstacle Sensor:</span>
                <span className="font-mono font-semibold text-slate-800">GPIO 26 (Active LOW)</span>
              </li>
              <li className="flex justify-between">
                <span>Servo Signal (PWM):</span>
                <span className="font-mono font-semibold text-brand-700">GPIO 19</span>
              </li>
            </ul>
          </div>

          {/* Slot 3 Wiring */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-900">Slot 3 (Potato Chips)</span>
              <span className="px-1.5 py-0.5 rounded bg-brand-100 text-brand-800 font-bold font-mono text-[10px]">
                SLOT #3
              </span>
            </div>
            <ul className="space-y-1.5 text-slate-600 text-[11px]">
              <li className="flex justify-between">
                <span>Push Button:</span>
                <span className="font-mono font-semibold text-slate-800">GPIO 27 (Pullup)</span>
              </li>
              <li className="flex justify-between">
                <span>IR Obstacle Sensor:</span>
                <span className="font-mono font-semibold text-slate-800">GPIO 33 (Active LOW)</span>
              </li>
              <li className="flex justify-between">
                <span>Servo Signal (PWM):</span>
                <span className="font-mono font-semibold text-brand-700">GPIO 21</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Electrical safety note */}
        <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Crucial Engineering Rule: </span>
            <span>
              Use an external 5V/2A power supply for the 3 servos. <strong>Do NOT power servos from the ESP32 3.3V or VIN pin</strong> to prevent brownout resets. Ensure common Ground (GND) is connected between the external 5V power supply and the ESP32.
            </span>
          </div>
        </div>
      </div>

      {/* 3. NETWORK & MACHINE PARAMETERS FORM */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Wifi className="w-4 h-4 text-brand-600" />
            Machine Telemetry & Network Config
          </h3>

          <form onSubmit={handleSave} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Machine Identifier:</label>
              <input
                type="text"
                value={machineId}
                onChange={(e) => setMachineId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Wi-Fi SSID:</label>
              <input
                type="text"
                value={wifiSsid}
                onChange={(e) => setWifiSsid(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Backend Server Base URL:</label>
              <input
                type="text"
                value={serverHost}
                onChange={(e) => setServerHost(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-between items-center">
              {savedSettings && (
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Settings Saved!
                </span>
              )}
              <button
                type="submit"
                className="ml-auto px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg shadow-xs transition-colors"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>

        {/* AI Model Hyperparameters */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-brand-600" />
            AI Demand Forecast Hyperparameters
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
              <div>
                <span className="font-semibold text-slate-800 block">Scikit-Learn Algorithm</span>
                <span className="text-[11px] text-slate-500">L2 Regularized Ridge Regression</span>
              </div>
              <span className="font-mono text-brand-700 font-bold">Ridge(alpha=1.0)</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
              <div>
                <span className="font-semibold text-slate-800 block">Service Level Z-Score</span>
                <span className="text-[11px] text-slate-500">95% Out-of-Stock Protection</span>
              </div>
              <span className="font-mono text-slate-800 font-bold">Z = 1.65</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
              <div>
                <span className="font-semibold text-slate-800 block">Historical Training Horizon</span>
                <span className="text-[11px] text-slate-500">Chronological sliding telemetry window</span>
              </div>
              <span className="font-mono text-slate-800 font-bold">30 Days</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. ARDUINO FIRMWARE QUICK CODE VIEWER */}
      <div className="bg-slate-900 rounded-xl p-5 text-white border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <FileCode className="w-4 h-4 text-brand-400" />
            <span className="text-xs font-bold uppercase tracking-wider">ESP32 Firmware Header (smartvend_esp32.ino)</span>
          </div>
          <button
            onClick={copyToClipboard}
            className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-mono transition-colors"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>

        <pre className="text-xs font-mono text-sky-300 overflow-x-auto p-2 bg-slate-950 rounded-lg leading-relaxed">
          {sampleArduinoSnippet}
        </pre>
        <p className="text-[11px] text-slate-400 mt-2">
          Full sketch located at <code className="text-white">esp32/smartvend_esp32.ino</code> with complete HTTP POST and IR verification routines.
        </p>
      </div>
    </div>
  );
}
