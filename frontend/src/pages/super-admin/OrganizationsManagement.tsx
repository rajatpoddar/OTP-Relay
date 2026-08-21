import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { Organization } from '../../types'
import { Building2, Plus, Edit2, X, CheckCircle, XCircle, Pause } from 'lucide-react'

export function OrganizationsManagement() {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Organization | null>(null)
  const queryClient = useQueryClient()

  const { data: orgs, isLoading } = useQuery<Organization[]>({
    queryKey: ['super-admin-orgs'],
    queryFn: async () => { const r = await api.get('/api/super-admin/organizations?limit=100'); return r.data },
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => { const r = await api.post('/api/super-admin/organizations', data); return r.data },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['super-admin-orgs'] }); setShowForm(false) },
  })

  const suspendMutation = useMutation({
    mutationFn: async (id: string) => { const r = await api.patch(`/api/super-admin/organizations/${id}/suspend`); return r.data },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['super-admin-orgs'] }),
  })

  const activateMutation = useMutation({
    mutationFn: async (id: string) => { const r = await api.patch(`/api/super-admin/organizations/${id}/activate`); return r.data },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['super-admin-orgs'] }),
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-display-md font-display-md text-primary">Organizations</h2>
          <p className="text-body-md font-body-md text-on-surface-variant mt-1">Manage all organizations on the platform.</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true) }} className="px-4 py-2 bg-primary text-on-primary rounded-lg text-label-sm font-label-sm flex items-center gap-2 hover:bg-inverse-surface transition-colors">
          <Plus className="w-4 h-4" /> New Organization
        </button>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase border-b border-outline-variant">
              <tr>
                <th className="px-4 py-3 font-semibold">Organization</th>
                <th className="px-4 py-3 font-semibold">Code</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Created</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-mono-data font-mono-data">
              {orgs?.map(org => (
                <tr key={org.id} className="hover:bg-surface-container transition-colors h-12">
                  <td className="px-4 py-2">
                    <div className="font-medium text-primary">{org.name}</div>
                  </td>
                  <td className="px-4 py-2 text-on-surface-variant">{org.code}</td>
                  <td className="px-4 py-2 text-on-surface-variant capitalize">{org.org_type}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${getStatusColor(org.status)}`}>{org.status}</span>
                  </td>
                  <td className="px-4 py-2 text-on-surface-variant">{new Date(org.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex gap-1 justify-end">
                      {org.status === 'ACTIVE' ? (
                        <button onClick={() => suspendMutation.mutate(org.id)} className="px-2 py-1 text-[11px] font-bold bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200">Suspend</button>
                      ) : (
                        <button onClick={() => activateMutation.mutate(org.id)} className="px-2 py-1 text-[11px] font-bold bg-green-100 text-green-800 rounded hover:bg-green-200">Activate</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {(!orgs || orgs.length === 0) && <tr><td colSpan={6} className="px-4 py-8 text-center text-on-surface-variant">No organizations found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setShowForm(false); setEditing(null) }}>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-headline-sm font-headline-sm text-primary">New Organization</h3>
              <button onClick={() => { setShowForm(false); setEditing(null) }} className="text-on-surface-variant hover:text-primary"><X className="w-5 h-5" /></button>
            </div>
            <OrgForm onSave={(d) => createMutation.mutate(d)} loading={createMutation.isPending} />
          </div>
        </div>
      )}
    </div>
  )
}

function OrgForm({ onSave, loading }: { onSave: (d: any) => void; loading: boolean }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [type, setType] = useState('office')

  return (
    <div className="space-y-4">
      <div><label className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-2">Organization Name</label>
        <input value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Block Office Name" /></div>
      <div><label className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-2">Code</label>
        <input value={code} onChange={e => setCode(e.target.value)} className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary" placeholder="ORG-001" /></div>
      <div><label className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-2">Type</label>
        <select value={type} onChange={e => setType(e.target.value)} className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="office">Office</option>
          <option value="block">Block</option>
          <option value="district">District</option>
          <option value="state">State</option>
        </select></div>
      <button onClick={() => name && code && onSave({ name, code, org_type: type })} disabled={!name || !code || loading} className="w-full py-3 bg-primary text-on-primary rounded-lg text-label-sm font-label-sm hover:bg-inverse-surface transition-colors disabled:opacity-50">{loading ? 'Saving...' : 'Create Organization'}</button>
    </div>
  )
}
