import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { Mail, Plus, Edit2, X, Building2, FileText, Regex } from 'lucide-react'

interface SenderIdItem {
  id: string; sender_id: string; display_name: string | null;
  department_id: string | null; otp_length: number; is_active: boolean;
  message_template: string | null; extraction_regex: string | null;
  purpose_regex: string | null; reference_regex: string | null;
}
interface DepartmentItem { id: string; name: string; code: string; display_name: string | null; is_active: boolean }

export function SenderIdsPage() {
  const [tab, setTab] = useState<'senders' | 'departments'>('senders')

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
        <p className="text-body-md font-body-md text-on-surface-variant mt-1">Configure sender IDs, message templates, and government departments/services.</p>
      </div>

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
  const [editing, setEditing] = useState<SenderIdItem | null>(null)
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: async (d: any) => { const r = await api.post('/api/admin/sender-ids', d); return r.data },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-sender-ids'] }); setShowForm(false) },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...d }: any) => { const r = await api.put(`/api/admin/sender-ids/${id}`, d); return r.data },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-sender-ids'] }); setEditing(null); setShowForm(false) },
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { setEditing(null); setShowForm(true) }} className="px-4 py-2 bg-primary text-on-primary rounded-lg text-label-sm font-label-sm flex items-center gap-2 hover:bg-inverse-surface transition-colors">
          <Plus className="w-4 h-4" /> Add Sender ID
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map(s => (
          <div key={s.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-headline-sm font-headline-sm text-primary">{s.sender_id}</h3>
                  <button onClick={() => { setEditing(s); setShowForm(true) }} className="p-1 text-on-surface-variant hover:text-primary transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-label-sm font-label-sm text-on-surface-variant">{s.display_name || '—'}</p>
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${s.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {s.is_active ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
            <div className="space-y-1 text-mono-data font-mono-data text-on-surface-variant text-[11px]">
              <div>OTP Length: {s.otp_length} digits</div>
              {s.message_template && (
                <div className="flex items-center gap-1 text-tertiary-fixed-dim">
                  <FileText className="w-3 h-3" />
                  <span className="truncate">{s.message_template}</span>
                </div>
              )}
              {s.extraction_regex && (
                <div className="flex items-center gap-1 text-tertiary-fixed-dim">
                  <Regex className="w-3 h-3" />
                  <span className="truncate">{s.extraction_regex}</span>
                </div>
              )}
            </div>
          </div>
        ))}
        {data.length === 0 && <div className="col-span-3 text-center py-8 text-on-surface-variant">No sender IDs configured</div>}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setShowForm(false); setEditing(null) }}>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-headline-sm font-headline-sm text-primary">{editing ? 'Edit Sender ID' : 'Add Sender ID'}</h3>
              <button onClick={() => { setShowForm(false); setEditing(null) }} className="text-on-surface-variant hover:text-primary"><X className="w-5 h-5" /></button>
            </div>
            <SenderForm
              initial={editing}
              onSave={(d) => editing ? updateMutation.mutate({ id: editing.id, ...d }) : createMutation.mutate(d)}
              loading={createMutation.isPending || updateMutation.isPending}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function SenderForm({ initial, onSave, loading }: { initial: SenderIdItem | null; onSave: (d: any) => void; loading: boolean }) {
  const [senderId, setSenderId] = useState(initial?.sender_id || '')
  const [displayName, setDisplayName] = useState(initial?.display_name || '')
  const [otpLength, setOtpLength] = useState(String(initial?.otp_length || 6))
  const [messageTemplate, setMessageTemplate] = useState(initial?.message_template || '')
  const [extractionRegex, setExtractionRegex] = useState(initial?.extraction_regex || '')
  const [purposeRegex, setPurposeRegex] = useState(initial?.purpose_regex || '')
  const [referenceRegex, setReferenceRegex] = useState(initial?.reference_regex || '')

  const handleSave = () => {
    if (!senderId) return
    onSave({
      sender_id: senderId,
      display_name: displayName || null,
      otp_length: parseInt(otpLength),
      message_template: messageTemplate || null,
      extraction_regex: extractionRegex || null,
      purpose_regex: purposeRegex || null,
      reference_regex: referenceRegex || null,
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-2">Sender ID *</label>
        <input value={senderId} onChange={e => setSenderId(e.target.value)} className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary" placeholder="BT-VBGRAM-G" disabled={!!initial} />
        {initial && <p className="text-[11px] text-on-surface-variant mt-1">Sender ID cannot be changed after creation</p>}
      </div>
      <div>
        <label className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-2">Display Name</label>
        <input value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Village Business" />
      </div>
      <div>
        <label className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-2">OTP Length</label>
        <input type="number" value={otpLength} onChange={e => setOtpLength(e.target.value)} className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>

      <div className="border-t border-outline-variant pt-4 mt-4">
        <h4 className="text-label-sm font-label-sm text-primary uppercase mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4" /> Message Template
        </h4>
        <div>
          <label className="block text-[11px] font-label-sm text-on-surface-variant uppercase mb-2">Template Pattern</label>
          <textarea value={messageTemplate} onChange={e => setMessageTemplate(e.target.value)} rows={2} className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-mono-data font-mono-data text-primary focus:outline-none focus:ring-2 focus:ring-primary text-[12px]" placeholder="Your OTP is {otp} for {purpose}. Reference No: {reference}" />
          <p className="text-[10px] text-on-surface-variant mt-1">Use {'{otp}'}, {'{purpose}'}, {'{reference}'} placeholders</p>
        </div>
      </div>

      <div className="border-t border-outline-variant pt-4">
        <h4 className="text-label-sm font-label-sm text-primary uppercase mb-3 flex items-center gap-2">
          <Regex className="w-4 h-4" /> Custom Regex Patterns
        </h4>
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-label-sm text-on-surface-variant uppercase mb-1">OTP Extraction Regex</label>
            <input value={extractionRegex} onChange={e => setExtractionRegex(e.target.value)} className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-mono-data font-mono-data text-primary focus:outline-none focus:ring-2 focus:ring-primary text-[11px]" placeholder="OTP\s+is\s+(\d{6})" />
          </div>
          <div>
            <label className="block text-[11px] font-label-sm text-on-surface-variant uppercase mb-1">Purpose Regex</label>
            <input value={purposeRegex} onChange={e => setPurposeRegex(e.target.value)} className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-mono-data font-mono-data text-primary focus:outline-none focus:ring-2 focus:ring-primary text-[11px]" placeholder="for\s+(.+?)(?:\.|$)" />
          </div>
          <div>
            <label className="block text-[11px] font-label-sm text-on-surface-variant uppercase mb-1">Reference Regex</label>
            <input value={referenceRegex} onChange={e => setReferenceRegex(e.target.value)} className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-mono-data font-mono-data text-primary focus:outline-none focus:ring-2 focus:ring-primary text-[11px]" placeholder="Reference\s+(?:No\.?:?\s*)?([A-Z0-9\-]+)" />
          </div>
        </div>
      </div>

      <button onClick={handleSave} disabled={!senderId || loading} className="w-full py-3 bg-primary text-on-primary rounded-lg text-label-sm font-label-sm hover:bg-inverse-surface transition-colors disabled:opacity-50 mt-4">
        {loading ? 'Saving...' : initial ? 'Update Sender ID' : 'Add Sender ID'}
      </button>
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
