#!/usr/bin/env npx tsx

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Cargar variables de entorno del archivo .env.local del proyecto web
dotenv.config({ path: path.join(__dirname, '../web/.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: SUPABASE_URL y SUPABASE_ANON_KEY deben estar definidas en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

function createConversationChannelId(did1: string, did2: string): string {
  return did1 < did2 ? `${did1}-${did2}` : `${did2}-${did1}`
}

async function testConversationChannel(): Promise<void> {
  console.log('🧪 Probando apertura de canal de conversación específico...')
  console.log('=' .repeat(60))

  const testDid1 = 'did:example:alice'
  const testDid2 = 'did:example:bob'
  const conversationId = createConversationChannelId(testDid1, testDid2)
  const channelName = `conversation:${conversationId}`

  console.log(`\n📡 Datos de la prueba:`)
  console.log(`   DID 1: ${testDid1}`)
  console.log(`   DID 2: ${testDid2}`)
  console.log(`   Conversation ID: ${conversationId}`)
  console.log(`   Channel Name: ${channelName}`)

  // Simular la creación del canal como lo hace la web
  console.log(`\n🔌 Abriendo canal de conversación: ${conversationId}`)

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `or(and(from_did.eq.${testDid1},to_did.eq.${testDid2}),and(from_did.eq.${testDid2},to_did.eq.${testDid1}))`
      },
      (payload) => {
        console.log(`📨 Evento recibido en canal ${conversationId}:`, payload.eventType)
        console.log(`   Desde: ${payload.new?.from_did || 'N/A'}`)
        console.log(`   Para: ${payload.new?.to_did || 'N/A'}`)
        console.log(`   Mensaje: ${payload.new?.mensaje || 'N/A'}`)
      }
    )
    .subscribe((status) => {
      console.log(`📡 Estado del canal ${conversationId}: ${status}`)

      if (status === 'SUBSCRIBED') {
        console.log(`✅ Canal activo para conversación: ${conversationId}`)
        console.log(`💡 El canal está listo para recibir mensajes en tiempo real`)
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`❌ Error en canal: ${conversationId}`)
        console.log(`💡 Verifica que realtime esté habilitado para la tabla 'messages'`)
      } else if (status === 'TIMED_OUT') {
        console.error(`⏱️ Timeout en canal: ${conversationId}`)
        console.log(`💡 Verifica la conexión a Supabase`)
      } else if (status === 'CLOSED') {
        console.log(`📪 Canal cerrado: ${conversationId}`)
      } else {
        console.log(`🔄 Estado del canal: ${status}`)
      }
    })

  // Esperar para ver el estado de la suscripción
  console.log('\n⏳ Esperando estado de suscripción...')
  await new Promise(resolve => setTimeout(resolve, 3000))

  // Insertar un mensaje de prueba si el canal está activo
  console.log('\n📝 Insertando mensaje de prueba...')

  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([{
        from_did: testDid1,
        to_did: testDid2,
        mensaje: `Mensaje de prueba enviado a las ${new Date().toLocaleTimeString()}`,
        user_id: '00000000-0000-0000-0000-000000000000' // UUID dummy para prueba
      }])
      .select()

    if (error) {
      console.log(`⚠️ No se pudo insertar mensaje de prueba: ${error.message}`)
      console.log(`💡 Esto es normal si no tienes un usuario autenticado`)
    } else {
      console.log(`✅ Mensaje de prueba insertado exitosamente`)
      console.log(`💡 Si el canal funciona, deberías ver el evento arriba`)
    }
  } catch (insertError) {
    console.log(`⚠️ Error insertando mensaje de prueba:`, insertError)
  }

  // Esperar un poco más para recibir el evento
  console.log('\n⏳ Esperando eventos de realtime...')
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Limpiar
  await channel.unsubscribe()
  console.log('\n🔌 Canal cerrado')
}

async function testRealtimeConfiguration(): Promise<void> {
  console.log('\n🔍 Verificando configuración de Realtime...')

  try {
    // Verificar que la tabla messages existe
    const { error: tableError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })

    if (tableError) {
      console.log(`❌ Tabla 'messages' no accesible: ${tableError.message}`)
      return
    }

    console.log(`✅ Tabla 'messages' accesible`)

    // Verificar que podemos crear un canal básico
    const testChannel = supabase
      .channel('test-basic-connection')
      .subscribe((status) => {
        console.log(`📡 Canal básico: ${status}`)
      })

    await new Promise(resolve => setTimeout(resolve, 1000))
    await testChannel.unsubscribe()

  } catch (error) {
    console.error(`❌ Error verificando configuración:`, error)
  }
}

async function main(): Promise<void> {
  console.log('🚀 Test de Canales de Conversación DID')
  console.log('=' .repeat(60))

  await testRealtimeConfiguration()
  await testConversationChannel()

  console.log('\n✅ Prueba completada!')
  console.log('\n💡 Si ves "SUBSCRIBED" y el canal se abre correctamente,')
  console.log('   la funcionalidad debería trabajar en la aplicación web.')
  console.log('\n💡 Si hay errores, verifica:')
  console.log('   1. Que Supabase local esté ejecutándose')
  console.log('   2. Que realtime esté habilitado para la tabla "messages"')
  console.log('   3. Que las variables de entorno estén configuradas')
}

// Ejecutar script si es llamado directamente
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Error ejecutando el script:', error)
    process.exit(1)
  })
}

export { main as testConversationChannels }