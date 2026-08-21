import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { Smartphone, Plus, X, CheckCircle, AlertTriangle } from 'lucide-react'

interface AppVersion { id: string; version: string; minimum_supported_version: string | null; latest_version: string; force_update: boolean; release_notes: string | null; download_url: string | null; is_active: boolean; created_at: string | null }

export function AppVersionsPage() {
  const [showForm, setShowForm] = useState(false)
  const queryClient = useQueryClient()

  const { data: versions, isLoading } = useQuery<AppVersion[]>({
    queryKey: ['super-admin-versions'],
    queryFn: async () => { const r = await api.get('/api/super-admin/app-versions'); return r.data },
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const params = new URLSearchParams(data)
      const r = await api.post(`/api/super-admin/app-versions?${params}`)
      return r.data
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['super-admin-versions'] }); setShowForm(false) },
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-display-md font-display-md text-primary">App Versions</h2>
          <p className="text-body-md font-body-md text-on-surface-variant mt-1">Manage Android app versions and force updates.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-primary text-on-primary rounded-lg text-label-sm font-label-sm flex items-center gap-2 hover:bg-inverse-surface transition-colors">
          <Plus className="w-4 h-4" /> New Version
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {versions?.map(v => (
          <div key={v.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" />
                <h3 className="text-headline-sm font-headline-sm text-primary">v{v.version}</h3>
              </div>
              {v.force_update && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800">
                  <AlertTriangle className="w-3 h-3" /> Force Update
                </span>
              )}
            </div>

            <div className="space-y-2 text-body-md font-body-md">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Latest:</span>
                <span className="text-primary">{v.latest_version}</span>
              </div>
              {v.minimum_supported_version && (
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Min Supported:</span>
                  <span className="text-primary">{v.minimum_supported_version}</span>
                </div>
              )}
            </div>

            {v.release_notes && (
              <p className="text-body-md font-body-md text-on-surface-variant mt-3 p-3 bg-surface-container-low rounded-lg">{v.release_notes}</p>
            )}

            {v.download_url && (
              <a href={v.download_url} target="_blank" rel="noopener noreferrer" className="block mt-3 text-label-sm font-label-sm text-secondary hover:underline">Download APK →</a>
            )}

            <p className="text-label-sm font-label-sm text-on-surface-variant mt-3">
              {v.created_at ? new Date(v.created_at).toLocaleDateString() : '—'}
            </p>
          </div>
        ))}
        {(!versions || versions.length === 0) && (
          <div className="col-span-3 text-center py-8 text-on-surface-variant">No app versions configured</div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-headline-sm font-headline-sm text-primary">New App Version</h3>
              <button onClick={() => setShowForm(false)} className="text-on-surface-variant hover:text-primary"><X className="w-5 h-5" /></button>
            </div>
            <VersionForm onSave={(d) => createMutation.mutate(d)} loading={createMutation.isPending} />
          </div>
        </div>
      )}
    </div>
  )
}

function VersionForm({ onSave, loading }: { onSave: (d: any) => void; loading: boolean }) {
  const [version, setVersion] = useState('')
  const [latest, setLatest] = useState('')
  const [minSupported, setMinSupported] = useState('')
  const [forceUpdate, setForceUpdate] = useState(false)
  const [releaseNotes, setReleaseNotes] = useState('')
  const [downloadUrl, setDownloadUrl] = useState('')

  return (
    <div className="space-y-4">
      <div><label className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-2">Version</label>
        <input value={version} onChange={e => setVersion(e.target.value)} className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary" placeholder="1.0.0" /></div>
      <div><label className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-2">Latest Version</label>
        <input value={latest} onChange={e => setLatest(e.target.value)} className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary" placeholder="1.0.0" /></div>
      <div><label className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-2">Min Supported Version</label>
        <input value={minSupported} onChange={e => setMinSupported(e.target.value)} className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary" placeholder="0.9.0" /></div>
      <div className="flex items-center gap-3">
        <input type="checkbox" checked={forceUpdate} onChange={e => setForceUpdate(e.target.checked)} className="w-4 h-4" />
        <label className="text-body-md font-body-md text-primary">Force Update</label>
      </div>
      <div><label className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-2">Release Notes</label>
        <textarea value={releaseNotes} onChange={e => setReleaseNotes(e.target.value)} className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary resize-none" rows={3} placeholder="Bug fixes and improvements" /></div>
      <div><label className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-2">Download URL</label>
        <input value={downloadUrl} onChange={e => setDownloadUrl(e.target.value)} className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary" placeholder="https://..." /></div>
      <button onClick={() => version && latest && onSave({ version, latest_version: latest, minimum_supported_version: minSupported || null, force_update: forceUpdate, release_notes: releaseNotes || null, download_url: downloadUrl || null })} disabled={!version || !latest || loading} className="w-full py-3 bg-primary text-on-primary rounded-lg text-label-sm font-label-sm hover:bg-inverse-surface transition-colors disabled:opacity-50">{loading ? 'Saving...' : 'Create Version'}</button>
    </div>
  )
}
