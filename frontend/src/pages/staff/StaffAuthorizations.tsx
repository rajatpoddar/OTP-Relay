import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { Shield, CheckCircle, XCircle, Smartphone, Wifi } from 'lucide-react'

interface SenderConfig {
  id: string
  sender_id: string
  display_name: string
  department_id: string | null
  otp_length: number
}

interface StaffAuth {
  id: string
  staff_id: string
  sender_id: string
  status: string
  authorized_at: string | null
  revoked_at: string | null
}

export function StaffAuthorizations() {
  const queryClient = useQueryClient()

  const { data: authorizations, isLoading: authLoading } = useQuery<StaffAuth[]>({
    queryKey: ['staff-authorizations'],
    queryFn: async () => {
      const res = await api.get('/api/staff/authorizations')
      return res.data
    },
  })

  const { data: senders, isLoading: senderLoading } = useQuery<SenderConfig[]>({
    queryKey: ['admin-sender-ids'],
    queryFn: async () => {
      const res = await api.get('/api/admin/sender-ids')
      return res.data
    },
  })

  const authMutation = useMutation({
    mutationFn: async ({ senderText, status }: { senderText: string; status: string }) => {
      const res = await api.post('/api/staff/authorize-by-text', {
        sender_text: senderText,
        status,
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-authorizations'] })
    },
  })

  const isLoading = authLoading || senderLoading

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-surface-container rounded-xl"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-headline-sm font-headline-sm text-primary">OTP Sharing Authorization</h1>
        <p className="text-body-md font-body-md text-on-surface-variant leading-relaxed">
          Only the sender IDs you authorize will be processed by OTP Relay. Personal and unrelated SMS messages are not processed.
        </p>
      </div>

      {/* Device Status */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
        <div className="flex items-center gap-3">
          <Smartphone className="w-5 h-5 text-primary" />
          <div className="flex-1">
            <p className="text-body-md font-body-md text-primary font-semibold">Device Connected</p>
            <p className="text-label-sm font-label-sm text-on-surface-variant">
              Last sync: {new Date().toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2 text-tertiary-fixed-dim">
            <Wifi className="w-4 h-4" />
            <span className="text-label-sm font-label-sm">Online</span>
          </div>
        </div>
      </div>

      {/* Sender ID Authorization Cards */}
      <div className="space-y-4">
        {senders?.map((config) => {
          const auth = authorizations?.find(a => a.sender_id === config.id)
          const isAuthorized = auth?.status === 'AUTHORIZED'

          return (
            <div key={config.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-headline-sm font-headline-sm text-primary">{config.display_name || config.sender_id}</h3>
                  <p className="text-label-sm font-label-sm text-on-surface-variant">{config.sender_id}</p>
                </div>
                <div className={`flex items-center gap-2 ${isAuthorized ? 'text-tertiary-fixed-dim' : 'text-on-surface-variant'}`}>
                  {isAuthorized ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  <span className="text-label-sm font-bold uppercase">
                    {isAuthorized ? 'Authorized' : 'Not Authorized'}
                  </span>
                </div>
              </div>

              <p className="text-body-md font-body-md text-on-surface-variant mb-4">
                OTP Length: {config.otp_length} digits
              </p>

              <button
                onClick={() => authMutation.mutate({
                  senderText: config.sender_id,
                  status: isAuthorized ? 'NOT_AUTHORIZED' : 'AUTHORIZED',
                })}
                disabled={authMutation.isPending}
                className={`w-full py-3 rounded-lg text-label-sm font-label-sm transition-colors ${
                  isAuthorized
                    ? 'border border-outline-variant text-on-surface hover:bg-surface-container'
                    : 'bg-secondary text-on-secondary hover:bg-secondary-container'
                } disabled:opacity-50`}
              >
                {authMutation.isPending ? 'Processing...' : isAuthorized ? 'Revoke Authorization' : 'Authorize'}
              </button>
            </div>
          )
        })}

        {(!senders || senders.length === 0) && (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 text-center">
            <Shield className="w-12 h-12 text-on-surface-variant mx-auto mb-4" />
            <p className="text-headline-sm font-headline-sm text-primary mb-2">No Sender IDs Configured</p>
            <p className="text-body-md font-body-md text-on-surface-variant">
              Contact your Office Admin to configure sender IDs.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
