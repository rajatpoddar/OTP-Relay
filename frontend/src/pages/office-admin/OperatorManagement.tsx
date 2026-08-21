import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { Operator } from '../../types'
import { UserCheck, Plus, Search, Edit2, X } from 'lucide-react'

export function OperatorManagement() {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Operator | null>(null)
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()

  const { data: operators, isLoading } = useQuery<Operator[]>({
    queryKey: ['admin-operators'],
    queryFn: async () => {
      const res = await api.get('/api/admin/operators?limit=100')
      return res.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/api/admin/operators', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-operators'] })
      setShowForm(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await api.put(`/api/admin/operators/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-operators'] })
      setEditing(null)
    },
  })

  const filtered = operators?.filter(o =>
    o.full_name.toLowerCase().includes(search.toLowerCase())
  ) || []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-display-md font-display-md text-primary">Operator Management</h2>
          <p className="text-body-md font-body-md text-on-surface-variant mt-1">Manage operators who receive and process OTPs.</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true) }} className="px-4 py-2 bg-primary text-on-primary rounded-lg text-label-sm font-label-sm flex items-center gap-2 hover:bg-inverse-surface transition-colors">
          <Plus className="w-4 h-4" /> Add Operator
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search operators..." className="w-full pl-10 pr-4 py-2 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" />
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase border-b border-outline-variant">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Created</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-mono-data font-mono-data">
              {filtered.map(o => (
                <tr key={o.id} className="hover:bg-surface-container transition-colors h-12">
                  <td className="px-4 py-2 font-medium text-primary">{o.full_name}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${o.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {o.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-on-surface-variant">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => { setEditing(o); setShowForm(true) }} className="p-1 text-on-surface-variant hover:text-primary transition-colors"><Edit2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-on-surface-variant">No operators found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setShowForm(false); setEditing(null) }}>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-headline-sm font-headline-sm text-primary">{editing ? 'Edit Operator' : 'Add Operator'}</h3>
              <button onClick={() => { setShowForm(false); setEditing(null) }} className="text-on-surface-variant hover:text-primary"><X className="w-5 h-5" /></button>
            </div>
            <OperatorForm
              initial={editing}
              onSave={(data) => editing ? updateMutation.mutate({ id: editing.id, data }) : createMutation.mutate(data)}
              loading={createMutation.isPending || updateMutation.isPending}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function OperatorForm({ initial, onSave, loading }: { initial: Operator | null; onSave: (d: any) => void; loading: boolean }) {
  const [name, setName] = useState(initial?.full_name || '')
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-2">Full Name</label>
        <input value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Amit Kumar" />
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={() => onSave({ full_name: name })} disabled={!name || loading} className="flex-1 py-3 bg-primary text-on-primary rounded-lg text-label-sm font-label-sm hover:bg-inverse-surface transition-colors disabled:opacity-50">{loading ? 'Saving...' : 'Save'}</button>
      </div>
    </div>
  )
}
