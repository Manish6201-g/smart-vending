import React, { useState } from 'react';
import { 
  BarChart3, 
  DollarSign, 
  ShoppingCart, 
  Download, 
  Search, 
  Filter, 
  Calendar, 
  Award, 
  ArrowDownRight, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend, 
  Cell 
} from 'recharts';
import { getExportCsvUrl } from '../api';

export default function SalesAnalytics({ salesData, products, onFilterApply }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const kpis = salesData?.kpis || {};
  const transactions = salesData?.transactions || [];
  const productBreakdown = salesData?.product_breakdown || [];
  const hourlyChart = salesData?.hourly_chart || [];
  const dailyChart = salesData?.daily_chart || [];

  const handleApplyFilter = (e) => {
    e.preventDefault();
    if (onFilterApply) {
      onFilterApply({
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        product_id: selectedProduct || undefined,
      });
    }
  };

  const handleResetFilter = () => {
    setStartDate('');
    setEndDate('');
    setSelectedProduct('');
    if (onFilterApply) onFilterApply({});
  };

  // Filter transactions by search
  const filteredTransactions = transactions.filter(tx => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      tx.product_name?.toLowerCase().includes(q) ||
      tx.event_id?.toLowerCase().includes(q) ||
      String(tx.slot_id).includes(q)
    );
  });

  const COLORS = ['#2563eb', '#0ea5e9', '#f59e0b', '#10b981'];

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & CSV EXPORT */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sales Analytics & Transaction Ledger</h2>
          <p className="text-xs text-slate-500">Chronological dispense audit verified via ESP32 drop sensors</p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={getExportCsvUrl()}
            download="smartvend_sales_report.csv"
            className="flex items-center space-x-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Sales CSV</span>
          </a>
        </div>
      </div>

      {/* 2. REVENUE & VOLUME KPI STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-center text-xs text-slate-500 uppercase font-semibold">
            <span>Today's Performance</span>
            <ShoppingCart className="w-4 h-4 text-brand-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {kpis.today_sales ?? 0} <span className="text-xs font-normal text-slate-400">units</span>
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-1">
            ${(kpis.today_revenue ?? 0).toFixed(2)} generated
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-center text-xs text-slate-500 uppercase font-semibold">
            <span>Weekly Sales (7D)</span>
            <BarChart3 className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {kpis.weekly_sales ?? 0} <span className="text-xs font-normal text-slate-400">units</span>
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            ${(kpis.weekly_revenue ?? 0).toFixed(2)} gross sales
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-center text-xs text-slate-500 uppercase font-semibold">
            <span>Monthly Sales (30D)</span>
            <Calendar className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {kpis.monthly_sales ?? 0} <span className="text-xs font-normal text-slate-400">units</span>
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            ${(kpis.monthly_revenue ?? 0).toFixed(2)} total volume
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-center text-xs text-slate-500 uppercase font-semibold">
            <span>Total Cumulative Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            ${(kpis.total_revenue ?? 0).toFixed(2)}
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            All-time confirmed sales: {kpis.total_sales ?? 0}
          </div>
        </div>
      </div>

      {/* 3. CHARTS: HOURLY SALES DISTRIBUTION & PRODUCT BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Sales Graph */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Peak Dispensing Hours</h3>
              <p className="text-xs text-slate-500">Campus traffic distribution (08:00 to 22:00)</p>
            </div>
            <span className="text-[11px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
              Hourly Aggregate
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="transactions" name="Units Dispensed" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product Revenue Breakdown Table & Bar */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Slot-Wise Revenue Contribution</h3>
                <p className="text-xs text-slate-500">Sales volume and gross dollar earnings per item</p>
              </div>
            </div>

            <div className="space-y-3">
              {productBreakdown.map((item, idx) => {
                const totalRev = kpis.total_revenue || 1;
                const sharePct = Math.round((item.total_revenue / totalRev) * 100);
                return (
                  <div key={item.product_id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex justify-between items-center text-xs font-semibold mb-1">
                      <span className="flex items-center gap-1.5 text-slate-900">
                        <span className="w-5 h-5 rounded bg-brand-600 text-white font-mono text-[10px] flex items-center justify-center font-bold">
                          S{item.slot_id}
                        </span>
                        {item.product_name}
                      </span>
                      <span className="text-slate-900 font-bold">${item.total_revenue?.toFixed(2)} ({sharePct}%)</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1.5">
                      <span>Units Sold: {item.total_units_sold}</span>
                      <span>Unit Price: ${(item.total_revenue / (item.total_units_sold || 1)).toFixed(2)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ width: `${sharePct}%`, backgroundColor: COLORS[idx % COLORS.length] }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Best vs Least Selling Callout */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 text-xs mt-3">
            <div className="flex items-center space-x-2 text-slate-700">
              <Award className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Top Seller</span>
                <span className="font-bold truncate block">{kpis.best_selling_product || 'Cadbury Chocolate'}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-slate-700">
              <ArrowDownRight className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Lowest Rotation</span>
                <span className="font-bold truncate block">{kpis.least_selling_product || 'Lay\'s Chips'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. TRANSACTION FILTER TOOLBAR */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
        <form onSubmit={handleApplyFilter} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end text-xs">
          <div>
            <label className="block text-slate-500 font-medium mb-1">Start Date:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">End Date:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">Product / Slot:</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
            >
              <option value="">All Products (All Slots)</option>
              {products?.map(p => (
                <option key={p.product_id} value={p.product_id}>
                  Slot {p.slot_id} – {p.product_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">Search ID / Product:</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter results..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg shadow-xs transition-colors"
            >
              Apply Filter
            </button>
            <button
              type="button"
              onClick={handleResetFilter}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-lg transition-colors"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* 5. FULL TRANSACTION HISTORY TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold text-sm text-slate-900">
            Transaction Ledger ({filteredTransactions.length} records)
          </h3>
          <span className="text-xs text-slate-400">
            Recorded in SQLite with idempotency checks
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Sale ID</th>
                <th className="py-3 px-4">ESP32 Event ID</th>
                <th className="py-3 px-4">Slot</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Qty</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-center">IR Drop Confirmed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map((tx) => (
                <tr key={tx.sale_id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-slate-800">#{tx.sale_id}</td>
                  <td className="py-3 px-4 font-mono text-slate-500 text-[11px] truncate max-w-[120px]" title={tx.event_id}>
                    {tx.event_id}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 font-bold font-mono text-[10px]">
                      Slot {tx.slot_id}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">{tx.product_name}</td>
                  <td className="py-3 px-4 font-semibold">{tx.quantity}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">${tx.total_amount?.toFixed(2)}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{tx.timestamp}</td>
                  <td className="py-3 px-4 text-center">
                    {tx.dispense_confirmed ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Confirmed
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800 border border-rose-300">
                        <AlertCircle className="w-3 h-3 mr-1" /> Failed / Jam
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    No transactions found matching your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
