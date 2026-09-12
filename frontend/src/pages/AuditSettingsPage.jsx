import React, { useState, useEffect } from 'react';
import { auditAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/common/StatusBadge';
import {
  ShieldAlert,
  Search,
  Filter,
  Settings,
  Sliders,
  CheckCircle2,
  Lock,
  Cpu,
  Clock,
  FileText,
  Save,
  Download
} from 'lucide-react';

export const AuditSettingsPage = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('logs'); // 'logs', 'settings'
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL');

  // Settings State
  const [settings, setSettings] = useState({
    aiConfidenceThreshold: 80,
    slaTargetHours: 48,
    geminiModel: 'gemini-3.6-flash',
    malwareScanningEnabled: true,
    requireReviewBelowConfidence: 85,
    autoRouteExceptions: true
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await auditAPI.getLogs({
        action: selectedAction,
        search
      });
      if (res.data.success) {
        setLogs(res.data.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await auditAPI.getSettings();
      if (res.data.success && res.data.settings) {
        setSettings(res.data.settings);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchSettings();
  }, [selectedAction, search]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setSaveSuccess(false);
    try {
      await auditAPI.updateSettings(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      fetchLogs(); // updates audit log with settings change event
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleExportAudit = () => {
    const jsonStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `immutable_university_audit_trail_${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Immutable Audit Logs & Governance Controls
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Tamper-evident audit trail for AI executions, human overrides, and institutional threshold management.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs">
            <Lock className="w-4 h-4 text-emerald-600" /> Non-Repudiable Append-Only Trail
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 text-xs font-bold">
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 px-4 border-b-2 transition-all flex items-center gap-2 ${activeTab === 'logs'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Audit Log Registry ({logs.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 px-4 border-b-2 transition-all flex items-center gap-2 ${activeTab === 'settings'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
          <Sliders className="w-4 h-4" />
          <span>System Thresholds & AI Parameters</span>
        </button>
      </div>

      {/* Tab 1: Audit Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by actor, entity ID, action..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="text-xs p-2 border border-slate-200 rounded-lg bg-white font-medium text-slate-700"
              >
                <option value="ALL">All Event Actions</option>
                <option value="AUTH_LOGIN_SUCCESS">Login Successful</option>
                <option value="DOC_UPLOAD">Document Upload</option>
                <option value="AI_EXTRACT">AI Extraction Run</option>
                <option value="FIELD_OVERRIDE">Human Field Override</option>
                <option value="CASE_APPROVED">Case Approved</option>
                <option value="SETTINGS_UPDATE">Settings Modified</option>
              </select>
            </div>

            <button
              onClick={handleExportAudit}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export JSON
            </button>
          </div>

          <div className="overflow-x-auto">
            {loadingLogs ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading audit logs...
              </div>
            ) : logs.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                <ShieldAlert className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-1" />
                No audit entries match search filter.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-y border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Actor & Role</th>
                    <th className="py-2.5 px-3">Action Event</th>
                    <th className="py-2.5 px-3">Entity</th>
                    <th className="py-2.5 px-3">Event Details</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50 font-mono text-[11px]">
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <p className="font-bold text-slate-900">{log.actorEmail}</p>
                        <p className="text-[10px] text-slate-400">{log.actorRole}</p>
                      </td>
                      <td className="py-3 px-3 font-bold text-brand-700">
                        {log.action}
                      </td>
                      <td className="py-3 px-3 font-sans text-slate-600">
                        {log.entity} {log.entityId && `(${log.entityId})`}
                      </td>
                      <td className="py-3 px-3 max-w-xs truncate text-slate-700" title={log.details}>
                        {log.details}
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <StatusBadge status={log.status || 'SUCCESS'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: System Settings & AI Parameters */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6 max-w-3xl">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">Institutional Thresholds & AI Parameters</h2>
            <p className="text-[11px] text-slate-500">Configure operational boundaries and automatic exception triggers</p>
          </div>

          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Settings updated successfully and logged in the immutable audit trail.
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                AI Confidence Threshold ({settings.aiConfidenceThreshold}%)
              </label>
              <input
                type="range"
                min="50"
                max="95"
                value={settings.aiConfidenceThreshold}
                onChange={(e) => setSettings({ ...settings, aiConfidenceThreshold: parseInt(e.target.value) })}
                className="w-full accent-brand-600"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Extractions below this threshold automatically generate a "LOW_CONFIDENCE" human exception item.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Target SLA Processing Window (Hours)
              </label>
              <input
                type="number"
                min="12"
                max="120"
                value={settings.slaTargetHours}
                onChange={(e) => setSettings({ ...settings, slaTargetHours: parseInt(e.target.value) })}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-medium"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Maximum turnaround hours before supervisor SLA escalation alert is dispatched.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Active Generative AI Model Identifier
              </label>
              <input
                type="text"
                disabled
                value={settings.geminiModel || 'gemini-3.6-flash'}
                className="w-full text-xs p-2.5 border border-slate-200 bg-slate-100 rounded-lg font-mono text-slate-700"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Configured securely on server-side environment via Google Generative Language API.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <label className="flex items-center text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.malwareScanningEnabled}
                  onChange={(e) => setSettings({ ...settings, malwareScanningEnabled: e.target.checked })}
                  className="w-4 h-4 text-brand-600 rounded border-slate-300 mr-2"
                />
                Enforce SecOps ClamAV Signature Scanning on all uploads
              </label>

              <label className="flex items-center text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoRouteExceptions}
                  onChange={(e) => setSettings({ ...settings, autoRouteExceptions: e.target.checked })}
                  className="w-4 h-4 text-brand-600 rounded border-slate-300 mr-2"
                />
                Automatically route identified discrepancies into Reviewer exception queue
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={savingSettings}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" /> Save Configuration & Log
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AuditSettingsPage;

