import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { DashboardMetrics, OtpMessage } from '../../types'
import { Send, Clock, CheckCircle, AlertTriangle, Users, UserCheck, Smartphone } from 'lucide-react'

export function OfficeAdminDashboard() {
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ['office-admin-dashboard'],
    queryFn: async () => {
      const res = await api.get('/api/admin/dashboard')
      return res.data
    },
  })

  const { data: otps } = useQuery<OtpMessage[]>({
    queryKey: ['admin-otps'],
    queryFn: async () => {
      const res = await api.get('/api/admin/otp?limit=10')
      return res.data
    },
  })

  if (isLoading) return <div className="text-on-surface-variant">Loading...</div>

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-display-md font-display-md text-primary">Office Dashboard</h2>
        <p className="text-body-md font-body-md text-on-surface-variant mt-1">
          Real-time overview of your office operations.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="OTPs Today" value={metrics?.otps_today ?? 0} icon={<Send className="w-5 h-5" />} />
        <MetricCard title="Pending" value={metrics?.pending_otps ?? 0} icon={<Clock className="w-5 h-5" />} color="secondary" />
        <MetricCard title="Completed" value={metrics?.used_otps ?? 0} icon={<CheckCircle className="w-5 h-5" />} color="green" />
        <MetricCard title="Failed" value={metrics?.failed_otps ?? 0} icon={<AlertTriangle className="w-5 h-5" />} color="error" />
      </div>

      {/* Resource Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
          <h3 className="text-headline-sm font-headline-sm text-primary mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" /> Resource Summary
          </h3>
          <div className="space-y-3">
            <ResourceRow label="Staff" value={metrics?.total_staff ?? 0} max={50} icon={<Users className="w-4 h-4" />} />
            <ResourceRow label="Operators" value={metrics?.total_operators ?? 0} max={10} icon={<UserCheck className="w-4 h-4" />} />
            <ResourceRow label="Active Devices" value={metrics?.active_devices ?? 0} max={50} icon={<Smartphone className="w-4 h-4" />} />
          </div>
        </div>

        <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
          <h3 className="text-headline-sm font-headline-sm text-primary mb-4 flex items-center gap-2">
            Activity Overview
          </h3>
          <div className="h-48 flex items-end gap-2 border-b border-l border-outline-variant p-2">
            {Array.from({ length: 12 }, (_, i) => {
              const height = Math.random() * 80 + 20
              return (
                <div
                  key={i}
                  className="flex-1 bg-primary-container rounded-t-sm hover:opacity-80 transition-opacity"
                  style={{ height: `${height}%` }}
                />
              )
            })}
          </div>
        </div>
      </div>

      {/* Recent OTP Activity */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div className="p-4 border-b border-outline-variant bg-surface-bright">
          <h3 className="text-headline-sm font-headline-sm text-primary">Recent OTP Activity</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase border-b border-outline-variant">
              <tr>
                <th className="px-4 py-3 font-semibold">Time</th>
                <th className="px-4 py-3 font-semibold">Service</th>
                <th className="px-4 py-3 font-semibold">Sender</th>
                <th className="px-4 py-3 font-semibold">Purpose</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-mono-data font-mono-data">
              {otps?.map((otp) => (
                <tr key={otp.id} className="hover:bg-surface-container transition-colors h-12">
                  <td className="px-4 py-2 whitespace-nowrap">{new Date(otp.received_at).toLocaleTimeString()}</td>
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-surface-container-high text-on-surface">
                      {otp.service_name || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-2">{otp.sender_text}</td>
                  <td className="px-4 py-2 text-on-surface-variant">{otp.purpose || '—'}</td>
                  <td className="px-4 py-2"><StatusBadge status={otp.status} /></td>
                </tr>
              ))}
              {(!otps || otps.length === 0) && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-on-surface-variant">No recent activity</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ title, value, icon, color = 'primary' }: {
  title: string; value: number; icon: React.ReactNode; color?: string
}) {
  const colorMap: Record<string, string> = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    green: 'text-tertiary-fixed-dim',
    error: 'text-error',
  }
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col">
      <div className="flex justify-between items-start mb-2">
        <span className="text-label-sm font-label-sm text-on-surface-variant uppercase">{title}</span>
        <span className={colorMap[color] || 'text-on-surface-variant'}>{icon}</span>
      </div>
      <div className={`text-display-md font-display-md ${colorMap[color] || 'text-primary'} mt-auto`}>
        {value}
      </div>
    </div>
  )
}

function ResourceRow({ label, value, max, icon }: {
  label: string; value: number; max: number; icon: React.ReactNode
}) {
  return (
    <div className="flex justify-between items-center p-3 bg-surface-container-low rounded border border-surface-variant">
      <div className="flex items-center gap-3">
        <span className="text-on-surface-variant">{icon}</span>
        <span className="text-body-md font-body-md text-primary font-semibold">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-headline-sm font-headline-sm text-primary">{value}</span>
        <span className="text-label-sm font-label-sm text-on-surface-variant">/ {max}</span>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    USED: 'bg-green-100 text-green-800',
    DELIVERED: 'bg-blue-100 text-blue-800',
    VIEWED: 'bg-purple-100 text-purple-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    FAILED: 'bg-red-100 text-red-800',
    RECEIVED: 'bg-gray-100 text-gray-800',
    UNASSIGNED: 'bg-orange-100 text-orange-800',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  )
}
