import { supabase } from './supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function createConversationChannelId(did1: string, did2: string): string {
  // Crear un ID único ordenando los DIDs lexicográficamente
  return did1 < did2 ? `${did1}-${did2}` : `${did2}-${did1}`
}

export function createConversationChannel(did1: string, did2: string): RealtimeChannel {
  const channelId = createConversationChannelId(did1, did2)

  return supabase.channel(`conversation:${channelId}`)
}

export function subscribeToConversation(
  did1: string,
  did2: string,
  onMessage: (payload: any) => void,
  onStatusChange?: (status: string) => void
): RealtimeChannel {
  const channel = createConversationChannel(did1, did2)
  const conversationId = createConversationChannelId(did1, did2)

  console.log(`🔌 Abriendo canal de conversación: ${conversationId}`)
  console.log(`   📡 Canal: conversation:${conversationId}`)
  console.log(`   📨 Escuchando mensajes entre: ${did1} ↔ ${did2}`)

  const channelWithListeners = channel
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `or(and(from_did.eq.${did1},to_did.eq.${did2}),and(from_did.eq.${did2},to_did.eq.${did1}))`
      },
      (payload) => {
        console.log(`📨 Evento recibido en canal ${conversationId}:`, payload.eventType)
        onMessage(payload)
      }
    )
    .subscribe((status) => {
      console.log(`📡 Estado del canal ${conversationId}: ${status}`)
      onStatusChange?.(status)

      if (status === 'SUBSCRIBED') {
        console.log(`✅ Canal activo para conversación: ${conversationId}`)
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`❌ Error en canal: ${conversationId}`)
      } else if (status === 'TIMED_OUT') {
        console.error(`⏱️ Timeout en canal: ${conversationId}`)
      } else if (status === 'CLOSED') {
        console.log(`📪 Canal cerrado: ${conversationId}`)
      }
    })

  return channelWithListeners
}

export function unsubscribeFromConversation(channel: RealtimeChannel): void {
  channel.unsubscribe()
}

export function broadcastToConversation(
  did1: string,
  did2: string,
  event: string,
  payload: any
): void {
  const channel = createConversationChannel(did1, did2)

  channel.send({
    type: 'broadcast',
    event,
    payload
  })
}