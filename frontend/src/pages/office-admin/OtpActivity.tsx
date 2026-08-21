import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { OtpMessage } from '../../types'
import { History, Search, Filter, Eye, ChevronRight } from 'lucide-react'

export function OtpActivity() {
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(0)

  const { data: otps, isLoading } = useQuery<OtpMessage[]>({
    queryKey: ['admin-otps', filter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '20', skip: String(page * 20) })
      if (filter) params.set('status', filter)
      const r = await api.get(`/api/admin/otp?${params}`)
      return r.data
    },
  })

  const statusFilters = ['', 'RECEIVED', 'DELIVERED', 'VIEWED', 'USED', 'FAILED', 'UNASSIGNED']

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-display-md font-display-md text-primary">OTP Activity</h2>
        <p className="text-body-md font-body-md text-on-surface-variant mt-1">Complete audit trail of all OTP messages.</p>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {statusFilters.map(s => (
          <button
            key={s}
            onClick={() => { setFilter(s); setPage(0) }}
            className={`px-3 py-1.5 rounded-full text-label-sm font-label-sm transition-colors ${
              filter === s
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container border border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase border-b border-outline-variant">
              <tr>
                <th className="px-4 py-3 font-semibold">Time</th>
                <th className="px-4 py-3 font-semibold">Service</th>
                <th className="px-4 py-3 font-semibold">Sender</th>
                <th className="px-4 py-3 font-semibold">OTP</th>
                <th className="px-4 py-3 font-semibold">Purpose</th>
                <th className="px-4 py-3 font-semibold">Reference</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-mono-data font-mono-data">
              {otps?.map(otp => (
                <tr key={otp.id} className="hover:bg-surface-container transition-colors h-12">
                  <td className="px-4 py-2 whitespace-nowrap">{new Date(otp.received_at).toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-surface-container-high text-on-surface">
                      {otp.service_name || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-2">{otp.sender_text}</td>
                  <td className="px-4 py-2 font-bold text-primary">{otp.otp_display || '••••••'}</td>
                  <td className="px-4 py-2 text-on-surface-variant">{otp.purpose || '—'}</td>
                  <td className="px-4 py-2 text-on-surface-variant">{otp.reference_number || '—'}</td>
                  <td className="px-4 py-2">
                    <StatusBadge status={otp.status} />
                  </td>
                </tr>
              ))}
              {(!otps || otps.length === 0) && <tr><td colSpan={7} className="px-4 py-8 text-center text-on-surface-variant">No OTP activity found</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-outline-variant bg-surface-container-low flex justify-between items-center text-label-sm font-label-sm text-on-surface-variant">
          <span>Showing {page * 20 + 1} to {Math.min((page + 1) * 20, (otps?.length || 0) + page * 20)}</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1 border border-outline-variant rounded hover:bg-surface-container disabled:opacity-50">Prev</button>
            <button onClick={() => setPage(p => p + 1)} disabled={!otps || otps.length < 20} className="px-3 py-1 border border-outline-variant rounded hover:bg-surface-container disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    USED: 'bg-green-100 text-green-800', DELIVERED: 'bg-blue-100 text-blue-800',
    VIEWED: 'bg-purple-100 text-purple-800', FAILED: 'bg-red-100 text-red-800',
    RECEIVED: 'bg-gray-100 text-gray-800', UNASSIGNED: 'bg-orange-100 text-orange-800',
  }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${colors[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>
}
