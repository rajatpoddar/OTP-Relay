import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Shield } from 'lucide-react'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-container text-on-primary-container mb-4">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-display-md font-display-md text-primary">OTP Relay</h1>
          <p className="text-body-lg font-body-lg text-on-surface-variant mt-2">Enterprise Platform</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8">
          <h2 className="text-headline-sm font-headline-sm text-primary mb-6">Sign In</h2>

          {error && (
            <div className="mb-4 p-3 bg-error-container/20 border border-error-container rounded-lg text-error text-body-md font-body-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="admin@otp-relay.gov.in"
                required
              />
            </div>

            <div>
              <label className="block text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-on-primary rounded-lg text-label-sm font-label-sm uppercase tracking-wider hover:bg-inverse-surface transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
