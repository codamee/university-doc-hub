import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import NotificationDrawer from './NotificationDrawer';
import { notificationsAPI, exceptionsAPI, casesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const AppLayout = () => {
  const { user } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [exceptionCount, setExceptionCount] = useState(0);
  const [activeCaseCount, setActiveCaseCount] = useState(0);

  const fetchLayoutData = async () => {
    try {
      // 1. Notifications
      const notifRes = await notificationsAPI.list();
      if (notifRes.data.success) {
        setNotifications(notifRes.data.notifications || []);
        setUnreadCount(notifRes.data.unreadCount || 0);
      }

      // 2. Open Exceptions (for Reviewers, Supervisors, Admins)
      if (user?.role !== 'Applicant') {
        const excRes = await exceptionsAPI.list({ status: 'OPEN' });
        if (excRes.data.success) {
          setExceptionCount(excRes.data.total || 0);
        }
      }

      // 3. Active Cases
      const caseRes = await casesAPI.list({ status: 'UNDER_REVIEW' });
      if (caseRes.data.success) {
        setActiveCaseCount(caseRes.data.total || 0);
      }
    } catch (err) {
      console.warn('[Layout] Polling data warning:', err.message);
    }
  };

  useEffect(() => {
    fetchLayoutData();
    const interval = setInterval(fetchLayoutData, 12000); // 12-sec refresh
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkRead = async (id) => {
    await notificationsAPI.markRead(id);
    fetchLayoutData();
  };

  const handleMarkAllRead = async () => {
    await notificationsAPI.markAllRead();
    fetchLayoutData();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar
        onOpenNotifications={() => setIsDrawerOpen(true)}
        unreadCount={unreadCount}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          exceptionCount={exceptionCount}
          activeCaseCount={activeCaseCount}
        />

        <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl mx-auto w-full">
          <Outlet context={{ refreshLayout: fetchLayoutData }} />
        </main>
      </div>

      <NotificationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        notifications={notifications}
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
      />
    </div>
  );
};

export default AppLayout;

