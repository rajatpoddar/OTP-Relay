import { Link } from 'react-router-dom'
import { Download, ArrowRight, Shield, Clock, Users, CheckCircle, ChevronRight, Smartphone, BarChart3, Zap, Lock, Eye } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

function useApkUrl() {
  const [url, setUrl] = useState('/uploads/apk/otp-relay.apk')
  useEffect(() => {
    fetch('/api/public/app-version/latest')
      .then(r => r.json())
      .then(data => { if (data.download_url) setUrl(data.download_url) })
      .catch(() => {})
  }, [])
  return url
}

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setIsInView(true); observer.disconnect() }
    }, { threshold })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [threshold])
  return { ref, isInView }
}

const faqs = [
  { q: 'Does this read personal messages?', a: 'No. The app only processes SMS from government sender IDs that your office explicitly authorizes. Personal messages from family, banks, etc. are never read or transmitted.' },
  { q: 'What happens when the phone goes offline?', a: 'The app queues OTPs locally and syncs when connectivity returns. SMS reception works on mobile network — internet is only needed to relay to the operator dashboard.' },
  { q: 'Is this secure?', a: 'Yes. Every OTP is encrypted in transit, every access is logged, and operators must provide a usage note for every code they use. Full audit trail is available to administrators.' },
  { q: 'How long does setup take?', a: 'Most offices are running within 30 minutes. Add staff, configure sender IDs, set routing rules, and you are live.' },
]

