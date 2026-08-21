import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { Mail, Plus, Edit2, X, Building2 } from 'lucide-react'

interface SenderIdItem { id: string; sender_id: string; display_name: string | null; department_id: string | null; otp_length: number; is_active: boolean }
interface DepartmentItem { id: string; name: string; code: string; display_name: string | null; is_active: boolean }

export function SenderIdsPage() {
  const [tab, setTab] = useState<'senders' | 'departments'>('senders')
  const queryClient = useQueryClient()

  const { data: senders } = useQuery<SenderIdItem[]>({
    queryKey: ['admin-sender-ids'],
    queryFn: async () => { const r = await api.get('/api/admin/sender-ids'); return r.data },
  })

  const { data: departments } = useQuery<DepartmentItem[]>({
    queryKey: ['admin-services'],
    queryFn: async () => { const r = await api.get('/api/admin/services'); return r.data },
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-display-md font-display-md text-primary">Sender IDs & Departments</h2>
        <p className="text-body-md font-body-md text-on-surface-variant mt-1">Configure sender IDs and government departments/services.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-outline-variant">
        <button onClick={() => setTab('senders')} className={`px-4 py-3 text-label-sm font-label-sm border-b-2 transition-colors ${tab === 'senders' ? 'border-primary text-primary font-bold' : 'border-transparent text-on-surface-variant hover:text-primary'}`}>
          <Mail className="w-4 h-4 inline mr-2" />Sender IDs ({senders?.length || 0})
        </button>
        <button onClick={() => setTab('departments')} className={`px-4 py-3 text-label-sm font-label-sm border-b-2 transition-colors ${tab === 'departments' ? 'border-primary text-primary font-bold' : 'border-transparent text-on-surface-variant hover:text-primary'}`}>
          <Building2 className="w-4 h-4 inline mr-2" />Departments ({departments?.length || 0})
        </button>
      </div>

      {tab === 'senders' && <SendersList data={senders || []} />}
      {tab === 'departments' && <DepartmentsList data={departments || []} />}
    </div>
  )
}

function SendersList({ data }: { data: SenderIdItem[] }) {
  const [showForm, setShowForm] = useState(false)
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: async (d: any) => { const r = await api.post('/api/admin/sender-ids', d); return r.data },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-sender-ids'] }); setShowForm(false) },
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-primary text-on-primary rounded-lg text-label-sm font-label-sm flex items-center gap-2 hover:bg-inverse-surface transition-colors">
          <Plus className="w-4 h-4" /> Add Sender ID
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map(s => (
          <div key={s.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-headline-sm font-headline-sm text-primary">{s.sender_id}</h3>
                <p className="text-label-sm font-label-sm text-on-surface-variant">{s.display_name || '—'}</p>
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${s.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {s.is_active ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
            <div className="text-mono-data font-mono-data text-on-surface-variant text-[12px]">
              OTP Length: {s.otp_length} digits
            </div>
          </div>
        ))}
        {data.length === 0 && <div className="col-span-3 text-center py-8 text-on-surface-variant">No sender IDs configured</div>}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-headline-sm font-headline-sm text-primary">Add Sender ID</h3>
              <button onClick={() => setShowForm(false)} className="text-on-surface-variant hover:text-primary"><X className="w-5 h-5" /></button>
            </div>
            <SenderForm onSave={(d) => createMutation.mutate(d)} loading={createMutation.isPending} />
          </div>
        </div>
      )}
    </div>
  )
}

function SenderForm({ onSave, loading }: { onSave: (d: any) => void; loading: boolean }) {
  const [senderId, setSenderId] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [otpLength, setOtpLength] = useState('6')

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-2">Sender ID</label>
        <input value={senderId} onChange={e => setSenderId(e.target.value)} className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary" placeholder="BT-VBGRAM-G" />
      </div>
      <div>
        <label className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-2">Display Name</label>
        <input value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Village Business" />
      </div>
      <div>
        <label className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-2">OTP Length</label>
        <input type="number" value={otpLength} onChange={e => setOtpLength(e.target.value)} className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>
      <button onClick={() => senderId && onSave({ sender_id: senderId, display_name: displayName || null, otp_length: parseInt(otpLength) })} disabled={!senderId || loading} className="w-full py-3 bg-primary text-on-primary rounded-lg text-label-sm font-label-sm hover:bg-inverse-surface transition-colors disabled:opacity-50">{loading ? 'Saving...' : 'Add Sender ID'}</button>
    </div>
  )
}

function DepartmentsList({ data }: { data: DepartmentItem[] }) {
  const [showForm, setShowForm] = useState(false)
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: async (d: any) => { const r = await api.post('/api/admin/services', d); return r.data },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-services'] }); setShowForm(false) },
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-primary text-on-primary rounded-lg text-label-sm font-label-sm flex items-center gap-2 hover:bg-inverse-surface transition-colors">
          <Plus className="w-4 h-4" /> Add Department
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map(d => (
          <div key={d.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
            <h3 className="text-headline-sm font-headline-sm text-primary">{d.name}</h3>
            <p className="text-label-sm font-label-sm text-on-surface-variant">{d.code}</p>
            {d.display_name && <p className="text-body-md font-body-md text-on-surface-variant mt-2">{d.display_name}</p>}
          </div>
        ))}
        {data.length === 0 && <div className="col-span-3 text-center py-8 text-on-surface-variant">No departments configured</div>}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-headline-sm font-headline-sm text-primary">Add Department</h3>
              <button onClick={() => setShowForm(false)} className="text-on-surface-variant hover:text-primary"><X className="w-5 h-5" /></button>
            </div>
            <DepartmentForm onSave={(d) => createMutation.mutate(d)} loading={createMutation.isPending} />
          </div>
        </div>
      )}
    </div>
  )
}

function DepartmentForm({ onSave, loading }: { onSave: (d: any) => void; loading: boolean }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [displayName, setDisplayName] = useState('')
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-2">Department Name</label>
        <input value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary" placeholder="VBGRAMG" />
      </div>
      <div>
        <label className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-2">Code</label>
        <input value={code} onChange={e => setCode(e.target.value)} className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary" placeholder="VBGRAMG" />
      </div>
      <div>
        <label className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-2">Display Name</label>
        <input value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Village Business Gramin" />
      </div>
      <button onClick={() => name && code && onSave({ name, code, display_name: displayName || null })} disabled={!name || !code || loading} className="w-full py-3 bg-primary text-on-primary rounded-lg text-label-sm font-label-sm hover:bg-inverse-surface transition-colors disabled:opacity-50">{loading ? 'Saving...' : 'Add Department'}</button>
    </div>
  )
}
