import { useState, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { OtpMessage } from '../../types'
import { useWebSocket } from '../../hooks/useWebSocket'
import { Copy, CheckCircle, Clock, Timer, Wifi, WifiOff, Bell, BellOff } from 'lucide-react'

export function OperatorLiveOTPs() {
  const [selectedOtp, setSelectedOtp] = useState<OtpMessage | null>(null)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const queryClient = useQueryClient()

  const { data: otps, isLoading } = useQuery<OtpMessage[]>({
    queryKey: ['operator-otps'],
    queryFn: async () => {
      const res = await api.get('/api/operator/otp?limit=20')
      return res.data
    },
    refetchInterval: 3000,
  })

  // WebSocket for real-time updates
  const handleNewOtp = useCallback((data: any) => {
    queryClient.invalidateQueries({ queryKey: ['operator-otps'] })
  }, [queryClient])

  const handleOtpUpdate = useCallback((data: any) => {
    queryClient.invalidateQueries({ queryKey: ['operator-otps'] })
  }, [queryClient])

  const { isConnected } = useWebSocket({
    onNewOtp: handleNewOtp,
    onOtpUpdate: handleOtpUpdate,
  })

  const useMutation_ = useMutation({
    mutationFn: async ({ otpId, note }: { otpId: string; note: string }) => {
      const res = await api.post(`/api/operator/otp/${otpId}/use`, { note })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operator-otps'] })
      setSelectedOtp(null)
    },
  })

  const handleCopyOtp = (otp: string) => {
    navigator.clipboard.writeText(otp || '')
  }

  const handleMarkUsed = (otpId: string, note: string) => {
    useMutation_.mutate({ otpId, note })
  }

  const enableNotifications = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      setNotificationsEnabled(permission === 'granted')
    }
  }

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted')
    }
  }, [])

  const activeOtps = otps?.filter(o => ['DELIVERED', 'VIEWED', 'ROUTED', 'RECEIVED'].includes(o.status)) || []
  const recentOtps = otps?.filter(o => ['USED', 'EXPIRED', 'FAILED'].includes(o.status)) || []

  if (isLoading) return <div className="text-on-surface-variant">Loading...</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-display-md font-display-md text-primary">LIVE OTP QUEUE</h2>
          <div className="flex items-center gap-2 text-on-surface-variant mt-1">
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4 text-tertiary-fixed-dim" />
                <span className="text-body-md font-body-md">Connected • Real-time updates active</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-error" />
                <span className="text-body-md font-body-md text-error">Disconnected</span>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={enableNotifications}
            className={`px-3 py-2 rounded-lg text-label-sm font-label-sm flex items-center gap-2 transition-colors ${
              notificationsEnabled
                ? 'bg-tertiary-fixed-dim/20 text-tertiary-fixed-dim border border-tertiary-fixed-dim/30'
                : 'bg-surface-container border border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            {notificationsEnabled ? 'Notifications On' : 'Enable Notifications'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Active OTP */}
        <div className="col-span-12 lg:col-span-8">
          {activeOtps.length > 0 ? (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 relative overflow-hidden shadow-sm">
              <div className="absolute top-0 left-0 w-full h-1 bg-tertiary-fixed-dim"></div>

              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary-fixed/30 flex items-center justify-center text-primary-fixed-dim">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-headline-sm font-headline-sm text-primary">NEW OTP RECEIVED</h3>
                    <p className="text-label-sm font-label-sm text-on-surface-variant">
                      {activeOtps[0]?.service_name || 'Unknown Service'}
                    </p>
                  </div>
                </div>
                <CountdownTimer expiryAt={activeOtps[0]?.expiry_at} />
              </div>

              {/* OTP Display */}
              <div className="bg-surface py-10 px-6 rounded-lg border border-outline-variant/30 flex flex-col items-center justify-center mb-8">
                <span className="text-label-sm font-label-sm text-on-surface-variant mb-2 uppercase tracking-widest">OTP</span>
                <div className="text-7xl leading-none font-display-lg text-primary tracking-widest tabular-nums">
                  {activeOtps[0]?.otp_display || '••••••'}
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 bg-surface-container-low p-4 rounded-lg">
                <DataField label="Service" value={activeOtps[0]?.service_name || '—'} />
                <DataField label="Purpose" value={activeOtps[0]?.purpose || '—'} />
                <DataField label="Reference" value={activeOtps[0]?.reference_number || '—'} />
                <DataField label="Sender" value={activeOtps[0]?.sender_text || '—'} />
                <DataField label="Received" value={activeOtps[0] ? new Date(activeOtps[0].received_at).toLocaleTimeString() : '—'} />
                <DataField label="Status" value={activeOtps[0]?.status || '—'} />
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4 border-t border-outline-variant/50">
                <button
                  onClick={() => handleCopyOtp(activeOtps[0]?.otp_display || '')}
                  className="flex-1 bg-primary text-on-primary py-4 rounded-lg text-label-sm font-label-sm flex items-center justify-center gap-2 hover:bg-inverse-surface transition-colors"
                >
                  <Copy className="w-5 h-5" /> COPY OTP
                </button>
                <button
                  onClick={() => setSelectedOtp(activeOtps[0])}
                  className="flex-1 bg-surface-container border border-outline-variant text-on-surface py-4 rounded-lg text-label-sm font-label-sm flex items-center justify-center gap-2 hover:bg-surface-container-high transition-colors"
                >
                  <CheckCircle className="w-5 h-5" /> MARK USED
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-12 text-center">
              <Clock className="w-12 h-12 text-on-surface-variant mx-auto mb-4" />
              <p className="text-headline-sm font-headline-sm text-primary mb-2">No Active OTPs</p>
              <p className="text-body-md font-body-md text-on-surface-variant">Waiting for new OTP messages...</p>
              {isConnected && (
                <p className="text-label-sm font-label-sm text-tertiary-fixed-dim mt-4">
                  ✓ Real-time connection active
                </p>
              )}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl flex flex-col h-full">
            <div className="p-6 border-b border-outline-variant">
              <h3 className="text-headline-sm font-headline-sm text-primary">Recent Activity</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {recentOtps.slice(0, 5).map((otp) => (
                <div key={otp.id} className="p-4 rounded-lg border border-outline-variant/40 flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant shrink-0 mt-1">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-body-md font-body-md font-medium text-primary line-through opacity-70">
                        {otp.otp_display || '••••••'}
                      </span>
                      <span className="text-label-sm font-label-sm text-on-surface-variant bg-surface-container px-2 py-0.5 rounded text-[10px]">
                        {otp.status}
                      </span>
                    </div>
                    <div className="text-label-sm font-label-sm text-on-surface-variant truncate">
                      {otp.service_name || 'Unknown'} • Ref: {otp.reference_number || '—'}
                    </div>
                  </div>
                </div>
              ))}
              {recentOtps.length === 0 && (
                <div className="p-4 text-center text-on-surface-variant text-body-md font-body-md">No recent activity</div>
              )}
            </div>
            <div className="p-4 border-t border-outline-variant text-center">
              <button className="text-label-sm font-label-sm text-primary hover:underline">View Full History</button>
            </div>
          </div>
        </div>
      </div>

      {/* Mark Used Modal */}
      {selectedOtp && (
        <MarkUsedModal
          otp={selectedOtp}
          onConfirm={(note) => handleMarkUsed(selectedOtp.id, note)}
          onCancel={() => setSelectedOtp(null)}
          loading={useMutation_.isPending}
        />
      )}
    </div>
  )
}

function CountdownTimer({ expiryAt }: { expiryAt: string | null }) {
  const [timeLeft, setTimeLeft] = useState('07:31')

  useEffect(() => {
    if (!expiryAt) return

    const updateTimer = () => {
      const now = new Date().getTime()
      const expiry = new Date(expiryAt).getTime()
      const diff = expiry - now

      if (diff <= 0) {
        setTimeLeft('00:00')
        return
      }

      const minutes = Math.floor(diff / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [expiryAt])

  return (
    <div className="flex items-center gap-2 bg-error-container/20 px-4 py-2 rounded-lg border border-error-container">
      <Timer className="w-5 h-5 text-error" />
      <span className="text-headline-sm font-headline-sm text-error">{timeLeft}</span>
    </div>
  )
}

function DataField({ label, value, error = false }: { label: string; value: string; error?: boolean }) {
  return (
    <div>
      <span className="block text-label-sm font-label-sm text-on-surface-variant mb-1">{label}</span>
      <span className={`block text-mono-data font-mono-data ${error ? 'text-error font-bold' : 'text-primary'}`}>{value}</span>
    </div>
  )
}

function MarkUsedModal({ otp, onConfirm, onCancel, loading }: {
  otp: OtpMessage; onConfirm: (note: string) => void; onCancel: () => void; loading: boolean
}) {
  const [note, setNote] = useState('')

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-headline-sm font-headline-sm text-primary mb-4">Confirm OTP Usage</h3>

        <div className="space-y-2 mb-6 bg-surface-container-low p-4 rounded-lg">
          <div className="flex justify-between text-body-md font-body-md">
            <span className="text-on-surface-variant">Service:</span>
            <span className="text-primary font-semibold">{otp.service_name || '—'}</span>
          </div>
          <div className="flex justify-between text-body-md font-body-md">
            <span className="text-on-surface-variant">Purpose:</span>
            <span className="text-primary">{otp.purpose || '—'}</span>
          </div>
          <div className="flex justify-between text-body-md font-body-md">
            <span className="text-on-surface-variant">Reference:</span>
            <span className="text-primary">{otp.reference_number || '—'}</span>
          </div>
          <div className="flex justify-between text-body-md font-body-md">
            <span className="text-on-surface-variant">OTP:</span>
            <span className="text-primary font-bold">{otp.otp_display || '—'}</span>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider mb-2">
            Usage Note (Required)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
            rows={3}
            placeholder="e.g., FTO login completed for Reference 000*"
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 border border-outline-variant rounded-lg text-label-sm font-label-sm text-on-surface hover:bg-surface-container transition-colors">
            Cancel
          </button>
          <button
            onClick={() => note.trim() && onConfirm(note)}
            disabled={!note.trim() || loading}
            className="flex-1 py-3 bg-primary text-on-primary rounded-lg text-label-sm font-label-sm hover:bg-inverse-surface transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Confirm & Mark Used'}
          </button>
        </div>
      </div>
    </div>
  )
}
