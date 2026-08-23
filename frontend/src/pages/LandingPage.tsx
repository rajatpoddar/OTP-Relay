import { Link } from 'react-router-dom'
import { Download } from 'lucide-react'

const APK_DOWNLOAD_URL = '/uploads/apk/otp-relay.apk'

const faqs = [
  {
    q: 'Does this bypass the portal\'s authentication?',
    a: 'No. OTP Relay simply acts as a secure delivery mechanism between the authorized staff member\'s phone and the operator. The staff member continues to receive the original SMS on their registered mobile number. OTP Relay does not replace or bypass the portal\'s authentication.',
  },
  {
    q: 'What happens if the operator misuses an OTP?',
    a: 'Every OTP usage is logged with a mandatory usage note and tied to the specific operator\'s account, creating a complete audit trail that administrators can review at any time.',
  },
  {
    q: 'Does the platform read personal messages?',
    a: 'No. The relay engine is configured to strictly process messages only from pre-approved authorized sender IDs. All other personal messages are completely ignored.',
  },
  {
    q: 'Can multiple operators share the same dashboard?',
    a: 'No, each operator requires their own individual login credentials to ensure accountability and accurate audit trails.',
  },
  {
    q: 'What if the officer\'s phone has no internet?',
    a: 'If internet connectivity is temporarily unavailable, the authorized Android app can securely queue the OTP event and synchronize it when connectivity is restored. SMS/mobile-network availability is separate from internet connectivity.',
  },
  {
    q: 'Can we route different departments to different operators?',
    a: 'Administrators can configure routing rules to send OTPs from specific senders or services to designated operators.',
  },
  {
    q: 'How long does implementation take?',
    a: 'Setup depends on the size and configuration of the office. Once staff devices are authorized and routing rules are configured, OTP Relay can begin routing matching OTPs.',
  },
  {
    q: 'What happens if a staff device is lost?',
    a: 'Administrators can revoke a device from the central dashboard, preventing further OTP submissions once the device synchronizes.',
  },
]

const problems = [
  { icon: 'phone_in_talk', title: 'Repeated Calls', desc: 'Operators waste hours calling officers to dictate 6-digit codes over poor connections.' },
  { icon: 'signal_cellular_connected_no_internet_0_bar', title: 'Field Connectivity', desc: 'Officers working in rural and field areas may have difficulty sharing OTPs with operators when connectivity is poor.' },
  { icon: 'hourglass_empty', title: 'Operational Delays', desc: 'Critical portal entries stall while waiting for OTPs, impacting daily operational efficiency.' },
  { icon: 'policy', title: 'No Accountability', desc: 'Manual sharing leaves no reliable audit trail of who received, viewed, and used an OTP.' },
]

const features = [
  { title: 'Real-Time OTP Routing', desc: 'Matching OTPs are routed to the designated operator dashboard in real time.' },
  { title: 'Sender-Specific Authorization', desc: 'Control exactly which sender IDs are processed.' },
  { title: 'Smart Routing Rules', desc: 'Route OTPs to designated operators based on sender ID, service, staff member, or configured office routing rules.' },
  { title: 'Complete Audit Trail', desc: 'Log every OTP received, routed, viewed, and used.' },
  { title: 'Operator Usage Notes', desc: 'Require operators to document why an OTP was used.' },
  { title: 'Offline Queue', desc: 'Store and forward when connectivity is restored.' },
  { title: 'Device Management', desc: 'Centralized control over registered staff devices.' },
  { title: 'Office Reports', desc: 'Generate detailed operational efficiency metrics.' },
]

const pricing = [
  { name: 'Basic', price: '₹499', period: '/mo', features: ['Up to 2 Staff Devices', '3 Operators', 'Standard Routing'], highlight: false },
  { name: 'Standard', price: '₹999', period: '/mo', features: ['Up to 50 Staff', 'Up to 10 Operators', 'Smart Routing & Audit'], highlight: true, badge: 'MOST POPULAR' },
  { name: 'Professional', price: '₹1,999', period: '/mo', features: ['Designed for larger offices', 'Advanced Routing', 'Full Reporting Suite'], highlight: false },
  { name: 'Enterprise', price: 'Custom', period: '', features: ['Multi-office Deployment', 'State/District Hierarchy', 'Dedicated Support'], highlight: false },
]

