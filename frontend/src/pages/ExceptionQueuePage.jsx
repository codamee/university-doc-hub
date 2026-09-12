import React, { useState, useEffect } from 'react';
import { exceptionsAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../components/common/StatusBadge';
import {
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  ArrowUpRight,
  ShieldAlert,
  FileQuestion,
  FileWarning,
  Copy,
  CalendarX2,
  Sparkles
} from 'lucide-react';

export const ExceptionQueuePage = () => {
  const navigate = useNavigate();

  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('OPEN');

  // Resolution modal
  const [resolveModal, setResolveModal] = useState({
    isOpen: false,
    exception: null,
    action: 'APPROVE', // 'APPROVE', 'REJECT', 'REQUEST_CORRECTION', 'OVERRIDE', 'ESCALATE'
    reason: '',
    correctionNote: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const exceptionTypes = [
    { id: 'MISSING_DATA', label: 'Missing Information', icon: FileQuestion },
    { id: 'CONFLICTING_DATA', label: 'Conflicting Data', icon: FileWarning },
    { id: 'LOW_CONFIDENCE', label: 'Low-Confidence (<80%)', icon: Sparkles },
    { id: 'EXPIRED_DOCUMENT', label: 'Expired Document', icon: CalendarX2 },
    { id: 'DUPLICATE_SUBMISSION', label: 'Duplicate Document Hash', icon: Copy }
  ];

  const fetchExceptions = async () => {
    try {
      setLoading(true);
      const res = await exceptionsAPI.list({
        type: selectedType,
        severity: selectedSeverity,
        status: selectedStatus
      });
      if (res.data.success) {
        setExceptions(res.data.exceptions || []);
      }
    } catch (err) {
      console.error('Fetch exceptions error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExceptions();
  }, [selectedType, selectedSeverity, selectedStatus]);

  const handleOpenResolveModal = (exc, defaultAction = 'APPROVE') => {
    setErrorMsg('');
    setResolveModal({
      isOpen: true,
      exception: exc,
      action: defaultAction,
      reason: defaultAction === 'APPROVE' ? 'Institutional exception waiver approved following supervisory review.' : '',
      correctionNote: ''
    });
  };

  const handleExecuteResolution = async () => {
    if (!resolveModal.reason || resolveModal.reason.trim().length < 5) {
      setErrorMsg('A mandatory justification reason (min 5 characters) is required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      await exceptionsAPI.resolve(resolveModal.exception.id, {
        action: resolveModal.action,
        reason: resolveModal.reason,
        correctionNote: resolveModal.correctionNote
      });

      setResolveModal({ isOpen: false, exception: null, action: 'APPROVE', reason: '', correctionNote: '' });
      fetchExceptions();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message || 'Resolution failed');
    } finally {
      setSubmitting(false);
    }
  };

  const criticalCount = exceptions.filter(e => e.severity === 'CRITICAL').length;
  const warningCount = exceptions.filter(e => e.severity === 'WARNING').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Exception Review Queues
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Human-in-the-loop governance for missing data, optical ambiguity, identity discrepancies, and expired records.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs">
            <AlertOctagon className="w-4 h-4 text-rose-600" /> {criticalCount} Critical Exceptions
          </span>
          <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600" /> {warningCount} Warnings
          </span>
        </div>
      </div>

      {/* Exception Categories Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {exceptionTypes.map(item => {
          const Icon = item.icon;
          const isSelected = selectedType === item.id;
          const count = exceptions.filter(e => e.exceptionType === item.id).length;
          return (
            <button
              key={item.id}
              onClick={() => setSelectedType(isSelected ? 'ALL' : item.id)}
              className={`p-3.5 rounded-xl border text-left transition-all ${isSelected
                  ? 'border-brand-600 bg-brand-50/70 shadow-xs ring-1 ring-brand-500'
                  : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Icon className={`w-4 h-4 ${isSelected ? 'text-brand-600' : 'text-slate-500'}`} />
                <span className="text-xs font-bold font-mono text-slate-700">{count}</span>
              </div>
              <p className={`text-xs font-bold truncate ${isSelected ? 'text-brand-900' : 'text-slate-800'}`}>
                {item.label}
              </p>
            </button>
          );
        })}
      </div>

      {/* Filter and Table Container */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Queue Status:</span>
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
              {['OPEN', 'RESOLVED', 'ALL'].map(st => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`px-3 py-1 rounded-md font-semibold transition-all ${selectedStatus === st
                      ? 'bg-white text-brand-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="text-xs p-2 border border-slate-200 rounded-lg bg-white font-medium text-slate-700"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="WARNING">Warning</option>
              <option value="NORMAL">Normal</option>
            </select>
          </div>
        </div>

        {/* Exceptions Table */}
        <div className="mt-4 overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading exception records...
            </div>
          ) : exceptions.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-400 stroke-1" />
              No pending exceptions in this queue. All documents verified!
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-y border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Severity & Type</th>
                  <th className="py-2.5 px-3">Case Reference</th>
                  <th className="py-2.5 px-3">Discrepancy Details</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exceptions.map(exc => (
                  <tr key={exc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="flex items-center space-x-2">
                        <StatusBadge status={exc.severity} />
                        <span className="text-[11px] font-bold text-slate-700 font-mono">
                          {exc.exceptionType}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <p className="font-mono font-bold text-brand-700">{exc.caseNumber}</p>
                      <p className="text-[11px] text-slate-600 font-medium">{exc.applicantName}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{exc.category}</p>
                    </td>
                    <td className="py-3.5 px-3 max-w-md">
                      <p className="text-slate-800 text-xs font-medium leading-relaxed">
                        {exc.description}
                      </p>
                      {exc.resolutionReason && (
                        <p className="text-[11px] text-emerald-700 mt-1 font-mono bg-emerald-50 p-1.5 rounded border border-emerald-100">
                          Resolution: {exc.resolutionReason} (by {exc.resolvedByName || exc.resolvedBy})
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      <StatusBadge status={exc.status} />
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => navigate(`/cases/${exc.caseId}`)}
                          className="p-1.5 text-slate-500 hover:text-brand-600 rounded hover:bg-slate-100"
                          title="Open Case Evidence"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                        {exc.status === 'OPEN' && (
                          <>
                            <button
                              onClick={() => handleOpenResolveModal(exc, 'APPROVE')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-bold shadow-xs transition-colors"
                            >
                              Waive / Approve
                            </button>
                            <button
                              onClick={() => handleOpenResolveModal(exc, 'REQUEST_CORRECTION')}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-[11px] font-bold shadow-xs transition-colors"
                            >
                              Correction
                            </button>
                            <button
                              onClick={() => handleOpenResolveModal(exc, 'ESCALATE')}
                              className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-[11px] font-bold shadow-xs transition-colors"
                            >
                              Escalate
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Resolve Exception Modal */}
      {resolveModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Resolve Exception: <span className="text-brand-600">{resolveModal.exception?.caseNumber}</span>
            </h3>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              Discrepancy: {resolveModal.exception?.description}
            </p>

            {errorMsg && (
              <div className="mb-3 p-2 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-lg font-medium">
                {errorMsg}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Resolution Action
                </label>
                <select
                  value={resolveModal.action}
                  onChange={(e) => setResolveModal({ ...resolveModal, action: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value="APPROVE">Approve with Institutional Policy Waiver</option>
                  <option value="OVERRIDE">Override with Human Field Evidence</option>
                  <option value="REQUEST_CORRECTION">Request Document Correction from Applicant</option>
                  <option value="ESCALATE">Escalate to Department Head / Supervisor</option>
                  <option value="REJECT">Reject Credential</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mandatory Justification Reason *
                </label>
                <textarea
                  rows={3}
                  value={resolveModal.reason}
                  onChange={(e) => setResolveModal({ ...resolveModal, reason: e.target.value })}
                  placeholder="Record policy citation, verified external registry link, or supervisor authorization..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setResolveModal({ isOpen: false, exception: null, action: 'APPROVE', reason: '', correctionNote: '' })}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleExecuteResolution}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
              >
                {submitting ? 'Resolving...' : 'Commit Resolution'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExceptionQueuePage;

