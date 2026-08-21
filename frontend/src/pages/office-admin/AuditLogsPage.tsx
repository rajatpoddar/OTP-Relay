import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { History, Filter } from 'lucide-react'

interface AuditLogItem { id: string; action: string; entity_type: string; entity_id: string | null; details: string | null; created_at: string | null }

export function AuditLogsPage() {
  const [actionFilter, setActionFilter] = useState('')
  const [page, setPage] = useState(0)

  const { data: logs, isLoading } = useQuery<AuditLogItem[]>({
    queryKey: ['admin-audit', actionFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '30', skip: String(page * 30) })
      if (actionFilter) params.set('action', actionFilter)
      const r = await api.get(`/api/admin/audit?${params}`)
      return r.data
    },
  })

  const actionFilters = ['', 'otp_delivered', 'otp_unassigned', 'otp_used', 'otp_failed']

  const getActionColor = (action: string) => {
    if (action.includes('used')) return 'bg-green-100 text-green-800'
    if (action.includes('failed')) return 'bg-red-100 text-red-800'
    if (action.includes('unassigned')) return 'bg-orange-100 text-orange-800'
    if (action.includes('delivered')) return 'bg-blue-100 text-blue-800'
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-display-md font-display-md text-primary">Audit Logs</h2>
        <p className="text-body-md font-body-md text-on-surface-variant mt-1">Complete audit trail of system activities.</p>
      </div>

      {/* Action Filter */}
      <div className="flex gap-2 flex-wrap">
        {actionFilters.map(a => (
          <button
            key={a}
            onClick={() => { setActionFilter(a); setPage(0) }}
            className={`px-3 py-1.5 rounded-full text-label-sm font-label-sm transition-colors ${
              actionFilter === a
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container border border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {a || 'All Actions'}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-on-surface-variant">Loading...</div>
        ) : logs && logs.length > 0 ? (
          <div className="divide-y divide-outline-variant">
            {logs.map(log => (
              <div key={log.id} className="p-4 hover:bg-surface-container transition-colors">
                <div className="flex items-start gap-4">
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${getActionColor(log.action).split(' ')[0]}`}></div>
                    <div className="w-px h-full bg-outline-variant min-h-[40px]"></div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${getActionColor(log.action)}`}>
                        {log.action.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <span className="text-label-sm font-label-sm text-on-surface-variant">
                        {log.entity_type}
                      </span>
                    </div>
                    {log.details && (
                      <p className="text-body-md font-body-md text-on-surface">{log.details}</p>
                    )}
                    <p className="text-mono-data font-mono-data text-on-surface-variant mt-1 text-[11px]">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-on-surface-variant">No audit logs found</div>
        )}

        {/* Pagination */}
        <div className="p-3 border-t border-outline-variant bg-surface-container-low flex justify-between items-center text-label-sm font-label-sm text-on-surface-variant">
          <span>Page {page + 1}</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1 border border-outline-variant rounded hover:bg-surface-container disabled:opacity-50">Prev</button>
            <button onClick={() => setPage(p => p + 1)} disabled={!logs || logs.length < 30} className="px-3 py-1 border border-outline-variant rounded hover:bg-surface-container disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  )
}
