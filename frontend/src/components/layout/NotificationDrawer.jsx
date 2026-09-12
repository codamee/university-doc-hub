import React from 'react';
import { X, Check, Bell, AlertTriangle, FileText, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const NotificationDrawer = ({ isOpen, onClose, notifications = [], onMarkRead, onMarkAllRead }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleOpenItem = (notif) => {
    onMarkRead(notif.id);
    if (notif.link) {
      navigate(notif.link);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-brand-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Operational Alerts</h2>
              <span className="text-[10px] bg-brand-500/30 text-brand-300 font-mono px-2 py-0.5 rounded-full">
                {notifications.filter(n => !n.isRead).length} new
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onMarkAllRead}
                className="text-xs text-slate-300 hover:text-white flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-800"
                title="Mark all as read"
              >
                <Check className="w-3.5 h-3.5" /> Mark read
              </button>
              <button
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
            {notifications.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                <Bell className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-1" />
                No current notifications.
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => handleOpenItem(notif)}
                  className={`p-3.5 rounded-xl transition-all cursor-pointer mb-1 border ${notif.isRead
                      ? 'bg-white border-transparent hover:bg-slate-50'
                      : 'bg-brand-50/40 border-brand-100 hover:bg-brand-50/70'
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      {notif.severity === 'CRITICAL' || notif.type === 'EXCEPTION' ? (
                        <span className="p-1 rounded bg-rose-100 text-rose-700">
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="p-1 rounded bg-blue-100 text-brand-700">
                          <FileText className="w-3.5 h-3.5" />
                        </span>
                      )}
                      <h4 className={`text-xs font-bold ${notif.isRead ? 'text-slate-700' : 'text-slate-900'}`}>
                        {notif.title}
                      </h4>
                    </div>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-brand-600 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{notif.message}</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100/60 text-[10px] text-slate-400">
                    <span>{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {notif.link && (
                      <span className="text-brand-600 font-semibold flex items-center gap-0.5">
                        View Record <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationDrawer;

