import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { CreditCard, Plus, Edit2, Trash2, X, Users, Smartphone, Radio } from 'lucide-react'

interface Plan { id: string; name: string; description: string | null; monthly_price: number; staff_limit: number; operator_limit: number; device_limit: number; otp_limit: number; is_active: boolean }

export function PlansManagement() {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Plan | null>(null)
  const queryClient = useQueryClient()

  const { data: plans, isLoading } = useQuery<Plan[]>({
    queryKey: ['super-admin-plans'],
    queryFn: async () => { const r = await api.get('/api/super-admin/plans'); return r.data },
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => { const r = await api.post('/api/super-admin/plans', data); return r.data },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['super-admin-plans'] }); setShowForm(false) },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => { const r = await api.put(`/api/super-admin/plans/${id}`, data); return r.data },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['super-admin-plans'] }); setEditing(null); setShowForm(false) },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const r = await api.delete(`/api/super-admin/plans/${id}`); return r.data },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['super-admin-plans'] }),
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-display-md font-display-md text-primary">Subscription Plans</h2>
          <p className="text-body-md font-body-md text-on-surface-variant mt-1">Manage subscription plans and pricing.</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true) }} className="px-4 py-2 bg-primary text-on-primary rounded-lg text-label-sm font-label-sm flex items-center gap-2 hover:bg-inverse-surface transition-colors">
          <Plus className="w-4 h-4" /> New Plan
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans?.map(plan => (
          <div key={plan.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-headline-sm font-headline-sm text-primary">{plan.name}</h3>
              <div className="flex gap-1">
                <button onClick={() => { setEditing(plan); setShowForm(true) }} className="p-1 text-on-surface-variant hover:text-primary"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => { if (confirm('Delete this plan?')) deleteMutation.mutate(plan.id) }} className="p-1 text-on-surface-variant hover:text-error"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>

            {plan.description && <p className="text-body-md font-body-md text-on-surface-variant mb-4">{plan.description}</p>}

            <div className="text-3xl font-display-md text-primary mb-4">
              ₹{plan.monthly_price.toLocaleString()}<span className="text-body-md text-on-surface-variant">/mo</span>
            </div>

            <div className="space-y-2 flex-1">
              <LimitRow icon={<Users className="w-4 h-4" />} label="Staff" limit={plan.staff_limit} />
              <LimitRow icon={<CreditCard className="w-4 h-4" />} label="Operators" limit={plan.operator_limit} />
              <LimitRow icon={<Smartphone className="w-4 h-4" />} label="Devices" limit={plan.device_limit} />
              <LimitRow icon={<Radio className="w-4 h-4" />} label="OTPs/month" limit={plan.otp_limit} />
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setShowForm(false); setEditing(null) }}>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-headline-sm font-headline-sm text-primary">{editing ? 'Edit Plan' : 'New Plan'}</h3>
              <button onClick={() => { setShowForm(false); setEditing(null) }} className="text-on-surface-variant hover:text-primary"><X className="w-5 h-5" /></button>
            </div>
            <PlanForm
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

function LimitRow({ icon, label, limit }: { icon: React.ReactNode; label: string; limit: number }) {
  return (
    <div className="flex items-center justify-between text-body-md font-body-md">
      <span className="flex items-center gap-2 text-on-surface-variant">{icon} {label}</span>
      <span className="text-primary font-semibold">{limit.toLocaleString()}</span>
    </div>
  )
}

function PlanForm({ initial, onSave, loading }: { initial: Plan | null; onSave: (d: any) => void; loading: boolean }) {
  const [name, setName] = useState(initial?.name || '')
  const [desc, setDesc] = useState(initial?.description || '')
  const [price, setPrice] = useState(String(initial?.monthly_price || 0))
  const [staffLimit, setStaffLimit] = useState(String(initial?.staff_limit || 10))
  const [operatorLimit, setOperatorLimit] = useState(String(initial?.operator_limit || 2))
  const [deviceLimit, setDeviceLimit] = useState(String(initial?.device_limit || 10))
  const [otpLimit, setOtpLimit] = useState(String(initial?.otp_limit || 1000))

  return (
    <div className="space-y-4">
      <div><label className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-2">Plan Name</label>
        <input value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Professional" /></div>
      <div><label className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-2">Description</label>
        <input value={desc} onChange={e => setDesc(e.target.value)} className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Full access for mid-size offices" /></div>
      <div><label className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-2">Monthly Price (₹)</label>
        <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary" /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-2">Staff Limit</label>
          <input type="number" value={staffLimit} onChange={e => setStaffLimit(e.target.value)} className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary" /></div>
        <div><label className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-2">Operator Limit</label>
          <input type="number" value={operatorLimit} onChange={e => setOperatorLimit(e.target.value)} className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary" /></div>
        <div><label className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-2">Device Limit</label>
          <input type="number" value={deviceLimit} onChange={e => setDeviceLimit(e.target.value)} className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary" /></div>
        <div><label className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-2">OTP Limit/month</label>
          <input type="number" value={otpLimit} onChange={e => setOtpLimit(e.target.value)} className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary" /></div>
      </div>
      <button onClick={() => name && onSave({ name, description: desc || null, monthly_price: parseInt(price), staff_limit: parseInt(staffLimit), operator_limit: parseInt(operatorLimit), device_limit: parseInt(deviceLimit), otp_limit: parseInt(otpLimit) })} disabled={!name || loading} className="w-full py-3 bg-primary text-on-primary rounded-lg text-label-sm font-label-sm hover:bg-inverse-surface transition-colors disabled:opacity-50">{loading ? 'Saving...' : 'Save Plan'}</button>
    </div>
  )
}
