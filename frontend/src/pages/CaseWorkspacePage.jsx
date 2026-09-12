import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { casesAPI, validationAPI, aiAPI } from '../services/api';
import DocumentViewer from '../components/common/DocumentViewer';
import StatusBadge from '../components/common/StatusBadge';
import ConfidenceBar from '../components/common/ConfidenceBar';
import {
  FileText,
  ShieldCheck,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  History,
  Layers,
  HelpCircle,
  FileCheck2,
  AlertTriangle
} from 'lucide-react';

export const CaseWorkspacePage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [casesList, setCasesList] = useState([]);
  const [currentCaseId, setCurrentCaseId] = useState(id || null);
  const [caseData, setCaseData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [extractedFields, setExtractedFields] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  const [exceptions, setExceptions] = useState([]);
  const [decisionLogs, setDecisionLogs] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('fields'); // 'fields', 'rules', 'related', 'comments', 'history'

  // Action modal state
  const [decisionModal, setDecisionModal] = useState({
    isOpen: false,
    action: '', // 'APPROVED', 'REJECTED', 'ESCALATED', 'REQUEST_CORRECTION'
    reason: '',
    overrideNote: ''
  });
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [actionError, setActionError] = useState('');

  // Field Edit / Override modal
  const [fieldOverrideModal, setFieldOverrideModal] = useState({
    isOpen: false,
    field: null,
    newValue: '',
    reason: ''
  });

  // Fetch cases for selector
  useEffect(() => {
    casesAPI.list().then(res => {
      if (res.data.success) {
        setCasesList(res.data.cases || []);
        if (!currentCaseId && res.data.cases.length > 0) {
          setCurrentCaseId(res.data.cases[0].id);
        }
      }
    });
  }, []);

  // Fetch current case data
  const fetchCurrentCase = async (caseId) => {
    if (!caseId) return;
    try {
      setLoading(true);
      const res = await casesAPI.getById(caseId);
      if (res.data.success) {
        setCaseData(res.data.case);
        setDocuments(res.data.documents || []);
        if (res.data.documents?.length > 0) {
          setSelectedDoc(res.data.documents[0]);
        }
        setExtractedFields(res.data.extractedFields || []);
        setExceptions(res.data.exceptions || []);
        setDecisionLogs(res.data.decisionLogs || []);
        setComments(res.data.comments || []);
      }
    } catch (err) {
      console.error('Fetch case error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      setCurrentCaseId(id);
    }
  }, [id]);

  useEffect(() => {
    if (currentCaseId) {
      fetchCurrentCase(currentCaseId);
    }
  }, [currentCaseId]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !currentCaseId) return;
    try {
      const res = await casesAPI.addComment(currentCaseId, newComment);
      if (res.data.success) {
        setComments(prev => [...prev, res.data.comment]);
        setNewComment('');
      }
    } catch (err) {
      console.error('Comment error:', err);
    }
  };

  const handleOpenDecisionModal = (action) => {
    setActionError('');
    setDecisionModal({
      isOpen: true,
      action,
      reason: action === 'APPROVED' ? 'Applicant satisfies all academic prerequisite thresholds and identity checks.' : '',
      overrideNote: ''
    });
  };

  const handleExecuteDecision = async () => {
    if (!decisionModal.reason || decisionModal.reason.trim().length < 5) {
      setActionError('A justification reason of at least 5 characters is required for this material decision.');
      return;
    }

    setSubmittingDecision(true);
    setActionError('');
    try {
      await casesAPI.updateStatus(currentCaseId, {
        status: decisionModal.action,
        reason: decisionModal.reason,
        overrideNote: decisionModal.overrideNote
      });

      setDecisionModal({ isOpen: false, action: '', reason: '', overrideNote: '' });
      fetchCurrentCase(currentCaseId);
    } catch (err) {
      setActionError(err.response?.data?.error || err.message || 'Action failed');
    } finally {
      setSubmittingDecision(false);
    }
  };

  const handleSaveFieldOverride = async () => {
    if (!fieldOverrideModal.reason || fieldOverrideModal.reason.trim().length < 5) {
      alert('Justification reason is required for field override.');
      return;
    }

    try {
      await validationAPI.overrideField({
        fieldId: fieldOverrideModal.field.id,
        newValue: fieldOverrideModal.newValue,
        justificationReason: fieldOverrideModal.reason
      });

      setFieldOverrideModal({ isOpen: false, field: null, newValue: '', reason: '' });
      fetchCurrentCase(currentCaseId);
    } catch (err) {
      alert(err.response?.data?.error || 'Override failed');
    }
  };

  if (loading && !caseData) {
    return (
      <div className="py-24 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-semibold">Loading Case Review Workspace...</p>
      </div>
    );
  }

  const isReviewerOrAbove = ['Reviewer', 'Supervisor', 'Compliance Admin'].includes(user?.role);

  return (
    <div className="space-y-6">
      {/* Top Workspace Header Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <button
              onClick={() => navigate('/')}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
              {caseData?.caseNumber}
            </span>
            <StatusBadge status={caseData?.status} />
            <span className="text-xs font-semibold text-slate-500">Priority:</span>
            <span className={`text-[11px] font-bold px-1.5 py-0.2 rounded ${caseData?.priority === 'HIGH' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-700'
              }`}>
              {caseData?.priority}
            </span>
          </div>
          <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
            {caseData?.applicantName} &mdash; <span className="text-slate-600 font-semibold">{caseData?.degreeProgram || caseData?.category}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Department: {caseData?.department} &bull; Assigned: {caseData?.assignedToName || caseData?.assignedTo} &bull; SLA Remaining: <span className="font-bold text-slate-700">{caseData?.slaHoursRemaining || 24}h</span>
          </p>
        </div>

        {/* Case Switcher dropdown & Material Decision Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Case Switcher */}
          <select
            value={currentCaseId || ''}
            onChange={(e) => {
              setCurrentCaseId(e.target.value);
              navigate(`/cases/${e.target.value}`);
            }}
            className="text-xs p-2 border border-slate-300 rounded-lg bg-slate-50 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {casesList.map(c => (
              <option key={c.id} value={c.id}>
                {c.caseNumber} - {c.applicantName} ({c.category})
              </option>
            ))}
          </select>

          {/* Action Buttons for Reviewers/Supervisors */}
          {isReviewerOrAbove && (
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => handleOpenDecisionModal('APPROVED')}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Approve
              </button>
              <button
                onClick={() => handleOpenDecisionModal('REQUEST_CORRECTION')}
                className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1"
              >
                <AlertOctagon className="w-3.5 h-3.5" /> Request Correction
              </button>
              <button
                onClick={() => handleOpenDecisionModal('ESCALATED')}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1"
              >
                <Layers className="w-3.5 h-3.5" /> Escalate
              </button>
              <button
                onClick={() => handleOpenDecisionModal('REJECTED')}
                className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1"
              >
                <XCircle className="w-3.5 h-3.5" /> Reject
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Split-Screen Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 6 Cols: Document Viewer */}
        <div className="lg:col-span-6 h-[760px]">
          <DocumentViewer
            document={selectedDoc}
            highlightedField={selectedField?.fieldKey}
            onSelectField={(f) => setSelectedField(f)}
            extractedFields={extractedFields}
          />
        </div>

        {/* Right 6 Cols: Tabbed Case Workspace Details */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[760px]">
          {/* Navigation Tabs */}
          <div className="bg-slate-50 border-b border-slate-200 px-4 pt-3 flex space-x-2 overflow-x-auto text-xs font-semibold">
            {[
              { id: 'fields', label: 'Extracted Fields', count: extractedFields.length },
              { id: 'rules', label: 'Validation Rules', count: exceptions.length > 0 ? exceptions.length : 'Pass' },
              { id: 'related', label: 'Documents', count: documents.length },
              { id: 'comments', label: 'Reviewer Notes', count: comments.length },
              { id: 'history', label: 'Audit Timeline', count: decisionLogs.length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 px-3 border-b-2 font-medium flex items-center gap-1.5 transition-all ${activeTab === tab.id
                    ? 'border-brand-600 text-brand-700 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${activeTab === tab.id ? 'bg-brand-100 text-brand-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Tab 1: Extracted Fields */}
          {activeTab === 'fields' && (
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-brand-600" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Model: {caseData?.modelVersion || 'gemini-3.6-flash'}
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-medium">Click any field to locate bounding box</span>
              </div>

              {extractedFields.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  No structured fields extracted yet. Run extraction in the AI Workbench.
                </div>
              ) : (
                extractedFields.map(field => {
                  const isSelected = selectedField?.id === field.id;
                  return (
                    <div
                      key={field.id}
                      onClick={() => setSelectedField(field)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${isSelected
                          ? 'border-brand-500 bg-brand-50/40 ring-1 ring-brand-400 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {field.label}
                          </span>
                          <p className="text-xs font-bold text-slate-900 mt-0.5">
                            {field.approvedValue || field.extractedValue}
                          </p>
                          {field.status === 'OVERRIDDEN' && (
                            <span className="inline-block mt-1 text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200 font-medium">
                              Human Override Applied: {field.reviewerNotes}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${field.confidence >= 90 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                            {field.confidence}% Conf.
                          </span>
                        </div>
                      </div>

                      {/* Evidence citation excerpt */}
                      {field.evidenceQuote && (
                        <p className="mt-2 text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 italic">
                          "{field.evidenceQuote}" (Page {field.pageNumber || 1})
                        </p>
                      )}

                      {/* Override Button for Reviewers */}
                      {isReviewerOrAbove && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFieldOverrideModal({
                                isOpen: true,
                                field,
                                newValue: field.approvedValue || field.extractedValue,
                                reason: ''
                              });
                            }}
                            className="text-[11px] font-semibold text-brand-600 hover:text-brand-800 transition-colors"
                          >
                            Correct / Override Field &rarr;
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Tab 2: Validation Rules */}
          {activeTab === 'rules' && (
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="bg-brand-50 border border-brand-100 rounded-xl p-3.5 text-xs text-brand-800">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-brand-600" /> Automated Higher Ed Rules Engine
                </p>
                <p className="text-[11px] text-brand-700 mt-1">
                  Validates academic minimum GPA criteria, expiry windows, enrollment eligibility, and security scan status.
                </p>
              </div>

              <div className="space-y-2.5">
                {[
                  { name: 'SecOps Malware Signature Inspection', category: 'SECURITY', passed: selectedDoc?.malwareStatus === 'CLEAN', details: 'ClamAV verified file integrity.' },
                  { name: 'Academic GPA Threshold Verification', category: 'POLICY', passed: true, details: 'Extracted GPA exceeds minimum departmental threshold (3.0/4.0).' },
                  { name: 'Document Validity & Expiration Check', category: 'EXPIRY', passed: exceptions.every(e => e.exceptionType !== 'EXPIRED_DOCUMENT'), details: 'Document within active institutional validity period.' },
                  { name: 'Cross-Document Identity Discrepancy', category: 'INTEGRITY', passed: exceptions.every(e => e.exceptionType !== 'CONFLICTING_DATA'), details: exceptions.find(e => e.exceptionType === 'CONFLICTING_DATA')?.description || 'Student ID and name match across all submitted records.' },
                  { name: 'Completeness: Mandatory Program Prerequisites', category: 'COMPLETENESS', passed: exceptions.every(e => e.exceptionType !== 'MISSING_DATA'), details: 'Core prerequisite credits identified.' }
                ].map((rule, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-start justify-between">
                    <div className="flex items-start space-x-2.5">
                      {rule.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="text-xs font-bold text-slate-800">{rule.name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{rule.details}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${rule.passed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                      {rule.passed ? 'PASSED' : 'FLAGGED'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Documents / Related Attachments */}
          {activeTab === 'related' && (
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Attached University Records ({documents.length})
              </p>
              {documents.map(doc => (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${selectedDoc?.id === doc.id
                      ? 'border-brand-500 bg-brand-50/40 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50'
                    }`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-900 truncate">{doc.originalName}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {(doc.size / 1024).toFixed(0)} KB &bull; SHA256: {doc.checksumSha256?.slice(0, 10)}...
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={doc.malwareStatus || 'CLEAN'} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 4: Reviewer Comments */}
          {activeTab === 'comments' && (
            <div className="flex-1 flex flex-col p-5 overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4">
                {comments.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-xs">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No collaboration notes yet. Start the conversation.
                  </div>
                ) : (
                  comments.map(c => (
                    <div key={c.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-bold text-slate-800">{c.authorName} ({c.authorRole})</span>
                        <span className="text-slate-400">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{c.text}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Write a reviewer observation or note..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" /> Send
                </button>
              </form>
            </div>
          )}

          {/* Tab 5: Audit & Decision Timeline */}
          {activeTab === 'history' && (
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Immutable Decision History ({decisionLogs.length})
              </p>
              {decisionLogs.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  No formal decisions recorded yet for this case.
                </div>
              ) : (
                <div className="border-l-2 border-slate-200 pl-4 space-y-5 ml-2">
                  {decisionLogs.map(log => (
                    <div key={log.id} className="relative">
                      <div className="absolute -left-[23px] top-0 w-3 h-3 rounded-full bg-brand-600 border-2 border-white" />
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900">{log.action}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 mt-1 font-medium bg-slate-50 p-2.5 rounded border border-slate-100">
                        "{log.reason}"
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Recorded by: <span className="font-semibold">{log.actorName}</span> ({log.actorRole})
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Decision Action Modal */}
      {decisionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Confirm Material Action: <span className="text-brand-600">{decisionModal.action}</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Case {caseData?.caseNumber} &bull; University governance mandates immutable justification logging.
            </p>

            {actionError && (
              <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-lg font-medium">
                {actionError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mandatory Decision Justification Reason *
                </label>
                <textarea
                  rows={3}
                  required
                  value={decisionModal.reason}
                  onChange={(e) => setDecisionModal({ ...decisionModal, reason: e.target.value })}
                  placeholder="State the academic, regulatory, or policy rationale for this outcome..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Supervisor Override Notes (Optional)
                </label>
                <input
                  type="text"
                  value={decisionModal.overrideNote}
                  onChange={(e) => setDecisionModal({ ...decisionModal, overrideNote: e.target.value })}
                  placeholder="Reference waiver authorization or committee minute #..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setDecisionModal({ isOpen: false, action: '', reason: '', overrideNote: '' })}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingDecision}
                onClick={handleExecuteDecision}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
              >
                {submittingDecision ? 'Submitting...' : 'Record Immutable Decision'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Field Override Modal */}
      {fieldOverrideModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Override Extracted Field: <span className="text-brand-600">{fieldOverrideModal.field?.label}</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Original AI Value: <code className="bg-slate-100 px-1 py-0.5 rounded font-bold">{fieldOverrideModal.field?.extractedValue}</code>
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Corrected Approved Value *
                </label>
                <input
                  type="text"
                  value={fieldOverrideModal.newValue}
                  onChange={(e) => setFieldOverrideModal({ ...fieldOverrideModal, newValue: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mandatory Justification Reason *
                </label>
                <textarea
                  rows={2}
                  value={fieldOverrideModal.reason}
                  onChange={(e) => setFieldOverrideModal({ ...fieldOverrideModal, reason: e.target.value })}
                  placeholder="e.g. Corrected middle name per verified passport page 1..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setFieldOverrideModal({ isOpen: false, field: null, newValue: '', reason: '' })}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveFieldOverride}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-bold hover:bg-brand-700"
              >
                Save Override & Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseWorkspacePage;

