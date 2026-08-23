import { Link } from 'react-router-dom'
import { Download, ArrowRight, Shield, Clock, Users, CheckCircle, ChevronRight, Smartphone, BarChart3, Zap, Lock, Eye, ArrowUpRight } from 'lucide-react'
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
  { q: 'Does this read personal messages?', a: 'No. The app only processes SMS from senders your office explicitly authorizes. Personal messages from family, banks, and others are never accessed.' },
  { q: 'What happens offline?', a: 'The app queues OTPs locally and syncs when connectivity returns. SMS reception works on mobile network — internet is only needed to relay to the operator dashboard.' },
  { q: 'Is this secure?', a: 'Yes. Every OTP is encrypted in transit, every access is logged, and operators must provide a usage note for each code. Full audit trail available to administrators.' },
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
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-indigo-50/20"></div>
          <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-indigo-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>

          <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-green-100">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  Trusted by field teams across India
                </div>
                <h1 className="text-4xl md:text-[2.75rem] font-bold text-gray-900 leading-[1.15] mb-5">
                  Your team is in the field.<br />
                  <span className="text-indigo-600">The OTP is stuck</span> on their phone.
                </h1>
                <p className="text-lg text-gray-500 mb-8 leading-relaxed max-w-md">
                  OTP Relay detects incoming codes and sends them straight to your office dashboard. No phone calls. No waiting. Just the code, when you need it.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 mb-8">
                  <Link to="/login" className="group inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-3.5 rounded-lg font-medium hover:bg-gray-800 transition-all hover:shadow-lg">
                    Open Dashboard <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <a href={APK} download className="inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3.5 rounded-lg font-medium hover:bg-white hover:border-gray-400 hover:shadow-sm transition-all">
                    <Download className="w-4 h-4" /> Get the Android App
                  </a>
                </div>
                <div className="flex items-center gap-6 text-xs text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> Encrypted end-to-end
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" /> Full audit trail
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> 30-min setup
                  </div>
                </div>
              </div>

              {/* Preview Card */}
              <div className="hidden lg:block relative">
                <div className="absolute -inset-4 bg-indigo-100/40 rounded-2xl blur-xl"></div>
                <div className="relative bg-white rounded-2xl border border-gray-200 shadow-xl p-5">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <img src="/logo.png" alt="" className="w-4 h-4 rounded" />
                      </div>
                      <span className="text-xs font-semibold text-gray-700">Live Dashboard</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-green-600">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                      <span className="text-xs font-medium">Connected</span>
                    </div>
                  </div>

                  <div className="bg-gray-900 rounded-xl p-5 mb-3">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Sender</p>
                        <p className="text-sm font-semibold text-white">BT-VBGRAM-G</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Service</p>
                        <p className="text-sm font-semibold text-white">VBGRAMG</p>
                      </div>
                    </div>
                    <div className="text-center py-4">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">OTP Code</p>
                      <p className="text-4xl font-mono font-bold text-white tracking-[0.25em]">980847</p>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                      <span>Ref: 000*</span>
                      <span>Expires in 4:52</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button className="py-2.5 bg-gray-900 text-white text-xs font-medium rounded-lg">Copy OTP</button>
                    <button className="py-2.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg">Mark Used</button>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                    <span>Auto-routed from field device</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Logos / Trust bar */}
        <section className="border-y border-gray-100 bg-gray-50/50">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 text-xs text-gray-400 font-medium uppercase tracking-wider">
              <span className="flex items-center gap-2"><Shield className="w-4 h-4" /> ISO 27001 Ready</span>
              <span className="flex items-center gap-2"><Lock className="w-4 h-4" /> AES-256 Encryption</span>
              <span className="flex items-center gap-2"><Eye className="w-4 h-4" /> Real-time Monitoring</span>
              <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> 99.9% Uptime</span>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how">
          <div className="max-w-6xl mx-auto px-6 py-20">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-3">How it works</p>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Four steps. That's it.</h2>
            <p className="text-gray-500 mb-12 max-w-lg">From install to first OTP routed in under 30 minutes.</p>
            <div ref={s1.ref} className={`grid md:grid-cols-4 gap-8 transition-all duration-700 ${s1.isInView ? 'opacity-100' : 'opacity-0'}`}>
              {[
                { n: '01', title: 'Install', desc: 'Staff installs the Android app and logs in with OTP verification.', color: 'text-indigo-600' },
                { n: '02', title: 'Authorize', desc: 'Staff selects which senders the app should process. Nothing else.', color: 'text-purple-600' },
                { n: '03', title: 'Detect', desc: 'When a portal sends an OTP, the app reads it automatically via SMS.', color: 'text-pink-600' },
                { n: '04', title: 'Deliver', desc: 'Code appears on the operator dashboard in real time. Done.', color: 'text-green-600' },
              ].map((s, i) => (
                <div key={s.n} className="relative group" style={{ transitionDelay: `${i * 100}ms` }}>
                  <span className={`text-5xl font-bold ${s.color} opacity-20 group-hover:opacity-40 transition-opacity`}>{s.n}</span>
                  <h3 className="text-lg font-semibold text-gray-900 mt-2 mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Problem */}
        <section className="bg-gray-900 text-white">
          <div className="max-w-6xl mx-auto px-6 py-20">
            <div className="grid md:grid-cols-2 gap-16">
              <div>
                <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3">The problem</p>
                <h2 className="text-3xl font-bold mb-6">OTP sharing is broken.</h2>
                <p className="text-gray-400 leading-relaxed mb-8">
                  Every portal login needs a code. Your team is in the field with poor connectivity. The office is waiting. What follows is hours of phone calls, missed deadlines, and no record of who shared what.
                </p>
                <div className="space-y-4">
                  {[
                    'Operators call field staff 5-10 times daily just for OTPs',
                    'No record of who shared what and when',
                    'Critical entries stall while waiting for a 6-digit code',
                    'Staff in remote areas can\'t always take calls',
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center mt-0.5 shrink-0">
                        <span className="text-red-400 text-xs font-bold">✕</span>
                      </div>
                      <span className="text-sm text-gray-300">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div ref={s2.ref} className={`transition-all duration-700 delay-200 ${s2.isInView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-700">
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">New OTP received</p>
                      <p className="text-xs text-gray-500">BT-VBGRAM-G • VBGRAMG • Just now</p>
                    </div>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-6 text-center mb-4">
                    <p className="text-xs text-gray-500 tracking-widest mb-2">OTP</p>
                    <p className="text-4xl font-mono font-bold text-white tracking-[0.2em]">980847</p>
                    <p className="text-xs text-gray-500 mt-2">Expires in 4:52</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">FTO Login</span>
                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">Ref: 000*</span>
                    <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded font-medium">Auto-routed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features">
          <div className="max-w-6xl mx-auto px-6 py-20">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-3">Features</p>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Built for how you actually work.</h2>
            <p className="text-gray-500 mb-12 max-w-lg">Everything you need. Nothing you don't.</p>
            <div ref={s3.ref} className={`grid md:grid-cols-3 gap-6 transition-all duration-700 ${s3.isInView ? 'opacity-100' : 'opacity-0'}`}>
              {[
                { icon: Zap, title: 'Instant relay', desc: 'Code appears on the dashboard the second it arrives on the phone.', color: 'text-amber-500', bg: 'bg-amber-50' },
                { icon: Lock, title: 'Sender authorization', desc: 'Staff choose exactly which senders the app processes. Nothing else.', color: 'text-indigo-500', bg: 'bg-indigo-50' },
                { icon: Eye, title: 'Full audit trail', desc: 'Who received it, when it was used, and why. Every single time.', color: 'text-green-500', bg: 'bg-green-50' },
                { icon: BarChart3, title: 'Smart routing', desc: 'Route by sender, service, staff member, or department. Your rules.', color: 'text-purple-500', bg: 'bg-purple-50' },
                { icon: Clock, title: 'Offline queue', desc: 'No signal? Codes queue locally and sync when back online.', color: 'text-blue-500', bg: 'bg-blue-50' },
                { icon: Shield, title: 'Remote device control', desc: 'Lost phone? Revoke it instantly from the dashboard.', color: 'text-red-500', bg: 'bg-red-50' },
              ].map((f, i) => (
                <div key={f.title} className="group p-5 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all cursor-default" style={{ transitionDelay: `${i * 50}ms` }}>
                  <div className={`w-9 h-9 rounded-lg ${f.bg} flex items-center justify-center mb-3`}>
                    <f.icon className={`w-4 h-4 ${f.color}`} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Roles */}
        <section className="border-t border-gray-100 bg-gray-50/50">
          <div className="max-w-6xl mx-auto px-6 py-20">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-3">Who uses it</p>
            <h2 className="text-3xl font-bold text-gray-900 mb-12">Three roles. One flow.</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Users, role: 'Administrator', items: ['Add staff & operators', 'Configure sender IDs', 'Set routing rules', 'Review audit logs'] },
                { icon: Smartphone, role: 'Field Staff', items: ['Install the app', 'Authorize senders', 'Keep phone charged', 'Thats it - OTPs auto-detect'] },
                { icon: Eye, role: 'Operator', items: ['See OTPs in real time', 'Copy codes into portals', 'Log usage notes', 'Done in seconds'] },
              ].map((r) => (
                <div key={r.role} className="bg-white p-5 rounded-xl border border-gray-200">
                  <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center mb-3">
                    <r.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-3">{r.role}</h3>
                  <ul className="space-y-2">
                    {r.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-500">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq">
          <div className="max-w-3xl mx-auto px-6 py-20">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-3">FAQ</p>
            <h2 className="text-3xl font-bold text-gray-900 mb-10">Questions & answers</h2>
            <div className="space-y-2">
              {faqs.map((faq, i) => (
                <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
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
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Stop calling for OTPs.</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">Set up your team in 30 minutes. Free to try.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/login" className="group inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-3.5 rounded-lg font-medium hover:bg-gray-800 transition-all hover:shadow-lg">
                Open Dashboard <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link to="/instructions" className="inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3.5 rounded-lg font-medium hover:bg-gray-50 hover:border-gray-400 transition-all">
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
