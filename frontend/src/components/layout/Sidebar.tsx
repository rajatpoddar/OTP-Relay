import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  LayoutDashboard, Users, Radio, Smartphone,
  History, Settings, LogOut, Building2, UserCheck, Key, GitBranch,
  Mail, BarChart3, CreditCard, Package, BadgeCheck, X,
} from 'lucide-react'
import clsx from 'clsx'

const superAdminLinks = [
  { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/app/organizations', icon: Building2, label: 'Organizations' },
  { to: '/app/plans', icon: CreditCard, label: 'Plans' },
  { to: '/app/subscriptions', icon: BadgeCheck, label: 'Subscriptions' },
  { to: '/app/app-versions', icon: Package, label: 'App Versions' },
  { to: '/app/audit', icon: History, label: 'Audit Logs' },
  { to: '/app/settings', icon: Settings, label: 'Settings' },
]

const officeAdminLinks = [
  { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/app/staff', icon: Users, label: 'Staff' },
  { to: '/app/operators', icon: UserCheck, label: 'Operators' },
  { to: '/app/sender-ids', icon: Mail, label: 'Sender IDs' },
  { to: '/app/routing', icon: GitBranch, label: 'Routing Rules' },
  { to: '/app/devices', icon: Smartphone, label: 'Devices' },
  { to: '/app/otp-activity', icon: Radio, label: 'OTP Activity' },
  { to: '/app/reports', icon: BarChart3, label: 'Reports' },
  { to: '/app/audit', icon: History, label: 'Audit Logs' },
  { to: '/app/subscription', icon: CreditCard, label: 'Subscription' },
  { to: '/app/settings', icon: Settings, label: 'Settings' },
]

const operatorLinks = [
  { to: '/app/live-otps', icon: Radio, label: 'Live OTPs' },
  { to: '/app/my-activity', icon: History, label: 'My Activity' },
  { to: '/app/settings', icon: Settings, label: 'Profile' },
]

const staffLinks = [
  { to: '/app/staff-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/app/authorizations', icon: Key, label: 'Authorizations' },
  { to: '/app/device-status', icon: Smartphone, label: 'Device Status' },
  { to: '/app/settings', icon: Settings, label: 'Settings' },
]

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const { user, logout } = useAuth()

  const links = user?.role === 'SUPER_ADMIN'
    ? superAdminLinks
    : user?.role === 'OFFICE_ADMIN'
    ? officeAdminLinks
    : user?.role === 'OPERATOR'
    ? operatorLinks
    : staffLinks

  const categoryLabel = user?.role === 'SUPER_ADMIN'
    ? 'PLATFORM ADMINISTRATION'
    : user?.role === 'OFFICE_ADMIN'
    ? 'OFFICE MANAGEMENT'
    : user?.role === 'OPERATOR'
    ? 'OPERATOR'
    : 'STAFF'

  const handleNavClick = () => {
    // Close sidebar on mobile after navigation
    onClose?.()
  }

  return (
    <aside className="w-[240px] h-full bg-surface-container-lowest border-r border-outline-variant flex flex-col py-6 px-4">
      {/* Brand */}
      <div className="flex items-center justify-between px-2 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div>
            <h1 className="text-headline-sm font-headline-sm font-bold text-primary">OTP Relay</h1>
            <p className="text-label-sm font-label-sm text-on-surface-variant">Enterprise Platform</p>
          </div>
        </div>
        {/* Close button - mobile only */}
        <button
          onClick={onClose}
          className="lg:hidden p-1 text-on-surface-variant hover:text-primary rounded"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Category */}
      <p className="px-3 text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-2">
        {categoryLabel}
      </p>

      {/* Nav Links */}
      <nav className="flex-1 flex flex-col gap-1 overflow-y-auto pr-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={handleNavClick}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 text-label-sm font-label-sm',
                isActive
                  ? 'text-primary border-l-4 border-primary bg-surface-container-low font-bold scale-[0.98]'
                  : 'text-on-surface-variant hover:bg-surface-container border-l-4 border-transparent'
              )
            }
          >
            <link.icon className="w-5 h-5" />
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-outline-variant space-y-1">
        <button
          onClick={() => { logout(); handleNavClick() }}
          className="flex items-center gap-3 px-3 py-2 w-full text-on-surface-variant hover:bg-surface-container rounded-lg border-l-4 border-transparent text-label-sm font-label-sm transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  )
}
