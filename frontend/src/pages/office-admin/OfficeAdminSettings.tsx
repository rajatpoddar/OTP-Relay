import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import { Settings, Building2, Users, Smartphone, Shield, Bell, Key } from 'lucide-react'

export function OfficeAdminSettings() {
  const { user } = useAuth()

  const { data: subscription } = useQuery({
    queryKey: ['admin-subscription'],
    queryFn: async () => { const r = await api.get('/api/admin/subscription'); return r.data },
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-display-md font-display-md text-primary">Office Settings</h2>
        <p className="text-body-md font-body-md text-on-surface-variant mt-1">Manage your office configuration.</p>
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
            <p className="text-label-sm font-label-sm text-secondary uppercase">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SettingsCard
          icon={<Building2 className="w-5 h-5" />}
          title="Organization"
          description="Office name, location, and hierarchy"
          value="Your Organization"
        />
        <SettingsCard
          icon={<Key className="w-5 h-5" />}
          title="Subscription"
          description={subscription?.plan_name || 'No plan'}
          value={subscription?.status || 'N/A'}
          statusColor={subscription?.status === 'ACTIVE' ? 'text-tertiary-fixed-dim' : 'text-error'}
        />
        <SettingsCard
          icon={<Users className="w-5 h-5" />}
          title="Staff Limit"
          description={`${subscription?.usage?.staff_count || 0} / ${subscription?.limits?.staff_limit || 0} staff members`}
          value={`${subscription?.usage?.staff_count || 0} used`}
        />
        <SettingsCard
          icon={<Smartphone className="w-5 h-5" />}
          title="Device Limit"
          description={`${subscription?.usage?.device_count || 0} / ${subscription?.limits?.device_limit || 0} devices`}
          value={`${subscription?.usage?.device_count || 0} used`}
        />
        <SettingsCard
          icon={<Shield className="w-5 h-5" />}
          title="Security"
          description="Password, 2FA, session management"
          value="Configured"
        />
        <SettingsCard
          icon={<Bell className="w-5 h-5" />}
          title="Notifications"
          description="Email and push notification settings"
          value="Enabled"
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
