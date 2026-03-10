import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { MOCK_HOSPITALS } from '@/mockData';

export const AuthenticatedLayout: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Check for global pending notifications (for Sidebar)
  const hasPendingAdminActions = MOCK_HOSPITALS.some(h => h.hasPendingUploads);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900" dir="rtl">
      <Sidebar
        user={user!}
        onLogout={logout}
        hasPendingNotifications={hasPendingAdminActions}
      />

      <main className="flex-1 overflow-auto relative">
        <Outlet />
      </main>
    </div>
  );
};
