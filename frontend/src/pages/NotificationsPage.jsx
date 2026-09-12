import React, { useState, useEffect } from 'react';
import { notificationsAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  AlertTriangle,
  FileText,
  Clock,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Filter
} from 'lucide-react';

export const NotificationsPage = () => {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL', 'UNREAD', 'CRITICAL', 'ASSIGNMENT'

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      const res = await notificationsAPI.list();
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkRead = async (id) => {
    await notificationsAPI.markRead(id);
    fetchNotifs();
  };

  const handleMarkAllRead = async () => {
    await notificationsAPI.markAllRead();
    fetchNotifs();
  };

  const filteredNotifs = notifications.filter(n => {
    if (activeFilter === 'UNREAD') return !n.isRead;
    if (activeFilter === 'CRITICAL') return n.severity === 'CRITICAL' || n.type === 'EXCEPTION';
    if (activeFilter === 'ASSIGNMENT') return n.type === 'ASSIGNMENT';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Operational Notifications & Alerts
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Real-time feed for case assignments, exception triggers, SLA warnings, and AI events.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" /> Mark All as Read
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        {/* Filters */}
        <div className="flex items-center space-x-2 pb-4 border-b border-slate-100 mb-4 overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Notifications', count: notifications.length },
            { id: 'UNREAD', label: 'Unread', count: notifications.filter(n => !n.isRead).length },
            { id: 'CRITICAL', label: 'Urgent & Exceptions', count: notifications.filter(n => n.severity === 'CRITICAL' || n.type === 'EXCEPTION').length },
            { id: 'ASSIGNMENT', label: 'Assignments', count: notifications.filter(n => n.type === 'ASSIGNMENT').length }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${activeFilter === f.id
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
            >
              <span>{f.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${activeFilter === f.id ? 'bg-brand-700 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading notifications...
          </div>
        ) : filteredNotifs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <Bell className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-1" />
            No notifications in this category.
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredNotifs.map(notif => (
              <div
                key={notif.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${notif.isRead
                    ? 'bg-white border-slate-200'
                    : 'bg-brand-50/40 border-brand-200'
                  }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-xl mt-0.5 ${notif.severity === 'CRITICAL' || notif.type === 'EXCEPTION'
                      ? 'bg-rose-100 text-rose-700'
                      : notif.type === 'ASSIGNMENT'
                        ? 'bg-blue-100 text-brand-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                    {notif.severity === 'CRITICAL' ? <AlertTriangle className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-bold text-slate-900">{notif.title}</h4>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-brand-600" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                    <span className="text-[10px] text-slate-400 mt-1.5 block">
                      {new Date(notif.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {!notif.isRead && (
                    <button
                      onClick={() => handleMarkRead(notif.id)}
                      className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded text-xs font-semibold"
                    >
                      Mark Read
                    </button>
                  )}
                  {notif.link && (
                    <button
                      onClick={() => {
                        handleMarkRead(notif.id);
                        navigate(notif.link);
                      }}
                      className="px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded text-xs font-bold inline-flex items-center gap-1 transition-colors"
                    >
                      Open Record <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;

