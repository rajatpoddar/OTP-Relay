import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { DashboardMetrics, Organization } from '../../types'
import { Building2, Users, Smartphone, Activity, Plus, TrendingUp, AlertTriangle } from 'lucide-react'

export function SuperAdminDashboard() {
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ['super-admin-dashboard'],
    queryFn: async () => {
      const res = await api.get('/api/super-admin/dashboard')
      return res.data
    },
  })

  const { data: orgs } = useQuery<Organization[]>({
    queryKey: ['organizations'],
    queryFn: async () => {
      const res = await api.get('/api/super-admin/organizations?limit=10')
      return res.data
    },
  })

  if (isLoading) {
    return <div className="text-on-surface-variant">Loading...</div>
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-display-lg font-display-lg text-primary">System Overview</h2>
          <p className="text-body-lg font-body-lg text-on-surface-variant mt-1">
            Real-time metrics for all OTP Relay organizations.
          </p>
        </div>
        <button className="px-4 py-2 rounded-lg bg-primary text-on-primary text-label-sm font-label-sm flex items-center gap-2 hover:bg-inverse-surface transition-colors">
          <Plus className="w-4 h-4" />
          New Organization
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Organizations"
          value={metrics?.total_organizations ?? 0}
          icon={<Building2 className="w-5 h-5" />}
          trend="+12 this week"
          trendUp
        />
        <KPICard
          title="Active Offices"
          value={metrics?.active_organizations ?? 0}
          icon={<Activity className="w-5 h-5 text-tertiary-fixed-dim" />}
          subtitle={`${((metrics?.active_organizations ?? 0) / (metrics?.total_organizations ?? 1) * 100).toFixed(1)}% of total`}
        />
        <KPICard
          title="Total Staff"
          value={metrics?.total_staff ?? 0}
          icon={<Users className="w-5 h-5 text-secondary" />}
          subtitle="Across all organizations"
        />
        <KPICard
          title="OTPs This Month"
          value={metrics?.otps_this_month ?? 0}
          icon={<Smartphone className="w-5 h-5 text-tertiary-fixed-dim" />}
          trend={`Today: ${metrics?.otps_today ?? 0}`}
        />
      </div>

      {/* Organizations Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div className="p-4 border-b border-outline-variant bg-surface-bright">
          <h3 className="text-headline-sm font-headline-sm text-primary">Recent Organizations</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 font-semibold">Organization</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container text-mono-data font-mono-data">
              {orgs?.map((org) => (
                <tr key={org.id} className="hover:bg-surface-container-lowest/50 transition-colors h-12">
                  <td className="px-4 py-2">
                    <div className="font-medium text-primary">{org.name}</div>
                    <div className="text-[11px] text-on-surface-variant">{org.code}</div>
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge status={org.status} />
                  </td>
                  <td className="px-4 py-2 text-on-surface-variant">
                    {new Date(org.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {(!orgs || orgs.length === 0) && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-on-surface-variant">
                    No organizations found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function KPICard({ title, value, icon, trend, trendUp, subtitle }: {
  title: string
  value: number
  icon: React.ReactNode
  trend?: string
  trendUp?: boolean
  subtitle?: string
}) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col justify-between h-32">
      <div className="flex justify-between items-start">
        <h3 className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">{title}</h3>
        {icon}
      </div>
      <div>
        <p className="text-display-md font-display-md text-primary">{value.toLocaleString()}</p>
        {trend && (
          <p className={`text-mono-data font-mono-data flex items-center gap-1 mt-1 ${trendUp ? 'text-tertiary-fixed-dim' : 'text-on-surface-variant'}`}>
            {trendUp && <TrendingUp className="w-3.5 h-3.5" />}
            {trend}
          </p>
        )}
        {subtitle && (
          <p className="text-mono-data font-mono-data text-on-surface-variant mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ACTIVE: 'bg-[#dcfce7] text-[#166534]',
    TRIAL: 'bg-[#dbeafe] text-[#1e40af]',
    EXPIRED: 'bg-[#fee2e2] text-[#991b1b]',
    SUSPENDED: 'bg-[#fee2e2] text-[#991b1b]',
    PAST_DUE: 'bg-[#fef3c7] text-[#92400e]',
    CANCELLED: 'bg-[#f3f4f6] text-[#374151]',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  )
}
