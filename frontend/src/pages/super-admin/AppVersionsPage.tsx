import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { Smartphone, Plus, X, CheckCircle, AlertTriangle, Download, Trash2, Eye, FileUp, Upload } from 'lucide-react'

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
  const [showDetail, setShowDetail] = useState<AppVersion | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadPercent, setUploadPercent] = useState(0)
  const [uploadPhase, setUploadPhase] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [releaseNotes, setReleaseNotes] = useState('')
  const [forceUpdate, setForceUpdate] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const { data: versions, isLoading } = useQuery<AppVersion[]>({
    queryKey: ['super-admin-versions'],
    queryFn: async () => {
      const r = await api.get('/api/super-admin/app-versions')
      return r.data
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

  const handleUploadApk = (file: File) => {
    setUploading(true)
    setUploadPercent(0)
    setUploadPhase('Preparing...')
    setUploadSuccess(false)

    const formData = new FormData()
    formData.append('file', file)
    if (releaseNotes) formData.append('release_notes', releaseNotes)
    formData.append('force_update', String(forceUpdate))

    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100)
        setUploadPercent(pct)
        const sizeMB = (e.loaded / (1024 * 1024)).toFixed(1)
        const totalMB = (e.total / (1024 * 1024)).toFixed(1)
        if (pct < 100) {
          setUploadPhase(`Uploading... ${sizeMB}MB / ${totalMB}MB`)
        } else {
          setUploadPhase('Processing...')
        }
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setUploadPercent(100)
        setUploadPhase('Published!')
        setUploadSuccess(true)
        setReleaseNotes('')
        setForceUpdate(false)
        queryClient.invalidateQueries({ queryKey: ['super-admin-versions'] })
        setTimeout(() => {
          setUploadSuccess(false)
          setUploadPercent(0)
          setUploadPhase('')
        }, 4000)
      } else {
        try {
          const err = JSON.parse(xhr.responseText)
          setUploadPhase(`❌ Failed: ${err.detail || 'Unknown error'}`)
        } catch {
          setUploadPhase(`❌ Upload failed (${xhr.status})`)
        }
      }
      setUploading(false)
    })

    xhr.addEventListener('error', () => {
      setUploadPhase('❌ Network error — check connection')
      setUploading(false)
    })

    xhr.open('POST', '/api/upload/apk')
    xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('token') || ''}`)
    xhr.send(formData)
  }

  const latestVersion = versions?.[0]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-display-md font-display-md text-primary">App Versions</h2>
        <p className="text-body-md font-body-md text-on-surface-variant mt-1">
          Upload APK to publish updates. All users will be notified automatically.
        </p>
      </div>

      {/* One-Click Upload Card */}
      <div className="bg-surface-container-lowest border-2 border-dashed border-primary/30 rounded-xl p-6">
        <div className="text-center">
          <Upload className="w-12 h-12 mx-auto text-primary/50 mb-3" />
          <h3 className="text-headline-sm font-headline-sm text-primary mb-1">Publish New Version</h3>
          <p className="text-body-md text-on-surface-variant mb-4">
            Upload APK file — version is auto-detected from filename and published instantly.
          </p>

          <div className="max-w-md mx-auto space-y-3">
            <div>
              <textarea
                value={releaseNotes}
                onChange={(e) => setReleaseNotes(e.target.value)}
                className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={2}
                placeholder="Release notes (optional)"
              />
            </div>

            <div className="flex items-center gap-3 justify-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={forceUpdate}
                  onChange={(e) => setForceUpdate(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-on-surface-variant">Force update</span>
              </label>
            </div>

            <label className="block">
              <div className="relative overflow-hidden rounded-xl transition-all">
                {/* Progress fill background */}
                {uploading && (
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-primary via-primary to-green-500 transition-all duration-300 ease-out rounded-xl"
                    style={{ width: `${uploadPercent}%`, opacity: 0.9 }}
                  />
                )}
                <div className={`relative flex items-center justify-center gap-2 px-6 py-4 cursor-pointer transition-all ${
                  uploading
                    ? uploadPercent >= 100
                      ? 'bg-green-600 text-white'
                      : 'text-white'
                    : 'bg-primary text-on-primary hover:bg-inverse-surface'
                }`}>
                  {uploading ? (
                    uploadPercent >= 100 ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-bold">Published!</span>
                      </>
                    ) : (
                      <>
                        <div className="relative w-5 h-5">
                          <svg className="w-5 h-5 -rotate-90" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                            <circle
                              cx="12" cy="12" r="10" fill="none" stroke="white" strokeWidth="3"
                              strokeDasharray={`${2 * Math.PI * 10}`}
                              strokeDashoffset={`${2 * Math.PI * 10 * (1 - uploadPercent / 100)}`}
                              strokeLinecap="round"
                              className="transition-all duration-300"
                            />
                          </svg>
                        </div>
                        <span className="font-bold">{uploadPercent}%</span>
                      </>
                    )
                  ) : (
                    <>
                      <FileUp className="w-5 h-5" />
                      <span className="font-bold">Upload APK & Publish</span>
                    </>
                  )}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".apk"
                className="hidden"
                disabled={uploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (file) await handleUploadApk(file)
                  e.target.value = ''
                }}
              />
            </label>
          </div>
        </div>

        {/* Upload Progress Bar */}
        {uploading && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-on-surface-variant">{uploadPhase}</span>
              <span className="text-sm font-bold text-primary">{uploadPercent}%</span>
            </div>
            <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300 ease-out"
                style={{
                  width: `${uploadPercent}%`,
                  background: uploadPercent >= 100
                    ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                    : 'linear-gradient(90deg, var(--color-primary, #6750a4), #8b5cf6)',
                }}
              />
            </div>
          </div>
        )}
        {uploadPhase && !uploading && uploadPhase.startsWith('❌') && (
          <div className="mt-4 p-3 rounded-lg text-sm text-center bg-red-50 text-red-800 border border-red-200">
            {uploadPhase}
          </div>
        )}

        {/* Upload Success */}
        {uploadSuccess && (
          <div className="mt-4 p-3 rounded-lg text-sm text-center bg-green-50 text-green-800 border border-green-200 flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Version published! All users will be notified on next app launch.
          </div>
        )}
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
              <p className="text-label-sm text-on-surface-variant">Published</p>
              <p className="text-title-lg text-primary font-bold">
                {latestVersion.created_at
                  ? new Date(latestVersion.created_at).toLocaleDateString()
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-label-sm text-on-surface-variant">Status</p>
              <p className="text-title-lg text-green-600 font-bold">Active</p>
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
                {!v.is_active && (
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
              <p className="text-lg font-medium">No app versions published</p>
              <p className="text-sm mt-2">Upload your first APK to enable auto-updates</p>
            </div>
          )}
        </div>
      </div>

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
                  <span className="text-on-surface-variant block mb-1">Download URL</span>
                  <a
                    href={showDetail.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-secondary hover:underline break-all text-sm"
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
