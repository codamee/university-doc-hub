import React from 'react';

export const StatusBadge = ({ status }) => {
  if (!status) return null;

  const configs = {
    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CLEAN: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    VALID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    ACCEPTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',

    UNDER_REVIEW: 'bg-blue-50 text-blue-700 border-blue-200',
    OPEN: 'bg-blue-50 text-blue-700 border-blue-200',
    IN_REVIEW: 'bg-blue-50 text-blue-700 border-blue-200',

    EXCEPTION: 'bg-amber-50 text-amber-800 border-amber-200',
    WARNING: 'bg-amber-50 text-amber-800 border-amber-200',
    FLAGGED: 'bg-amber-50 text-amber-800 border-amber-200',
    OVERRIDDEN: 'bg-purple-50 text-purple-700 border-purple-200',

    ESCALATED: 'bg-rose-50 text-rose-700 border-rose-200',
    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
    CRITICAL: 'bg-rose-50 text-rose-700 border-rose-200',
    QUARANTINED: 'bg-rose-50 text-rose-700 border-rose-200',

    PENDING: 'bg-slate-100 text-slate-700 border-slate-200',
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    INACTIVE: 'bg-slate-100 text-slate-500 border-slate-200'
  };

  const style = configs[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  const label = status.replace(/_/g, ' ');

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-75"></span>
      {label}
    </span>
  );
};

export default StatusBadge;

