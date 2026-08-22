import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { Smartphone, Shield, Clock, Wifi, WifiOff, Search, RefreshCw, X, Eye } from 'lucide-react'

interface DeviceItem {
  id: string
  device_id: string
  staff_name: string | null
  staff_mobile: string | null
  model: string | null
  manufacturer: string | null
  android_version: string | null
  app_version: string | null
  status: string
  registered_at: string
  last_seen_at: string | null
  last_sync_at: string | null
  revoked_at: string | null
}

export function DevicesPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [selectedDevice, setSelectedDevice] = useState<DeviceItem | null>(null)
  const queryClient = useQueryClient()

  const { data: devices, isLoading, refetch, isFetching } = useQuery<DeviceItem[]>({
    queryKey: ['admin-devices', statusFilter],
    queryFn: async () => {
      const params: any = { limit: 100 }
      if (statusFilter) params.status = statusFilter
      const r = await api.get('/api/admin/devices', { params })
      return r.data
    },
  })

  const revokeMutation = useMutation({
    mutationFn: async (deviceId: string) => {
      const res = await api.post(`/api/admin/devices/${deviceId}/revoke`, { reason: 'Revoked by admin' })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-devices'] })
      setSelectedDevice(null)
    },
  })

  const reactivateMutation = useMutation({
    mutationFn: async (deviceId: string) => {
      const res = await api.post(`/api/admin/devices/${deviceId}/reactivate`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-devices'] })
      setSelectedDevice(null)
    },
  })

  const filteredDevices = devices?.filter(d =>
    d.staff_name?.toLowerCase().includes(search.toLowerCase()) ||
    d.device_id.toLowerCase().includes(search.toLowerCase()) ||
    d.model?.toLowerCase().includes(search.toLowerCase())
  ) || []

  const totalDevices = devices?.length || 0
  const activeDevices = devices?.filter(d => d.status === 'ACTIVE').length || 0
  const revokedDevices = devices?.filter(d => d.status === 'REVOKED').length || 0

  if (isLoading) return <div className="text-on-surface-variant p-8">Loading devices...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-display-md font-display-md text-primary">Device Management</h2>
          <p className="text-body-md font-body-md text-on-surface-variant mt-1">Monitor and manage registered Android devices.</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="px-4 py-2 bg-surface-container border border-outline-variant text-on-surface rounded-lg text-label-sm font-label-sm flex items-center gap-2 hover:bg-surface-container-high transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
          <div className="flex justify-between items-start mb-2">
            <span className="text-label-sm font-label-sm text-on-surface-variant uppercase">Total Devices</span>
            <Smartphone className="w-5 h-5 text-on-surface-variant" />
          </div>
          <p className="text-display-md font-display-md text-primary">{totalDevices}</p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
          <div className="flex justify-between items-start mb-2">
            <span className="text-label-sm font-label-sm text-on-surface-variant uppercase">Active</span>
            <Wifi className="w-5 h-5 text-tertiary-fixed-dim" />
          </div>
          <p className="text-display-md font-display-md text-primary">{activeDevices}</p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
          <div className="flex justify-between items-start mb-2">
            <span className="text-label-sm font-label-sm text-on-surface-variant uppercase">Revoked</span>
            <Shield className="w-5 h-5 text-error" />
          </div>
          <p className="text-display-md font-display-md text-error">{revokedDevices}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by staff, device ID, or model..."
            className="w-full pl-10 pr-4 py-2 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="REVOKED">Revoked</option>
          <option value="PENDING">Pending</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {/* Device Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div className="p-4 border-b border-outline-variant bg-surface-bright">
          <h3 className="text-headline-sm font-headline-sm text-primary">Registered Devices</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase border-b border-outline-variant">
              <tr>
                <th className="px-4 py-3 font-semibold">Staff</th>
                <th className="px-4 py-3 font-semibold">Device</th>
                <th className="px-4 py-3 font-semibold">Model</th>
                <th className="px-4 py-3 font-semibold">Android</th>
                <th className="px-4 py-3 font-semibold">App Ver</th>
                <th className="px-4 py-3 font-semibold">Last Seen</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-mono-data font-mono-data">
              {filteredDevices.map(d => (
                <tr key={d.id} className="hover:bg-surface-container transition-colors h-12">
                  <td className="px-4 py-2">
                    <div className="font-medium text-primary">{d.staff_name || '—'}</div>
                    <div className="text-[11px] text-on-surface-variant">{d.staff_mobile || ''}</div>
                  </td>
                  <td className="px-4 py-2 text-on-surface-variant font-medium">{d.device_id.substring(0, 12)}...</td>
                  <td className="px-4 py-2 text-on-surface-variant">{d.model || '—'}</td>
                  <td className="px-4 py-2 text-on-surface-variant">{d.android_version || '—'}</td>
                  <td className="px-4 py-2 text-on-surface-variant">{d.app_version || '—'}</td>
                  <td className="px-4 py-2 text-on-surface-variant">{d.last_seen_at ? new Date(d.last_seen_at).toLocaleString() : 'Never'}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                      d.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                      d.status === 'REVOKED' ? 'bg-red-100 text-red-800' :
                      d.status === 'SUSPENDED' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>{d.status}</span>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => setSelectedDevice(d)}
                      className="p-1 text-on-surface-variant hover:text-primary transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredDevices.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-on-surface-variant">No devices found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Device Detail Modal */}
      {selectedDevice && (
        <DeviceDetailModal
          device={selectedDevice}
          onClose={() => setSelectedDevice(null)}
          onRevoke={() => revokeMutation.mutate(selectedDevice.id)}
          onReactivate={() => reactivateMutation.mutate(selectedDevice.id)}
          revoking={revokeMutation.isPending}
          reactivating={reactivateMutation.isPending}
        />
      )}
    </div>
  )
}

