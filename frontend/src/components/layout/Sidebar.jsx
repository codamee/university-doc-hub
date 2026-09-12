import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  UploadCloud,
  FolderKanban,
  AlertOctagon,
  LayoutDashboard,
  Sparkles,
  CheckCircle2,
  FileSpreadsheet,
  BarChart3,
  Bell,
  Users,
  ShieldAlert,
  GraduationCap
} from 'lucide-react';

export const Sidebar = ({ exceptionCount = 0, activeCaseCount = 0 }) => {
  const { user } = useAuth();
  const role = user?.role;

  const navItems = [
    {
      label: 'Document Intake',
      path: '/',
      icon: UploadCloud,
      roles: ['Applicant', 'Reviewer', 'Supervisor', 'Compliance Admin'],
      badge: null
    },
    {
      label: 'Case Workspace',
      path: '/cases',
      icon: FolderKanban,
      roles: ['Applicant', 'Reviewer', 'Supervisor', 'Compliance Admin'],
      badge: activeCaseCount > 0 ? activeCaseCount : null
    },
    {
      label: 'Exception Queue',
      path: '/exceptions',
      icon: AlertOctagon,
      roles: ['Reviewer', 'Supervisor', 'Compliance Admin'],
      badge: exceptionCount > 0 ? exceptionCount : null,
      badgeColor: 'bg-amber-100 text-amber-800'
    },
    {
      label: 'Supervisor View',
      path: '/supervisor',
      icon: LayoutDashboard,
      roles: ['Supervisor', 'Compliance Admin'],
      badge: 'SLA'
    },
    {
      label: 'AI Extraction Workbench',
      path: '/ai-extract',
      icon: Sparkles,
      roles: ['Applicant', 'Reviewer', 'Supervisor', 'Compliance Admin'],
      badge: 'Gemini'
    },
    {
      label: 'Validation Checks',
      path: '/validation',
      icon: CheckCircle2,
      roles: ['Reviewer', 'Supervisor', 'Compliance Admin'],
      badge: null
    },
    {
      label: 'Grounded Summaries',
      path: '/summaries',
      icon: FileSpreadsheet,
      roles: ['Reviewer', 'Supervisor', 'Compliance Admin'],
      badge: null
    },
    {
      label: 'Reports & Analytics',
      path: '/reports',
      icon: BarChart3,
      roles: ['Reviewer', 'Supervisor', 'Compliance Admin'],
      badge: null
    },
    {
      label: 'Notifications',
      path: '/notifications',
      icon: Bell,
      roles: ['Applicant', 'Reviewer', 'Supervisor', 'Compliance Admin'],
      badge: null
    },
    {
      label: 'User & Role Mgmt',
      path: '/users',
      icon: Users,
      roles: ['Compliance Admin', 'Supervisor'],
      badge: null
    },
    {
      label: 'Audit & System Settings',
      path: '/audit-settings',
      icon: ShieldAlert,
      roles: ['Compliance Admin', 'Supervisor'],
      badge: 'Immutable'
    }
  ];

  const visibleItems = navItems.filter(item => item.roles.includes(role));

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 min-h-[calc(100vh-4rem)] border-r border-slate-800 select-none">
      {/* Scope Info */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <GraduationCap className="w-4 h-4 text-brand-400" />
          <span className="font-semibold tracking-wide text-slate-300">University Scope</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1 truncate">
          {role === 'Applicant' ? 'Candidate Self-Service' : 'Admissions & Registrar Ops'}
        </p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {visibleItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/' || item.path === '/cases'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${isActive
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <div className="flex items-center space-x-3 truncate">
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.badgeColor || 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / System Status */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50 text-[11px] text-slate-400">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Gemini 3.6 Flash
          </span>
          <span className="text-[10px] font-mono text-slate-500">v1.0.4</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">Audit Trail: Active & Append-Only</p>
      </div>
    </aside>
  );
};

export default Sidebar;