export function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 w-full bg-surface/90 backdrop-blur-md border-b border-outline-variant z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
            <span className="font-headline-sm text-primary font-bold tracking-tight">OTP Relay</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a className="text-body-md text-on-surface hover:text-primary transition-colors" href="#product">Product</a>
            <a className="text-body-md text-on-surface hover:text-primary transition-colors" href="#how-it-works">How It Works</a>
            <a className="text-body-md text-on-surface hover:text-primary transition-colors" href="#features">Features</a>
            <a className="text-body-md text-on-surface hover:text-primary transition-colors" href="#security">Security</a>
            <a className="text-body-md text-on-surface hover:text-primary transition-colors" href="#pricing">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link className="text-body-md font-medium text-on-surface hover:text-primary hidden md:block" to="/login">Login</Link>
            <a href={APK_DOWNLOAD_URL} download className="flex items-center gap-1.5 bg-tertiary-fixed-dim/10 text-tertiary-fixed-dim border border-tertiary-fixed-dim/30 px-3 py-2 rounded-lg text-label-sm font-label-sm hover:bg-tertiary-fixed-dim/20 transition-colors">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download App</span>
            </a>
            <Link className="bg-primary text-on-primary px-4 py-2 rounded-lg text-body-md font-medium hover:bg-primary/90 transition-colors" to="/login">Get Started</Link>
          </div>
        </div>
      </header>

      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative pt-12 sm:pt-24 pb-16 sm:pb-32 overflow-hidden bg-surface-container-lowest">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
            {/* Mobile: stacked layout, Desktop: side by side */}
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              <div className="text-center lg:text-left">
                <h1 className="text-3xl sm:text-4xl lg:text-display-lg font-display-lg text-on-background mb-3 sm:mb-6 leading-tight">Stop Calling Officers for OTPs.</h1>
                <p className="text-base sm:text-body-lg text-on-surface-variant mb-6 sm:mb-8 max-w-xl mx-auto lg:mx-0">Automate OTP routing, reduce operational delays, and maintain a complete audit trail of OTP handling.</p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                  <Link to="/login" className="bg-primary text-on-primary px-5 sm:px-6 py-3 rounded-lg text-body-lg font-medium text-center hover:bg-primary/90 transition-colors">Deploy OTP Relay</Link>
                  <a href={APK_DOWNLOAD_URL} download className="flex items-center justify-center gap-2 bg-tertiary-fixed-dim/10 text-tertiary-fixed-dim border border-tertiary-fixed-dim/30 px-5 sm:px-6 py-3 rounded-lg text-body-lg font-medium hover:bg-tertiary-fixed-dim/20 transition-colors">
                    <Download className="w-5 h-5" />
                    Download App
                  </a>
                </div>
              </div>
              <div className="relative hidden lg:block">
                <div className="absolute inset-0 bg-gradient-to-tr from-surface-container-highest to-surface rounded-xl transform rotate-3 scale-105"></div>
                <div className="relative bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-on-surface-variant">account_balance</span>
                      <span className="font-label-sm text-on-surface-variant">Department</span>
                    </div>
                    <span className="material-symbols-outlined text-primary">arrow_forward</span>
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-on-surface-variant">smartphone</span>
                      <span className="font-label-sm text-on-surface-variant">Staff Mobile</span>
                    </div>
                    <span className="material-symbols-outlined text-primary">arrow_forward</span>
                    <div className="flex items-center gap-3 bg-surface-container py-2 px-4 rounded-full">
                      <span className="material-symbols-outlined text-primary text-sm">lock</span>
                      <span className="font-label-sm text-primary">Authorized Relay</span>
                    </div>
                  </div>
                  <div className="bg-surface-container-low rounded-lg p-4 border border-outline-variant">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-label-sm text-on-surface-variant">Sender: BT-VBGRAM-G</span>
                      <span className="font-mono-data text-primary">02:14 PM</span>
                    </div>
                    <p className="font-body-md text-on-background mb-3">Service: VBGRAMG<br />Purpose: FTO Login<br />Reference: 000*<br />OTP: 980847</p>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-surface-container text-on-surface text-xs rounded truncate">Jharkhand → Deoghar → Palojori → Palojori Block Office</span>
                      <span className="px-2 py-1 bg-surface-container-highest text-on-surface text-xs rounded">Auto-Routed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section className="py-24 bg-surface" id="problem">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="font-display-md text-on-background mb-4">Every OTP Shouldn't Require a Phone Call.</h2>
              <p className="font-body-lg text-on-surface-variant">The current reality of field operations involves inefficient workarounds that compromise security and speed.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {problems.map((p) => (
                <div key={p.title} className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant">
                  <span className="material-symbols-outlined text-error mb-4 text-3xl">{p.icon}</span>
                  <h3 className="font-headline-sm text-on-background mb-2">{p.title}</h3>
                  <p className="font-body-md text-on-surface-variant">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Solution Flow */}
        <section className="py-24 bg-surface-container-lowest" id="solution">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="font-display-md text-on-background mb-4">One Secure Relay Between Staff and Operators.</h2>
              <p className="font-body-lg text-on-surface-variant">Automate OTP routing, reduce operational delays, and maintain a complete audit trail of OTP handling.</p>
            </div>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 overflow-x-auto pb-8">
              {[
                { icon: 'account_balance', label: 'Department' },
                { icon: 'smartphone', label: 'Staff Mobile' },
                { icon: 'lock', label: 'Authorized Relay', blue: true },
                { icon: 'route', label: 'Routing' },
                { icon: 'person', label: 'Operator' },
                { icon: 'public', label: 'Web Portal' },
              ].map((step, i) => (
                <div key={step.label} className="flex items-center gap-4">
                  {i > 0 && <span className="hidden md:block material-symbols-outlined text-outline-variant">arrow_forward</span>}
                  <div className="text-center min-w-[120px]">
                    <div className={`w-16 h-16 ${step.blue ? 'bg-blue/10 border-blue/20' : 'bg-surface-container border-outline-variant'} rounded-full flex items-center justify-center mx-auto mb-4 border`}>
                      <span className={`material-symbols-outlined text-2xl ${step.blue ? 'text-blue' : 'text-primary'}`}>{step.icon}</span>
                    </div>
                    <h4 className={`font-headline-sm ${step.blue ? 'text-blue' : 'text-primary'} mb-2 text-sm`}>{step.label}</h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 bg-surface" id="how-it-works">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="font-display-md text-primary mb-4">How It Works</h2>
            </div>
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { num: 1, title: 'Authorize', desc: 'Staff grants explicit consent for specific authorized sender IDs.' },
                { num: 2, title: 'Receive', desc: 'The authorized app detects matching incoming SMS messages.' },
                { num: 3, title: 'Route', desc: 'OTP Relay securely routes the authorized OTP to the designated operator dashboard.' },
                { num: 4, title: 'Complete', desc: 'Operator views OTP, enters it in portal, and logs usage note.' },
              ].map((step, i) => (
                <div key={step.num} className="relative">
                  <div className="w-12 h-12 bg-secondary text-white rounded-full flex items-center justify-center font-bold text-xl mb-4 relative z-10">{step.num}</div>
                  {i < 3 && <div className="hidden md:block absolute top-6 left-12 w-full h-0.5 bg-outline-variant/30 -z-0"></div>}
                  <h4 className="font-headline-sm text-primary mb-2">{step.title}</h4>
                  <p className="font-body-md text-on-surface-variant">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 bg-surface-container-lowest" id="features">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="font-display-md text-primary mb-4">Built for Enterprise Operations</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((f) => (
                <div key={f.title} className="p-6 border border-outline-variant rounded-xl">
                  <h4 className="font-headline-sm text-primary mb-2">{f.title}</h4>
                  <p className="font-body-md text-on-surface-variant">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="py-24 bg-surface" id="security">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="font-display-md text-primary mb-4">Secure Access Controls</h2>
              <p className="font-body-lg text-on-surface-variant">Role-based access ensures staff, operators and administrators only see the information they are authorized to access.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { icon: 'shield', title: 'Staff', desc: 'Only authorize specific sender IDs. Personal SMS never leaves the device.' },
                { icon: 'admin_panel_settings', title: 'Office Admin', desc: 'Configure routing rules, manage devices, and review complete audit logs.' },
                { icon: 'badge', title: 'Operator', desc: 'View routed OTPs in real-time, copy codes, and log mandatory usage notes.' },
              ].map((role) => (
                <div key={role.title} className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant text-center">
                  <span className="material-symbols-outlined text-secondary text-3xl mb-4">{role.icon}</span>
                  <h4 className="font-headline-sm text-primary mb-2">{role.title}</h4>
                  <p className="font-body-md text-on-surface-variant">{role.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Product Preview */}
        <section className="py-24 bg-primary text-white" id="product">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="font-display-md mb-4">Operator Experience</h2>
              <p className="font-body-lg text-slate-300">No more refreshing or waiting. The code appears the moment it arrives.</p>
            </div>
            <div className="max-w-md mx-auto bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl">
              <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-4">
                <span className="text-slate-400 font-label-sm">LIVE OTP FEED</span>
                <div className="flex items-center gap-2 text-green-400">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                  <span className="font-label-sm">Connected</span>
                </div>
              </div>
              <div className="bg-slate-900 rounded-lg p-5 border border-slate-700">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="font-label-sm text-slate-400 mb-1">DEPARTMENT</div>
                    <div className="font-body-md font-medium">VBGRAMG</div>
                  </div>
                  <div className="text-right">
                    <div className="font-label-sm text-slate-400 mb-1">STAFF</div>
                    <div className="font-body-md font-medium">Rajesh Kumar</div>
                  </div>
                </div>
                <div className="text-center mb-6 py-4 bg-slate-800 rounded border border-slate-700">
                  <div className="font-mono text-5xl tracking-widest text-secondary font-bold" style={{ fontFamily: 'Inter, monospace' }}>980847</div>
                  <div className="font-label-sm text-slate-400 mt-2">Expires in ~4:52</div>
                </div>
                <button className="w-full py-3 bg-secondary hover:bg-secondary/90 text-white rounded-lg font-medium transition-colors">
                  Copy & Add Usage Note
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-24 bg-surface-container-lowest" id="pricing">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="font-display-md text-primary mb-4">Transparent Pricing</h2>
              <p className="font-body-lg text-on-surface-variant">Automate OTP routing, reduce operational delays, and maintain a complete audit trail of OTP handling.</p>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              {pricing.map((plan) => (
                <div key={plan.name} className={`p-8 rounded-xl flex flex-col ${plan.highlight ? 'bg-primary text-white shadow-lg relative transform md:-translate-y-4' : 'bg-surface border border-outline-variant'}`}>
                  {plan.badge && <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-secondary text-white px-3 py-1 rounded-full text-xs font-bold">{plan.badge}</div>}
                  <h3 className={`font-headline-sm mb-2 ${plan.highlight ? 'text-white' : 'text-primary'}`}>{plan.name}</h3>
                  <div className={`text-3xl font-bold mb-6 ${plan.highlight ? 'text-white' : 'text-primary'}`}>{plan.price}<span className={`text-lg font-normal ${plan.highlight ? 'text-slate-400' : 'text-on-surface-variant'}`}>{plan.period}</span></div>
                  <ul className={`space-y-3 mb-8 flex-1 ${plan.highlight ? 'text-slate-300' : 'text-on-surface-variant'} font-body-md`}>
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <span className={`material-symbols-outlined text-sm ${plan.highlight ? 'text-secondary' : 'text-green-600'}`}>check</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button className={`w-full py-2 rounded transition-colors ${plan.highlight ? 'bg-secondary hover:bg-secondary/90 text-white' : 'border border-outline text-primary hover:bg-surface-container'}`}>
                    Get Started
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-24 bg-surface" id="faq">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="font-display-md text-primary mb-4">Frequently Asked Questions</h2>
            </div>
            <div className="space-y-6">
              {faqs.map((faq) => (
                <div key={faq.q} className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant">
                  <h4 className="font-headline-sm text-primary mb-2">{faq.q}</h4>
                  <p className="font-body-md text-on-surface-variant">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 bg-secondary text-white text-center">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="font-display-lg mb-6">Spend Less Time Chasing OTPs.</h2>
            <p className="font-body-lg text-secondary/80 mb-8 max-w-2xl mx-auto">Give your operators the OTPs they need — without the repeated phone calls.</p>
            <Link to="/login" className="inline-block px-8 py-4 bg-white text-secondary font-bold rounded-lg hover:bg-slate-100 transition-colors shadow-lg">Get Started Today</Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-primary text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
              <span className="font-headline-sm text-white font-bold tracking-tight">OTP Relay</span>
            </div>
            <p className="text-sm">Secure OTP operations and routing for enterprise offices.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a className="hover:text-white transition-colors" href="#features">Features</a></li>
              <li><a className="hover:text-white transition-colors" href="#security">Security</a></li>
              <li><a className="hover:text-white transition-colors" href="#pricing">Pricing</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><Link className="hover:text-white transition-colors" to="/instructions">Documentation</Link></li>
              <li><Link className="hover:text-white transition-colors" to="/instructions">Setup Guide</Link></li>
              <li><a className="hover:text-white transition-colors" href="#faq">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Access</h4>
            <div className="space-y-2">
              <Link to="/login" className="block px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded hover:bg-slate-700 transition-colors w-full text-sm font-medium text-center">Office Login</Link>
              <a href={APK_DOWNLOAD_URL} download className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded hover:bg-slate-700 transition-colors w-full text-sm font-medium">
                <Download className="w-4 h-4" />
                Download App
              </a>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-slate-800 text-sm text-center">
          <p>© 2026 OTP Relay Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
