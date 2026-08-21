import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { CreditCard, Users, UserCheck, Smartphone, Radio, AlertTriangle, CheckCircle } from 'lucide-react'

interface SubData {
  has_subscription: boolean
  plan_name?: string
  monthly_price?: number
  status?: string
  starts_at?: string
  expires_at?: string
  limits?: { staff_limit: number; operator_limit: number; device_limit: number; otp_limit: number }
  usage?: { staff_count: number; operator_count: number; device_count: number }
}

export function SubscriptionPage() {
  const { data: sub, isLoading } = useQuery<SubData>({
    queryKey: ['admin-subscription'],
    queryFn: async () => { const r = await api.get('/api/admin/subscription'); return r.data },
  })

  if (isLoading) return <div className="text-on-surface-variant">Loading...</div>

  if (!sub?.has_subscription) {
    return (
      <div className="space-y-6">
        <h2 className="text-display-md font-display-md text-primary">Subscription</h2>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-12 text-center">
          <CreditCard className="w-12 h-12 text-on-surface-variant mx-auto mb-4" />
          <p className="text-headline-sm font-headline-sm text-primary mb-2">No Active Subscription</p>
          <p className="text-body-md font-body-md text-on-surface-variant">Contact Super Admin to set up a subscription.</p>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'TRIAL': return 'bg-blue-100 text-blue-800'
      case 'SUSPENDED': return 'bg-yellow-100 text-yellow-800'
      case 'EXPIRED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-display-md font-display-md text-primary">Subscription</h2>
        <p className="text-body-md font-body-md text-on-surface-variant mt-1">Your current plan and usage details.</p>
      </div>

      {/* Plan Card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-headline-sm font-headline-sm text-primary">{sub.plan_name}</h3>
            <p className="text-body-md font-body-md text-on-surface-variant mt-1">₹{sub.monthly_price?.toLocaleString()}/month</p>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded text-[12px] font-bold ${getStatusColor(sub.status || '')}`}>{sub.status}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-body-md font-body-md">
          <div>
            <span className="text-on-surface-variant">Starts:</span>
            <span className="ml-2 text-primary">{sub.starts_at ? new Date(sub.starts_at).toLocaleDateString() : '—'}</span>
          </div>
          <div>
            <span className="text-on-surface-variant">Expires:</span>
            <span className="ml-2 text-primary">{sub.expires_at ? new Date(sub.expires_at).toLocaleDateString() : '—'}</span>
          </div>
        </div>
      </div>

      {/* Usage vs Limits */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <UsageCard
          title="Staff"
          icon={<Users className="w-5 h-5" />}
          used={sub.usage?.staff_count ?? 0}
          limit={sub.limits?.staff_limit ?? 0}
        />
        <UsageCard
          title="Operators"
          icon={<UserCheck className="w-5 h-5" />}
          used={sub.usage?.operator_count ?? 0}
          limit={sub.limits?.operator_limit ?? 0}
        />
        <UsageCard
          title="Devices"
          icon={<Smartphone className="w-5 h-5" />}
          used={sub.usage?.device_count ?? 0}
          limit={sub.limits?.device_limit ?? 0}
        />
        <UsageCard
          title="OTP Limit"
          icon={<Radio className="w-5 h-5" />}
          used={0}
          limit={sub.limits?.otp_limit ?? 0}
          subtitle="per month"
        />
      </div>
    </div>
  )
}

function UsageCard({ title, icon, used, limit, subtitle }: {
  title: string; icon: React.ReactNode; used: number; limit: number; subtitle?: string
}) {
  const percentage = limit > 0 ? (used / limit * 100) : 0
  const isWarning = percentage >= 80
  const isFull = percentage >= 100

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
      <div className="flex justify-between items-start mb-3">
        <span className="text-label-sm font-label-sm text-on-surface-variant uppercase">{title}</span>
        {isWarning ? (
          <AlertTriangle className="w-5 h-5 text-error" />
        ) : (
          <span className="text-on-surface-variant">{icon}</span>
        )}
      </div>

      <div className="flex items-end gap-2 mb-2">
        <span className="text-display-md font-display-md text-primary">{used}</span>
        <span className="text-body-md font-body-md text-on-surface-variant mb-1">/ {limit}</span>
      </div>

      {subtitle && <p className="text-label-sm font-label-sm text-on-surface-variant mb-2">{subtitle}</p>}

      <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isFull ? 'bg-error' : isWarning ? 'bg-yellow-500' : 'bg-secondary'}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {isWarning && (
        <p className="text-label-sm font-label-sm text-error mt-2">
          {isFull ? 'Limit reached!' : 'Approaching limit'}
        </p>
      )}
    </div>
  )
}
