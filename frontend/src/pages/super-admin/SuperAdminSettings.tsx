import { useAuth } from '../../hooks/useAuth'
import { Settings, Shield, Bell, Database, Globe, Key } from 'lucide-react'

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
          value="localhost"
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
          value="v1.0.0"
        />
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
