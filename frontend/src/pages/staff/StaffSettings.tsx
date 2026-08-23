import { useAuth } from '../../hooks/useAuth'
import { User, Mail, Shield, Bell, Key, LogOut, Smartphone, Building2 } from 'lucide-react'

export function StaffSettings() {
  const { user, logout } = useAuth()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-display-md font-display-md text-primary">Settings</h2>
        <p className="text-body-md font-body-md text-on-surface-variant mt-1">Manage your account and preferences.</p>
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
            <p className="text-label-sm font-label-sm text-secondary uppercase">STAFF</p>
          </div>
        </div>
      </div>

      {/* Account Settings */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
        <h3 className="text-headline-sm font-headline-sm text-primary mb-4">Account</h3>
        <div className="space-y-4">
          <SettingsRow
            icon={<User className="w-5 h-5" />}
            label="Full Name"
            value={user?.full_name || '—'}
          />
          <SettingsRow
            icon={<Mail className="w-5 h-5" />}
            label="Email"
            value={user?.email || '—'}
          />
          <SettingsRow
            icon={<Building2 className="w-5 h-5" />}
            label="Organization"
            value="Your Organization"
          />
          <SettingsRow
            icon={<Shield className="w-5 h-5" />}
            label="Role"
            value="Staff"
          />
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
        <h3 className="text-headline-sm font-headline-sm text-primary mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5" /> Notifications
        </h3>
        <div className="space-y-4">
          <ToggleRow label="OTP Relay Notifications" description="Get notified when OTP is relayed" enabled={true} />
          <ToggleRow label="Device Status Alerts" description="Alert when device goes offline" enabled={true} />
          <ToggleRow label="Authorization Updates" description="Notify when sender authorization changes" enabled={false} />
        </div>
      </div>

      {/* Security */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
        <h3 className="text-headline-sm font-headline-sm text-primary mb-4 flex items-center gap-2">
          <Key className="w-5 h-5" /> Security
        </h3>
        <div className="space-y-4">
          <SettingsRow
            icon={<Key className="w-5 h-5" />}
            label="Password"
            value="••••••••"
            action="Change"
          />
          <SettingsRow
            icon={<Smartphone className="w-5 h-5" />}
            label="Active Sessions"
            value="1 device"
            action="Manage"
          />
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full py-3 bg-error/10 border border-error/30 text-error rounded-lg text-label-sm font-label-sm flex items-center justify-center gap-2 hover:bg-error/20 transition-colors"
      >
        <LogOut className="w-5 h-5" /> Logout
      </button>
    </div>
  )
}

function SettingsRow({ icon, label, value, action }: {
  icon: React.ReactNode; label: string; value: string; action?: string
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-outline-variant/50 last:border-0">
      <div className="flex items-center gap-3 text-on-surface-variant">
        {icon}
        <span className="text-body-md font-body-md">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-body-md font-body-md text-primary">{value}</span>
        {action && (
          <button className="text-label-sm font-label-sm text-secondary hover:underline">{action}</button>
        )}
      </div>
    </div>
  )
}

function ToggleRow({ label, description, enabled }: {
  label: string; description: string; enabled: boolean
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-body-md font-body-md text-primary">{label}</p>
        <p className="text-label-sm font-label-sm text-on-surface-variant">{description}</p>
      </div>
      <div className={`w-12 h-6 rounded-full transition-colors cursor-pointer ${enabled ? 'bg-secondary' : 'bg-surface-container-high'}`}>
        <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform mt-0.5 ${enabled ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
      </div>
    </div>
  )
}
