import React, { useState, useEffect } from 'react';
import { casesAPI, validationAPI } from '../services/api';
import StatusBadge from '../components/common/StatusBadge';
import {
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Play,
  RotateCcw,
  Sparkles,
  UserCheck,
  FileCheck2,
  ArrowRight,
  HelpCircle
} from 'lucide-react';

export const ValidationChecksPage = () => {
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [running, setRunning] = useState(false);

  // Field override modal
  const [overrideModal, setOverrideModal] = useState({
    isOpen: false,
    fieldKey: '',
    currentValue: '',
    newValue: '',
    reason: ''
  });

  useEffect(() => {
    casesAPI.list().then(res => {
      if (res.data.success && res.data.cases?.length > 0) {
        setCases(res.data.cases);
        setSelectedCaseId(res.data.cases[0].id);
      }
    });
  }, []);

  const handleRunValidation = async () => {
    if (!selectedCaseId) return;
    setRunning(true);
    try {
      const res = await validationAPI.run(selectedCaseId);
      if (res.data.success) {
        setValidationResult(res.data.results);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Validation run failed');
    } finally {
      setRunning(false);
    }
  };

  const selectedCase = cases.find(c => c.id === selectedCaseId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Validation & Cross-Document Rule Engine
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Institutional criteria verification, format checks, reference matching, and human override controls.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-brand-600" /> Active Academic Rule Catalog (v2.4)
          </span>
        </div>
      </div>

      {/* Case Selector and Trigger Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3 flex-1 max-w-xl">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap">
            Target Case:
          </label>
          <select
            value={selectedCaseId}
            onChange={(e) => {
              setSelectedCaseId(e.target.value);
              setValidationResult(null);
            }}
            className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-slate-50 font-medium text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
          >
            {cases.map(c => (
              <option key={c.id} value={c.id}>
                {c.caseNumber} &mdash; {c.applicantName} ({c.category})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleRunValidation}
          disabled={running || !selectedCaseId}
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
        >
          {running ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Running Rule Engine...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" /> Execute Comprehensive Rules
            </>
          )}
        </button>
      </div>

      {/* Visual Boundary Guide: AI Suggestion vs Human Business Decision */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-brand-200 bg-brand-50/40">
          <div className="flex items-center space-x-2 text-brand-800 font-bold text-xs mb-1">
            <Sparkles className="w-4 h-4 text-brand-600" />
            <span>AI Automated Suggestion & Extraction Layer</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Gemini 3.6 Flash identifies entities and potential rule violations probabilistically. These are advisory signals and do not constitute binding university legal actions.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40">
          <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs mb-1">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>Authorised Human Business Decision Layer</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            University Reviewers & Department Heads retain ultimate authority to validate, waive, or override flagged items with mandatory audit justifications.
          </p>
        </div>
      </div>

      {/* Rule Results Grid */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Active Rule Evaluation Matrix</h2>
            <p className="text-[11px] text-slate-500">
              Evaluated against Case: <span className="font-mono font-bold text-slate-800">{selectedCase?.caseNumber}</span>
            </p>
          </div>
          {validationResult && (
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${validationResult.allPassed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
              {validationResult.allPassed ? '✓ All Rules Passed' : '⚠ Exceptions Flagged for Review'}
            </span>
          )}
        </div>

        {!validationResult && !running && (
          <div className="py-16 text-center text-slate-400 text-xs">
            <FileCheck2 className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-1" />
            Select a case and click "Execute Comprehensive Rules" to evaluate constraints.
          </div>
        )}

        {validationResult && (
          <div className="space-y-3">
            {validationResult.rules.map((rule, idx) => (
              <div
                key={rule.id || idx}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${rule.passed ? 'bg-white border-slate-200' : 'bg-amber-50/40 border-amber-200'
                  }`}
              >
                <div className="flex items-start space-x-3">
                  {rule.passed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-bold text-slate-900">{rule.ruleName}</h4>
                      <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                        {rule.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{rule.message}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${rule.passed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                    {rule.passed ? 'PASSED' : 'FLAGGED'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ValidationChecksPage;