function DeviceDetailModal({ device, onClose, onRevoke, onReactivate, revoking, reactivating }: {
  device: DeviceItem
  onClose: () => void
  onRevoke: () => void
  onReactivate: () => void
  revoking: boolean
  reactivating: boolean
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-headline-sm font-headline-sm text-primary">Device Details</h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-primary"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-3 mb-6">
          <InfoRow label="Staff" value={device.staff_name || '—'} />
          <InfoRow label="Mobile" value={device.staff_mobile || '—'} />
          <InfoRow label="Device ID" value={device.device_id} />
          <InfoRow label="Model" value={device.model || '—'} />
          <InfoRow label="Android Version" value={device.android_version || '—'} />
          <InfoRow label="App Version" value={device.app_version || '—'} />
          <InfoRow label="Registered" value={new Date(device.registered_at).toLocaleString()} />
          <InfoRow label="Last Seen" value={device.last_seen_at ? new Date(device.last_seen_at).toLocaleString() : 'Never'} />
          <InfoRow label="Last Sync" value={device.last_sync_at ? new Date(device.last_sync_at).toLocaleString() : 'Never'} />
          <InfoRow label="Status" value={device.status} color={
            device.status === 'ACTIVE' ? 'text-green-600' :
            device.status === 'REVOKED' ? 'text-error' : 'text-on-surface-variant'
          } />
          {device.revoked_at && (
            <InfoRow label="Revoked At" value={new Date(device.revoked_at).toLocaleString()} color="text-error" />
          )}
        </div>

        <div className="flex gap-3 border-t border-outline-variant pt-4">
          <button onClick={onClose} className="flex-1 py-3 border border-outline-variant rounded-lg text-label-sm font-label-sm text-on-surface hover:bg-surface-container transition-colors">
            Close
          </button>
          {device.status === 'ACTIVE' ? (
            <button
              onClick={onRevoke}
              disabled={revoking}
              className="flex-1 py-3 bg-error text-on-error rounded-lg text-label-sm font-label-sm hover:bg-error/90 transition-colors disabled:opacity-50"
            >
              {revoking ? 'Revoking...' : 'Revoke Device'}
            </button>
          ) : device.status === 'REVOKED' ? (
            <button
              onClick={onReactivate}
              disabled={reactivating}
              className="flex-1 py-3 bg-tertiary-fixed-dim text-on-primary rounded-lg text-label-sm font-label-sm hover:bg-tertiary-fixed-dim/90 transition-colors disabled:opacity-50"
            >
              {reactivating ? 'Reactivating...' : 'Reactivate Device'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-body-md font-body-md text-on-surface-variant">{label}</span>
      <span className={`text-body-md font-body-md font-semibold ${color || 'text-primary'}`}>{value}</span>
    </div>
  )
}
