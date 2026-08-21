import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { Smartphone, Shield, Clock, Wifi, WifiOff } from 'lucide-react'

interface DeviceItem { id: string; device_id: string; model: string | null; android_version: string | null; app_version: string | null; status: string; registered_at: string; last_seen_at: string | null; last_sync_at: string | null }

export function DevicesPage() {
  const { data: devices, isLoading } = useQuery<DeviceItem[]>({
    queryKey: ['admin-devices'],
    queryFn: async () => { const r = await api.get('/api/admin/staff?limit=100'); return r.data },
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-display-md font-display-md text-primary">Device Management</h2>
        <p className="text-body-md font-body-md text-on-surface-variant mt-1">Monitor and manage registered Android devices.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
          <div className="flex justify-between items-start mb-2">
            <span className="text-label-sm font-label-sm text-on-surface-variant uppercase">Total Devices</span>
            <Smartphone className="w-5 h-5 text-on-surface-variant" />
          </div>
          <p className="text-display-md font-display-md text-primary">{devices?.length || 0}</p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
          <div className="flex justify-between items-start mb-2">
            <span className="text-label-sm font-label-sm text-on-surface-variant uppercase">Active</span>
            <Wifi className="w-5 h-5 text-tertiary-fixed-dim" />
          </div>
          <p className="text-display-md font-display-md text-primary">{devices?.filter(d => d.status === 'ACTIVE').length || 0}</p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
          <div className="flex justify-between items-start mb-2">
            <span className="text-label-sm font-label-sm text-on-surface-variant uppercase">Revoked</span>
            <Shield className="w-5 h-5 text-error" />
          </div>
          <p className="text-display-md font-display-md text-error">{devices?.filter(d => d.status === 'REVOKED').length || 0}</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div className="p-4 border-b border-outline-variant bg-surface-bright">
          <h3 className="text-headline-sm font-headline-sm text-primary">Registered Devices</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase border-b border-outline-variant">
              <tr>
                <th className="px-4 py-3 font-semibold">Device ID</th>
                <th className="px-4 py-3 font-semibold">Model</th>
                <th className="px-4 py-3 font-semibold">App Version</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Last Seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-mono-data font-mono-data">
              {devices?.map(d => (
                <tr key={d.id} className="hover:bg-surface-container transition-colors h-12">
                  <td className="px-4 py-2 text-primary font-medium">{d.device_id.substring(0, 12)}...</td>
                  <td className="px-4 py-2 text-on-surface-variant">{d.model || '—'}</td>
                  <td className="px-4 py-2 text-on-surface-variant">{d.app_version || '—'}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                      d.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                      d.status === 'REVOKED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>{d.status}</span>
                  </td>
                  <td className="px-4 py-2 text-on-surface-variant">{d.last_seen_at ? new Date(d.last_seen_at).toLocaleString() : 'Never'}</td>
                </tr>
              ))}
              {(!devices || devices.length === 0) && <tr><td colSpan={5} className="px-4 py-8 text-center text-on-surface-variant">No devices registered</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
