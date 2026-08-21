import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { GitBranch, Plus, Edit2, Trash2, X, ToggleLeft, ToggleRight } from 'lucide-react'

interface RoutingRule {
  id: string; name: string; sender_id: string | null; service_id: string | null;
  staff_id: string | null; operator_id: string; priority: string; is_active: boolean;
  effective_from: string | null; effective_to: string | null; created_at: string;
}

export function RoutingRules() {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<RoutingRule | null>(null)
  const queryClient = useQueryClient()

  const { data: rules, isLoading } = useQuery<RoutingRule[]>({
    queryKey: ['routing-rules'],
    queryFn: async () => { const r = await api.get('/api/admin/routing-rules'); return r.data },
  })

  const { data: senders } = useQuery({ queryKey: ['admin-sender-ids'], queryFn: async () => { const r = await api.get('/api/admin/sender-ids'); return r.data } })
  const { data: operators } = useQuery({ queryKey: ['admin-operators'], queryFn: async () => { const r = await api.get('/api/admin/operators'); return r.data } })

  const createMutation = useMutation({
    mutationFn: async (data: any) => { const r = await api.post('/api/admin/routing-rules', data); return r.data },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['routing-rules'] }); setShowForm(false) },
  })

  const getSenderName = (id: string | null) => senders?.find((s: any) => s.id === id)?.sender_id || '—'
  const getOperatorName = (id: string) => operators?.find((o: any) => o.id === id)?.full_name || '—'

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-display-md font-display-md text-primary">Routing Rules</h2>
          <p className="text-body-md font-body-md text-on-surface-variant mt-1">Configure how OTPs are routed to operators.</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true) }} className="px-4 py-2 bg-primary text-on-primary rounded-lg text-label-sm font-label-sm flex items-center gap-2 hover:bg-inverse-surface transition-colors">
          <Plus className="w-4 h-4" /> Add Rule
        </button>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase border-b border-outline-variant">
              <tr>
                <th className="px-4 py-3 font-semibold">Rule Name</th>
                <th className="px-4 py-3 font-semibold">Sender</th>
                <th className="px-4 py-3 font-semibold">Operator</th>
                <th className="px-4 py-3 font-semibold">Priority</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-mono-data font-mono-data">
              {rules?.map(rule => (
                <tr key={rule.id} className="hover:bg-surface-container transition-colors h-12">
                  <td className="px-4 py-2 font-medium text-primary">{rule.name}</td>
                  <td className="px-4 py-2"><span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-surface-container-high text-on-surface">{getSenderName(rule.sender_id)}</span></td>
                  <td className="px-4 py-2 text-on-surface-variant">{getOperatorName(rule.operator_id)}</td>
                  <td className="px-4 py-2"><span className={`text-[11px] font-bold uppercase ${rule.priority === 'high' ? 'text-error' : rule.priority === 'critical' ? 'text-error' : 'text-on-surface-variant'}`}>{rule.priority}</span></td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${rule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {rule.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => { setEditing(rule); setShowForm(true) }} className="p-1 text-on-surface-variant hover:text-primary transition-colors"><Edit2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {(!rules || rules.length === 0) && <tr><td colSpan={6} className="px-4 py-8 text-center text-on-surface-variant">No routing rules configured</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setShowForm(false); setEditing(null) }}>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-headline-sm font-headline-sm text-primary">{editing ? 'Edit Rule' : 'Add Routing Rule'}</h3>
              <button onClick={() => { setShowForm(false); setEditing(null) }} className="text-on-surface-variant hover:text-primary"><X className="w-5 h-5" /></button>
            </div>
            <RoutingRuleForm
              initial={editing}
              senders={senders || []}
              operators={operators || []}
              onSave={(data: any) => createMutation.mutate(data)}
              loading={createMutation.isPending}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function RoutingRuleForm({ initial, senders, operators, onSave, loading }: any) {
  const [name, setName] = useState(initial?.name || '')
  const [senderId, setSenderId] = useState(initial?.sender_id || '')
  const [operatorId, setOperatorId] = useState(initial?.operator_id || '')
  const [priority, setPriority] = useState(initial?.priority || 'normal')

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-2">Rule Name</label>
        <input value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary" placeholder="VBGRAMG → Amit Kumar" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-2">Sender ID</label>
          <select value={senderId} onChange={e => setSenderId(e.target.value)} className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="">All Senders (Default)</option>
            {senders.map((s: any) => <option key={s.id} value={s.id}>{s.sender_id}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-2">Operator</label>
          <select value={operatorId} onChange={e => setOperatorId(e.target.value)} className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="">Select Operator</option>
            {operators.map((o: any) => <option key={o.id} value={o.id}>{o.full_name}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-2">Priority</label>
        <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={() => name && operatorId && onSave({ name, sender_id: senderId || null, operator_id: operatorId, priority })} disabled={!name || !operatorId || loading} className="flex-1 py-3 bg-primary text-on-primary rounded-lg text-label-sm font-label-sm hover:bg-inverse-surface transition-colors disabled:opacity-50">{loading ? 'Saving...' : 'Save Rule'}</button>
      </div>
    </div>
  )
}
