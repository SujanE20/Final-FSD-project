import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import AuthLayout from './layouts/AuthLayout.jsx';
import AppShell from './layouts/AppShell.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ExecutionDetailPage from './pages/ExecutionDetailPage.jsx';
import ExecutionHistoryPage from './pages/ExecutionHistoryPage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import TasksPage from './pages/TasksPage.jsx';
import WorkflowsPage from './pages/WorkflowsPage.jsx';

const WorkflowDesignerPage = lazy(() => import('./pages/WorkflowDesignerPage.jsx'));

function ProtectedRoute({ children }) {
  const { user, checking } = useAuth();

  if (checking) {
    return <main className="loading-screen">Restoring your session…</main>;
  }

  return user ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
  const { user, checking } = useAuth();

  if (checking) {
    return <main className="loading-screen">Loading…</main>;
  }

  return user ? <Navigate to="/dashboard" replace /> : children;
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/login"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestRoute>
                <RegisterPage />
              </GuestRoute>
            }
          />
        </Route>
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/workflows" element={<WorkflowsPage />} />
          <Route path="/workflows/new" element={<Suspense fallback={<main className="loading-screen">Loading designer…</main>}><WorkflowDesignerPage /></Suspense>} />
          <Route path="/workflows/:workflowId/edit" element={<Suspense fallback={<main className="loading-screen">Loading designer…</main>}><WorkflowDesignerPage /></Suspense>} />
          <Route path="/executions" element={<ExecutionHistoryPage />} />
          <Route path="/executions/:executionId" element={<ExecutionDetailPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
