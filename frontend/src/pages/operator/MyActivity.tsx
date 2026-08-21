import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { OtpMessage } from '../../types'
import { History, CheckCircle, Clock, AlertTriangle, TrendingUp } from 'lucide-react'

export function MyActivity() {
  const { data: otps, isLoading } = useQuery<OtpMessage[]>({
    queryKey: ['operator-otps'],
    queryFn: async () => {
      const res = await api.get('/api/operator/otp?limit=100')
      return res.data
    },
  })

  const usedOtps = otps?.filter(o => o.status === 'USED') || []
  const failedOtps = otps?.filter(o => o.status === 'FAILED') || []
  const totalProcessed = usedOtps.length

  const successRate = otps && otps.length > 0
    ? ((usedOtps.length / otps.length) * 100).toFixed(1)
    : '0'

  if (isLoading) return <div className="text-on-surface-variant">Loading...</div>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-display-md font-display-md text-primary">My Activity</h2>
        <p className="text-body-md font-body-md text-on-surface-variant mt-1">Your OTP processing statistics and history.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Received" value={otps?.length ?? 0} icon={<History className="w-5 h-5" />} />
        <StatCard title="Used" value={usedOtps.length} icon={<CheckCircle className="w-5 h-5 text-tertiary-fixed-dim" />} color="green" />
        <StatCard title="Failed" value={failedOtps.length} icon={<AlertTriangle className="w-5 h-5 text-error" />} color="error" />
        <StatCard title="Success Rate" value={`${successRate}%`} icon={<TrendingUp className="w-5 h-5 text-tertiary-fixed-dim" />} color="green" />
      </div>

      {/* Activity Timeline */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div className="p-4 border-b border-outline-variant bg-surface-bright">
          <h3 className="text-headline-sm font-headline-sm text-primary">Activity History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase border-b border-outline-variant">
              <tr>
                <th className="px-4 py-3 font-semibold">Time</th>
                <th className="px-4 py-3 font-semibold">Service</th>
                <th className="px-4 py-3 font-semibold">OTP</th>
                <th className="px-4 py-3 font-semibold">Purpose</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-mono-data font-mono-data">
              {otps?.map(otp => (
                <tr key={otp.id} className="hover:bg-surface-container transition-colors h-12">
                  <td className="px-4 py-2 whitespace-nowrap">{new Date(otp.received_at).toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-surface-container-high text-on-surface">
                      {otp.service_name || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-2 font-bold text-primary">{otp.otp_display || '••••••'}</td>
                  <td className="px-4 py-2 text-on-surface-variant">{otp.purpose || '—'}</td>
                  <td className="px-4 py-2">
                    <StatusBadge status={otp.status} />
                  </td>
                </tr>
              ))}
              {(!otps || otps.length === 0) && <tr><td colSpan={5} className="px-4 py-8 text-center text-on-surface-variant">No activity recorded</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, color = 'primary' }: {
  title: string; value: number | string; icon: React.ReactNode; color?: string
}) {
  const colorMap: Record<string, string> = { primary: 'text-primary', green: 'text-tertiary-fixed-dim', error: 'text-error' }
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
      <div className="flex justify-between items-start mb-2">
        <span className="text-label-sm font-label-sm text-on-surface-variant uppercase">{title}</span>
        {icon}
      </div>
      <p className={`text-display-md font-display-md ${colorMap[color] || 'text-primary'}`}>{typeof value === 'number' ? value.toLocaleString() : value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    USED: 'bg-green-100 text-green-800', DELIVERED: 'bg-blue-100 text-blue-800',
    VIEWED: 'bg-purple-100 text-purple-800', FAILED: 'bg-red-100 text-red-800',
    RECEIVED: 'bg-gray-100 text-gray-800', UNASSIGNED: 'bg-orange-100 text-orange-800',
  }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${colors[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>
}
