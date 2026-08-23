import { Link } from 'react-router-dom'
import { Download, ArrowRight, Shield, Zap, Clock, CheckCircle, ChevronRight, Star, Users, Smartphone, BarChart3 } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

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

// Intersection Observer hook for scroll animations
function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, isInView }
}

const problems = [
  { icon: 'phone_in_talk', title: 'Repeated Calls', desc: 'Operators waste hours calling officers to dictate 6-digit codes over poor connections.', color: 'from-red-500 to-orange-500' },
  { icon: 'signal_cellular_connected_no_internet_0_bar', title: 'Field Connectivity', desc: 'Officers in rural areas struggle to share OTPs with operators when connectivity drops.', color: 'from-amber-500 to-yellow-500' },
  { icon: 'hourglass_empty', title: 'Operational Delays', desc: 'Critical portal entries stall while waiting for OTPs, impacting daily efficiency.', color: 'from-purple-500 to-pink-500' },
  { icon: 'policy', title: 'No Accountability', desc: 'Manual sharing leaves no reliable audit trail of who received, viewed, and used an OTP.', color: 'from-blue-500 to-cyan-500' },
]

const features = [
  { icon: Zap, title: 'Real-Time Routing', desc: 'OTPs appear on the operator dashboard the moment they arrive.', color: 'text-yellow-500', bg: 'bg-yellow-50' },
  { icon: Shield, title: 'Sender Authorization', desc: 'Staff explicitly choose which government senders to relay.', color: 'text-blue-500', bg: 'bg-blue-50' },
  { icon: BarChart3, title: 'Smart Routing Rules', desc: 'Route by sender ID, service, staff member, or department.', color: 'text-purple-500', bg: 'bg-purple-50' },
  { icon: Clock, title: 'Complete Audit Trail', desc: 'Every OTP is logged with timestamps, operator identity, and usage notes.', color: 'text-green-500', bg: 'bg-green-50' },
  { icon: Smartphone, title: 'Offline Queue', desc: 'OTPs sync when connectivity returns — nothing is lost.', color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { icon: Users, title: 'Multi-Role Access', desc: 'Admin, Operator, and Staff roles with granular permissions.', color: 'text-pink-500', bg: 'bg-pink-50' },
]

const pricing = [
  { name: 'Basic', price: '₹499', period: '/mo', features: ['Up to 2 Staff Devices', '3 Operators', 'Standard Routing'], highlight: false },
  { name: 'Standard', price: '₹999', period: '/mo', features: ['Up to 50 Staff', 'Up to 10 Operators', 'Smart Routing & Audit'], highlight: true, badge: 'MOST POPULAR' },
  { name: 'Professional', price: '₹1,999', period: '/mo', features: ['Designed for larger offices', 'Advanced Routing', 'Full Reporting Suite'], highlight: false },
  { name: 'Enterprise', price: 'Custom', period: '', features: ['Multi-office Deployment', 'State/District Hierarchy', 'Dedicated Support'], highlight: false },
]

const stats = [
  { value: '10x', label: 'Faster OTP Delivery' },
  { value: '100%', label: 'Audit Compliance' },
  { value: '24/7', label: 'Always Running' },
  { value: '0', label: 'Missed OTPs' },
]

const faqs = [
  { q: 'Does this bypass the portal\'s authentication?', a: 'No. OTP Relay simply acts as a secure delivery mechanism between the authorized staff member\'s phone and the operator.' },
  { q: 'What happens if the operator misuses an OTP?', a: 'Every OTP usage is logged with a mandatory usage note and tied to the specific operator\'s account, creating a complete audit trail.' },
  { q: 'Does the platform read personal messages?', a: 'No. The relay engine only processes messages from pre-approved authorized sender IDs. Personal messages are completely ignored.' },
  { q: 'What if the officer\'s phone has no internet?', a: 'The authorized Android app can securely queue the OTP event and synchronize when connectivity is restored.' },
  { q: 'Can we route different departments to different operators?', a: 'Yes. Administrators can configure routing rules to send OTPs from specific senders or services to designated operators.' },
]

export function LandingPage() {
  const APK_DOWNLOAD_URL = useApkUrl()
  const hero = useInView(0.2)
  const statsRef = useInView(0.3)
  const problemsRef = useInView(0.1)
  const featuresRef = useInView(0.1)
  const pricingRef = useInView(0.1)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-xl border-b border-gray-100 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:shadow-indigo-300 transition-shadow">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">OTP Relay</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {['Product', 'Features', 'Pricing', 'FAQ'].map((item) => (
              <a key={item} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" href={`#${item.toLowerCase()}`}>{item}</a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link className="text-sm font-medium text-gray-600 hover:text-indigo-600 hidden md:block transition-colors" to="/login">Login</Link>
            <a href={APK_DOWNLOAD_URL} download className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">App</span>
            </a>
            <Link to="/login" className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-indigo-200 transition-all hover:scale-105">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-16">
        {/* Hero Section */}
        <section ref={hero.ref} className="relative min-h-[90vh] flex items-center overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50"></div>
          <div className="absolute top-20 right-10 w-72 h-72 bg-purple-300/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl"></div>

          <div className="relative max-w-7xl mx-auto px-6 py-20">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left: Text */}
              <div className={`transition-all duration-1000 ${hero.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                  <Zap className="w-4 h-4" />
                  Trusted by Government Offices
                </div>
                <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
                  Stop Chasing
                  <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent"> OTPs</span>
                  <br />Over Phone Calls.
                </h1>
                <p className="text-xl text-gray-600 mb-8 max-w-lg leading-relaxed">
                  Automate OTP routing from officer phones to operator dashboards. Real-time, secure, fully audited.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/login" className="group bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-xl hover:shadow-indigo-200 transition-all hover:scale-105 flex items-center justify-center gap-2">
                    Deploy Now
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <a href={APK_DOWNLOAD_URL} download className="group bg-white border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold hover:border-indigo-300 hover:text-indigo-600 transition-all hover:scale-105 flex items-center justify-center gap-2">
                    <Download className="w-5 h-5" />
                    Download App
                  </a>
                </div>
              </div>

              {/* Right: Demo Card */}
              <div className={`relative transition-all duration-1000 delay-300 ${hero.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl opacity-20 blur-xl"></div>
                <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 hover:shadow-3xl transition-shadow">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">New OTP Received</p>
                        <p className="text-xs text-gray-500">BT-VBGRAM-G • Just now</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">LIVE</span>
                  </div>
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 text-center mb-4">
                    <p className="text-gray-400 text-sm mb-2 tracking-widest">OTP CODE</p>
                    <p className="text-5xl font-mono font-bold text-white tracking-[0.3em]">980847</p>
                    <p className="text-gray-500 text-sm mt-3">Expires in 4:52</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-lg">VBGRAMG</span>
                    <span className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-lg">FTO Login</span>
                    <span className="px-3 py-1.5 bg-indigo-100 text-indigo-700 text-xs rounded-lg font-medium">Ref: 000*</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <section ref={statsRef.ref} className="relative -mt-8 z-10">
          <div className="max-w-5xl mx-auto px-6">
            <div className={`bg-white rounded-2xl shadow-xl border border-gray-100 p-8 grid grid-cols-2 md:grid-cols-4 gap-8 transition-all duration-700 ${statsRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              {stats.map((stat, i) => (
                <div key={stat.label} className="text-center">
                  <p className="text-3xl font-extrabold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Problems */}
        <section ref={problemsRef.ref} id="product" className="py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className={`text-center max-w-2xl mx-auto mb-16 transition-all duration-700 ${problemsRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <span className="text-indigo-600 font-semibold text-sm tracking-wider uppercase">The Problem</span>
              <h2 className="text-4xl font-extrabold text-gray-900 mt-3 mb-4">Every OTP Requires a Phone Call.</h2>
              <p className="text-lg text-gray-600">Current field operations involve inefficient workarounds that compromise security and speed.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {problems.map((p, i) => (
                <div key={p.title} className={`group bg-white p-6 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50 transition-all duration-500 hover:-translate-y-2 ${problemsRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: `${i * 100}ms` }}>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <span className="material-symbols-outlined text-white text-xl">{p.icon}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">{p.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <span className="text-indigo-600 font-semibold text-sm tracking-wider uppercase">How It Works</span>
              <h2 className="text-4xl font-extrabold text-gray-900 mt-3">Four Simple Steps</h2>
            </div>
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { num: 1, title: 'Install', desc: 'Staff installs the app and authorizes sender IDs.', color: 'from-blue-500 to-cyan-500' },
                { num: 2, title: 'Receive', desc: 'App detects incoming OTP from government portals.', color: 'from-purple-500 to-pink-500' },
                { num: 3, title: 'Route', desc: 'OTP is securely routed to the designated operator.', color: 'from-orange-500 to-red-500' },
                { num: 4, title: 'Complete', desc: 'Operator enters OTP in portal and logs usage.', color: 'from-green-500 to-emerald-500' },
              ].map((step, i) => (
                <div key={step.num} className="relative text-center group">
                  {i < 3 && <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-gray-200 to-gray-300"></div>}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all`}>
                    {step.num}
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h4>
                  <p className="text-gray-600 text-sm">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section ref={featuresRef.ref} id="features" className="py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className={`text-center mb-16 transition-all duration-700 ${featuresRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <span className="text-indigo-600 font-semibold text-sm tracking-wider uppercase">Features</span>
              <h2 className="text-4xl font-extrabold text-gray-900 mt-3">Built for Enterprise</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f, i) => (
                <div key={f.title} className={`group bg-white p-6 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50 transition-all duration-500 hover:-translate-y-1 ${featuresRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: `${i * 80}ms` }}>
                  <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <f.icon className={`w-6 h-6 ${f.color}`} />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">{f.title}</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Product Preview */}
        <section id="product" className="py-24 bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 text-white relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl"></div>
          <div className="relative max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <span className="text-indigo-400 font-semibold text-sm tracking-wider uppercase">Live Dashboard</span>
              <h2 className="text-4xl font-extrabold mt-3 mb-4">Operator Experience</h2>
              <p className="text-lg text-gray-400">The code appears the moment it arrives. No refreshing. No waiting.</p>
            </div>
            <div className="max-w-lg mx-auto">
              <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-6 border border-gray-700/50 hover:border-indigo-500/30 transition-colors">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-gray-400 text-sm font-medium">LIVE OTP FEED</span>
                  <div className="flex items-center gap-2 text-green-400">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                    <span className="text-sm">Connected</span>
                  </div>
                </div>
                <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/30">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-gray-500 text-xs tracking-wider mb-1">DEPARTMENT</p>
                      <p className="font-semibold">VBGRAMG</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500 text-xs tracking-wider mb-1">STAFF</p>
                      <p className="font-semibold">Rajesh Kumar</p>
                    </div>
                  </div>
                  <div className="text-center py-6 bg-gray-800/50 rounded-xl border border-gray-700/30 mb-4">
                    <p className="text-6xl font-mono font-bold tracking-[0.3em] bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">980847</p>
                    <p className="text-gray-500 text-sm mt-2">Expires in 4:52</p>
                  </div>
                  <button className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-indigo-500/25">
                    Copy & Add Usage Note
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section ref={pricingRef.ref} id="pricing" className="py-24 bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className={`text-center mb-16 transition-all duration-700 ${pricingRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <span className="text-indigo-600 font-semibold text-sm tracking-wider uppercase">Pricing</span>
              <h2 className="text-4xl font-extrabold text-gray-900 mt-3">Transparent Plans</h2>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              {pricing.map((plan, i) => (
                <div key={plan.name} className={`group relative p-8 rounded-2xl flex flex-col transition-all duration-500 hover:-translate-y-2 ${
                  plan.highlight
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-2xl shadow-indigo-200 scale-105'
                    : 'bg-white border border-gray-200 hover:border-indigo-200 hover:shadow-xl'
                } ${pricingRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: `${i * 100}ms` }}>
                  {plan.badge && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-xs font-bold shadow-lg">{plan.badge}</div>}
                  <h3 className={`text-xl font-bold mb-2 ${plan.highlight ? '' : 'text-gray-900'}`}>{plan.name}</h3>
                  <div className={`text-4xl font-extrabold mb-6 ${plan.highlight ? '' : 'text-gray-900'}`}>
                    {plan.price}<span className={`text-lg font-normal ${plan.highlight ? 'text-indigo-200' : 'text-gray-500'}`}>{plan.period}</span>
                  </div>
                  <ul className={`space-y-3 mb-8 flex-1 ${plan.highlight ? 'text-indigo-100' : 'text-gray-600'}`}>
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <CheckCircle className={`w-4 h-4 ${plan.highlight ? 'text-green-300' : 'text-green-500'}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button className={`w-full py-3 rounded-xl font-semibold transition-all ${
                    plan.highlight
                      ? 'bg-white text-indigo-600 hover:bg-gray-100'
                      : 'bg-gray-100 text-gray-900 hover:bg-indigo-50 hover:text-indigo-600'
                  }`}>
                    Get Started
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-24">
          <div className="max-w-3xl mx-auto px-6">
            <div className="text-center mb-16">
              <span className="text-indigo-600 font-semibold text-sm tracking-wider uppercase">FAQ</span>
              <h2 className="text-4xl font-extrabold text-gray-900 mt-3">Got Questions?</h2>
            </div>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-indigo-200 transition-colors">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full px-6 py-4 flex items-center justify-between text-left">
                    <span className="font-semibold text-gray-900 pr-4">{faq.q}</span>
                    <ChevronRight className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${openFaq === i ? 'rotate-90' : ''}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-4 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-4">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 bg-gradient-to-br from-indigo-500 to-purple-600 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          <div className="relative max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-4xl lg:text-5xl font-extrabold mb-6">Ready to Automate OTPs?</h2>
            <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">Give your operators the OTPs they need — without the repeated phone calls.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login" className="group bg-white text-indigo-600 px-8 py-4 rounded-xl text-lg font-bold hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center gap-2">
                Get Started
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href={APK_DOWNLOAD_URL} download className="bg-white/10 border-2 border-white/30 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-white/20 transition-all hover:scale-105 flex items-center justify-center gap-2">
                <Download className="w-5 h-5" />
                Download App
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold">OTP Relay</span>
            </div>
            <p className="text-sm">Secure OTP operations for government offices.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a className="hover:text-white transition-colors" href="#features">Features</a></li>
              <li><a className="hover:text-white transition-colors" href="#pricing">Pricing</a></li>
              <li><a className="hover:text-white transition-colors" href="#faq">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><Link className="hover:text-white transition-colors" to="/instructions">Setup Guide</Link></li>
              <li><Link className="hover:text-white transition-colors" to="/instructions">Documentation</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Access</h4>
            <Link to="/login" className="block px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium text-center">Office Login</Link>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-8 pt-8 border-t border-gray-800 text-sm text-center">
          <p>© 2026 OTP Relay Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
