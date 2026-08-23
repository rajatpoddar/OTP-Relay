import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { Shield, Radio, Users, Smartphone, ArrowRight, CheckCircle, Wifi, Clock, AlertTriangle, XCircle, Check, Ban } from 'lucide-react'

interface RoutingInfo {
  id: string
  name: string
  sender_id: string | null
  service_id: string | null
  operator_id: string
  priority: string
  is_active: boolean
  authorization_status: string
}

interface SenderInfo {
  id: string
  sender_id: string
  display_name: string | null
  department_id: string | null
  otp_length: number
}

export function StaffDashboard() {
  const queryClient = useQueryClient()
  const [rejectReason, setRejectReason] = useState('')
  const [rejectingId, setRejectingId] = useState<string | null>(null)

  const { data: authorizations } = useQuery({
    queryKey: ['staff-authorizations'],
    queryFn: async () => { const r = await api.get('/api/staff/authorizations'); return r.data },
  })

  const { data: senders } = useQuery<SenderInfo[]>({
    queryKey: ['admin-sender-ids'],
    queryFn: async () => { const r = await api.get('/api/admin/sender-ids'); return r.data },
  })

  const { data: pendingRules } = useQuery<RoutingInfo[]>({
    queryKey: ['staff-pending-rules'],
    queryFn: async () => { const r = await api.get('/api/staff/pending-rules'); return r.data },
  })

  const authorizeRule = useMutation({
    mutationFn: async ({ ruleId, action, reason }: { ruleId: string; action: string; reason?: string }) => {
      const r = await api.post('/api/staff/authorize-rule', { rule_id: ruleId, action, rejection_reason: reason })
      return r.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-pending-rules'] })
      queryClient.invalidateQueries({ queryKey: ['routing-rules'] })
      setRejectingId(null)
      setRejectReason('')
    },
  })

  const authorizedCount = authorizations?.filter((a: any) => a.status === 'AUTHORIZED').length || 0
  const totalCount = senders?.length || 0

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
          title="Pending Rules"
          value={`${pendingRules?.length || 0} pending`}
          color={pendingRules?.length ? 'error' : 'green'}
        />
      </div>

      {/* Pending Routing Rules - Authorization Required */}
      {pendingRules && pendingRules.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-yellow-200 bg-yellow-100/50">
            <h3 className="text-headline-sm font-headline-sm text-yellow-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Pending Routing Authorizations ({pendingRules.length})
            </h3>
            <p className="text-body-md font-body-md text-yellow-700 mt-1">
              These routing rules are waiting for your approval. OTPs will NOT be routed via these rules until you authorize them.
            </p>
          </div>
          <div className="divide-y divide-yellow-200">
            {pendingRules.map((rule) => (
              <div key={rule.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-headline-sm font-headline-sm text-yellow-800">{rule.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      rule.priority === 'high' || rule.priority === 'critical' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                    }`}>{rule.priority.toUpperCase()}</span>
                  </div>
                  <p className="text-label-sm font-label-sm text-yellow-600 mt-1">
                    Sender → Operator routing rule targeting you
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {rejectingId === rule.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        placeholder="Reason (optional)"
                        className="px-3 py-1.5 bg-white border border-yellow-300 rounded text-sm text-primary w-40"
                      />
                      <button
                        onClick={() => authorizeRule.mutate({ ruleId: rule.id, action: 'reject', reason: rejectReason })}
                        className="px-3 py-1.5 bg-red-500 text-white rounded text-label-sm font-label-sm hover:bg-red-600"
                      >
                        Confirm Reject
                      </button>
                      <button
                        onClick={() => { setRejectingId(null); setRejectReason('') }}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-label-sm font-label-sm hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => authorizeRule.mutate({ ruleId: rule.id, action: 'authorize' })}
                        disabled={authorizeRule.isPending}
                        className="px-4 py-1.5 bg-green-600 text-white rounded text-label-sm font-label-sm hover:bg-green-700 flex items-center gap-1"
                      >
                        <Check className="w-4 h-4" /> Authorize
                      </button>
                      <button
                        onClick={() => setRejectingId(rule.id)}
                        className="px-4 py-1.5 bg-red-100 text-red-700 border border-red-200 rounded text-label-sm font-label-sm hover:bg-red-200 flex items-center gap-1"
                      >
                        <Ban className="w-4 h-4" /> Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
            <p className="text-body-md font-body-md text-primary font-semibold">1.1.0</p>
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
