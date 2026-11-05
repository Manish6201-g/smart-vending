import React, { useState, useEffect } from 'react';
import { 
  Globe2, 
  TrendingUp, 
  PieChart as PieIcon, 
  Layers, 
  ExternalLink, 
  Info, 
  ShieldCheck, 
  Building2, 
  Cpu, 
  CreditCard 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';
import { getGlobalMarketTrends } from '../api';

export default function GlobalTrends() {
  const [trendsData, setTrendsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGlobalMarketTrends()
      .then(data => setTrendsData(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const COLORS = ['#2563eb', '#0ea5e9', '#f59e0b', '#10b981', '#8b5cf6'];

  if (loading || !trendsData) {
    return (
      <div className="p-12 text-center text-xs text-slate-500">
        Loading published market intelligence...
      </div>
    );
  }

  const { dataset_info, macro_metrics, category_market_share, regional_breakdown, emerging_technological_trends } = trendsData;

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & PROMINENT DISCLAIMER */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2.5 mb-1">
              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                <Globe2 className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Global Vending Market Trends & Industry Research</h2>
            </div>
            <p className="text-xs text-slate-500">
              Published macro-economic benchmarks across automated retail, IoT micro-markets, and smart consumer trends.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-mono font-medium">
              Source: {dataset_info.source} ({dataset_info.publication_year})
            </span>
          </div>
        </div>

        {/* Essential Academic & Research Disclaimer */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start space-x-2.5 text-xs text-blue-900">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Academic Project Methodological Notice: </span>
            <span>{dataset_info.disclaimer}</span>
          </div>
        </div>
      </div>

      {/* 2. MACRO MARKET GROWTH METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">2023 Global Market</span>
          <div className="text-xl font-extrabold text-slate-900 mt-1">{macro_metrics.global_market_size_2023}</div>
          <span className="text-[10px] text-slate-400">Baseline valuation</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">2030 Projected Size</span>
          <div className="text-xl font-extrabold text-brand-700 mt-1">{macro_metrics.projected_market_size_2030}</div>
          <span className="text-[10px] text-brand-600 font-medium">Over next 5 years</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Industry Compound CAGR</span>
          <div className="text-xl font-extrabold text-emerald-600 mt-1">{macro_metrics.cagr_growth_rate}</div>
          <span className="text-[10px] text-emerald-700 font-medium">Sustained annual growth</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Cashless / Contactless</span>
          <div className="text-xl font-extrabold text-slate-900 mt-1">{macro_metrics.cashless_contactless_adoption}</div>
          <span className="text-[10px] text-slate-400">Card & Mobile NFC share</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">IoT / Telemetry Rate</span>
          <div className="text-xl font-extrabold text-indigo-600 mt-1">{macro_metrics.iot_enabled_vending_penetration}</div>
          <span className="text-[10px] text-indigo-700">ESP32 / Cellular connected</span>
        </div>
      </div>

      {/* 3. CHARTS: CATEGORY DYNAMICS & REGIONAL COMPARISON */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Market Share Chart */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Category Share in Global Vending</h3>
                <p className="text-xs text-slate-500">Breakdown of gross consumer spend by product type</p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    formatter={(val) => [`${val}%`, 'Market Share']}
                  />
                  <Pie
                    data={category_market_share}
                    dataKey="share_pct"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    innerRadius={50}
                    paddingAngle={3}
                  >
                    {category_market_share.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
            {category_market_share.map((c, i) => (
              <div key={c.category} className="flex justify-between items-center">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                  {c.category}
                </span>
                <span className="font-semibold text-slate-900">
                  {c.share_pct}% <span className="text-[10px] text-emerald-600 font-normal">({c.growth} YoY)</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Regional Comparison Chart */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Regional Market Share Comparison</h3>
                <p className="text-xs text-slate-500">Distribution across major continental economic zones</p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regional_breakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="region" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `${val}%`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    formatter={(val) => [`${val}%`, 'Global Share']}
                  />
                  <Bar dataKey="share_pct" name="Share %" fill="#0284c7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
            {regional_breakdown.map((r) => (
              <div key={r.region} className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex justify-between font-semibold text-slate-800 mb-0.5">
                  <span>{r.region}</span>
                  <span className="text-brand-700">{r.share_pct}%</span>
                </div>
                <p className="text-[10px] text-slate-500">{r.key_driver}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. EMERGING TECHNOLOGICAL TRENDS IN VENDING */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-brand-600" />
          Technological Disruptions in Modern Smart Vending
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {emerging_technological_trends.map((t, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded uppercase block w-fit mb-2">
                  Innovation #{idx + 1}
                </span>
                <h4 className="font-bold text-slate-900 text-sm mb-1.5">{t.title}</h4>
                <p className="text-slate-600 leading-relaxed text-[11px]">{t.impact}</p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200/60 text-[10px] text-slate-400 font-mono">
                Applied in SmartVend AI ESP32 Architecture
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
