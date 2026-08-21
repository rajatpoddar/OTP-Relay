import { useEffect, useRef, useCallback, useState } from 'react'
import { useAuth } from './useAuth'

interface WebSocketMessage {
  type: string
  timestamp: string
  data: any
}

interface UseWebSocketOptions {
  onNewOtp?: (data: any) => void
  onOtpUpdate?: (data: any) => void
  onStatusChange?: (status: string) => void
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { user } = useAuth()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<number | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)

  const connect = useCallback(() => {
    if (!user?.organization_id || wsRef.current?.readyState === WebSocket.OPEN) return

    const token = localStorage.getItem('access_token')
    if (!token) return

    const wsUrl = `ws://localhost:8000/ws?token=${token}&organization_id=${user.organization_id}`

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
        options.onStatusChange?.('connected')
        console.log('[WS] Connected')
      }

      ws.onmessage = (event) => {
        try {
          const msg: WebSocketMessage = JSON.parse(event.data)
          setLastMessage(msg)

          switch (msg.type) {
            case 'new_otp':
              options.onNewOtp?.(msg.data)
              // Show browser notification
              if (Notification.permission === 'granted') {
                new Notification('New OTP Received', {
                  body: `Service: ${msg.data.service_name || 'Unknown'}\nOTP: ${msg.data.otp_display || '••••••'}`,
                  icon: '/favicon.ico',
                })
              }
              break
            case 'otp_update':
              options.onOtpUpdate?.(msg.data)
              break
            case 'status':
              if (msg.data.status === 'pong') {
                // Keepalive response
              }
              break
          }
        } catch (e) {
          console.error('[WS] Parse error:', e)
        }
      }

      ws.onclose = () => {
        setIsConnected(false)
        options.onStatusChange?.('disconnected')
        console.log('[WS] Disconnected, reconnecting in 5s...')
        reconnectTimeoutRef.current = window.setTimeout(connect, 5000)
      }

      ws.onerror = (error) => {
        console.error('[WS] Error:', error)
      }
    } catch (error) {
      console.error('[WS] Connection failed:', error)
    }
  }, [user?.organization_id, options.onNewOtp, options.onOtpUpdate, options.onStatusChange])

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

  return { isConnected, lastMessage, sendMessage }
}
