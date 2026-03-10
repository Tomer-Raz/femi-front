import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login but save the attempted location
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

interface RoleProtectedRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
}

export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  children,
  allowedRoles
}) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    // User is authenticated but doesn't have the required role
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50" dir="rtl">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 max-w-md text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">אין הרשאה</h1>
          <p className="text-slate-600 mb-6">
            אין לך הרשאות גישה לעמוד זה. אנא צור קשר עם מנהל המערכת.
          </p>
          <a
            href="/dashboard"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            חזרה לדשבורד
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
