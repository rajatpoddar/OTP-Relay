import { useState, useEffect } from 'react'
import { useWebSocket } from '../hooks/useWebSocket'
import { useAuth } from '../hooks/useAuth'
import { Bell, Copy, CheckCircle, X } from 'lucide-react'

interface PendingLogin {
  mobile_number: string
  otp: string
  staff_name: string
  expires_at: string
}

export function StaffLoginRequests() {
  const { user } = useAuth()
  const { lastMessage } = useWebSocket()
  const [pendingLogins, setPendingLogins] = useState<PendingLogin[]>([])
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  // Handle app_login_request events from WebSocket
  useEffect(() => {
    if (lastMessage?.type === 'app_login_request') {
      const data = lastMessage.data
      setPendingLogins(prev => {
        const exists = prev.find(p => p.mobile_number === data.mobile_number)
        if (exists) return prev
        return [data, ...prev]
      })
      // Auto-remove after 5 minutes
      setTimeout(() => {
        setPendingLogins(prev => prev.filter(p => p.mobile_number !== data.mobile_number))
      }, 5 * 60 * 1000)
    }
  }, [lastMessage])

  const handleCopy = (otp: string, index: number) => {
    navigator.clipboard.writeText(otp)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handleDismiss = (mobile_number: string) => {
    setDismissed(prev => new Set([...prev, mobile_number]))
  }

  // Only show for OPERATOR and OFFICE_ADMIN
  if (!user || (user.role !== 'OPERATOR' && user.role !== 'OFFICE_ADMIN')) return null

  const visibleLogins = pendingLogins.filter(l => !dismissed.has(l.mobile_number))

  if (visibleLogins.length === 0) return null

  return (
    <div className="space-y-3 mb-6">
      {visibleLogins.map((login, index) => {
        const now = new Date().getTime()
        const expiry = new Date(login.expires_at).getTime()
        const timeLeft = Math.max(0, expiry - now)
        const minutes = Math.floor(timeLeft / 60000)
        const seconds = Math.floor((timeLeft % 60000) / 1000)
        const isExpiringSoon = minutes < 2

        return (
          <div
            key={login.mobile_number}
            className={`relative border rounded-xl overflow-hidden shadow-lg ${
              isExpiringSoon
                ? 'bg-red-50 border-red-300'
                : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
            }`}
          >
            <div className={`absolute top-0 left-0 w-full h-1 ${
              isExpiringSoon ? 'bg-red-500 animate-pulse' : 'bg-blue-500'
            }`}></div>

            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isExpiringSoon ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  <Bell className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    🔔 Staff Login Request
                  </p>
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">{login.staff_name}</span> • {login.mobile_number}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className={`px-5 py-2.5 rounded-lg text-2xl font-bold tracking-[0.25em] cursor-pointer transition-all ${
                    isExpiringSoon
                      ? 'bg-red-900 text-white hover:bg-red-800'
                      : 'bg-blue-900 text-white hover:bg-blue-800'
                  }`}
                  style={{ fontFamily: 'monospace' }}
                  onClick={() => handleCopy(login.otp, index)}
                  title="Click to copy"
                >
                  {login.otp}
                </div>
                <button
                  onClick={() => handleCopy(login.otp, index)}
                  className={`p-2.5 rounded-lg transition-colors ${
                    copiedIndex === index
                      ? 'bg-green-100 text-green-600'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                  title="Copy OTP"
                >
                  {copiedIndex === index ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className={`text-xs font-mono px-2 py-1 rounded ${
                  isExpiringSoon ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </div>
                <button
                  onClick={() => handleDismiss(login.mobile_number)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className={`px-4 py-2 text-xs ${
              isExpiringSoon ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
            }`}>
              📢 Verbally share this OTP with the staff member. They need it to complete login.
            </div>
          </div>
        )
      })}
    </div>
  )
}
