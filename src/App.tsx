import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { RoleProtectedRoute } from '@/components/routing/ProtectedRoute';
import { Login } from '@/screens/Login';
import { Dashboard } from '@/screens/Dashboard';
import { HospitalMonths } from '@/screens/HospitalMonths';
import { MonthlyResults } from '@/screens/MonthlyResults';
import { AdminManagement } from '@/screens/AdminManagement';
import { MyTeam } from '@/screens/MyTeam';
import { UserRole } from '@/types';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />

          {/* Authenticated Routes - wrapped in layout with Sidebar */}
          <Route element={<AuthenticatedLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />

            <Route path="/hospitals/:hospitalCode" element={<HospitalMonths />} />

            <Route path="/hospitals/:hospitalCode/months/:month" element={<MonthlyResults />} />

            {/* Team Lead Routes */}
            <Route
              path="/my-team"
              element={
                <RoleProtectedRoute allowedRoles={[UserRole.TeamLead]}>
                  <MyTeam />
                </RoleProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/runs"
              element={
                <RoleProtectedRoute allowedRoles={[UserRole.Admin]}>
                  <AdminManagement view="runs" />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/admin/tables"
              element={
                <RoleProtectedRoute allowedRoles={[UserRole.Admin]}>
                  <AdminManagement view="tables" />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/admin/rules"
              element={
                <RoleProtectedRoute allowedRoles={[UserRole.Admin]}>
                  <AdminManagement view="rules" />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <RoleProtectedRoute allowedRoles={[UserRole.Admin]}>
                  <AdminManagement view="users" />
                </RoleProtectedRoute>
              }
            />
          </Route>

          {/* 404 Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
