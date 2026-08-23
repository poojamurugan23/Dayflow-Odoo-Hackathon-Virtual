import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';
import { ForcePasswordChange } from './pages/auth/ForcePasswordChange';

// Employee Pages
import { EmployeeDashboard } from './pages/employee/Dashboard';
import { EmployeeProfile } from './pages/employee/Profile';
import { EmployeeAttendance } from './pages/employee/Attendance';
import { EmployeeTimeOff } from './pages/employee/TimeOff';
import { EmployeePayroll } from './pages/employee/Payroll';
import { EmployeeComplaints } from './pages/employee/Complaints';
import { EmployeeMeetings } from './pages/employee/Meetings';

// Admin/HR Pages
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminProfile } from './pages/admin/Profile';
import { AdminEmployees } from './pages/admin/Employees';
import { AdminAttendance } from './pages/admin/Attendance';
import { AdminTimeOff } from './pages/admin/TimeOff';
import { AdminPayroll } from './pages/admin/Payroll';
import { AdminReports } from './pages/admin/Reports';

// Super Admin Pages (New)
import { SuperAdminDashboard } from './pages/superadmin/Dashboard';
import { SuperAdminProfiles } from './pages/superadmin/Profiles';
import { SuperAdminHRApproval } from './pages/superadmin/HRApproval';
import { SuperAdminComplaints } from './pages/superadmin/Complaints';
import { SuperAdminMeetings } from './pages/superadmin/Meetings';

// Shared Pages
import { SettingsPage } from './pages/Settings';

function RedirectHome() {
  const { user, role } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.must_change_password) return <ForcePasswordChange />;
  if (role === 'admin') return <Navigate to="/superadmin/dashboard" replace />;
  if (role === 'hr') return <Navigate to="/hr/dashboard" replace />;
  return <Navigate to="/employee/dashboard" replace />;
}

// Wrapper for checking must_change_password inside protected routes
function RequirePasswordChangeCheck({ children }) {
  const { user } = useAuth();
  if (user?.must_change_password) {
    return <ForcePasswordChange />;
  }
  return children;
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
              <RequirePasswordChangeCheck>
                <DashboardLayout role="employee">
                  <Routes>
                    <Route path="dashboard" element={<EmployeeDashboard />} />
                    <Route path="profile" element={<EmployeeProfile />} />
                    <Route path="attendance" element={<EmployeeAttendance />} />
                    <Route path="timeoff" element={<EmployeeTimeOff />} />
                    <Route path="payroll" element={<EmployeePayroll />} />
                    <Route path="complaints" element={<EmployeeComplaints />} />
                    <Route path="meetings" element={<EmployeeMeetings />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="*" element={<Navigate to="dashboard" replace />} />
                  </Routes>
                </DashboardLayout>
              </RequirePasswordChangeCheck>
            </ProtectedRoute>
          } />

          {/* HR Routes */}
          <Route path="/hr/*" element={
            <ProtectedRoute allowedRoles={['hr']}>
              <RequirePasswordChangeCheck>
                <DashboardLayout role="hr">
                  <Routes>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="profile" element={<AdminProfile />} />
                    <Route path="employees" element={<AdminEmployees />} />
                    <Route path="attendance" element={<AdminAttendance />} />
                    <Route path="timeoff" element={<AdminTimeOff />} />
                    <Route path="payroll" element={<AdminPayroll />} />
                    <Route path="reports" element={<AdminReports />} />
                    <Route path="complaints" element={<EmployeeComplaints />} />
                    <Route path="meetings" element={<EmployeeMeetings />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="*" element={<Navigate to="dashboard" replace />} />
                  </Routes>
                </DashboardLayout>
              </RequirePasswordChangeCheck>
            </ProtectedRoute>
          } />

          {/* Super Admin Routes */}
          <Route path="/superadmin/*" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <RequirePasswordChangeCheck>
                <DashboardLayout role="admin">
                  <Routes>
                    <Route path="dashboard" element={<SuperAdminDashboard />} />
                    <Route path="profile" element={<AdminProfile />} />
                    <Route path="profiles" element={<SuperAdminProfiles />} />
                    <Route path="hr-approval" element={<SuperAdminHRApproval />} />
                    <Route path="reports" element={<AdminReports />} />
                    <Route path="complaints" element={<SuperAdminComplaints />} />
                    <Route path="meetings" element={<SuperAdminMeetings />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="*" element={<Navigate to="dashboard" replace />} />
                  </Routes>
                </DashboardLayout>
              </RequirePasswordChangeCheck>
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
