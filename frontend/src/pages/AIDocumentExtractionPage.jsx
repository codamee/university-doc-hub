import React, { useState } from 'react';
import { aiAPI } from '../services/api';
import ConfidenceBar from '../components/common/ConfidenceBar';
import StatusBadge from '../components/common/StatusBadge';
import {
  Sparkles,
  FileText,
  Play,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Clock,
  Layers,
  ArrowRight,
  Database,
  Cpu
} from 'lucide-react';

export const AIDocumentExtractionPage = () => {
  const [documentType, setDocumentType] = useState('Academic Transcript');
  const [fileName, setFileName] = useState('Sample_Official_Transcript.pdf');
  const [ocrText, setOcrText] = useState(
    `OFFICIAL UNIVERSITY TRANSCRIPT - ACCREDITED
Student Full Name: Naveen Sharma
Student Registration ID: UHD-2026-9082
Degree Awarded: Master of Science in Computer Science & AI
Conferral Date: 2026-05-20
Cumulative GPA: 3.84 / 4.00 (Standing: High Honors)
Total Credits Completed: 36.0 Graduate Units
Core Coursework:
- CS-501 Advanced Algorithms: Grade A (4.0)
- CS-520 Deep Neural Architectures: Grade A (4.0)
- MATH-402 Applied Linear Algebra: Grade A- (3.7)
Registrar Digital Seal: PKI-SHA256-VERIFIED-REGISTRAR-OFFICE`
  );

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [viewRawJson, setViewRawJson] = useState(false);

  const presetSamples = [
    {
      label: 'Academic Transcript (CS Grad)',
      type: 'Academic Transcript',
      fileName: 'Naveen_Sharma_Transcript.pdf',
      text: `OFFICIAL UNIVERSITY TRANSCRIPT - ACCREDITED\nStudent Full Name: Naveen Sharma\nStudent Registration ID: UHD-2026-9082\nDegree Awarded: Master of Science in Computer Science & AI\nConferral Date: 2026-05-20\nCumulative GPA: 3.84 / 4.00 (Standing: High Honors)\nTotal Credits Completed: 36.0 Graduate Units\nRegistrar Digital Seal: PKI-SHA256-VERIFIED`
    },
    {
      label: 'Tuition Fee Invoice & Wire',
      type: 'Fee Invoice',
      fileName: 'Tuition_Payment_Receipt.pdf',
      text: `BURSAR FINANCIAL SERVICES - STATE UNIVERSITY\nInvoice Reference: INV-2026-FALL-9921\nStudent ID: UHD-2026-4402\nStudent Name: Chloe Dupont\nProgram: International MBA\nBilling Term: Fall 2026 Semester\nTotal Tuition Due: $18,500.00 USD\nPayment Status: PAID IN FULL via Federal Wire Transfer Ref #WT-9021884\nTransaction Timestamp: 2026-08-14 11:22:04 UTC`
    },
    {
      label: 'Research Proposal (Grant)',
      type: 'Research Proposal',
      fileName: 'Quantum_Computing_Grant.pdf',
      text: `OFFICE OF SPONSORED RESEARCH & GRANTS\nProject Title: Superconducting Qubit Benchmarking for Scalable Quantum Computing\nPrincipal Investigator: Dr. Tariq Al-Mansoor\nDepartment: Institute for Quantum Computing\nProposed Budget: $140,000.00 USD\nProject Duration: 24 Months (2026-2028)\nIRB Human Ethics Compliance: PENDING SUBMISSION\nPrior Publications: 14 Peer-Reviewed IEEE & Nature Papers`
    }
  ];

  const handleSelectPreset = (preset) => {
    setDocumentType(preset.type);
    setFileName(preset.fileName);
    setOcrText(preset.text);
    setResult(null);
    setError('');
  };

  const handleRunExtraction = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await aiAPI.extract({
        documentType,
        fileName,
        textSnippet: ocrText
      });

      if (res.data.success) {
        setResult(res.data);
      } else {
        setError(res.data.error || 'Extraction failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'AI extraction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            AI Document Extraction Workbench
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Real-time entity extraction, layout understanding, and confidence scoring powered by Google Gemini 3.6 Flash.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-brand-700 bg-brand-50 border border-brand-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs">
            <Cpu className="w-4 h-4 text-brand-600" /> Active Model: gemini-3.6-flash
          </span>
        </div>
      </div>

      {/* Preset Quick Load Bar */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 flex flex-wrap items-center gap-2 shadow-xs">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2">Load Preset Schema:</span>
        {presetSamples.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSelectPreset(p)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-brand-50 hover:border-brand-300 text-xs font-semibold text-slate-700 transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Main Grid: Input OCR Sandbox vs Structured Extraction Result */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 6 Cols: OCR & Input Schema Config */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-brand-600" />
              <h2 className="text-sm font-bold text-slate-900">Document Input Payload</h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">OCR Raw Text</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Document Schema Target
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white font-medium"
              >
                <option value="Academic Transcript">Academic Transcript</option>
                <option value="Admissions Application">Admissions Application</option>
                <option value="Course Syllabus">Course Syllabus</option>
                <option value="Assessment Record">Assessment Record</option>
                <option value="Research Proposal">Research Proposal</option>
                <option value="Degree Certificate">Degree Certificate</option>
                <option value="Fee Invoice">Fee Invoice & Receipt</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Virtual File Name
              </label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Raw OCR / Scanned Text Stream
            </label>
            <textarea
              rows={12}
              value={ocrText}
              onChange={(e) => setOcrText(e.target.value)}
              className="w-full text-xs font-mono p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none leading-relaxed bg-slate-950 text-slate-100"
            />
          </div>

          <button
            onClick={handleRunExtraction}
            disabled={loading}
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing via Gemini 3.6 Flash Pipeline...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" /> Execute Intelligent Extraction
              </>
            )}
          </button>
        </div>

        {/* Right 6 Cols: Structured Extraction Result */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col min-h-[580px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-brand-600" />
              <h2 className="text-sm font-bold text-slate-900">Extracted Entities & Metadata</h2>
            </div>
            {result && (
              <button
                onClick={() => setViewRawJson(!viewRawJson)}
                className="text-xs text-brand-600 hover:text-brand-800 font-semibold flex items-center gap-1"
              >
                <Code2 className="w-3.5 h-3.5" /> {viewRawJson ? 'Structured View' : 'Raw JSON View'}
              </button>
            )}
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-xl font-medium mb-4">
              {error}
            </div>
          )}

          {!result && !loading && (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400">
              <Cpu className="w-12 h-12 mb-3 stroke-1 text-slate-300" />
              <p className="text-xs font-bold text-slate-700">Ready to Extract</p>
              <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                Configure OCR text or select a preset and click "Execute Intelligent Extraction".
              </p>
            </div>
          )}

          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400">
              <div className="w-10 h-10 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-xs font-bold text-slate-800">Analyzing Document Structure...</p>
              <p className="text-[11px] text-slate-500 mt-1 font-mono">Invoking Gemini 3.6 Flash endpoint</p>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-4">
              {/* Extraction Metrics Bar */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Overall Confidence</span>
                  <span className="font-mono font-bold text-base text-slate-900">
                    {result.result?.overallConfidence || 94}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Latency</span>
                  <span className="font-mono font-bold text-xs text-emerald-700">
                    {result.latencyMs || 140} ms
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Engine Version</span>
                  <span className="font-mono text-[11px] text-slate-700">
                    {result.modelVersion}
                  </span>
                </div>
              </div>

              {/* Summary note */}
              {result.result?.summary && (
                <div className="p-3 bg-brand-50/50 border border-brand-100 rounded-xl text-xs text-brand-900 leading-relaxed">
                  <span className="font-bold block mb-0.5">AI Grounded Summary:</span>
                  {result.result.summary}
                </div>
              )}

              {/* View Raw JSON vs Structured Cards */}
              {viewRawJson ? (
                <pre className="p-4 bg-slate-950 text-slate-200 rounded-xl text-[11px] font-mono overflow-auto max-h-[360px] border border-slate-800">
                  {JSON.stringify(result.result, null, 2)}
                </pre>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {result.result?.extractedFields?.map((f, i) => (
                    <div key={i} className="p-3 rounded-xl border border-slate-200 bg-white hover:border-brand-300 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{f.label}</span>
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${f.confidence >= 90 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                          {f.confidence}% Conf.
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-900">{f.value}</p>
                      {f.evidenceQuote && (
                        <p className="text-[10px] text-slate-500 italic mt-1 bg-slate-50 p-1.5 rounded">
                          "{f.evidenceQuote}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIDocumentExtractionPage;

