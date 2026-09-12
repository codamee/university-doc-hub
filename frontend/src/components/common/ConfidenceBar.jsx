import React from 'react';

export const ConfidenceBar = ({ confidence, showLabel = true, size = 'md' }) => {
  const score = Math.round(Number(confidence) || 0);

  let colorClass = 'bg-rose-500 text-rose-700';
  let badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
  let statusText = 'Low Confidence';

  if (score >= 90) {
    colorClass = 'bg-emerald-500 text-emerald-700';
    badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    statusText = 'High Confidence';
  } else if (score >= 80) {
    colorClass = 'bg-amber-500 text-amber-700';
    badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
    statusText = 'Acceptable';
  }

  const heightClass = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2';

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-medium text-slate-600 flex items-center gap-1">
            AI Confidence:
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${badgeClass}`}>
              {statusText}
            </span>
          </span>
          <span className="font-bold font-mono text-slate-800">{score}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-200 rounded-full overflow-hidden ${heightClass}`}>
        <div
          className={`${colorClass.split(' ')[0]} ${heightClass} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
    </div>
  );
};

export default ConfidenceBar;

