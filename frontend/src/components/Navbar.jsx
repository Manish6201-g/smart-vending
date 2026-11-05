import React, { useState } from 'react';
import { 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Play, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { simulateDispense } from '../api';

export default function Navbar({ 
  activeTabTitle, 
  lastSyncTime, 
  onRefresh, 
  isRefreshing, 
  deviceStatus, 
  onDispenseSuccess 
}) {
  const [showSimModal, setShowSimModal] = useState(false);
  const [simSlot, setSimSlot] = useState(1);
  const [simIrSuccess, setSimIrSuccess] = useState(true);
  const [simLoading, setSimLoading] = useState(false);
  const [simFeedback, setSimFeedback] = useState(null);

  const isOnline = Boolean(deviceStatus?.online_status);

  const handleSimulate = async () => {
    setSimLoading(true);
    setSimFeedback(null);
    try {
      const res = await simulateDispense(simSlot, simIrSuccess);
      if (res.status === 'success') {
        setSimFeedback({
          type: 'success',
          msg: `Dispensed Slot ${simSlot} (${res.product_name}). Stock reduced. Amount: $${res.amount.toFixed(2)}`
        });
        if (onDispenseSuccess) onDispenseSuccess();
      } else {
        setSimFeedback({
          type: 'warning',
          msg: `IR Sensor timed out on Slot ${simSlot}. Dispense failed; stock NOT deducted.`
        });
        if (onDispenseSuccess) onDispenseSuccess();
      }
    } catch (err) {
      setSimFeedback({
        type: 'error',
        msg: err.message || 'Simulation failed'
      });
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-xs z-20">
      {/* Title & Path */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">{activeTabTitle}</h2>
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <span>Smart Vending Station 01</span>
          <span>•</span>
          <span className="flex items-center space-x-1 font-mono text-[11px] text-slate-600">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Last Sync: {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString() : 'Connecting...'}</span>
          </span>
        </div>
      </div>

      {/* Action items */}
      <div className="flex items-center space-x-3">
        {/* Hardware connectivity badge */}
        <div className={`hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
          isOnline 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
            : 'bg-rose-50 text-rose-700 border-rose-200'
        }`}>
          {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-600" /> : <WifiOff className="w-3.5 h-3.5 text-rose-600" />}
          <span>{isOnline ? 'ESP32 Connected' : 'ESP32 Offline'}</span>
        </div>

        {/* Quick Dispense Simulator Button */}
        <div className="relative">
          <button
            onClick={() => setShowSimModal(!showSimModal)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Hardware Test & Dispense</span>
            <ChevronDown className="w-3 h-3 text-brand-500" />
          </button>

          {showSimModal && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-brand-600" />
                  Hardware Dispense Test
                </span>
                <button 
                  onClick={() => setShowSimModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold px-1"
                >
                  ✕
                </button>
              </div>

              <p className="text-[11px] text-slate-500 mb-3">
                Emulates customer button press, servo actuation, and IR obstacle delivery verification.
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Target Vending Slot:</label>
                  <select 
                    value={simSlot} 
                    onChange={(e) => setSimSlot(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md py-1.5 px-2 text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
                  >
                    <option value={1}>Slot 1 – Chocolate ($2.50)</option>
                    <option value={2}>Slot 2 – Biscuits ($1.75)</option>
                    <option value={3}>Slot 3 – Potato Chips ($2.00)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">IR Beam Sensor Behavior:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSimIrSuccess(true)}
                      className={`py-1.5 px-2 rounded-md border text-center font-medium transition-all ${
                        simIrSuccess 
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      ✓ Drop Confirmed
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimIrSuccess(false)}
                      className={`py-1.5 px-2 rounded-md border text-center font-medium transition-all ${
                        !simIrSuccess 
                          ? 'bg-rose-50 border-rose-500 text-rose-700' 
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      ✕ Simulate Jam / Miss
                    </button>
                  </div>
                </div>

                {simFeedback && (
                  <div className={`p-2.5 rounded-md text-[11px] leading-tight border ${
                    simFeedback.type === 'success' 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                      : simFeedback.type === 'warning'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}>
                    {simFeedback.msg}
                  </div>
                )}

                <button
                  onClick={handleSimulate}
                  disabled={simLoading}
                  className="w-full py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center space-x-1.5"
                >
                  {simLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Actuating Servo & IR...</span>
                    </>
                  ) : (
                    <span>Execute Dispense Test</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-brand-600' : ''}`} />
        </button>

        {/* Admin Avatar */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-navy-800 text-white font-bold text-xs flex items-center justify-center shadow-xs">
            EN
          </div>
          <div className="hidden md:block text-left text-xs leading-tight">
            <span className="font-semibold text-slate-700 block">Lead Engineer</span>
            <span className="text-[10px] text-slate-400">Admin Console</span>
          </div>
        </div>
      </div>
    </header>
  );
}
