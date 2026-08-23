import { Link } from 'react-router-dom'
import { Download, Shield, Users, Smartphone, Settings, CheckCircle, ArrowRight, Key, Mail, GitBranch, Radio } from 'lucide-react'
import { useState, useEffect } from 'react'

function useApkUrl() {
  const [url, setUrl] = useState('/uploads/apk/otp-relay.apk')
  useEffect(() => {
    fetch('/api/public/app-version/latest')
      .then(r => r.json())
      .then(data => {
        if (data.download_url) setUrl(data.download_url)
      })
      .catch(() => {})
  }, [])
  return url
}

const setupSteps = [
  {
    step: 1,
    title: 'Download & Install the App',
    icon: Download,
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200',
    details: [
      'Download the OTP Relay Android app using the button below.',
      'Install the APK on all staff member phones.',
      'Enable "Install from Unknown Sources" if prompted.',
      'The app needs SMS permission to detect OTPs — grant it when asked.',
    ],
  },
  {
    step: 2,
    title: 'Admin Setup — Organization & Staff',
    icon: Settings,
    color: 'text-purple-600',
    bg: 'bg-purple-50 border-purple-200',
    details: [
      'Login to the web dashboard at otp.nregabot.com with admin credentials.',
      'Go to "Staff" section and add all staff members with their mobile numbers.',
      'Go to "Operators" section and create operator accounts.',
      'Go to "Sender IDs" and add all government portal sender IDs (e.g., BT-VBGRAM-G, VK-ADHAAR, etc.).',
      'Set OTP length and service name for each sender ID.',
    ],
  },
  {
    step: 3,
    title: 'Configure Routing Rules',
    icon: GitBranch,
    color: 'text-green-600',
    bg: 'bg-green-50 border-green-200',
    details: [
      'Go to "Routing Rules" in the admin dashboard.',
      'Create rules to route OTPs from specific senders to designated operators.',
      'You can route by: Sender ID, Service name, Staff member, or Department.',
      'Operators can be assigned to handle OTPs from specific senders only.',
    ],
  },
  {
    step: 4,
    title: 'Staff First-Time Login (OTP Login)',
    icon: Smartphone,
    color: 'text-orange-600',
    bg: 'bg-orange-50 border-orange-200',
    details: [
      'Open the installed app on staff phone.',
      'Enter the registered mobile number.',
      'Tap "Request OTP" — a login request will appear on the Operator dashboard.',
      'Operator reads the 6-digit OTP to the staff member verbally.',
      'Staff enters the OTP in the app to complete login.',
      'On first login, staff completes their profile (name, designation).',
    ],
  },
  {
    step: 5,
    title: 'Authorize Sender IDs',
    icon: Key,
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
    details: [
      'After login, staff goes to "Authorizations" in the app.',
      'Staff selects and authorizes which government sender IDs the app can process.',
      'Only authorized sender IDs will have their OTPs relayed to operators.',
      'Personal SMS from other senders are never touched or read.',
    ],
  },
  {
    step: 6,
    title: 'Start Using — OTP Auto-Relay',
    icon: Radio,
    color: 'text-teal-600',
    bg: 'bg-teal-50 border-teal-200',
    details: [
      'When a government portal sends an OTP to the staff phone, the app detects it.',
      'The OTP is automatically routed to the designated operator dashboard.',
      'Operator sees the OTP in real-time, copies it, and enters it in the portal.',
      'Operator marks the OTP as "Used" with a mandatory usage note.',
      'Everything is logged in the audit trail for admin review.',
    ],
  },
]

const roles = [
  {
    role: 'Office Admin',
    icon: Shield,
    color: 'bg-purple-100 text-purple-700',
    responsibilities: [
      'Add staff members and operators',
      'Configure sender IDs and routing rules',
      'Review audit logs and reports',
      'Manage devices and subscriptions',
    ],
  },
  {
    role: 'Operator',
    icon: Users,
    color: 'bg-blue-100 text-blue-700',
    responsibilities: [
      'View OTPs in real-time on the Live OTP dashboard',
      'Copy OTP codes and enter them in government portals',
      'Mark OTPs as used with mandatory usage notes',
      'Share OTPs verbally with staff during login',
    ],
  },
  {
    role: 'Staff (Field Officer)',
    icon: Smartphone,
    color: 'bg-green-100 text-green-700',
    responsibilities: [
      'Install the app and complete OTP-based login',
      'Authorize specific government sender IDs',
      'Keep the phone charged and app running in background',
      'OTP SMS is automatically detected and relayed — no manual action needed',
    ],
  },
]

