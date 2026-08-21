import { useState, useEffect } from 'react'
import { Bell, User, X, CheckCircle, AlertTriangle, Info, Menu } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

interface Notification {
  id: string
  type: 'success' | 'warning' | 'info'
  title: string
  message: string
  time: string
  read: boolean
}

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuth()
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'success',
      title: 'OTP Relayed',
      message: 'OTP from BT-VBGRAM-G successfully routed to Amit Kumar',
      time: '2 min ago',
      read: false,
    },
    {
      id: '2',
      type: 'info',
      title: 'System Update',
      message: 'New routing rules have been applied',
      time: '1 hour ago',
      read: false,
    },
    {
      id: '3',
      type: 'warning',
      title: 'Subscription Expiring',
      message: 'Your subscription expires in 5 days',
      time: '2 hours ago',
      read: true,
    },
  ])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.notification-container')) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header className="flex justify-between items-center w-full h-14 md:h-16 px-4 md:px-6 bg-surface border-b border-outline-variant z-10 shrink-0">
      <div className="flex items-center gap-3 md:gap-4">
        {/* Hamburger menu - mobile only */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Status badge - hidden on small mobile */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-surface-container-low rounded-full border border-outline-variant">
          <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim animate-pulse"></span>
          <span className="text-label-sm font-label-sm text-primary">System Online</span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Notification Bell */}
        <div className="relative notification-container">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-error rounded-full text-[10px] font-bold text-on-error flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-72 md:w-80 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="p-3 border-b border-outline-variant flex justify-between items-center bg-surface-bright">
                <h3 className="text-headline-sm font-headline-sm text-primary">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-label-sm font-label-sm text-secondary hover:underline">
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-on-surface-variant">No notifications</div>
                ) : (
                  notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`p-3 border-b border-outline-variant/50 hover:bg-surface-container transition-colors ${!notification.read ? 'bg-surface-container-low' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 ${
                          notification.type === 'success' ? 'text-tertiary-fixed-dim' :
                          notification.type === 'warning' ? 'text-yellow-500' : 'text-secondary'
                        }`}>
                          {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> :
                           notification.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                           <Info className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-body-md font-body-md text-primary font-semibold truncate">{notification.title}</p>
                            {!notification.read && <span className="w-2 h-2 rounded-full bg-secondary shrink-0"></span>}
                          </div>
                          <p className="text-label-sm font-label-sm text-on-surface-variant mt-0.5">{notification.message}</p>
                          <p className="text-[10px] text-on-surface-variant mt-1">{notification.time}</p>
                        </div>
                        <button onClick={() => clearNotification(notification.id)} className="text-on-surface-variant hover:text-primary shrink-0">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-2 border-t border-outline-variant text-center">
                  <button className="text-label-sm font-label-sm text-secondary hover:underline">View all notifications</button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-outline-variant hidden sm:block"></div>

        {/* Profile - responsive */}
        <div className="flex items-center gap-2 md:gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-label-sm font-label-sm text-primary font-bold">{user?.full_name}</p>
            <p className="text-[10px] text-on-surface-variant">{user?.role?.replace('_', ' ')}</p>
          </div>
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container border border-outline-variant">
            <User className="w-4 h-4 md:w-5 md:h-5" />
          </div>
        </div>
      </div>
    </header>
  )
}
