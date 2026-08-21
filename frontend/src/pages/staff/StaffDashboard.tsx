import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { Shield, Radio, Users, Smartphone, ArrowRight, CheckCircle, Wifi, Clock } from 'lucide-react'

interface RoutingInfo {
  id: string
  name: string
  sender_id: string | null
  operator_id: string
  priority: string
  is_active: boolean
}

interface SenderInfo {
  id: string
  sender_id: string
  display_name: string | null
  department_id: string | null
  otp_length: number
}

export function StaffDashboard() {
  const { data: authorizations } = useQuery({
    queryKey: ['staff-authorizations'],
    queryFn: async () => { const r = await api.get('/api/staff/authorizations'); return r.data },
  })

  const { data: senders } = useQuery<SenderInfo[]>({
    queryKey: ['admin-sender-ids'],
    queryFn: async () => { const r = await api.get('/api/admin/sender-ids'); return r.data },
  })

  const authorizedCount = authorizations?.filter((a: any) => a.status === 'AUTHORIZED').length || 0
  const totalCount = senders?.length || 0

  // Sample routing info (in real app, this would come from API)
  const routingInfo = [
    { service: 'VBGRAMG', sender: 'BT-VBGRAM-G', operator: 'Amit Kumar', priority: 'High' },
    { service: 'MKUBER', sender: 'AX-MKUBER-S', operator: 'Sunita Devi', priority: 'High' },
    { service: 'NREGA', sender: 'JD-NREGA-D', operator: 'Amit Kumar', priority: 'Normal' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-display-md font-display-md text-primary">Staff Dashboard</h2>
        <p className="text-body-md font-body-md text-on-surface-variant mt-1">
          Your OTP sharing status and routing information.
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatusCard
          icon={<Wifi className="w-5 h-5 text-tertiary-fixed-dim" />}
          title="Device Status"
          value="Connected"
          color="green"
        />
        <StatusCard
          icon={<Shield className="w-5 h-5 text-secondary" />}
          title="Authorized Senders"
          value={`${authorizedCount} / ${totalCount}`}
          color="secondary"
        />
        <StatusCard
          icon={<Radio className="w-5 h-5 text-tertiary-fixed-dim" />}
          title="Active Routing"
          value={`${routingInfo.length} rules`}
          color="green"
        />
      </div>

      {/* OTP Routing Flow */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
        <h3 className="text-headline-sm font-headline-sm text-primary mb-4 flex items-center gap-2">
          <Radio className="w-5 h-5" /> OTP Routing Flow
        </h3>
        <p className="text-body-md font-body-md text-on-surface-variant mb-4">
          When you receive an OTP, it follows this path to reach the operator:
        </p>

        {/* Visual Flow */}
        <div className="flex items-center justify-between bg-surface-container-low rounded-lg p-4 mb-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center mx-auto mb-2">
              <Smartphone className="w-6 h-6 text-on-secondary" />
            </div>
            <p className="text-label-sm font-label-sm text-primary font-bold">Your Phone</p>
            <p className="text-[10px] text-on-surface-variant">Receives SMS</p>
          </div>
          <ArrowRight className="w-6 h-6 text-on-surface-variant" />
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center mx-auto mb-2">
              <Shield className="w-6 h-6 text-on-primary" />
            </div>
            <p className="text-label-sm font-label-sm text-primary font-bold">OTP Relay</p>
            <p className="text-[10px] text-on-surface-variant">Extracts & Routes</p>
          </div>
          <ArrowRight className="w-6 h-6 text-on-surface-variant" />
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-tertiary-container flex items-center justify-center mx-auto mb-2">
              <Users className="w-6 h-6 text-on-tertiary" />
            </div>
            <p className="text-label-sm font-label-sm text-primary font-bold">Operator</p>
            <p className="text-[10px] text-on-surface-variant">Processes OTP</p>
          </div>
        </div>
      </div>

      {/* Routing Rules */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div className="p-4 border-b border-outline-variant bg-surface-bright">
          <h3 className="text-headline-sm font-headline-sm text-primary flex items-center gap-2">
            <Users className="w-5 h-5" /> Active Routing Rules
          </h3>
          <p className="text-body-md font-body-md text-on-surface-variant mt-1">
            Which operator receives OTPs from each service
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase border-b border-outline-variant">
              <tr>
                <th className="px-4 py-3 font-semibold">Service</th>
                <th className="px-4 py-3 font-semibold">Sender ID</th>
                <th className="px-4 py-3 font-semibold text-center">Route To</th>
                <th className="px-4 py-3 font-semibold">Priority</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-mono-data font-mono-data">
              {routingInfo.map((rule, i) => (
                <tr key={i} className="hover:bg-surface-container transition-colors h-12">
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-surface-container-high text-on-surface">
                      {rule.service}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-primary font-medium">{rule.sender}</td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <ArrowRight className="w-4 h-4 text-tertiary-fixed-dim" />
                      <span className="text-primary font-semibold">{rule.operator}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`text-[11px] font-bold uppercase ${
                      rule.priority === 'High' ? 'text-error' : 'text-on-surface-variant'
                    }`}>{rule.priority}</span>
                  </td>
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-tertiary-fixed-dim">
                      <CheckCircle className="w-3 h-3" /> Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Device Status */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
        <h3 className="text-headline-sm font-headline-sm text-primary mb-4 flex items-center gap-2">
          <Smartphone className="w-5 h-5" /> Device Status
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-label-sm font-label-sm text-on-surface-variant">Status</p>
            <p className="text-body-md font-body-md text-tertiary-fixed-dim font-semibold flex items-center gap-1">
              <Wifi className="w-4 h-4" /> Online
            </p>
          </div>
          <div>
            <p className="text-label-sm font-label-sm text-on-surface-variant">Last Sync</p>
            <p className="text-body-md font-body-md text-primary font-semibold flex items-center gap-1">
              <Clock className="w-4 h-4" /> {new Date().toLocaleTimeString()}
            </p>
          </div>
          <div>
            <p className="text-label-sm font-label-sm text-on-surface-variant">App Version</p>
            <p className="text-body-md font-body-md text-primary font-semibold">1.0.0</p>
          </div>
          <div>
            <p className="text-label-sm font-label-sm text-on-surface-variant">Android</p>
            <p className="text-body-md font-body-md text-primary font-semibold">14</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusCard({ icon, title, value, color }: {
  icon: React.ReactNode; title: string; value: string; color: string
}) {
  const colorMap: Record<string, string> = {
    green: 'bg-tertiary-fixed-dim/10 border-tertiary-fixed-dim/30',
    secondary: 'bg-secondary/10 border-secondary/30',
    error: 'bg-error/10 border-error/30',
  }
  return (
    <div className={`border rounded-xl p-5 ${colorMap[color] || 'bg-surface-container-lowest border-outline-variant'}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-label-sm font-label-sm text-on-surface-variant uppercase">{title}</span>
      </div>
      <p className="text-headline-sm font-headline-sm text-primary">{value}</p>
    </div>
  )
}
