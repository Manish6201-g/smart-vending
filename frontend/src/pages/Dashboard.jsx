import React from 'react';
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Award, 
  Radio, 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  Boxes,
  Zap
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend, 
  Cell 
} from 'recharts';

export default function Dashboard({ 
  salesData, 
  products, 
  deviceStatus, 
  forecastData, 
  alerts, 
  onNavigate 
}) {
  const kpis = salesData?.kpis || {};
  const isOnline = Boolean(deviceStatus?.online_status);
  const activeAlerts = alerts?.filter(a => !a.is_acknowledged) || [];

  const COLORS = ['#2563eb', '#0284c7', '#38bdf8', '#818cf8'];

  return (
    <div className="space-y-6">
      {/* Top Banner if Low Stock or Errors */}
      {activeAlerts.length > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-amber-900">
                Action Required: {activeAlerts.length} Active System Alert{activeAlerts.length > 1 ? 's' : ''}
              </h4>
              <p className="text-xs text-amber-700">
                {activeAlerts[0]?.title}: {activeAlerts[0]?.message}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('alerts')}
            className="text-xs font-semibold px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-2xs transition-colors shrink-0"
          >
            Review Alerts
          </button>
        </div>
      )}

      {/* 1. SIX PRIMARY KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* KPI 1: Today's Sales */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Sales</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{kpis.today_sales ?? 0} <span className="text-xs font-normal text-slate-500">units</span></div>
            <div className="text-[11px] text-emerald-600 font-medium flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              <span>Dispensed via IR check</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Today's Revenue */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">${(kpis.today_revenue ?? 0).toFixed(2)}</div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              Total: ${(kpis.total_revenue ?? 0).toFixed(2)}
            </div>
          </div>
        </div>

        {/* KPI 3: Available Stock */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available Stock</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{kpis.total_available_stock ?? 0} <span className="text-xs font-normal text-slate-500">items</span></div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              Across 3 Cardboard Slots
            </div>
          </div>
        </div>

        {/* KPI 4: Best-Selling Product */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Top Product</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-base font-bold text-slate-900 truncate" title={kpis.best_selling_product}>
              {kpis.best_selling_product || 'Cadbury Chocolate'}
            </div>
            <div className="text-[11px] text-amber-600 font-medium mt-1 flex items-center">
              <span>Highest rotation rate</span>
            </div>
          </div>
        </div>

        {/* KPI 5: Machine Connectivity */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Machine Status</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-lg font-bold text-slate-900 flex items-center">
              <span className={`w-2.5 h-2.5 rounded-full mr-2 ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              {isOnline ? 'ESP32 Online' : 'Hardware Idle'}
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-1">
              RSSI: {deviceStatus?.rssi ? `${deviceStatus.rssi} dBm` : '-54 dBm'}
            </div>
          </div>
        </div>

        {/* KPI 6: Seven-Day Predicted Demand */}
        <div className="bg-gradient-to-br from-navy-900 to-navy-800 rounded-xl p-4 text-white shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-300 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              7-Day Demand
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">
              {forecastData?.total_7day_predicted_demand ?? 142} <span className="text-xs font-normal text-sky-200">units</span>
            </div>
            <div className="text-[11px] text-sky-300 font-medium mt-1 flex items-center justify-between">
              <span>Ridge AI Model</span>
              <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded">MAE: {forecastData?.products?.[0]?.metrics?.mae || '0.94'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Sales Trend Line Chart (Last 14 Days) */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Daily Sales & Dispense Trend</h3>
              <p className="text-xs text-slate-500">14-day chronological transaction volume & revenue</p>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="inline-flex items-center text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-600 mr-1.5"></span> Units Sold
              </span>
              <span className="inline-flex items-center text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5"></span> Revenue ($)
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData?.daily_chart || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="sale_date" 
                  tickFormatter={(val) => val.slice(5)} 
                  stroke="#94a3b8" 
                  fontSize={11} 
                />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="total_units" 
                  name="Units Sold" 
                  stroke="#2563eb" 
                  strokeWidth={2.5} 
                  dot={{ r: 3, fill: '#2563eb' }} 
                  activeDot={{ r: 5 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="daily_revenue" 
                  name="Revenue ($)" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  strokeDasharray="4 4" 
                  dot={false} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 italic text-right">
            *Verified by ESP32 physical IR obstacle detection sensor
          </div>
        </div>

        {/* Product-wise Sales Bar Chart */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Product Sales Volume</h3>
                <p className="text-xs text-slate-500">Distribution across machine slots</p>
              </div>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData?.product_breakdown || []} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="product_name" stroke="#94a3b8" fontSize={10} tickFormatter={(val) => val.split(' ')[0]} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="total_units_sold" name="Units Sold" radius={[6, 6, 0, 0]}>
                    {(salesData?.product_breakdown || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Slots Active: <strong>3 of 3</strong></span>
            <button 
              onClick={() => onNavigate('analytics')} 
              className="text-brand-600 font-semibold hover:underline flex items-center gap-1"
            >
              Full Analytics <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. HARDWARE & AI HIGHLIGHT ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vending Machine Physical Status Summary */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Boxes className="w-4 h-4 text-brand-600" />
              Machine Slots & Stock Level
            </h3>
            <button 
              onClick={() => onNavigate('monitoring')}
              className="text-xs text-brand-600 font-semibold hover:underline"
            >
              Live Cam/Status
            </button>
          </div>

          <div className="space-y-3">
            {products?.map((prod) => {
              const pct = Math.min(100, Math.round((prod.current_stock / (prod.initial_stock || 25)) * 100));
              const isLow = prod.current_stock <= (prod.min_stock || 3);
              return (
                <div key={prod.product_id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-[10px]">
                        S{prod.slot_id}
                      </span>
                      {prod.product_name}
                    </span>
                    <span className={isLow ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                      {prod.current_stock} left ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${isLow ? 'bg-rose-500' : 'bg-brand-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI-Generated Business Insights */}
        <div className="bg-gradient-to-br from-slate-900 to-navy-900 text-white rounded-xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center border border-brand-500/30">
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">AI Machine Intelligence</h3>
              </div>
              <span className="text-[10px] bg-brand-400/20 text-brand-300 px-2 py-0.5 rounded-full font-mono">
                Scikit-Learn
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              {forecastData?.explanation || 
                "Regression model trained on 30-day temporal sales telemetry. Factors in weekend visitor surge coefficients and lag features."}
            </p>

            <div className="space-y-2 text-xs">
              <div className="bg-white/5 p-2.5 rounded-lg border border-white/10 flex items-center justify-between">
                <span className="text-slate-300">Fastest Depleting Item:</span>
                <span className="font-semibold text-sky-400">
                  {forecastData?.best_seller_forecast?.product_name || 'Cadbury Chocolate'}
                </span>
              </div>
              <div className="bg-white/5 p-2.5 rounded-lg border border-white/10 flex items-center justify-between">
                <span className="text-slate-300">Model Evaluation MAE:</span>
                <span className="font-mono font-semibold text-emerald-400">
                  ±{forecastData?.products?.[0]?.metrics?.mae || '0.94'} units/day
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400 text-[11px]">Formula: Restock = F + Safety - C</span>
            <button
              onClick={() => onNavigate('ai-forecast')}
              className="text-sky-300 hover:text-white font-semibold flex items-center gap-1"
            >
              Detailed Predictions <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Recent Transactions Feed */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              Latest Hardware Sales
            </h3>
            <button 
              onClick={() => onNavigate('analytics')}
              className="text-xs text-brand-600 font-semibold hover:underline"
            >
              View All
            </button>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-64 pr-1">
            {(salesData?.transactions || []).slice(0, 5).map((tx) => (
              <div key={tx.sale_id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-brand-100 text-brand-700 font-mono text-[10px]">
                      Slot {tx.slot_id}
                    </span>
                    <span>{tx.product_name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {tx.timestamp} • ID: {tx.event_id?.slice(0, 10)}...
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">${tx.total_amount?.toFixed(2)}</div>
                  <span className="inline-flex items-center text-[10px] text-emerald-600 font-medium">
                    <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> IR OK
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
