import React from 'react';
import { 
  LayoutDashboard, 
  Cpu, 
  Sparkles, 
  BarChart3, 
  Boxes, 
  Truck, 
  Globe2, 
  Bell, 
  Settings, 
  Radio, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  FlaskConical
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, alertsCount, deviceStatus, demoMode, onToggleDemo }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'monitoring', label: 'Live Machine Monitor', icon: Cpu },
    { id: 'ai-forecast', label: 'AI Demand Forecast', icon: Sparkles, badge: 'Ridge AI' },
    { id: 'analytics', label: 'Sales Analytics', icon: BarChart3 },
    { id: 'inventory', label: 'Inventory Management', icon: Boxes },
    { id: 'restocking', label: 'Smart Restocking', icon: Truck },
    { id: 'trends', label: 'Global Market Trends', icon: Globe2 },
    { id: 'alerts', label: 'Alerts & System Logs', icon: Bell, badgeCount: alertsCount },
    { id: 'settings', label: 'Hardware & Settings', icon: Settings },
  ];

  const isOnline = Boolean(deviceStatus?.online_status);

  return (
    <aside className="w-72 bg-navy-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none shadow-xl">
      {/* Brand & Logo */}
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3.5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" />
            <line x1="9" y1="6" x2="15" y2="6" />
            <line x1="9" y1="10" x2="15" y2="10" />
            <line x1="8" y1="16" x2="16" y2="16" />
            <line x1="16" y1="14" x2="16" y2="18" />
            <circle cx="12" cy="18" r="0.5" fill="currentColor" />
          </svg>
        </div>
        <div>
          <div className="flex items-center space-x-1.5">
            <h1 className="font-bold text-lg text-white tracking-tight">SmartVend</h1>
            <span className="text-xs px-1.5 py-0.5 font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/40 rounded">AI</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">IoT Cardboard Vending System</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
          Operations & Intelligence
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-700/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-400'}`} />
                <span className="tracking-tight">{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-brand-400/20 text-brand-300 border border-brand-400/30">
                  {item.badge}
                </span>
              )}
              {item.badgeCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white animate-pulse">
                  {item.badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Hardware Telemetry Card */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/60">
        <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Radio className="w-3 h-3 text-sky-400" />
              <span>ESP32 NodeMCU</span>
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
              isOnline 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>

          <div className="text-[11px] text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Machine ID:</span>
              <span className="text-slate-200 font-mono">smartvend_01</span>
            </div>
            <div className="flex justify-between">
              <span>WiFi SSID:</span>
              <span className="text-slate-200 font-medium truncate max-w-[110px]">{deviceStatus?.wifi_ssid || 'No WiFi'}</span>
            </div>
            <div className="flex justify-between">
              <span>IP Address:</span>
              <span className="text-slate-200 font-mono">{deviceStatus?.ip_address || '192.168.1.105'}</span>
            </div>
          </div>

          {/* Mode switch */}
          <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <FlaskConical className="w-3 h-3 text-amber-400" />
              Demo Mode
            </span>
            <button
              onClick={onToggleDemo}
              className={`text-[11px] px-2 py-0.5 rounded font-semibold transition-colors ${
                demoMode 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30' 
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {demoMode ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>
        </div>

        <div className="mt-2 text-center">
          <p className="text-[10px] text-slate-500">
            College Engineering Project • v1.0.4
          </p>
        </div>
      </div>
    </aside>
  );
}
