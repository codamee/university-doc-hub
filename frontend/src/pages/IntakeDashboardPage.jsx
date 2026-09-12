import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { casesAPI, documentsAPI } from '../services/api';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import {
  UploadCloud,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Search,
  Filter,
  ArrowUpRight,
  FolderKanban,
  Clock,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export const IntakeDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Upload state
  const [uploadCategory, setUploadCategory] = useState('Admission');
  const [applicantName, setApplicantName] = useState('');
  const [department, setDepartment] = useState('School of Computing');
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  const categories = [
    { id: 'Admission', label: 'Admissions Application' },
    { id: 'Transcript', label: 'Academic Transcript' },
    { id: 'CourseMaterial', label: 'Course Syllabus / Materials' },
    { id: 'Assessment', label: 'Assessment Record' },
    { id: 'ResearchProposal', label: 'Research Proposal' },
    { id: 'Certificate', label: 'Degree Certificate' },
    { id: 'FeeInvoice', label: 'Fee Invoice & Receipt' }
  ];

  const fetchCases = async () => {
    try {
      setLoading(true);
      const res = await casesAPI.list({
        search,
        category: selectedCategory,
        status: selectedStatus
      });
      if (res.data.success) {
        setCases(res.data.cases || []);
      }
    } catch (err) {
      console.error('Fetch cases error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [search, selectedCategory, selectedStatus]);

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select or drop a document to submit.');
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadSuccess(null);

    try {
      // 1. Create Case
      const caseRes = await casesAPI.create({
        category: uploadCategory,
        applicantName: applicantName || user?.name || 'Applicant',
        applicantEmail: user?.email,
        department,
        priority: 'MEDIUM'
      });

      const newCase = caseRes.data.case;

      // 2. Upload Document with SHA256 & SecOps Malware Scan
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('caseId', newCase.id);
      formData.append('category', uploadCategory);

      const docRes = await documentsAPI.upload(formData);

      setUploadSuccess({
        caseNumber: newCase.caseNumber,
        caseId: newCase.id,
        fileName: selectedFile.name,
        checksum: docRes.data.document?.checksumSha256,
        malwareStatus: docRes.data.scanResult?.status || 'CLEAN'
      });

      setSelectedFile(null);
      setApplicantName('');
      fetchCases();
    } catch (err) {
      setUploadError(err.response?.data?.error || err.message || 'Intake submission failed');
    } finally {
      setUploading(false);
    }
  };

  // Metrics
  const totalSubmissions = cases.length;
  const underReviewCount = cases.filter(c => c.status === 'UNDER_REVIEW').length;
  const exceptionCount = cases.filter(c => c.status === 'EXCEPTION' || c.status === 'ESCALATED').length;
  const approvedCount = cases.filter(c => c.status === 'APPROVED').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Secure Document Intake & Tracking
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Automated document ingestion, checksum verification, ClamAV scanning, and lifecycle tracking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> SecOps Ingestion Pipeline Online
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Submissions"
          value={totalSubmissions}
          subtext="Active in university queue"
          icon={FolderKanban}
          color="blue"
        />
        <StatCard
          title="Under Evaluation"
          value={underReviewCount}
          subtext="AI extraction & reviewer check"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Exceptions Flagged"
          value={exceptionCount}
          subtext="Requires human decision"
          icon={AlertTriangle}
          color="rose"
        />
        <StatCard
          title="Approved Credentials"
          value={approvedCount}
          subtext="Verified & accredited"
          icon={CheckCircle2}
          color="emerald"
        />
      </div>

      {/* Main Grid: Upload Portal + Submission Tracking Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Secure Drag-and-Drop Ingestion */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-2 pb-4 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Secure Intake Portal</h2>
              <p className="text-[11px] text-slate-500">Upload forms, certificates & records</p>
            </div>
          </div>

          {uploadError && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {uploadError}
            </div>
          )}

          {uploadSuccess && (
            <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1.5">
              <p className="font-bold text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Ingestion Verified!
              </p>
              <p className="text-emerald-700">Case Created: <span className="font-mono font-bold">{uploadSuccess.caseNumber}</span></p>
              <p className="text-[11px] text-emerald-600 font-mono truncate">SHA256: {uploadSuccess.checksum?.slice(0, 16)}...</p>
              <p className="text-[11px] font-semibold text-emerald-800">
                SecOps Scan: <span className="bg-emerald-100 px-1.5 py-0.5 rounded text-[10px]">{uploadSuccess.malwareStatus}</span>
              </p>
              <button
                onClick={() => navigate(`/cases/${uploadSuccess.caseId}`)}
                className="mt-2 w-full py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold transition-colors flex items-center justify-center gap-1"
              >
                Open Case Workspace <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <form onSubmit={handleUploadSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Document Category
              </label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Student / Applicant Name
              </label>
              <input
                type="text"
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                placeholder={user?.name || "e.g. Naveen Sharma"}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Academic Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="School of Computing">School of Computing & Data Science</option>
                <option value="School of Medicine">School of Medicine & Health</option>
                <option value="Biomedical Engineering">Biomedical Engineering</option>
                <option value="Faculty of Mathematics">Faculty of Mathematics</option>
                <option value="Graduate Business School">Graduate Business School</option>
              </select>
            </div>

            {/* Dropzone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${dragOver
                  ? 'border-brand-500 bg-brand-50/50'
                  : selectedFile
                    ? 'border-emerald-400 bg-emerald-50/30'
                    : 'border-slate-300 hover:border-brand-400 hover:bg-slate-50'
                }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.docx,.tiff"
                onChange={handleFileSelect}
              />
              <UploadCloud className="w-8 h-8 mx-auto mb-2 text-brand-500" />
              {selectedFile ? (
                <div>
                  <p className="text-xs font-bold text-slate-800 truncate">{selectedFile.name}</p>
                  <p className="text-[11px] text-slate-500 font-mono">{(selectedFile.size / 1024).toFixed(0)} KB</p>
                  <p className="text-[10px] text-emerald-600 font-semibold mt-1">Ready for SecOps Scan</p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-bold text-slate-700">Drag & Drop Document Here</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">or click to browse from device</p>
                  <p className="text-[10px] text-slate-400 mt-2 font-mono">PDF, PNG, JPG, DOCX (Max 25MB)</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Hashing & Scanning File...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" /> Secure Submit & Ingest
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Filterable Submissions Tracking */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Submission Tracking & Queue</h2>
              <p className="text-[11px] text-slate-500">Live registry of all ingested higher education cases</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium font-mono">{cases.length} records</span>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="py-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by case #, name, department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs p-2 border border-slate-200 rounded-lg bg-white font-medium text-slate-700"
            >
              <option value="ALL">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs p-2 border border-slate-200 rounded-lg bg-white font-medium text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="EXCEPTION">Exception</option>
              <option value="ESCALATED">Escalated</option>
            </select>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-x-auto">
            {loading ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading submission queue...
              </div>
            ) : cases.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-1" />
                No matching submissions found.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-y border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Case Number</th>
                    <th className="py-2.5 px-3">Applicant & Program</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">AI Confidence</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cases.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-brand-700">
                        {c.caseNumber}
                        <span className="block text-[10px] font-sans font-normal text-slate-400">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-900">{c.applicantName}</p>
                        <p className="text-[11px] text-slate-500 truncate max-w-[180px]">{c.degreeProgram || c.department}</p>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                          {c.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        {c.aiConfidence ? (
                          <span className={`font-bold ${c.aiConfidence >= 90 ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {c.aiConfidence}%
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Pending</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => navigate(`/cases/${c.id}`)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1"
                        >
                          Workspace <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntakeDashboardPage;

