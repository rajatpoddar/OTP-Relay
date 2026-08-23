import { createContext, useContext, useEffect, useRef, useCallback, useState, ReactNode } from 'react'
import { useAuth } from './useAuth'

interface WebSocketMessage {
  type: string
  timestamp: string
  data: any
}

interface WebSocketContextType {
  isConnected: boolean
  lastMessage: WebSocketMessage | null
  sendMessage: (message: any) => void
}

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  lastMessage: null,
  sendMessage: () => {},
})

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<number | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)

  const connect = useCallback(() => {
    if (!user?.organization_id || wsRef.current?.readyState === WebSocket.OPEN) return

    const token = localStorage.getItem('access_token')
    if (!token) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws?token=${token}&organization_id=${user.organization_id}`

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
        console.log('[WS] Connected')
      }

      ws.onmessage = (event) => {
        try {
          const msg: WebSocketMessage = JSON.parse(event.data)
          setLastMessage(msg)

          switch (msg.type) {
            case 'new_otp':
              if (Notification.permission === 'granted') {
                new Notification('New OTP Received', {
                  body: `Service: ${msg.data.service_name || 'Unknown'}\nOTP: ${msg.data.otp_display || '••••••'}`,
                  icon: '/favicon.ico',
                })
              }
              break
          }
        } catch (e) {
          console.error('[WS] Parse error:', e)
        }
      }

      ws.onclose = () => {
        setIsConnected(false)
        console.log('[WS] Disconnected, reconnecting in 5s...')
        reconnectTimeoutRef.current = window.setTimeout(connect, 5000)
      }

      ws.onerror = (error) => {
        console.error('[WS] Error:', error)
      }
    } catch (error) {
      console.error('[WS] Connection failed:', error)
    }
  }, [user?.organization_id])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsConnected(false)
  }, [])

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    }
  }, [])

  // Auto-connect
  useEffect(() => {
    if (user?.organization_id) {
      connect()
    }
    return disconnect
  }, [user?.organization_id, connect, disconnect])

  // Keepalive ping every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      sendMessage({ type: 'ping' })
    }, 30000)
    return () => clearInterval(interval)
  }, [sendMessage])

  return (
    <WebSocketContext.Provider value={{ isConnected, lastMessage, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocket() {
  return useContext(WebSocketContext)
}
