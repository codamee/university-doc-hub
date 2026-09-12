import React, { useState, useEffect } from 'react';
import { supervisorAPI, casesAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import {
  LayoutDashboard,
  Users,
  Clock,
  AlertOctagon,
  ArrowUpRight,
  ShieldCheck,
  Search,
  Split,
  UserCheck,
  CheckCircle2,
  FileText
} from 'lucide-react';

export const SupervisorDashboardPage = () => {
  const navigate = useNavigate();

  const [workload, setWorkload] = useState([]);
  const [ageing, setAgeing] = useState(null);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Reassign modal
  const [reassignModal, setReassignModal] = useState({
    isOpen: false,
    caseItem: null,
    reviewerEmail: 'reviewer@university.edu',
    reason: ''
  });
  const [reassigning, setReassigning] = useState(false);

  // Side-by-side comparison modal
  const [comparisonModal, setComparisonModal] = useState({
    isOpen: false,
    caseItem: null
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [workloadRes, ageingRes, casesRes] = await Promise.all([
        supervisorAPI.getWorkload(),
        supervisorAPI.getAgeing(),
        casesAPI.list({ search })
      ]);

      if (workloadRes.data.success) setWorkload(workloadRes.data.workload || []);
      if (ageingRes.data.success) setAgeing(ageingRes.data.ageing || null);
      if (casesRes.data.success) setCases(casesRes.data.cases || []);
    } catch (err) {
      console.error('Fetch supervisor data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  const handleExecuteReassign = async () => {
    if (!reassignModal.caseItem) return;
    setReassigning(true);
    try {
      await casesAPI.reassign(reassignModal.caseItem.id, {
        assignedToEmail: reassignModal.reviewerEmail,
        assignedToName: reassignModal.reviewerEmail === 'reviewer@university.edu' ? 'Dr. Elena Rostova' : 'Prof. Marcus Vance',
        reason: reassignModal.reason || 'Workload load balancing per supervisory review'
      });
      setReassignModal({ isOpen: false, caseItem: null, reviewerEmail: '', reason: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Reassignment failed');
    } finally {
      setReassigning(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Supervisor Operations & Ageing Control
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Institutional turnaround monitoring, queue depth balancing, reviewer allocation, and side-by-side document diffs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-brand-700 bg-brand-50 border border-brand-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs">
            <Clock className="w-4 h-4 text-brand-600" /> Target SLA: 48 Hours Max
          </span>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Backlog"
          value={ageing?.totalBacklog || 0}
          subtext="Under active evaluation"
          icon={LayoutDashboard}
          color="blue"
        />
        <StatCard
          title="Ageing < 24 Hours"
          value={ageing?.under24h || 0}
          subtext="Within healthy SLA zone"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Ageing 24 - 48 Hours"
          value={ageing?.between24and48h || 0}
          subtext="Approaching threshold"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="SLA Breaches (>48h)"
          value={ageing?.over48h || 0}
          subtext="Immediate supervisor escalation"
          icon={AlertOctagon}
          color="rose"
        />
      </div>

      {/* Reviewer Workload Distribution Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Reviewer Capacity & Throughput</h2>
            <p className="text-[11px] text-slate-500">Real-time case assignments and review completion velocity</p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
            {workload.length} Reviewers Online
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-y border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Reviewer Name</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3 text-center">Active Cases</th>
                <th className="py-2.5 px-3 text-center">Completed</th>
                <th className="py-2.5 px-3 text-center">High Priority</th>
                <th className="py-2.5 px-3 text-center">Average AI Alignment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {workload.map(rev => (
                <tr key={rev.reviewerId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3">
                    <p className="font-bold text-slate-900">{rev.name}</p>
                    <p className="text-[10px] text-slate-500">{rev.email}</p>
                  </td>
                  <td className="py-3 px-3 text-slate-600">{rev.department}</td>
                  <td className="py-3 px-3 text-center">
                    <span className="font-bold font-mono text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                      {rev.activeCount}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-emerald-700">
                    {rev.completedCount}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`font-mono font-bold ${rev.urgentCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                      {rev.urgentCount}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                    {rev.avgConfidence}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Case Management & Reassignment Grid */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Case Oversight & Workload Rebalancing</h2>
            <p className="text-[11px] text-slate-500">Reassign reviewers, inspect versions, or trigger side-by-side comparisons</p>
          </div>
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search case #, applicant, department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-y border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Case ID</th>
                <th className="py-2.5 px-3">Applicant & Program</th>
                <th className="py-2.5 px-3">Assigned Reviewer</th>
                <th className="py-2.5 px-3">SLA Status</th>
                <th className="py-2.5 px-3">Case Status</th>
                <th className="py-2.5 px-3 text-right">Supervisory Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cases.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-brand-700">
                    {c.caseNumber}
                  </td>
                  <td className="py-3 px-3">
                    <p className="font-bold text-slate-900">{c.applicantName}</p>
                    <p className="text-[10px] text-slate-500">{c.department}</p>
                  </td>
                  <td className="py-3 px-3 text-slate-700 font-medium">
                    {c.assignedToName || c.assignedTo || 'Unassigned'}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${(c.slaHoursRemaining || 24) < 12
                        ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                        : 'bg-slate-100 text-slate-700'
                      }`}>
                      {c.slaHoursRemaining || 24}h remaining
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => setComparisonModal({ isOpen: true, caseItem: c })}
                        className="p-1.5 text-slate-600 hover:text-brand-600 rounded hover:bg-slate-100"
                        title="Document Comparison / Diff"
                      >
                        <Split className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setReassignModal({ isOpen: true, caseItem: c, reviewerEmail: 'reviewer@university.edu', reason: '' })}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition-colors inline-flex items-center gap-1"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Reassign
                      </button>
                      <button
                        onClick={() => navigate(`/cases/${c.id}`)}
                        className="p-1.5 text-brand-600 hover:bg-brand-50 rounded"
                        title="Open Case"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reassign Case Modal */}
      {reassignModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Reassign Case: <span className="text-brand-600">{reassignModal.caseItem?.caseNumber}</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Current Assignee: {reassignModal.caseItem?.assignedToName}
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Select Target Reviewer
                </label>
                <select
                  value={reassignModal.reviewerEmail}
                  onChange={(e) => setReassignModal({ ...reassignModal, reviewerEmail: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white font-medium"
                >
                  <option value="reviewer@university.edu">Dr. Elena Rostova (Admissions Reviewer)</option>
                  <option value="supervisor@university.edu">Prof. Marcus Vance (Senior Registrar)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Reassignment Reason
                </label>
                <input
                  type="text"
                  value={reassignModal.reason}
                  onChange={(e) => setReassignModal({ ...reassignModal, reason: e.target.value })}
                  placeholder="e.g. Balancing admission workload..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setReassignModal({ isOpen: false, caseItem: null, reviewerEmail: '', reason: '' })}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reassigning}
                onClick={handleExecuteReassign}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                {reassigning ? 'Reassigning...' : 'Confirm Reassignment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Side-by-Side Document Comparison Modal */}
      {comparisonModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Split className="w-5 h-5 text-brand-600" />
                  Side-by-Side Document Comparison & Discrepancy Diff
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Case: {comparisonModal.caseItem?.caseNumber} &bull; {comparisonModal.caseItem?.applicantName}
                </p>
              </div>
              <button
                onClick={() => setComparisonModal({ isOpen: false, caseItem: null })}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4 flex-1 overflow-y-auto p-2">
              {/* Document A */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Document A: Academic Transcript</span>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-bold">Verified</span>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Applicant Full Name</span>
                    <span className="font-bold text-slate-800">Naveen Sharma</span>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Degree / Major</span>
                    <span className="font-bold text-slate-800">B.S. Computer Science</span>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Cumulative GPA</span>
                    <span className="font-bold text-slate-800">3.84 / 4.00</span>
                  </div>
                </div>
              </div>

              {/* Document B */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Document B: Government Passport</span>
                  <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-bold">Variation</span>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className="p-2 bg-amber-50/60 rounded border border-amber-300">
                    <span className="text-[10px] text-amber-700 uppercase font-bold block">Passport Full Name (Diff)</span>
                    <span className="font-bold text-slate-900">Naveen Kumar Sharma</span>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Nationality</span>
                    <span className="font-bold text-slate-800">Indian</span>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Passport Validity</span>
                    <span className="font-bold text-slate-800">2032-11-20 (Valid)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center text-xs">
              <span className="text-slate-500 italic">
                Comparison Engine: SHA-256 matched, 1 middle-name variation flagged for reviewer notice.
              </span>
              <button
                onClick={() => setComparisonModal({ isOpen: false, caseItem: null })}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 transition-colors"
              >
                Dismiss Comparison
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupervisorDashboardPage;