const faqs = [
  { q: 'Does this read personal messages?', a: 'No. The app only processes SMS from government sender IDs that YOU explicitly authorize. Personal messages from family, banks, etc. are never read or transmitted.' },
  { q: 'What if the phone has no internet?', a: 'The app can queue OTPs locally and sync when connectivity returns. SMS reception works on mobile network — internet is only needed to relay to the operator dashboard.' },
  { q: 'How many staff phones can use one account?', a: 'Each staff member needs their own app installation and login. The number of staff is determined by your subscription plan.' },
  { q: 'What if a staff phone is lost?', a: 'Admin can immediately revoke the device from the dashboard. The device will be blocked from submitting OTPs on next sync.' },
  { q: 'Can different departments have different operators?', a: 'Yes. Routing rules can be configured to send OTPs from specific senders or services to designated operators.' },
]

export function InstructionsPage() {
  const APK_DOWNLOAD_URL = useApkUrl()
  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-primary text-white py-6 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
              <span className="material-symbols-outlined">arrow_back</span>
              <span className="text-sm font-medium">Back to Home</span>
            </Link>
            <a href={APK_DOWNLOAD_URL} download className="flex items-center gap-2 bg-white text-primary px-4 py-2 rounded-lg font-medium hover:bg-white/90 transition-colors">
              <Download className="w-4 h-4" />
              Download App
            </a>
          </div>
          <div className="mt-8 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">OTP Relay — Setup Guide</h1>
            <p className="text-white/80 text-lg">Complete instructions for setting up the OTP relay system in your office.</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-16">

        {/* Download CTA */}
        <section className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-8 text-center">
          <Smartphone className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Step 0: Download the App</h2>
          <p className="text-gray-600 mb-6 max-w-lg mx-auto">Install the OTP Relay app on all staff member Android phones before proceeding with setup.</p>
          <a href={APK_DOWNLOAD_URL} download className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-blue-700 transition-colors shadow-lg">
            <Download className="w-6 h-6" />
            Download OTP Relay APK
          </a>
          <p className="text-sm text-gray-500 mt-3">Android 7.0+ required • Size: ~15 MB</p>
        </section>

        {/* Setup Steps */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Complete Setup Guide</h2>
          <div className="space-y-6">
            {setupSteps.map((step) => (
              <div key={step.step} className={`border rounded-xl overflow-hidden ${step.bg}`}>
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-10 h-10 rounded-full bg-white border-2 flex items-center justify-center font-bold ${step.color}`}>
                      {step.step}
                    </div>
                    <step.icon className={`w-6 h-6 ${step.color}`} />
                    <h3 className="text-lg font-bold text-gray-900">{step.title}</h3>
                  </div>
                  <ol className="ml-14 space-y-2">
                    {step.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Roles */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Roles & Responsibilities</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {roles.map((r) => (
              <div key={r.role} className="bg-white border border-gray-200 rounded-xl p-6">
                <div className={`w-12 h-12 rounded-full ${r.color} flex items-center justify-center mb-4`}>
                  <r.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{r.role}</h3>
                <ul className="space-y-2">
                  {r.responsibilities.map((resp, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                      {resp}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Login Credentials */}
        <section className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Key className="w-5 h-5" />
            Default Login Credentials
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Role</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Email</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Password</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr><td className="py-2 px-3 font-medium">Office Admin</td><td className="py-2 px-3 font-mono text-xs">admin@otp-relay.gov.in</td><td className="py-2 px-3 font-mono text-xs">admin123</td></tr>
                <tr><td className="py-2 px-3 font-medium">Staff</td><td className="py-2 px-3 font-mono text-xs">rajesh.kumar@palojori.gov.in</td><td className="py-2 px-3 font-mono text-xs">staff123</td></tr>
                <tr><td className="py-2 px-3 font-medium">Operator</td><td className="py-2 px-3 font-mono text-xs">amit.kumar@palojori.gov.in</td><td className="py-2 px-3 font-mono text-xs">operator123</td></tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-3">⚠️ Change these passwords after first login for security.</p>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-white border border-gray-200 rounded-xl p-5">
                <h4 className="font-bold text-gray-900 mb-2">{faq.q}</h4>
                <p className="text-gray-600 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="bg-primary text-white rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-3">Ready to Get Started?</h2>
          <p className="text-white/80 mb-6">Login to the dashboard and start configuring your OTP relay system.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/login" className="inline-flex items-center justify-center gap-2 bg-white text-primary px-6 py-3 rounded-lg font-bold hover:bg-white/90 transition-colors">
              Open Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
            <a href={APK_DOWNLOAD_URL} download className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/30 text-white px-6 py-3 rounded-lg font-bold hover:bg-white/20 transition-colors">
              <Download className="w-4 h-4" />
              Download App
            </a>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 py-6 text-center text-sm text-gray-500">
        <p>© 2026 OTP Relay Platform. Need help? Contact your system administrator.</p>
      </footer>
    </div>
  )
}
