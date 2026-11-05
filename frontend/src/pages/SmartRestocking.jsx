import React, { useState } from 'react';
import { 
  Truck, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Info, 
  ShieldCheck, 
  PackageCheck,
  RefreshCw
} from 'lucide-react';
import { restockProduct } from '../api';

export default function SmartRestocking({ forecastData, onRefresh }) {
  const [restockingId, setRestockingId] = useState(null);
  const [restockSuccess, setRestockSuccess] = useState(null);
  const products = forecastData?.products || [];

  const handleRestock = async (productId, quantity) => {
    setRestockingId(productId);
    setRestockSuccess(null);
    try {
      const res = await restockProduct({
        product_id: productId,
        restock_quantity: quantity > 0 ? quantity : 15
      });
      setRestockSuccess({
        id: productId,
        message: `Restocked ${res.restocked} units! New physical stock: ${res.new_stock}. Alerts cleared.`
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(`Restock failed: ${err.message}`);
    } finally {
      setRestockingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & SCIENTIFIC FORMULA BANNER */}
      <div className="bg-gradient-to-r from-navy-900 to-brand-900 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5 mb-2">
              <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-400/30 flex items-center justify-center text-brand-300">
                <Truck className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold tracking-tight">AI Smart Restocking Engine</h2>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Automated supply chain replenishment using empirical demand variance and Z-score buffer buffers.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 font-mono text-xs">
            <span className="text-[10px] text-slate-400 block uppercase mb-1">Replenishment Formula</span>
            <span className="text-sky-300 font-bold block">
              Restock = Forecast + Safety Stock - Current Stock
            </span>
          </div>
        </div>

        {/* Priority Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-white/10 text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-rose-500"></span>
            <span><strong>HIGH PRIORITY:</strong> Imminent stockout (&le; 2 days)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            <span><strong>MEDIUM PRIORITY:</strong> Approaching safety buffer</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span><strong>NORMAL:</strong> Sufficient shelf buffer</span>
          </div>
        </div>
      </div>

      {/* Restock Notification Toast */}
      {restockSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{restockSuccess.message}</span>
          </div>
          <button onClick={() => setRestockSuccess(null)} className="text-xs font-bold px-2 py-0.5">✕</button>
        </div>
      )}

      {/* 2. RESTOCK RECOMMENDATION CARDS FOR EACH SLOT */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((item) => {
          const isHigh = item.priority === 'HIGH';
          const isRestockingThis = restockingId === item.product_id;

          return (
            <div 
              key={item.product_id}
              className={`bg-white rounded-xl border p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between ${
                isHigh ? 'border-rose-400 ring-1 ring-rose-200' : 'border-slate-200'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-100 text-brand-800 font-mono">
                      SLOT {item.slot_id}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 mt-1">{item.product_name}</h4>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                    item.priority === 'HIGH' 
                      ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                      : item.priority === 'MEDIUM'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}>
                    {item.priority}
                  </span>
                </div>

                {/* Math breakdown */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 space-y-2 text-xs mb-4">
                  <div className="flex justify-between text-slate-600">
                    <span>Current In-Machine Stock:</span>
                    <strong className={item.current_stock <= (item.min_stock || 3) ? 'text-rose-600 font-bold' : 'text-slate-900'}>
                      {item.current_stock} units
                    </strong>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>7-Day Forecast Demand:</span>
                    <span className="font-semibold text-brand-700">+{item.seven_day_total} units</span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Required Safety Stock (95% CL):</span>
                    <span className="font-semibold text-slate-800">+{item.safety_stock} units</span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Incoming Deliveries:</span>
                    <span className="font-semibold text-slate-800">0 units</span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-900">Recommended Order:</span>
                    <span className="text-base font-extrabold text-brand-700 font-mono">
                      {item.recommended_restock} units
                    </span>
                  </div>
                </div>

                {/* Stockout Timeline */}
                <div className="text-[11px] text-slate-500 mb-4 flex items-center justify-between">
                  <span>Depletion Runway:</span>
                  <span className={`font-semibold ${item.days_until_stockout <= 2 ? 'text-rose-600' : 'text-slate-800'}`}>
                    ~{item.days_until_stockout} days at current velocity
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleRestock(item.product_id, item.recommended_restock > 0 ? item.recommended_restock : 15)}
                disabled={isRestockingThis}
                className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-1.5 ${
                  isHigh 
                    ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                    : 'bg-brand-600 hover:bg-brand-700 text-white'
                }`}
              >
                {isRestockingThis ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating Inventory...</span>
                  </>
                ) : (
                  <>
                    <PackageCheck className="w-3.5 h-3.5" />
                    <span>Execute Restock Order ({item.recommended_restock > 0 ? item.recommended_restock : 15} units)</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* 3. SUPPLY CHAIN BEST PRACTICES NOTE */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs text-xs text-slate-600 space-y-2">
        <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
          <Info className="w-4 h-4 text-brand-600" />
          Hardware Refill Procedure for College Cardboard Vending Machine
        </h4>
        <p>
          1. Physically load items into Slot spirals (Slot 1: Chocolate, Slot 2: Biscuits, Slot 3: Chips).
        </p>
        <p>
          2. Ensure the cardboard spiral coil is positioned so that the front item rests just behind the drop chute lip.
        </p>
        <p>
          3. Click the <strong>Execute Restock Order</strong> button above. This immediately updates the SQLite database, 
          resets low-stock indicators, clears active dashboard alerts, and enables customer servo actuation.
        </p>
      </div>
    </div>
  );
}
