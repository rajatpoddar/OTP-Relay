import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { Smartphone, Wifi, WifiOff, RefreshCw, Shield, CheckCircle, Clock } from 'lucide-react'

export function DeviceStatus() {
  const { data: authorizations, isLoading } = useQuery({
    queryKey: ['staff-authorizations'],
    queryFn: async () => {
      const res = await api.get('/api/staff/authorizations')
      return res.data
    },
  })

  const authorizedCount = authorizations?.filter((a: any) => a.status === 'AUTHORIZED').length || 0
  const totalCount = authorizations?.length || 0

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-headline-sm font-headline-sm text-primary">Device Status</h1>
        <p className="text-body-md font-body-md text-on-surface-variant mt-1">
          Monitor your device connection and OTP sharing status.
        </p>
      </div>

      {/* Connection Status */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-tertiary-fixed-dim/20 flex items-center justify-center">
            <Wifi className="w-6 h-6 text-tertiary-fixed-dim" />
          </div>
          <div className="flex-1">
            <p className="text-headline-sm font-headline-sm text-primary">Connected</p>
            <p className="text-label-sm font-label-sm text-on-surface-variant">
              Device is online and syncing
            </p>
          </div>
          <div className="w-3 h-3 rounded-full bg-tertiary-fixed-dim animate-pulse"></div>
        </div>
      </div>

      {/* Device Info */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
        <h3 className="text-headline-sm font-headline-sm text-primary mb-4 flex items-center gap-2">
          <Smartphone className="w-5 h-5" /> Device Information
        </h3>
        <div className="space-y-3">
          <InfoRow label="Status" value="Active" color="text-tertiary-fixed-dim" />
          <InfoRow label="Last Sync" value={new Date().toLocaleString()} />
          <InfoRow label="App Version" value="1.0.0" />
          <InfoRow label="Android" value="14" />
        </div>
      </div>

      {/* OTP Sharing Status */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
        <h3 className="text-headline-sm font-headline-sm text-primary mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" /> OTP Sharing
        </h3>

        <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg mb-4">
          <span className="text-body-md font-body-md text-primary font-semibold">Authorized Senders</span>
          <span className="text-headline-sm font-headline-sm text-primary">
            {authorizedCount} / {totalCount}
          </span>
        </div>

        <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-tertiary-fixed-dim rounded-full transition-all"
            style={{ width: `${totalCount > 0 ? (authorizedCount / totalCount * 100) : 0}%` }}
          />
        </div>

        <p className="text-body-md font-body-md text-on-surface-variant">
          {authorizedCount > 0
            ? `${authorizedCount} sender ID${authorizedCount > 1 ? 's' : ''} authorized. OTPs from these senders will be relayed.`
            : 'No sender IDs authorized yet. Go to Authorizations to enable OTP sharing.'}
        </p>
      </div>

      {/* Last Activity */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
        <h3 className="text-headline-sm font-headline-sm text-primary mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" /> Recent Activity
        </h3>
        <div className="text-center py-4">
          <CheckCircle className="w-8 h-8 text-tertiary-fixed-dim mx-auto mb-2" />
          <p className="text-body-md font-body-md text-on-surface-variant">
            Device is active and ready to relay OTPs
          </p>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-body-md font-body-md text-on-surface-variant">{label}</span>
      <span className={`text-body-md font-body-md font-semibold ${color || 'text-primary'}`}>{value}</span>
    </div>
  )
}
