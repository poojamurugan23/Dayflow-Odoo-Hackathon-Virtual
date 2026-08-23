import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';

// Employee Pages
import { EmployeeDashboard } from './pages/employee/Dashboard';
import { EmployeeProfile } from './pages/employee/Profile';
import { EmployeeAttendance } from './pages/employee/Attendance';
import { EmployeeTimeOff } from './pages/employee/TimeOff';
import { EmployeePayroll } from './pages/employee/Payroll';

// Admin Pages
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminProfile } from './pages/admin/Profile';
import { AdminEmployees } from './pages/admin/Employees';
import { AdminAttendance } from './pages/admin/Attendance';
import { AdminTimeOff } from './pages/admin/TimeOff';
import { AdminPayroll } from './pages/admin/Payroll';
import { AdminReports } from './pages/admin/Reports';

// Shared Pages
import { SettingsPage } from './pages/Settings';

function RedirectHome() {
  const { user, role } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={(role === 'admin' || role === 'hr') ? '/admin/dashboard' : '/employee/dashboard'} replace />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<RedirectHome />} />

          {/* Employee Routes */}
          <Route path="/employee/*" element={
            <ProtectedRoute allowedRoles={['employee']}>
              <DashboardLayout role="employee">
                <Routes>
                  <Route path="dashboard" element={<EmployeeDashboard />} />
                  <Route path="profile" element={<EmployeeProfile />} />
                  <Route path="attendance" element={<EmployeeAttendance />} />
                  <Route path="timeoff" element={<EmployeeTimeOff />} />
                  <Route path="payroll" element={<EmployeePayroll />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Routes>
              </DashboardLayout>
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin/*" element={
            <ProtectedRoute allowedRoles={['admin', 'hr']}>
              <DashboardLayout role="admin">
                <Routes>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="profile" element={<AdminProfile />} />
                  <Route path="employees" element={<AdminEmployees />} />
                  <Route path="attendance" element={<AdminAttendance />} />
                  <Route path="timeoff" element={<AdminTimeOff />} />
                  <Route path="payroll" element={<AdminPayroll />} />
                  <Route path="reports" element={<AdminReports />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Routes>
              </DashboardLayout>
            </ProtectedRoute>
          } />

          {/* Catch-all */}
          <Route path="*" element={<RedirectHome />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
