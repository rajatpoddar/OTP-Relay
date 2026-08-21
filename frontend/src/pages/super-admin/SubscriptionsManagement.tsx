import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { BadgeCheck, CheckCircle, XCircle, Pause } from 'lucide-react'

interface Sub { id: string; organization_id: string; organization_name: string; plan_name: string; status: string; starts_at: string | null; expires_at: string | null; monthly_price: number }

export function SubscriptionsManagement() {
  const queryClient = useQueryClient()

  const { data: subs, isLoading } = useQuery<Sub[]>({
    queryKey: ['super-admin-subs'],
    queryFn: async () => { const r = await api.get('/api/super-admin/subscriptions'); return r.data },
  })

  const activateMutation = useMutation({
    mutationFn: async (id: string) => { const r = await api.patch(`/api/super-admin/subscriptions/${id}/activate`); return r.data },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['super-admin-subs'] }),
  })

  const suspendMutation = useMutation({
    mutationFn: async (id: string) => { const r = await api.patch(`/api/super-admin/subscriptions/${id}/suspend`); return r.data },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['super-admin-subs'] }),
  })

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
        <h2 className="text-display-md font-display-md text-primary">Subscriptions</h2>
        <p className="text-body-md font-body-md text-on-surface-variant mt-1">Manage organization subscriptions.</p>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase border-b border-outline-variant">
              <tr>
                <th className="px-4 py-3 font-semibold">Organization</th>
                <th className="px-4 py-3 font-semibold">Plan</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Expires</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-mono-data font-mono-data">
              {subs?.map(sub => (
                <tr key={sub.id} className="hover:bg-surface-container transition-colors h-12">
                  <td className="px-4 py-2 font-medium text-primary">{sub.organization_name}</td>
                  <td className="px-4 py-2">{sub.plan_name}</td>
                  <td className="px-4 py-2">₹{sub.monthly_price.toLocaleString()}/mo</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${getStatusColor(sub.status)}`}>{sub.status}</span>
                  </td>
                  <td className="px-4 py-2 text-on-surface-variant">{sub.expires_at ? new Date(sub.expires_at).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex gap-1 justify-end">
                      {sub.status !== 'ACTIVE' && (
                        <button onClick={() => activateMutation.mutate(sub.id)} className="px-2 py-1 text-[11px] font-bold bg-green-100 text-green-800 rounded hover:bg-green-200">Activate</button>
                      )}
                      {sub.status === 'ACTIVE' && (
                        <button onClick={() => suspendMutation.mutate(sub.id)} className="px-2 py-1 text-[11px] font-bold bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200">Suspend</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {(!subs || subs.length === 0) && <tr><td colSpan={6} className="px-4 py-8 text-center text-on-surface-variant">No subscriptions found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
