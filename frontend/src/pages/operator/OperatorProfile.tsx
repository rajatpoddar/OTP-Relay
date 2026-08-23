import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import { User, Mail, Shield, Activity, Clock } from 'lucide-react'

export function OperatorProfile() {
  const { user } = useAuth()

  const { data: otps } = useQuery({
    queryKey: ['operator-otps'],
    queryFn: async () => { const r = await api.get('/api/operator/otp?limit=100'); return r.data },
  })

  const usedCount = otps?.filter((o: any) => o.status === 'USED').length || 0
  const totalCount = otps?.length || 0

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-display-md font-display-md text-primary">My Profile</h2>
        <p className="text-body-md font-body-md text-on-surface-variant mt-1">Your account details and statistics.</p>
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
            <p className="text-label-sm font-label-sm text-secondary uppercase">OPERATOR</p>
          </div>
        </div>

        <div className="space-y-3 border-t border-outline-variant pt-4">
          <InfoRow icon={<User className="w-4 h-4" />} label="Role" value="Operator" />
          <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={user?.email || '—'} />
          <InfoRow icon={<Shield className="w-4 h-4" />} label="Organization" value="Your Organization" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-secondary" />
            <span className="text-label-sm font-label-sm text-on-surface-variant uppercase">Total OTPs</span>
          </div>
          <p className="text-display-md font-display-md text-primary">{totalCount}</p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-tertiary-fixed-dim" />
            <span className="text-label-sm font-label-sm text-on-surface-variant uppercase">Processed</span>
          </div>
          <p className="text-display-md font-display-md text-primary">{usedCount}</p>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-on-surface-variant">
        {icon}
        <span className="text-body-md font-body-md">{label}</span>
      </div>
      <span className="text-body-md font-body-md text-primary font-semibold">{value}</span>
    </div>
  )
}
