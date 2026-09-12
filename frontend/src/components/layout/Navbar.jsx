import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, User, LogOut, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Navbar = ({ onOpenNotifications, unreadCount = 0 }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const roleColors = {
    'Applicant': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Reviewer': 'bg-blue-50 text-blue-700 border-blue-200',
    'Supervisor': 'bg-purple-50 text-purple-700 border-purple-200',
    'Compliance Admin': 'bg-amber-50 text-amber-800 border-amber-200'
  };

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="px-6 h-16 flex items-center justify-between">
        {/* Left: Branding */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-navy-900 flex items-center justify-center text-white font-black text-lg shadow-md shadow-brand-500/20">
            U
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-slate-900 tracking-tight text-base">IntelliDoc Hub</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Gemini 3.6 Flash
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Higher Education Document Intake & Decision Hub</p>
          </div>
        </div>

        {/* Right: Real User Role Badge, Notifications & Profile */}
        <div className="flex items-center space-x-4">
          {/* Active Role Badge */}
          {user?.role && (
            <div className="flex items-center space-x-1.5">
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">Role:</span>
              <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${roleColors[user.role] || 'bg-slate-100 text-slate-700'}`}>
                {user.role}
              </span>
            </div>
          )}

          {/* Notifications Button */}
          <button
            onClick={onOpenNotifications}
            className="p-2 rounded-lg text-slate-600 hover:text-brand-600 hover:bg-slate-100 relative transition-colors"
            title="Open notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Real User Profile Info & Sign Out */}
          <div className="flex items-center space-x-3 pl-3 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-900 truncate max-w-[160px]">{user?.name}</p>
              <p className="text-[10px] text-slate-500 font-mono truncate max-w-[160px]">{user?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline text-[11px]">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
