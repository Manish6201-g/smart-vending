import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import LiveMachine from './pages/LiveMachine';
import AiPredictions from './pages/AiPredictions';
import SalesAnalytics from './pages/SalesAnalytics';
import Inventory from './pages/Inventory';
import SmartRestocking from './pages/SmartRestocking';
import GlobalTrends from './pages/GlobalTrends';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';

import { 
  getDeviceStatus, 
  getProducts, 
  getSalesAnalytics, 
  getForecast, 
  getAlerts,
  setDemoMode as apiSetDemoMode
} from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Core state
  const [deviceStatus, setDeviceStatus] = useState(null);
  const [products, setProducts] = useState([]);
  const [salesData, setSalesData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [demoMode, setDemoModeState] = useState(false);
  const [salesFilter, setSalesFilter] = useState({});

  // Fetch all primary operational telemetry
  const loadDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsRefreshing(true);
    try {
      const [statusRes, productsRes, salesRes, forecastRes, alertsRes] = await Promise.all([
        getDeviceStatus().catch(err => ({ device: { online_status: 0, machine_id: 'smartvend_01' }, slots: [] })),
        getProducts().catch(err => []),
        getSalesAnalytics(salesFilter).catch(err => ({ kpis: {}, transactions: [] })),
        getForecast().catch(err => ({ products: [], total_7day_predicted_demand: 0 })),
        getAlerts().catch(err => [])
      ]);

      setDeviceStatus(statusRes.device);
      setProducts(productsRes);
      setSalesData(salesRes);
      setForecastData(forecastRes);
      setAlerts(alertsRes);
      setDemoModeState(Boolean(statusRes.device?.demo_mode));
      setLastSyncTime(new Date());
    } catch (err) {
      console.error("Dashboard synchronization error:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [salesFilter]);

  useEffect(() => {
    loadDashboardData();

    // Auto-polling telemetry interval every 8 seconds
    const interval = setInterval(() => {
      loadDashboardData(true);
    }, 8000);

    return () => clearInterval(interval);
  }, [loadDashboardData]);

  // Toggle demo mode
  const handleToggleDemo = async () => {
    const nextMode = !demoMode;
    setDemoModeState(nextMode);
    try {
      await apiSetDemoMode(nextMode);
      loadDashboardData(true);
    } catch (err) {
      console.error(err);
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard Overview';
      case 'monitoring': return 'Live Cardboard Vending Machine Monitor';
      case 'ai-forecast': return 'AI Demand Forecasting & Predictions';
      case 'analytics': return 'Sales Analytics & Dispense Records';
      case 'inventory': return 'Inventory & Slot Management';
      case 'restocking': return 'Smart AI Restocking Recommendations';
      case 'trends': return 'Global Vending Market Trends';
      case 'alerts': return 'System Alerts & Diagnostics';
      case 'settings': return 'Hardware & ESP32 Configuration';
      default: return 'SmartVend AI';
    }
  };

  const unreadAlertsCount = alerts.filter(a => !a.is_acknowledged).length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800">
      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        alertsCount={unreadAlertsCount}
        deviceStatus={deviceStatus}
        demoMode={demoMode}
        onToggleDemo={handleToggleDemo}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar 
          activeTabTitle={getTabTitle()}
          lastSyncTime={lastSyncTime}
          onRefresh={() => loadDashboardData(false)}
          isRefreshing={isRefreshing}
          deviceStatus={deviceStatus}
          onDispenseSuccess={() => loadDashboardData(true)}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#f8fafc]">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
              <p className="text-xs font-semibold text-slate-500">
                Synchronizing SmartVend AI Telemetry & SQLite Database...
              </p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <Dashboard 
                  salesData={salesData} 
                  products={products} 
                  deviceStatus={deviceStatus} 
                  forecastData={forecastData}
                  alerts={alerts}
                  onNavigate={setActiveTab}
                />
              )}

              {activeTab === 'monitoring' && (
                <LiveMachine 
                  deviceStatus={deviceStatus} 
                  products={products}
                  onRefresh={() => loadDashboardData(true)}
                />
              )}

              {activeTab === 'ai-forecast' && (
                <AiPredictions 
                  forecastData={forecastData} 
                  onNavigate={setActiveTab}
                />
              )}

              {activeTab === 'analytics' && (
                <SalesAnalytics 
                  salesData={salesData} 
                  products={products}
                  onFilterApply={(filters) => {
                    setSalesFilter(filters);
                  }}
                />
              )}

              {activeTab === 'inventory' && (
                <Inventory 
                  products={products}
                  onRefresh={() => loadDashboardData(true)}
                />
              )}

              {activeTab === 'restocking' && (
                <SmartRestocking 
                  forecastData={forecastData}
                  onRefresh={() => loadDashboardData(true)}
                />
              )}

              {activeTab === 'trends' && (
                <GlobalTrends />
              )}

              {activeTab === 'alerts' && (
                <Alerts 
                  alerts={alerts}
                  onRefresh={() => loadDashboardData(true)}
                />
              )}

              {activeTab === 'settings' && (
                <Settings 
                  deviceStatus={deviceStatus}
                  demoMode={demoMode}
                  onToggleDemo={handleToggleDemo}
                  onRefresh={() => loadDashboardData(true)}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
