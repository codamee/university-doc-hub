import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';

// Pages
import LoginPage from './pages/LoginPage';
import IntakeDashboardPage from './pages/IntakeDashboardPage';
import CaseWorkspacePage from './pages/CaseWorkspacePage';
import ExceptionQueuePage from './pages/ExceptionQueuePage';
import SupervisorDashboardPage from './pages/SupervisorDashboardPage';
import AIDocumentExtractionPage from './pages/AIDocumentExtractionPage';
import ValidationChecksPage from './pages/ValidationChecksPage';
import GroundedSummariesPage from './pages/GroundedSummariesPage';
import ReportsAnalyticsPage from './pages/ReportsAnalyticsPage';
import NotificationsPage from './pages/NotificationsPage';
import UserManagementPage from './pages/UserManagementPage';
import AuditSettingsPage from './pages/AuditSettingsPage';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white text-xs">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mr-3" />
        Authenticating session...
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<LoginPage />} />

          {/* Protected Application Modules */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* 1. Secure Document Intake & Dashboard */}
            <Route index element={<IntakeDashboardPage />} />

            {/* 2. Case Review Workspace */}
            <Route path="cases" element={<CaseWorkspacePage />} />
            <Route path="cases/:id" element={<CaseWorkspacePage />} />

            {/* 3. Exception Review Queue */}
            <Route
              path="exceptions"
              element={
                <ProtectedRoute allowedRoles={['Reviewer', 'Supervisor', 'Compliance Admin']}>
                  <ExceptionQueuePage />
                </ProtectedRoute>
              }
            />

            {/* 4. Case Search & Supervisor Dashboard */}
            <Route
              path="supervisor"
              element={
                <ProtectedRoute allowedRoles={['Supervisor', 'Compliance Admin']}>
                  <SupervisorDashboardPage />
                </ProtectedRoute>
              }
            />

            {/* 5. AI Document Extraction Workbench */}
            <Route path="ai-extract" element={<AIDocumentExtractionPage />} />

            {/* 6. Validation & Cross-Document Checks */}
            <Route
              path="validation"
              element={
                <ProtectedRoute allowedRoles={['Reviewer', 'Supervisor', 'Compliance Admin']}>
                  <ValidationChecksPage />
                </ProtectedRoute>
              }
            />

            {/* 7. Grounded Summaries & Decision Support */}
            <Route
              path="summaries"
              element={
                <ProtectedRoute allowedRoles={['Reviewer', 'Supervisor', 'Compliance Admin']}>
                  <GroundedSummariesPage />
                </ProtectedRoute>
              }
            />

            {/* 8. Reports & Analytics */}
            <Route
              path="reports"
              element={
                <ProtectedRoute allowedRoles={['Reviewer', 'Supervisor', 'Compliance Admin']}>
                  <ReportsAnalyticsPage />
                </ProtectedRoute>
              }
            />

            {/* 9. Notifications Center */}
            <Route path="notifications" element={<NotificationsPage />} />

            {/* 10. User & Role Management */}
            <Route
              path="users"
              element={
                <ProtectedRoute allowedRoles={['Compliance Admin', 'Supervisor']}>
                  <UserManagementPage />
                </ProtectedRoute>
              }
            />

            {/* 11. Audit Logs & System Settings */}
            <Route
              path="audit-settings"
              element={
                <ProtectedRoute allowedRoles={['Compliance Admin', 'Supervisor']}>
                  <AuditSettingsPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

