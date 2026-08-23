import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { Staff } from '../../types'
import { Users, Plus, Search, Edit2, Trash2, X, Check } from 'lucide-react'

export function StaffManagement() {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Staff | null>(null)
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()

  const { data: staffList, isLoading } = useQuery<Staff[]>({
    queryKey: ['admin-staff'],
    queryFn: async () => {
      const res = await api.get('/api/admin/staff?limit=100')
      return res.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/api/admin/staff', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-staff'] })
      setShowForm(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await api.put(`/api/admin/staff/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-staff'] })
      setEditing(null)
    },
  })

  const filteredStaff = staffList?.filter(s =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.mobile_number.includes(search)
  ) || []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-display-md font-display-md text-primary">Staff Management</h2>
          <p className="text-body-md font-body-md text-on-surface-variant mt-1">
            Manage staff members who receive OTPs on their devices.
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true) }}
          className="px-4 py-2 bg-primary text-on-primary rounded-lg text-label-sm font-label-sm flex items-center gap-2 hover:bg-inverse-surface transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Staff
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or mobile..."
          className="w-full pl-10 pr-4 py-2 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
        />
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase border-b border-outline-variant">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Mobile</th>
                <th className="px-4 py-3 font-semibold">Designation</th>
                <th className="px-4 py-3 font-semibold">Profile</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-mono-data font-mono-data">
              {filteredStaff.map((s) => (
                <tr key={s.id} className="hover:bg-surface-container transition-colors h-12">
                  <td className="px-4 py-2">
                    <div className="font-medium text-primary">{s.full_name}</div>
                    {s.staff_id_number && <div className="text-xs text-on-surface-variant">ID: {s.staff_id_number}</div>}
                  </td>
                  <td className="px-4 py-2">{s.mobile_number}</td>
                  <td className="px-4 py-2 text-on-surface-variant">{s.designation || '—'}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${s.profile_completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {s.profile_completed ? 'COMPLETED' : 'PENDING'}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${s.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {s.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => { setEditing(s); setShowForm(true) }}
                      className="p-1 text-on-surface-variant hover:text-primary transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredStaff.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-on-surface-variant">No staff found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <StaffFormModal
          staff={editing}
          onClose={() => { setShowForm(false); setEditing(null) }}
          onSave={(data) => {
            if (editing) {
              updateMutation.mutate({ id: editing.id, data })
            } else {
              createMutation.mutate(data)
            }
          }}
          loading={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  )
}

function StaffFormModal({ staff, onClose, onSave, loading }: {
  staff: Staff | null
  onClose: () => void
  onSave: (data: any) => void
  loading: boolean
}) {
  const [name, setName] = useState(staff?.full_name || '')
  const [mobile, setMobile] = useState(staff?.mobile_number || '')
  const [staffId, setStaffId] = useState(staff?.staff_id_number || '')
  const [designation, setDesignation] = useState(staff?.designation || '')

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-headline-sm font-headline-sm text-primary">
            {staff ? 'Edit Staff' : 'Add Staff'}
          </h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-primary"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-2">Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Rajesh Kumar" />
          </div>
          <div>
            <label className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-2">Mobile Number</label>
            <input value={mobile} onChange={e => setMobile(e.target.value)} className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary" placeholder="9876543210" />
          </div>
          <div>
            <label className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-2">Staff ID (optional)</label>
            <input value={staffId} onChange={e => setStaffId(e.target.value)} className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary" placeholder="STF-001" />
          </div>
          <div>
            <label className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-2">Designation (optional)</label>
            <input value={designation} onChange={e => setDesignation(e.target.value)} className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary" placeholder="e.g. Village Resource Person" />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 border border-outline-variant rounded-lg text-label-sm font-label-sm text-on-surface hover:bg-surface-container transition-colors">Cancel</button>
          <button
            onClick={() => name && mobile && onSave({ full_name: name, mobile_number: mobile, staff_id_number: staffId || null, designation: designation || null })}
            disabled={!name || !mobile || loading}
            className="flex-1 py-3 bg-primary text-on-primary rounded-lg text-label-sm font-label-sm hover:bg-inverse-surface transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
