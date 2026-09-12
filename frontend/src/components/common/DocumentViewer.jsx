import React, { useState } from 'react';
import { ZoomIn, ZoomOut, Download, FileText, ChevronLeft, ChevronRight, CheckCircle2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { documentsAPI } from '../../services/api';

export const DocumentViewer = ({ document, highlightedField = null, onSelectField = null, extractedFields = [] }) => {
  const [zoom, setZoom] = useState(100);
  const [page, setPage] = useState(1);
  const maxPages = document?.pageCount || 2;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 15, 160));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 15, 70));

  if (!document) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 text-slate-400">
        <FileText className="w-12 h-12 mb-2 stroke-1" />
        <p className="text-sm font-medium">No document selected for preview</p>
        <p className="text-xs text-slate-400">Select a document from the intake list</p>
      </div>
    );
  }

  const downloadUrl = documentsAPI.getDownloadUrl(document.id);

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-md">
      {/* Viewer Toolbar */}
      <div className="bg-slate-800 text-slate-200 px-4 py-2.5 flex items-center justify-between border-b border-slate-700">
        <div className="flex items-center space-x-2 text-xs truncate max-w-xs">
          <FileText className="w-4 h-4 text-brand-400 flex-shrink-0" />
          <span className="font-semibold truncate" title={document.originalName}>
            {document.originalName}
          </span>
          <span className="text-slate-400 text-[10px]">({(document.size / 1024).toFixed(0)} KB)</span>
        </div>

        {/* Security & Malware Badge */}
        <div className="flex items-center space-x-2">
          {document.malwareStatus === 'CLEAN' ? (
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
              <ShieldCheck className="w-3.5 h-3.5" /> ClamAV Clean
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-medium text-rose-400 bg-rose-950/60 border border-rose-800 px-2 py-0.5 rounded">
              <AlertTriangle className="w-3.5 h-3.5" /> Threat Flagged
            </span>
          )}

          {/* Zoom controls */}
          <div className="flex items-center bg-slate-700 rounded-lg p-0.5 space-x-1">
            <button
              onClick={handleZoomOut}
              className="p-1 hover:bg-slate-600 rounded text-slate-300 hover:text-white"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-1 text-slate-300">{zoom}%</span>
            <button
              onClick={handleZoomIn}
              className="p-1 hover:bg-slate-600 rounded text-slate-300 hover:text-white"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Page controls */}
          <div className="flex items-center bg-slate-700 rounded-lg p-0.5 space-x-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="p-1 disabled:opacity-40 hover:bg-slate-600 rounded text-slate-300 hover:text-white"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-1 text-slate-300">
              {page}/{maxPages}
            </span>
            <button
              disabled={page >= maxPages}
              onClick={() => setPage(p => Math.min(maxPages, p + 1))}
              className="p-1 disabled:opacity-40 hover:bg-slate-600 rounded text-slate-300 hover:text-white"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <a
            href={downloadUrl}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 bg-brand-600 hover:bg-brand-500 rounded-lg text-white transition-colors"
            title="Download Document"
          >
            <Download className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Document Canvas Area */}
      <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-slate-950/80">
        <div
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          className="transition-transform duration-150 bg-white text-slate-900 rounded-lg shadow-2xl p-10 min-w-[560px] min-h-[720px] max-w-[620px] relative font-serif select-none"
        >
          {/* University Document Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
            <div className="w-64 h-64 rounded-full border-8 border-slate-900 flex items-center justify-center font-bold text-3xl">
              UHD OFFICIAL
            </div>
          </div>

          {/* Official Document Header */}
          <div className="border-b-2 border-slate-800 pb-4 mb-6 flex justify-between items-start font-sans">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded bg-brand-700 text-white font-bold flex items-center justify-center text-xs">U</span>
                <span className="font-extrabold text-sm tracking-wider uppercase text-slate-800">State University Registry</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Office of Academic Credentials & Graduate Admissions</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-400 block">DOC_ID: {document.id}</span>
              <span className="text-[10px] font-mono text-slate-500 block">SHA256: {document.checksumSha256?.slice(0, 12)}...</span>
              <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1 justify-end mt-1">
                <CheckCircle2 className="w-3 h-3" /> Digitally Certified
              </span>
            </div>
          </div>

          {/* Render Document Body based on category / mock */}
          <div className="space-y-5 text-xs font-sans">
            <div className="text-center py-2 border-y border-slate-200 bg-slate-50/50">
              <h2 className="text-base font-bold uppercase tracking-wider text-slate-800">
                {document.category || 'Official Academic Record & Transcript'}
              </h2>
              <p className="text-[11px] text-slate-500">Record issued for matriculation verification</p>
            </div>

            {/* Extracted Fields Visual Overlay */}
            <div className="grid grid-cols-2 gap-4">
              {extractedFields.map(field => {
                const isSelected = highlightedField === field.fieldKey;
                return (
                  <div
                    key={field.id || field.fieldKey}
                    onClick={() => onSelectField && onSelectField(field)}
                    className={`p-2.5 rounded border transition-all cursor-pointer relative ${isSelected
                        ? 'bg-blue-50 border-brand-500 shadow-md ring-2 ring-brand-400'
                        : 'bg-slate-50/60 border-slate-200 hover:border-brand-300 hover:bg-brand-50/30'
                      }`}
                  >
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{field.label}</span>
                      <span className="text-[9px] font-mono font-bold text-emerald-600 bg-emerald-50 px-1 rounded">
                        {field.confidence}%
                      </span>
                    </div>
                    <div className="font-semibold text-slate-800 text-xs truncate">
                      {field.approvedValue || field.extractedValue || 'N/A'}
                    </div>
                    {isSelected && (
                      <span className="absolute -top-2 -right-1 text-[9px] bg-brand-600 text-white font-bold px-1.5 py-0.2 rounded shadow">
                        Active Bounding Box
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Simulated Coursework / Tabular content */}
            <div className="mt-4 border border-slate-200 rounded overflow-hidden">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2">Course Code</th>
                    <th className="p-2">Title</th>
                    <th className="p-2 text-center">Credits</th>
                    <th className="p-2 text-center">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  <tr>
                    <td className="p-2 text-slate-600">CS-501</td>
                    <td className="p-2 font-sans font-medium text-slate-800">Advanced Algorithms & Complexity</td>
                    <td className="p-2 text-center">4.0</td>
                    <td className="p-2 text-center font-bold text-emerald-700">A</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-slate-600">CS-520</td>
                    <td className="p-2 font-sans font-medium text-slate-800">Deep Neural Architectures</td>
                    <td className="p-2 text-center">4.0</td>
                    <td className="p-2 text-center font-bold text-emerald-700">A</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-slate-600">MATH-402</td>
                    <td className="p-2 font-sans font-medium text-slate-800">Applied Linear Algebra</td>
                    <td className="p-2 text-center">3.0</td>
                    <td className="p-2 text-center font-bold text-emerald-700">A-</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-slate-600">SYS-515</td>
                    <td className="p-2 font-sans font-medium text-slate-800">Distributed Cloud Computing</td>
                    <td className="p-2 text-center">4.0</td>
                    <td className="p-2 text-center font-bold text-emerald-700">A</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Registrar Signature Block */}
            <div className="pt-6 mt-6 border-t border-slate-200 flex justify-between items-end font-sans">
              <div>
                <p className="text-[10px] text-slate-400">AUTHENTICATION SECURE HASH</p>
                <p className="text-[9px] font-mono text-slate-500">PKI-RSA-4096-SHA256-VERIFIED</p>
              </div>
              <div className="text-right">
                <div className="font-serif italic text-sm text-slate-700 border-b border-slate-300 pb-1 mb-1">
                  Dr. Elena Rostova, Registrar
                </div>
                <p className="text-[9px] text-slate-400">AUTHORIZED INSTITUTIONAL SEAL</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;

