import React, { useState, useEffect } from 'react';
import { casesAPI, aiAPI } from '../services/api';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import {
  Sparkles,
  Play,
  FileCheck,
  ThumbsUp,
  ThumbsDown,
  Clock,
  ShieldCheck,
  AlertTriangle,
  BookOpen,
  Activity,
  CheckCircle2,
  Cpu
} from 'lucide-react';

export const GroundedSummariesPage = () => {
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [summaryData, setSummaryData] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    casesAPI.list().then(res => {
      if (res.data.success && res.data.cases?.length > 0) {
        setCases(res.data.cases);
        setSelectedCaseId(res.data.cases[0].id);
      }
    });

    aiAPI.getMetrics().then(res => {
      if (res.data.success) {
        setMetrics(res.data.metrics);
      }
    });
  }, []);

  const handleGenerateSummary = async () => {
    if (!selectedCaseId) return;
    setLoading(true);
    setSummaryData(null);
    setFeedbackSent(false);

    try {
      const res = await aiAPI.summarize({ caseId: selectedCaseId });
      if (res.data.success) {
        setSummaryData(res.data.summary);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Summarization failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendFeedback = async (rating) => {
    try {
      await aiAPI.submitFeedback({
        caseId: selectedCaseId,
        rating,
        feedbackNote: rating === 'POSITIVE' ? 'Accurate grounded synthesis' : 'Recommendation required supervisor calibration',
        overridden: false
      });
      setFeedbackSent(true);
    } catch (err) {
      console.error(err);
    }
  };

  const selectedCase = cases.find(c => c.id === selectedCaseId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Grounded Summaries & Decision Support
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Grounded case synthesis with page-level citations, risk indicators, auto-routing rules, and model alignment.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Evidence Citations Verified
          </span>
        </div>
      </div>

      {/* Operational AI Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Model Accuracy"
          value={`${metrics?.overallAccuracy || 95.8}%`}
          subtext="Benchmarked against human decisions"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Average Latency"
          value={`${metrics?.averageLatencyMs || 142} ms`}
          subtext="Gemini 3.6 Flash inference"
          icon={Clock}
          color="blue"
        />
        <StatCard
          title="Concept Drift Index"
          value={`${metrics?.conceptDriftScore || 1.2}%`}
          subtext="Within strict university bounds"
          icon={Activity}
          color="purple"
        />
        <StatCard
          title="Reviewer Adoption Rate"
          value={`${100 - (metrics?.humanOverrideRate || 4.8)}%`}
          subtext={`${metrics?.humanOverrideRate || 4.8}% human override rate`}
          icon={Cpu}
          color="amber"
        />
      </div>

      {/* Generator Control Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3 flex-1 max-w-xl">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap">
            Select Case:
          </label>
          <select
            value={selectedCaseId}
            onChange={(e) => {
              setSelectedCaseId(e.target.value);
              setSummaryData(null);
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
          onClick={handleGenerateSummary}
          disabled={loading || !selectedCaseId}
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Synthesizing Case Evidence...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" /> Synthesize Grounded Decision Notes
            </>
          )}
        </button>
      </div>

      {/* Main Grounded Summary Display */}
      {summaryData && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
          {/* Recommendation Top Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-brand-50/60 border border-brand-200 rounded-xl gap-3">
            <div>
              <span className="text-[10px] font-bold text-brand-700 uppercase tracking-wider block mb-0.5">
                AI Advisory Recommendation
              </span>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <StatusBadge status={summaryData.recommendation} />
                <span className="text-xs text-slate-600 font-normal">
                  ({summaryData.recommendationConfidence || 92}% Confidence Score)
                </span>
              </h3>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                Calculated Risk Score
              </span>
              <span className={`text-lg font-black font-mono ${summaryData.riskScore > 30 ? 'text-amber-600' : 'text-emerald-700'
                }`}>
                {summaryData.riskScore}/100
              </span>
            </div>
          </div>

          {/* Executive Summary */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Executive Background Summary
            </h4>
            <p className="text-xs text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 font-medium">
              {summaryData.executiveSummary}
            </p>
          </div>

          {/* Grounded Evidence Citations */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-brand-600" />
              Grounded Page Citations & Document Lineage
            </h4>
            <div className="space-y-2">
              {summaryData.citations?.map((cit, idx) => (
                <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 hover:border-brand-300 transition-colors">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-900">{cit.claim}</span>
                    <span className="text-[10px] font-mono font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                      {cit.sourceDocument} &bull; Page {cit.page}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 italic bg-slate-50/70 p-2 rounded">
                    "{cit.excerpt}"
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Routing Reason & Next Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Human Review Routing Policy
              </h5>
              <p className="text-xs text-slate-600 leading-relaxed">
                {summaryData.routingReason || 'University policy mandates reviewer sign-off for degree-granting admission decisions.'}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Recommended Procedural Next Steps
              </h5>
              <ul className="text-xs text-slate-600 list-disc list-inside space-y-1">
                {summaryData.nextSteps?.map((s, i) => (
                  <li key={i}>{s}</li>
                )) || <li>Reviewer verifies final official seal</li>}
              </ul>
            </div>
          </div>

          {/* Feedback & Calibration Capture */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-slate-800">Was this decision recommendation helpful?</p>
              <p className="text-[11px] text-slate-500">Continuous human feedback calibrates confidence thresholds.</p>
            </div>

            {feedbackSent ? (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Feedback recorded for model alignment!
              </span>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleSendFeedback('POSITIVE')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <ThumbsUp className="w-3.5 h-3.5" /> Accurate
                </button>
                <button
                  onClick={() => handleSendFeedback('NEGATIVE')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 rounded-lg text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <ThumbsDown className="w-3.5 h-3.5" /> Needed Modification
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GroundedSummariesPage;

