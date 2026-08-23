import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { LoginPage } from './pages/LoginPage'
import { LandingPage } from './pages/LandingPage'
import { InstructionsPage } from './pages/InstructionsPage'
import { DashboardLayout } from './components/layout/DashboardLayout'

// Super Admin
import { SuperAdminDashboard } from './pages/super-admin/SuperAdminDashboard'
import { PlansManagement } from './pages/super-admin/PlansManagement'
import { SubscriptionsManagement } from './pages/super-admin/SubscriptionsManagement'
import { AppVersionsPage } from './pages/super-admin/AppVersionsPage'
import { OrganizationsManagement } from './pages/super-admin/OrganizationsManagement'
import { SuperAdminSettings } from './pages/super-admin/SuperAdminSettings'

// Office Admin
import { OfficeAdminDashboard } from './pages/office-admin/OfficeAdminDashboard'
import { StaffManagement } from './pages/office-admin/StaffManagement'
import { OperatorManagement } from './pages/office-admin/OperatorManagement'
import { RoutingRules } from './pages/office-admin/RoutingRules'
import { SenderIdsPage } from './pages/office-admin/SenderIdsPage'
import { DevicesPage } from './pages/office-admin/DevicesPage'
import { OtpActivity } from './pages/office-admin/OtpActivity'
import { ReportsPage } from './pages/office-admin/ReportsPage'
import { AuditLogsPage } from './pages/office-admin/AuditLogsPage'
import { SubscriptionPage } from './pages/office-admin/SubscriptionPage'
import { OfficeAdminSettings } from './pages/office-admin/OfficeAdminSettings'

// Operator
import { OperatorLiveOTPs } from './pages/operator/OperatorLiveOTPs'
import { MyActivity } from './pages/operator/MyActivity'
import { OperatorProfile } from './pages/operator/OperatorProfile'

// Staff
import { StaffAuthorizations } from './pages/staff/StaffAuthorizations'
import { DeviceStatus } from './pages/staff/DeviceStatus'
import { StaffDashboard } from './pages/staff/StaffDashboard'
import { StaffSettings } from './pages/staff/StaffSettings'

import { ProtectedRoute } from './components/auth/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/instructions" element={<InstructionsPage />} />
      <Route path="/app" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<RoleBasedDashboard />} />

        {/* Office Admin routes */}
        <Route path="staff" element={<ProtectedRoute roles={['SUPER_ADMIN', 'OFFICE_ADMIN']}><StaffManagement /></ProtectedRoute>} />
        <Route path="operators" element={<ProtectedRoute roles={['SUPER_ADMIN', 'OFFICE_ADMIN']}><OperatorManagement /></ProtectedRoute>} />
        <Route path="routing" element={<ProtectedRoute roles={['SUPER_ADMIN', 'OFFICE_ADMIN']}><RoutingRules /></ProtectedRoute>} />
        <Route path="sender-ids" element={<ProtectedRoute roles={['SUPER_ADMIN', 'OFFICE_ADMIN']}><SenderIdsPage /></ProtectedRoute>} />
        <Route path="devices" element={<ProtectedRoute roles={['SUPER_ADMIN', 'OFFICE_ADMIN']}><DevicesPage /></ProtectedRoute>} />
        <Route path="otp-activity" element={<ProtectedRoute roles={['SUPER_ADMIN', 'OFFICE_ADMIN']}><OtpActivity /></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute roles={['SUPER_ADMIN', 'OFFICE_ADMIN']}><ReportsPage /></ProtectedRoute>} />
        <Route path="audit" element={<ProtectedRoute roles={['SUPER_ADMIN', 'OFFICE_ADMIN']}><AuditLogsPage /></ProtectedRoute>} />
        <Route path="subscription" element={<ProtectedRoute roles={['OFFICE_ADMIN']}><SubscriptionPage /></ProtectedRoute>} />

        {/* Operator routes */}
        <Route path="live-otps" element={<ProtectedRoute roles={['OPERATOR', 'OFFICE_ADMIN']}><OperatorLiveOTPs /></ProtectedRoute>} />
        <Route path="my-activity" element={<ProtectedRoute roles={['OPERATOR']}><MyActivity /></ProtectedRoute>} />

        {/* Staff routes */}
        <Route path="authorizations" element={<ProtectedRoute roles={['STAFF']}><StaffAuthorizations /></ProtectedRoute>} />
        <Route path="device-status" element={<ProtectedRoute roles={['STAFF']}><DeviceStatus /></ProtectedRoute>} />
        <Route path="staff-dashboard" element={<ProtectedRoute roles={['STAFF']}><StaffDashboard /></ProtectedRoute>} />

        {/* Super Admin routes */}
        <Route path="organizations" element={<ProtectedRoute roles={['SUPER_ADMIN']}><OrganizationsManagement /></ProtectedRoute>} />
        <Route path="plans" element={<ProtectedRoute roles={['SUPER_ADMIN']}><PlansManagement /></ProtectedRoute>} />
        <Route path="subscriptions" element={<ProtectedRoute roles={['SUPER_ADMIN']}><SubscriptionsManagement /></ProtectedRoute>} />
        <Route path="app-versions" element={<ProtectedRoute roles={['SUPER_ADMIN']}><AppVersionsPage /></ProtectedRoute>} />

        {/* Role-based Settings */}
        <Route path="settings" element={<RoleBasedSettings />} />
      </Route>
      <Route path="/app/*" element={<Navigate to="/app" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function RoleBasedDashboard() {
  const { user } = useAuth()
  if (!user) return null

  switch (user.role) {
    case 'SUPER_ADMIN': return <SuperAdminDashboard />
    case 'OFFICE_ADMIN': return <OfficeAdminDashboard />
    case 'OPERATOR': return <OperatorLiveOTPs />
    case 'STAFF': return <StaffDashboard />
    default: return <Navigate to="/login" replace />
  }
}

function RoleBasedSettings() {
  const { user } = useAuth()
  if (!user) return null

  switch (user.role) {
    case 'SUPER_ADMIN': return <SuperAdminSettings />
    case 'OFFICE_ADMIN': return <OfficeAdminSettings />
    case 'OPERATOR': return <OperatorProfile />
    case 'STAFF': return <StaffSettings />
    default: return <Navigate to="/login" replace />
  }
}

export default App
