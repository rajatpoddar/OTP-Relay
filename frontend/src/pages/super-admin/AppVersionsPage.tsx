import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { Smartphone, Plus, X, CheckCircle, AlertTriangle, Upload, Download, Trash2, Send, Eye } from 'lucide-react'

interface AppVersion {
  id: string
  version: string
  minimum_supported_version: string | null
  latest_version: string
  force_update: boolean
  release_notes: string | null
  download_url: string | null
  is_active: boolean
  created_at: string | null
}

export function AppVersionsPage() {
  const [showForm, setShowForm] = useState(false)
  const [showDetail, setShowDetail] = useState<AppVersion | null>(null)
  const queryClient = useQueryClient()

  const { data: versions, isLoading } = useQuery<AppVersion[]>({
    queryKey: ['super-admin-versions'],
    queryFn: async () => {
      const r = await api.get('/api/super-admin/app-versions')
      return r.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const params = new URLSearchParams(data)
      const r = await api.post(`/api/super-admin/app-versions?${params}`)
      return r.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-versions'] })
      setShowForm(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/super-admin/app-versions/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-versions'] })
    },
  })

  const latestVersion = versions?.[0]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-display-md font-display-md text-primary">App Versions</h2>
          <p className="text-body-md font-body-md text-on-surface-variant mt-1">
            Manage Android app versions, push updates, and control force updates.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-primary text-on-primary rounded-lg text-label-sm font-label-sm flex items-center gap-2 hover:bg-inverse-surface transition-colors"
        >
          <Plus className="w-4 h-4" /> Push New Version
        </button>
      </div>

      {/* Current Version Status */}
      {latestVersion && (
        <div className="bg-primary-container border border-primary rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Smartphone className="w-6 h-6 text-primary" />
            <h3 className="text-headline-sm font-headline-sm text-primary">
              Current Live Version
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-label-sm text-on-surface-variant">Version</p>
              <p className="text-title-lg text-primary font-bold">v{latestVersion.version}</p>
            </div>
            <div>
              <p className="text-label-sm text-on-surface-variant">Force Update</p>
              <p className={`text-title-lg font-bold ${latestVersion.force_update ? 'text-red-600' : 'text-green-600'}`}>
                {latestVersion.force_update ? 'Yes' : 'No'}
              </p>
            </div>
            <div>
              <p className="text-label-sm text-on-surface-variant">Min Supported</p>
              <p className="text-title-lg text-primary font-bold">
                {latestVersion.minimum_supported_version || 'None'}
              </p>
            </div>
            <div>
              <p className="text-label-sm text-on-surface-variant">Published</p>
              <p className="text-title-lg text-primary font-bold">
                {latestVersion.created_at
                  ? new Date(latestVersion.created_at).toLocaleDateString()
                  : '—'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Version History */}
      <div>
        <h3 className="text-headline-sm font-headline-sm text-primary mb-4">Version History</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {versions?.map((v, index) => (
            <div
              key={v.id}
              className={`bg-surface-container-lowest border rounded-xl p-5 transition-all hover:shadow-md ${
                index === 0 ? 'border-primary shadow-sm' : 'border-outline-variant'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-primary" />
                  <h3 className="text-headline-sm font-headline-sm text-primary">v{v.version}</h3>
                  {index === 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-green-100 text-green-800">
                      LIVE
                    </span>
                  )}
                </div>
                {v.force_update && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800">
                    <AlertTriangle className="w-3 h-3" /> Force
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
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Status:</span>
                  <span className={v.is_active ? 'text-green-600' : 'text-red-600'}>
                    {v.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {v.release_notes && (
                <p className="text-body-md font-body-md text-on-surface-variant mt-3 p-3 bg-surface-container-low rounded-lg line-clamp-2">
                  {v.release_notes}
                </p>
              )}

              <div className="flex gap-2 mt-4">
                {v.download_url && (
                  <a
                    href={v.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-secondary-container text-on-secondary-container rounded-lg text-label-sm font-label-sm hover:bg-inverse-surface transition-colors"
                  >
                    <Download className="w-4 h-4" /> APK
                  </a>
                )}
                <button
                  onClick={() => setShowDetail(v)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-outline-variant rounded-lg text-label-sm font-label-sm hover:bg-surface-container-low transition-colors"
                >
                  <Eye className="w-4 h-4" /> Details
                </button>
                {index > 0 && (
                  <button
                    onClick={() => {
                      if (confirm('Delete this version?')) {
                        deleteMutation.mutate(v.id)
                      }
                    }}
                    className="px-3 py-2 border border-error text-error rounded-lg text-label-sm font-label-sm hover:bg-error-container transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <p className="text-label-sm font-label-sm text-on-surface-variant mt-3">
                {v.created_at
                  ? new Date(v.created_at).toLocaleString()
                  : '—'}
              </p>
            </div>
          ))}
          {(!versions || versions.length === 0) && (
            <div className="col-span-3 text-center py-12 text-on-surface-variant">
              <Smartphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No app versions configured</p>
              <p className="text-sm mt-2">Push your first version to enable auto-updates</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Version Modal */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-headline-sm font-headline-sm text-primary">Push New Version</h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-on-surface-variant hover:text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <VersionForm
              currentVersion={latestVersion?.version}
              onSave={(d) => createMutation.mutate(d)}
              loading={createMutation.isPending}
            />
          </div>
        </div>
      )}

      {/* Version Detail Modal */}
      {showDetail && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDetail(null)}
        >
          <div
            className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 w-full max-w-md shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-headline-sm font-headline-sm text-primary">
                Version v{showDetail.version}
              </h3>
              <button
                onClick={() => setShowDetail(null)}
                className="text-on-surface-variant hover:text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b border-outline-variant">
                <span className="text-on-surface-variant">Version</span>
                <span className="font-medium">{showDetail.version}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-outline-variant">
                <span className="text-on-surface-variant">Latest Version</span>
                <span className="font-medium">{showDetail.latest_version}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-outline-variant">
                <span className="text-on-surface-variant">Min Supported</span>
                <span className="font-medium">{showDetail.minimum_supported_version || 'None'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-outline-variant">
                <span className="text-on-surface-variant">Force Update</span>
                <span className={`font-medium ${showDetail.force_update ? 'text-red-600' : 'text-green-600'}`}>
                  {showDetail.force_update ? 'Yes (Mandatory)' : 'No (Optional)'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-outline-variant">
                <span className="text-on-surface-variant">Status</span>
                <span className={`font-medium ${showDetail.is_active ? 'text-green-600' : 'text-red-600'}`}>
                  {showDetail.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              {showDetail.download_url && (
                <div className="py-2 border-b border-outline-variant">
                  <span className="text-on-surface-block">Download URL</span>
                  <a
                    href={showDetail.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mt-1 text-secondary hover:underline break-all text-sm"
                  >
                    {showDetail.download_url}
                  </a>
                </div>
              )}
              {showDetail.release_notes && (
                <div className="py-2">
                  <span className="text-on-surface-variant block mb-2">Release Notes</span>
                  <p className="p-3 bg-surface-container-low rounded-lg text-sm">
                    {showDetail.release_notes}
                  </p>
                </div>
              )}
              <div className="flex justify-between py-2">
                <span className="text-on-surface-variant">Published</span>
                <span className="font-medium">
                  {showDetail.created_at
                    ? new Date(showDetail.created_at).toLocaleString()
                    : '—'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowDetail(null)}
              className="w-full mt-6 py-3 bg-primary text-on-primary rounded-lg text-label-sm font-label-sm hover:bg-inverse-surface transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function VersionForm({
  currentVersion,
  onSave,
  loading,
}: {
  currentVersion?: string
  onSave: (d: any) => void
  loading: boolean
}) {
  const [version, setVersion] = useState('')
  const [minSupported, setMinSupported] = useState('')
  const [forceUpdate, setForceUpdate] = useState(false)
  const [releaseNotes, setReleaseNotes] = useState('')
  const [downloadUrl, setDownloadUrl] = useState('')

  // Auto-suggest version
  const suggestVersion = () => {
    if (currentVersion) {
      const parts = currentVersion.split('.')
      const minor = parseInt(parts[1] || '0') + 1
      return `${parts[0]}.${minor}.0`
    }
    return '1.0.0'
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-2">
          Version Number *
        </label>
        <div className="flex gap-2">
          <input
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            className="flex-1 px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="1.1.0"
          />
          <button
            type="button"
            onClick={() => setVersion(suggestVersion())}
            className="px-4 py-3 border border-outline-variant rounded-lg text-label-sm hover:bg-surface-container-low"
          >
            Auto
          </button>
        </div>
        {currentVersion && (
          <p className="text-[11px] text-on-surface-variant mt-1">
            Current: v{currentVersion}
          </p>
        )}
      </div>

      <div>
        <label className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-2">
          Min Supported Version
        </label>
        <input
          value={minSupported}
          onChange={(e) => setMinSupported(e.target.value)}
          className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="1.0.0 (optional)"
        />
        <p className="text-[11px] text-on-surface-variant mt-1">
          Users below this version will be forced to update
        </p>
      </div>

      <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg">
        <input
          type="checkbox"
          checked={forceUpdate}
          onChange={(e) => setForceUpdate(e.target.checked)}
          className="w-5 h-5 rounded"
        />
        <div>
          <label className="text-body-md font-body-md text-primary font-medium">
            Force Update (Mandatory)
          </label>
          <p className="text-[11px] text-on-surface-variant">
            Users MUST update to continue using the app
          </p>
        </div>
      </div>

      <div>
        <label className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-2">
          Release Notes *
        </label>
        <textarea
          value={releaseNotes}
          onChange={(e) => setReleaseNotes(e.target.value)}
          className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          rows={4}
          placeholder="What's new in this version:&#10;- Bug fixes&#10;- Performance improvements&#10;- New features"
        />
      </div>

      <div>
        <label className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-2">
          APK Download URL *
        </label>
        <input
          value={downloadUrl}
          onChange={(e) => setDownloadUrl(e.target.value)}
          className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="https://otp.nregabot.com/downloads/otp-relay-v1.1.0.apk"
        />
        <p className="text-[11px] text-on-surface-variant mt-1">
          Upload APK to your server and paste the direct download link here
        </p>
      </div>

      <div className="bg-primary-container p-4 rounded-lg">
        <h4 className="text-label-sm font-label-sm text-primary mb-2 flex items-center gap-2">
          <Send className="w-4 h-4" /> Push Update Flow
        </h4>
        <ol className="text-[12px] text-on-surface-variant space-y-1 list-decimal list-inside">
          <li>Enter version number and release notes</li>
          <li>Paste the APK download URL</li>
          <li>Toggle "Force Update" if mandatory</li>
          <li>Click "Push Version" to publish</li>
          <li>All apps will check for updates on next launch</li>
        </ol>
      </div>

      <button
        onClick={() => {
          if (version && downloadUrl && releaseNotes) {
            onSave({
              version,
              latest_version: version,
              minimum_supported_version: minSupported || null,
              force_update: forceUpdate,
              release_notes: releaseNotes,
              download_url: downloadUrl,
            })
          }
        }}
        disabled={!version || !downloadUrl || !releaseNotes || loading}
        className="w-full py-3 bg-primary text-on-primary rounded-lg text-label-sm font-label-sm hover:bg-inverse-surface transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          'Publishing...'
        ) : (
          <>
            <Send className="w-4 h-4" /> Push Version to All Users
          </>
        )}
      </button>
    </div>
  )
}
