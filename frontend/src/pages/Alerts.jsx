import React, { useState } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  AlertOctagon, 
  Info, 
  CheckCircle2, 
  Trash2, 
  Check, 
  Clock, 
  ShieldAlert,
  Filter
} from 'lucide-react';
import { acknowledgeAlert, deleteAlert } from '../api';

export default function Alerts({ alerts, onRefresh }) {
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [loadingId, setLoadingId] = useState(null);

  const handleAcknowledge = async (id) => {
    setLoadingId(id);
    try {
      await acknowledgeAlert(id);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(`Failed to acknowledge alert: ${err.message}`);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAlert(id);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(`Failed to delete alert: ${err.message}`);
    }
  };

  const filteredAlerts = alerts?.filter(a => {
    if (filterSeverity === 'ALL') return true;
    return a.severity?.toUpperCase() === filterSeverity;
  }) || [];

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & FILTER TOOLBAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Alerts & Hardware Diagnostics</h2>
          <p className="text-xs text-slate-500">Autonomous triggers for low stock, IR sensor drop timeouts, and ESP32 connectivity</p>
        </div>

        {/* Severity Filter Pills */}
        <div className="flex items-center space-x-1.5 text-xs bg-white p-1 rounded-lg border border-slate-200">
          {['ALL', 'DANGER', 'WARNING', 'INFO'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                filterSeverity === sev 
                  ? 'bg-slate-900 text-white shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* 2. ALERTS FEED */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center text-xs">
          <span className="font-bold text-slate-900">
            Active Alarms ({filteredAlerts.length})
          </span>
          <span className="text-slate-400">
            Ordered by priority & recency
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredAlerts.map((alert) => {
            const isDanger = alert.severity === 'danger';
            const isWarning = alert.severity === 'warning';
            const isAcknowledged = Boolean(alert.is_acknowledged);

            return (
              <div 
                key={alert.id}
                className={`p-4 transition-colors flex items-start justify-between gap-4 ${
                  isAcknowledged ? 'bg-slate-50/70 opacity-70' : 'bg-white hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    isDanger 
                      ? 'bg-rose-50 text-rose-600 border border-rose-200' 
                      : isWarning
                      ? 'bg-amber-50 text-amber-600 border border-amber-200'
                      : 'bg-blue-50 text-blue-600 border border-blue-200'
                  }`}>
                    {isDanger ? (
                      <AlertOctagon className="w-5 h-5" />
                    ) : isWarning ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <Info className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-sm text-slate-900">{alert.title}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        isDanger 
                          ? 'bg-rose-100 text-rose-800' 
                          : isWarning
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {alert.severity}
                      </span>
                      {isAcknowledged && (
                        <span className="text-[10px] font-medium text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">
                          Acknowledged
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                      {alert.message}
                    </p>

                    <div className="flex items-center space-x-3 mt-2 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {alert.created_at}
                      </span>
                      {alert.product_name && (
                        <span>• Target: <strong>{alert.product_name}</strong></span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 shrink-0">
                  {!isAcknowledged && (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      disabled={loadingId === alert.id}
                      className="px-2.5 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors border border-brand-200"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Acknowledge</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(alert.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Dismiss / Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredAlerts.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
              <span>All clear! No active system alerts matching your filter.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
