import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../services/api'
import { Settings, Shield, Bell, Database, Globe, Key, Save, CheckCircle, AlertTriangle } from 'lucide-react'

export function SuperAdminSettings() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-display-md font-display-md text-primary">Platform Settings</h2>
        <p className="text-body-md font-body-md text-on-surface-variant mt-1">Configure platform-wide settings.</p>
      </div>

      {/* Profile Card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center">
            <span className="text-2xl font-bold text-on-primary-container">{user?.full_name?.charAt(0)}</span>
          </div>
          <div>
            <h3 className="text-headline-sm font-headline-sm text-primary">{user?.full_name}</h3>
            <p className="text-body-md font-body-md text-on-surface-variant">{user?.email}</p>
            <p className="text-label-sm font-label-sm text-secondary uppercase">SUPER ADMIN</p>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <ChangePasswordCard />

      {/* Settings Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SettingsCard
          icon={<Shield className="w-5 h-5" />}
          title="Security"
          description="Password policies, session limits, 2FA"
          value="Configured"
        />
        <SettingsCard
          icon={<Key className="w-5 h-5" />}
          title="API Keys"
          description="Manage API keys and secrets"
          value="3 active"
        />
        <SettingsCard
          icon={<Database className="w-5 h-5" />}
          title="Database"
          description="Backup schedule, retention policy"
          value="Healthy"
          statusColor="text-tertiary-fixed-dim"
        />
        <SettingsCard
          icon={<Globe className="w-5 h-5" />}
          title="Domain & SSL"
          description="Custom domain and certificate management"
          value="otp.nregabot.com"
        />
        <SettingsCard
          icon={<Bell className="w-5 h-5" />}
          title="Notifications"
          description="Platform alert and notification settings"
          value="Enabled"
        />
        <SettingsCard
          icon={<Settings className="w-5 h-5" />}
          title="System"
          description="App version, maintenance mode, logging"
          value="v1.1.0"
        />
      </div>
    </div>
  )
}

function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleChangePassword = async () => {
    setMessage(null)

    if (!currentPassword || !newPassword) {
      setMessage({ type: 'error', text: 'Please fill in all fields' })
      return
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters' })
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }

    setLoading(true)
    try {
      await api.post('/api/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      })
      setMessage({ type: 'success', text: 'Password changed successfully!' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (e: any) {
      setMessage({
        type: 'error',
        text: e.response?.data?.detail || 'Failed to change password'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-error-container flex items-center justify-center">
          <Key className="w-5 h-5 text-error" />
        </div>
        <div>
          <h3 className="text-headline-sm font-headline-sm text-primary">Change Password</h3>
          <p className="text-body-md font-body-md text-on-surface-variant">
            Update your admin password for security
          </p>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-lg mb-4 flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success'
            ? <CheckCircle className="w-4 h-4" />
            : <AlertTriangle className="w-4 h-4" />
          }
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-2">
            Current Password
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter current password"
          />
        </div>

        <div>
          <label className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-2">
            New Password
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter new password (min 6 characters)"
          />
        </div>

        <div>
          <label className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-2">
            Confirm New Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Confirm new password"
          />
        </div>

        <button
          onClick={handleChangePassword}
          disabled={loading || !currentPassword || !newPassword || !confirmPassword}
          className="w-full py-3 bg-primary text-on-primary rounded-lg text-label-sm font-label-sm hover:bg-inverse-surface transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            'Changing...'
          ) : (
            <>
              <Save className="w-4 h-4" /> Change Password
            </>
          )}
        </button>
      </div>
    </div>
  )
}

function SettingsCard({ icon, title, description, value, statusColor }: {
  icon: React.ReactNode; title: string; description: string; value: string; statusColor?: string
}) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 hover:bg-surface-container-low transition-colors cursor-pointer">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant">
          {icon}
        </div>
        <div className="flex-1">
          <h4 className="text-headline-sm font-headline-sm text-primary">{title}</h4>
          <p className="text-body-md font-body-md text-on-surface-variant mt-1">{description}</p>
        </div>
        <span className={`text-label-sm font-label-sm ${statusColor || 'text-on-surface-variant'}`}>{value}</span>
      </div>
    </div>
  )
}
