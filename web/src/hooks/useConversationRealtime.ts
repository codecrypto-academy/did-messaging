import { useEffect, useRef, useState, useCallback } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { subscribeToConversation, unsubscribeFromConversation } from '../lib/realtime-channels'

interface Message {
  id: string
  from_did: string
  to_did: string
  mensaje: string
  fecha: string
  read_at?: string
}

interface UseConversationRealtimeProps {
  did1: string
  did2: string
  onNewMessage?: (message: Message) => void
  onMessageUpdate?: (message: Message) => void
  onMessageDelete?: (messageId: string) => void
}

export function useConversationRealtime({
  did1,
  did2,
  onNewMessage,
  onMessageUpdate,
  onMessageDelete
}: UseConversationRealtimeProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
  const [retryCount, setRetryCount] = useState(0)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const maxRetries = 3

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      console.log('🔌 Cerrando canal realtime')
      unsubscribeFromConversation(channelRef.current)
      channelRef.current = null
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
    setIsConnected(false)
    setConnectionStatus('disconnected')
  }, [])

  const connect = useCallback(() => {
    if (!did1 || !did2) {
      cleanup()
      return
    }

    console.log(`🔄 Configurando canal realtime para: ${did1} ↔ ${did2} (intento ${retryCount + 1})`)
    setConnectionStatus('connecting')

    const channel = subscribeToConversation(
      did1,
      did2,
      (payload) => {
        console.log('📨 Evento realtime recibido:', payload.eventType, payload)

        switch (payload.eventType) {
          case 'INSERT':
            onNewMessage?.(payload.new as Message)
            break
          case 'UPDATE':
            onMessageUpdate?.(payload.new as Message)
            break
          case 'DELETE':
            onMessageDelete?.(payload.old.id)
            break
        }
      },
      (status) => {
        console.log(`📡 Estado del canal: ${status}`)
        
        switch (status) {
          case 'SUBSCRIBED':
            setIsConnected(true)
            setConnectionStatus('connected')
            setRetryCount(0) // Reset retry count on successful connection
            console.log('✅ Canal conectado exitosamente')
            break
          case 'CHANNEL_ERROR':
          case 'TIMED_OUT':
            setIsConnected(false)
            setConnectionStatus('error')
            console.error(`❌ Error en conexión del canal: ${status}`)
            
            // Intentar reconexión automática
            if (retryCount < maxRetries) {
              const delay = Math.min(1000 * Math.pow(2, retryCount), 10000) // Exponential backoff, max 10s
              console.log(`🔄 Reintentando conexión en ${delay}ms...`)
              
              retryTimeoutRef.current = setTimeout(() => {
                setRetryCount(prev => prev + 1)
                connect()
              }, delay)
            } else {
              console.error('❌ Máximo número de reintentos alcanzado')
              setConnectionStatus('error')
            }
            break
          case 'CLOSED':
            setIsConnected(false)
            setConnectionStatus('disconnected')
            console.log('📪 Canal cerrado')
            break
          default:
            setIsConnected(false)
            setConnectionStatus('connecting')
            console.log(`🔄 Estado del canal: ${status}`)
        }
      }
    )

    channelRef.current = channel
  }, [did1, did2, onNewMessage, onMessageUpdate, onMessageDelete, retryCount, cleanup])

  // Función para reconectar manualmente
  const reconnect = useCallback(() => {
    console.log('🔄 Reconectando manualmente...')
    setRetryCount(0)
    cleanup()
    setTimeout(connect, 100)
  }, [connect, cleanup])

  useEffect(() => {
    connect()

    // Cleanup al desmontar
    return cleanup
  }, [connect, cleanup])

  return {
    isConnected,
    connectionStatus,
    retryCount,
    maxRetries,
    channel: channelRef.current,
    reconnect
  }
}