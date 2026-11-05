import React, { useState } from 'react';
import { 
  Cpu, 
  Wifi, 
  WifiOff, 
  Radio, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Play, 
  RotateCw, 
  Activity, 
  Layers, 
  ShieldCheck,
  RefreshCw,
  Box,
  Eye,
  Sliders
} from 'lucide-react';
import { simulateDispense } from '../api';

export default function LiveMachine({ deviceStatus, products, onRefresh }) {
  const [dispensingSlot, setDispensingSlot] = useState(null);
  const [dispenseResult, setDispenseResult] = useState(null);
  const [simulateIrSuccess, setSimulateIrSuccess] = useState(true);

  const isOnline = Boolean(deviceStatus?.online_status);

  // Trigger interactive test dispense
  const handleTestDispense = async (slotId) => {
    setDispensingSlot(slotId);
    setDispenseResult(null);

    try {
      // 1. Simulate servo rotation delay
      await new Promise(r => setTimeout(r, 900));

      // 2. Call backend dispense API
      const res = await simulateDispense(slotId, simulateIrSuccess);
      setDispenseResult({
        slotId,
        success: res.status === 'success',
        message: res.status === 'success' 
          ? `Dispense Confirmed! Item fell and IR beam was intercepted. 1 unit deducted.` 
          : `Dispense Unconfirmed! IR beam did not detect object fall. Inventory was NOT deducted.`,
        data: res
      });

      if (onRefresh) onRefresh();
    } catch (err) {
      setDispenseResult({
        slotId,
        success: false,
        message: `Hardware Error: ${err.message}`
      });
    } finally {
      setDispensingSlot(null);
    }
  };

  // Helper for status badge colors
  const getSlotStatus = (prod) => {
    if (!prod) return { text: 'Empty', color: 'slate' };
    if (prod.current_stock === 0) return { text: 'OUT OF STOCK', color: 'red' };
    if (prod.current_stock <= (prod.min_stock || 3)) return { text: 'LOW STOCK', color: 'orange' };
    return { text: 'NORMAL', color: 'green' };
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HARDWARE TELEMETRY & STATUS BANNER */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3.5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isOnline ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
            }`}>
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-slate-900">ESP32 NodeMCU 30-Pin CP2102</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {isOnline ? 'Hardware Online' : 'Hardware Disconnected'}
                </span>
                {deviceStatus?.demo_mode ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                    Simulator Mode Active
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Physical Cardboard Vending Machine • Real-Time GPIO Monitoring & Telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onRefresh}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Poll Status</span>
            </button>
          </div>
        </div>

        {/* Telemetry Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-slate-400 font-medium block mb-1">Wi-Fi Connection</span>
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-600" /> : <WifiOff className="w-3.5 h-3.5 text-rose-500" />}
              <span>{deviceStatus?.wifi_ssid || 'College_Lab_IoT'}</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">RSSI: {deviceStatus?.rssi ?? -54} dBm</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-slate-400 font-medium block mb-1">Controller IP / MAC</span>
            <div className="font-mono font-semibold text-slate-800">
              {deviceStatus?.ip_address || '192.168.1.105'}
            </div>
            <span className="text-[10px] text-slate-500">Port 8000 REST Bridge</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-slate-400 font-medium block mb-1">Servo Drivers</span>
            <div className="font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>3x PWM Ready</span>
            </div>
            <span className="text-[10px] text-slate-500">GPIO 18, 19, 21 (External 5V)</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-slate-400 font-medium block mb-1">IR Obstacle Health</span>
            <div className="font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>3x Beams Calibrated</span>
            </div>
            <span className="text-[10px] text-slate-500">GPIO 25, 26, 33 (Active LOW)</span>
          </div>
        </div>
      </div>

      {/* 2. SIMULATION & TEST CONTROLS TOOLBAR */}
      <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center space-x-2.5">
          <Sliders className="w-4 h-4 text-brand-700 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-brand-900 uppercase tracking-wide">
              Physical Cardboard Demonstration & Test Workbench
            </h4>
            <p className="text-xs text-brand-700">
              Click "Trigger Dispense" below to execute the exact servo rotation & IR verification loop in software and hardware.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-xs font-semibold text-brand-900">Simulate IR Sensor:</span>
          <button
            onClick={() => setSimulateIrSuccess(true)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              simulateIrSuccess 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'bg-white text-slate-600 border border-brand-200 hover:bg-brand-100'
            }`}
          >
            ✓ Drop Confirmed (Normal)
          </button>
          <button
            onClick={() => setSimulateIrSuccess(false)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              !simulateIrSuccess 
                ? 'bg-rose-600 text-white shadow-xs' 
                : 'bg-white text-slate-600 border border-brand-200 hover:bg-brand-100'
            }`}
          >
            ✕ Sensor Jam / Empty
          </button>
        </div>
      </div>

      {/* Dispense Result Toast */}
      {dispenseResult && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium animate-in fade-in duration-200 ${
          dispenseResult.success 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-300' 
            : 'bg-rose-50 text-rose-900 border-rose-300'
        }`}>
          <div className="flex items-center space-x-2.5">
            {dispenseResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{dispenseResult.message}</span>
          </div>
          <button 
            onClick={() => setDispenseResult(null)}
            className="text-xs font-bold px-2 py-0.5 rounded hover:bg-black/5"
          >
            ✕
          </button>
        </div>
      )}

      {/* 3. VISUAL REPRESENTATION OF THE 3-SLOT VENDING MACHINE */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Three-Slot Physical Dispensing Chutes</h3>
            <p className="text-xs text-slate-500">Live operational state of cardboard spirals, servo angles, and drop detectors</p>
          </div>
          <div className="flex items-center space-x-3 text-xs">
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Normal
            </span>
            <span className="flex items-center gap-1 text-amber-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Low Stock
            </span>
            <span className="flex items-center gap-1 text-rose-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> Out of Stock / Jam
            </span>
          </div>
        </div>

        {/* Cardboard Vending Machine Cabinet Visual */}
        <div className="bg-slate-900 rounded-2xl p-6 border-4 border-slate-700 shadow-2xl relative">
          {/* Cabinet Header Frame */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800 text-white">
            <div className="flex items-center space-x-2">
              <Box className="w-5 h-5 text-brand-400" />
              <span className="font-bold tracking-wider text-sm uppercase">SmartVend Chassis • Slot Array</span>
            </div>
            <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>DROP SENSORS ARMED</span>
            </div>
          </div>

          {/* 3 Slots Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((slotNumber) => {
              const prod = products?.find(p => p.slot_id === slotNumber);
              const statusInfo = getSlotStatus(prod);
              const isDispensingThis = dispensingSlot === slotNumber;

              const pinInfo = {
                1: { servoPin: 'GPIO 18', irPin: 'GPIO 25', btnPin: 'GPIO 13', defaultName: 'Cadbury Dairy Milk' },
                2: { servoPin: 'GPIO 19', irPin: 'GPIO 26', btnPin: 'GPIO 14', defaultName: 'Oreo Biscuits' },
                3: { servoPin: 'GPIO 21', irPin: 'GPIO 33', btnPin: 'GPIO 27', defaultName: "Lay's Classic Chips" },
              }[slotNumber];

              return (
                <div 
                  key={slotNumber} 
                  className={`bg-slate-800 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                    isDispensingThis 
                      ? 'border-brand-400 shadow-lg shadow-brand-500/30 scale-[1.02]' 
                      : statusInfo.color === 'red'
                      ? 'border-rose-500/80'
                      : statusInfo.color === 'orange'
                      ? 'border-amber-500/80'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {/* Slot Top Header */}
                  <div className="p-3 bg-slate-950 flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded bg-brand-600 text-white font-bold text-xs flex items-center justify-center">
                        #{slotNumber}
                      </span>
                      <span className="text-xs font-bold text-white tracking-wide">
                        SLOT {slotNumber}
                      </span>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      statusInfo.color === 'green'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : statusInfo.color === 'orange'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {statusInfo.text}
                    </span>
                  </div>

                  {/* Slot Product Visual & Window */}
                  <div className="p-4 bg-slate-900/60 relative flex flex-col items-center">
                    {/* Simulated acrylic / cardboard dispensing bay */}
                    <div className="w-full h-44 rounded-lg bg-slate-950 border border-slate-800 p-2 flex flex-col items-center justify-between relative overflow-hidden group">
                      {/* Product image */}
                      <img 
                        src={prod?.image_url || "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&q=80"} 
                        alt={prod?.product_name || pinInfo.defaultName}
                        className={`h-28 object-contain rounded drop-shadow-md transition-transform duration-500 ${
                          isDispensingThis ? 'translate-y-6 scale-95 opacity-80' : 'group-hover:scale-105'
                        }`}
                      />

                      {/* Spiral Coil Graphic Overlay */}
                      <div className="absolute inset-x-0 bottom-2 flex justify-center opacity-40 pointer-events-none">
                        <div className={`w-32 h-6 border-b-2 border-dotted border-white rounded-full ${
                          isDispensingThis ? 'animate-spin' : ''
                        }`} />
                      </div>

                      {/* Price Badge */}
                      <div className="w-full flex items-center justify-between px-2 text-xs">
                        <span className="font-bold text-emerald-400">
                          ${prod?.price ? prod.price.toFixed(2) : '2.00'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Available: <strong className="text-white text-xs">{prod?.current_stock ?? 0}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Product Name */}
                    <div className="mt-3 text-center w-full">
                      <h4 className="font-bold text-sm text-white truncate" title={prod?.product_name}>
                        {prod?.product_name || pinInfo.defaultName}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {prod?.category || 'Snack & Vending Item'}
                      </p>
                    </div>
                  </div>

                  {/* Hardware Telemetry Details */}
                  <div className="p-4 bg-slate-950/70 border-t border-slate-800/80 space-y-2 text-xs">
                    {/* Quantity & Sales */}
                    <div className="flex justify-between items-center text-slate-300">
                      <span>Total Units Sold:</span>
                      <span className="font-bold text-white">{prod?.units_sold ?? 14}</span>
                    </div>

                    {/* Servo Status */}
                    <div className="flex justify-between items-center text-slate-300">
                      <span className="flex items-center gap-1">
                        <RotateCw className="w-3 h-3 text-sky-400" />
                        Servo Motor ({pinInfo.servoPin}):
                      </span>
                      <span className={`font-mono font-semibold ${
                        isDispensingThis ? 'text-amber-400 animate-pulse' : 'text-emerald-400'
                      }`}>
                        {isDispensingThis ? 'ROTATING 180°' : 'IDLE / READY'}
                      </span>
                    </div>

                    {/* IR Sensor Status */}
                    <div className="flex justify-between items-center text-slate-300">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3 text-sky-400" />
                        IR Sensor ({pinInfo.irPin}):
                      </span>
                      <span className={`font-mono font-semibold ${
                        isDispensingThis ? 'text-amber-300' : 'text-emerald-400'
                      }`}>
                        {isDispensingThis ? 'WAITING DROP...' : 'BEAM ARMED'}
                      </span>
                    </div>

                    {/* Push button mapping */}
                    <div className="flex justify-between items-center text-slate-400 text-[11px]">
                      <span>Trigger Button:</span>
                      <span className="font-mono text-slate-300">{pinInfo.btnPin} (Pullup)</span>
                    </div>
                  </div>

                  {/* Dispense Trigger Button */}
                  <div className="p-3 bg-slate-900 border-t border-slate-800">
                    <button
                      onClick={() => handleTestDispense(slotNumber)}
                      disabled={isDispensingThis || (prod && prod.current_stock === 0)}
                      className={`w-full py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center space-x-1.5 transition-all ${
                        isDispensingThis
                          ? 'bg-amber-600 text-white cursor-wait'
                          : prod && prod.current_stock === 0
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-brand-600 hover:bg-brand-500 text-white shadow-sm hover:shadow-brand-500/20 active:scale-95'
                      }`}
                    >
                      {isDispensingThis ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Actuating Slot {slotNumber}...</span>
                        </>
                      ) : prod && prod.current_stock === 0 ? (
                        <span>Out of Stock (Restock Required)</span>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Test Dispense Slot {slotNumber}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cardboard Chute Collection Bin */}
          <div className="mt-6 pt-4 border-t border-slate-800 bg-slate-950/80 rounded-xl p-3 text-center border border-slate-800">
            <span className="text-xs text-slate-400 font-mono flex items-center justify-center gap-2">
              <Box className="w-4 h-4 text-brand-400" />
              PHYSICAL DROP CHUTE & COLLECTION TRAY (IR Obstacle Sensor verifies item exit before API commit)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