export function LandingPage() {
  const APK = useApkUrl()
  const s1 = useInView(0.15)
  const s2 = useInView(0.15)
  const s3 = useInView(0.15)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="OTP Relay" className="h-7 w-7 rounded" />
            <span className="font-bold text-gray-900">OTP Relay</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <a href="#how" className="text-gray-500 hover:text-gray-900 transition-colors">How it works</a>
            <a href="#features" className="text-gray-500 hover:text-gray-900 transition-colors">Features</a>
            <a href="#faq" className="text-gray-500 hover:text-gray-900 transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 hidden sm:block">Login</Link>
            <a href={APK} download className="text-sm font-medium bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
              Download APK
            </a>
          </div>
        </div>
      </nav>

      <main className="pt-14">
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-green-100">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              Live in government offices across India
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-5">
              Officers in the field.<br />
              OTPs stuck on their phones.
            </h1>
            <p className="text-lg text-gray-500 mb-8 leading-relaxed max-w-lg">
              OTP Relay detects government OTPs on staff phones and routes them instantly to the operator dashboard. No more phone calls. No more delays.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/login" className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors">
                Open Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
              <a href={APK} download className="inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4" /> Download Android App
              </a>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="border-t border-gray-100">
          <div className="max-w-6xl mx-auto px-6 py-20">
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">How it works</p>
            <h2 className="text-3xl font-bold text-gray-900 mb-12">Four steps. That's it.</h2>
            <div ref={s1.ref} className={`grid md:grid-cols-4 gap-8 transition-all duration-700 ${s1.isInView ? 'opacity-100' : 'opacity-0'}`}>
              {[
                { n: '01', title: 'Install', desc: 'Staff installs the Android app and logs in with OTP verification.' },
                { n: '02', title: 'Authorize', desc: 'Staff selects which government sender IDs the app should process.' },
                { n: '03', title: 'Detect', desc: 'When a portal sends an OTP, the app reads it automatically via SMS.' },
                { n: '04', title: 'Deliver', desc: 'OTP appears on the operator dashboard in real time. Done.' },
              ].map((s, i) => (
                <div key={s.n} className="relative" style={{ transitionDelay: `${i * 100}ms` }}>
                  <span className="text-5xl font-bold text-gray-100">{s.n}</span>
                  <h3 className="text-lg font-semibold text-gray-900 mt-2 mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The problem */}
        <section className="bg-gray-50 border-y border-gray-100">
          <div className="max-w-6xl mx-auto px-6 py-20">
            <div className="grid md:grid-cols-2 gap-16">
              <div>
                <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">The problem</p>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">OTP sharing is broken.</h2>
                <p className="text-gray-500 leading-relaxed mb-6">
                  Every government portal login needs an OTP. Officers work in the field with poor connectivity. Operators sit in offices waiting. The result? Hours wasted on phone calls, missed deadlines, zero accountability.
                </p>
                <div className="space-y-4">
                  {[
                    'Operators call officers 5-10 times daily just for OTPs',
                    'No audit trail of who shared what and when',
                    'Critical entries stall while waiting for a 6-digit code',
                    'Officers in remote areas can\'t always take calls',
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center mt-0.5 shrink-0">
                        <span className="text-red-500 text-xs font-bold">✕</span>
                      </div>
                      <span className="text-sm text-gray-600">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div ref={s2.ref} className={`transition-all duration-700 delay-200 ${s2.isInView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">New OTP received</p>
                      <p className="text-xs text-gray-400">BT-VBGRAM-G • VBGRAMG • Just now</p>
                    </div>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-6 text-center mb-4">
                    <p className="text-xs text-gray-500 tracking-widest mb-2">OTP</p>
                    <p className="text-4xl font-mono font-bold text-white tracking-[0.2em]">980847</p>
                    <p className="text-xs text-gray-500 mt-2">Expires in 4:52</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">FTO Login</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Ref: 000*</span>
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded font-medium">Auto-routed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features">
          <div className="max-w-6xl mx-auto px-6 py-20">
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Features</p>
            <h2 className="text-3xl font-bold text-gray-900 mb-12">Built for real offices.</h2>
            <div ref={s3.ref} className={`grid md:grid-cols-3 gap-6 transition-all duration-700 ${s3.isInView ? 'opacity-100' : 'opacity-0'}`}>
              {[
                { icon: Zap, title: 'Real-time relay', desc: 'OTPs appear on the dashboard the second they arrive on the staff phone.' },
                { icon: Lock, title: 'Sender authorization', desc: 'Staff choose exactly which government senders the app processes. Nothing else.' },
                { icon: Eye, title: 'Full audit trail', desc: 'Every OTP is logged — who received it, when it was used, and why.' },
                { icon: BarChart3, title: 'Smart routing', desc: 'Route OTPs by sender ID, service, staff member, or department.' },
                { icon: Clock, title: 'Offline queue', desc: 'If connectivity drops, OTPs are queued locally and synced when back online.' },
                { icon: Shield, title: 'Device management', desc: 'Admin can revoke any device remotely. Lost phone? No problem.' },
              ].map((f, i) => (
                <div key={f.title} className="group p-5 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all" style={{ transitionDelay: `${i * 60}ms` }}>
                  <f.icon className="w-5 h-5 text-gray-700 mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Roles */}
        <section className="border-t border-gray-100">
          <div className="max-w-6xl mx-auto px-6 py-20">
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Who uses it</p>
            <h2 className="text-3xl font-bold text-gray-900 mb-12">Three roles. One flow.</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Users, role: 'Administrator', desc: 'Adds staff, configures sender IDs, sets routing rules, reviews audit logs.', color: 'bg-purple-100 text-purple-700' },
                { icon: Smartphone, role: 'Staff (Field)', desc: 'Installs app, authorizes senders, keeps phone charged. OTPs are detected automatically.', color: 'bg-blue-100 text-blue-700' },
                { icon: Eye, role: 'Operator', desc: 'Sees OTPs in real time, copies codes into portals, logs usage notes.', color: 'bg-green-100 text-green-700' },
              ].map((r) => (
                <div key={r.role} className="p-5 rounded-xl border border-gray-200">
                  <div className={`w-10 h-10 rounded-lg ${r.color} flex items-center justify-center mb-3`}>
                    <r.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{r.role}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{r.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="bg-gray-50 border-t border-gray-100">
          <div className="max-w-3xl mx-auto px-6 py-20">
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">FAQ</p>
            <h2 className="text-3xl font-bold text-gray-900 mb-10">Questions & answers</h2>
            <div className="space-y-2">
              {faqs.map((faq, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors">
                    <span className="font-medium text-gray-900 pr-4 text-sm">{faq.q}</span>
                    <ChevronRight className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${openFaq === i ? 'rotate-90' : ''}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-gray-100">
          <div className="max-w-6xl mx-auto px-6 py-20 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Stop calling for OTPs.</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">Set up your office in 30 minutes. Free to try.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/login" className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors">
                Open Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/instructions" className="inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                Read the setup guide
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="OTP Relay" className="h-5 w-5 rounded" />
            <span className="text-sm text-gray-500">© 2026 OTP Relay</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link to="/login" className="hover:text-gray-600 transition-colors">Login</Link>
            <Link to="/instructions" className="hover:text-gray-600 transition-colors">Docs</Link>
            <a href={APK} download className="hover:text-gray-600 transition-colors">Download</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
