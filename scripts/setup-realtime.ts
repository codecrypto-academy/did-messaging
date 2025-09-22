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

interface RealtimeTable {
  name: string
  description: string
  events: string[]
}

const realtimeTables: RealtimeTable[] = [
  {
    name: 'messages',
    description: 'Mensajes entre DIDs',
    events: ['INSERT', 'UPDATE', 'DELETE']
  },
  {
    name: 'conversations',
    description: 'Conversaciones',
    events: ['INSERT', 'UPDATE', 'DELETE']
  }
]

async function enableRealtime(): Promise<void> {
  console.log('🔄 Configurando Supabase Realtime para las tablas...')
  console.log('=' .repeat(60))

  for (const table of realtimeTables) {
    console.log(`\n📡 Configurando realtime para: ${table.name}`)
    console.log(`   Descripción: ${table.description}`)
    console.log(`   Eventos: ${table.events.join(', ')}`)

    try {
      // Verificar si la tabla existe
      const { data: tableExists, error: checkError } = await supabase
        .from(table.name)
        .select('*', { count: 'exact', head: true })

      if (checkError && checkError.message.includes('does not exist')) {
        console.log(`   ⚠️  Tabla ${table.name} no existe, saltando...`)
        continue
      }

      if (checkError) {
        console.log(`   ❌ Error verificando tabla ${table.name}:`, checkError.message)
        continue
      }

      // La tabla existe, mostrar información
      console.log(`   ✅ Tabla ${table.name} encontrada`)
      console.log(`   📊 Registros actuales: ${tableExists?.length || 0}`)

      // Intentar habilitar realtime automáticamente
      console.log(`   🔧 Intentando habilitar realtime automáticamente...`)

      try {
        const { error: realtimeError } = await supabase.rpc('sql', {
          query: `ALTER PUBLICATION supabase_realtime ADD TABLE ${table.name};`
        })

        if (realtimeError) {
          console.log(`   ⚠️  No se pudo habilitar automáticamente (${realtimeError.message})`)
          console.log(`   📝 Para habilitar realtime manualmente en ${table.name}:`)
          console.log(`      1. Ve a http://localhost:54323 (Supabase Studio)`)
          console.log(`      2. Database → Replication`)
          console.log(`      3. Habilita realtime para la tabla '${table.name}'`)
          console.log(`      4. Eventos: ${table.events.join(', ')}`)
        } else {
          console.log(`   ✅ Realtime habilitado automáticamente para ${table.name}`)
        }
      } catch (sqlError) {
        console.log(`   ⚠️  Configuración manual requerida para ${table.name}`)
        console.log(`   📝 Ejecuta este SQL en Supabase Studio:`)
        console.log(`      ALTER PUBLICATION supabase_realtime ADD TABLE ${table.name};`)
      }

    } catch (error) {
      console.error(`   ❌ Error inesperado en ${table.name}:`, error)
    }
  }

  console.log('\n' + '=' .repeat(60))
  console.log('📋 Instrucciones para configurar Realtime manualmente:')
  console.log('   1. Abre Supabase Studio: http://localhost:54323')
  console.log('   2. Ve a Database → Replication')
  console.log('   3. En la sección "Realtime", habilita las siguientes tablas:')

  for (const table of realtimeTables) {
    console.log(`      - ${table.name} (eventos: ${table.events.join(', ')})`)
  }

  console.log('\n   Alternativamente, ejecuta estos comandos SQL:')
  console.log('   (desde el SQL Editor en Supabase Studio)')
  console.log('')

  for (const table of realtimeTables) {
    console.log(`   -- Habilitar realtime para ${table.name}`)
    console.log(`   ALTER PUBLICATION supabase_realtime ADD TABLE ${table.name};`)
    console.log('')
  }
}

function createConversationChannelId(did1: string, did2: string): string {
  return did1 < did2 ? `${did1}-${did2}` : `${did2}-${did1}`
}

async function testRealtime(): Promise<void> {
  console.log('\n🧪 Probando configuración de Realtime...')

  // Probar suscripción a mensajes
  console.log('📡 Intentando suscribirse a la tabla messages...')

  const channel = supabase
    .channel('test-messages')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages'
      },
      (payload) => {
        console.log('✅ Evento de realtime recibido:', payload.eventType)
      }
    )
    .subscribe((status) => {
      console.log(`📡 Estado de suscripción: ${status}`)
    })

  // Probar channels basados en conversación entre DIDs
  console.log('\n📡 Probando channels de conversación entre DIDs...')

  const testDid1 = 'did:example:alice'
  const testDid2 = 'did:example:bob'
  const conversationId = createConversationChannelId(testDid1, testDid2)

  console.log(`🔗 Channel ID para conversación: conversation:${conversationId}`)

  const conversationChannel = supabase
    .channel(`conversation:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `from_did=eq.${testDid1},to_did=eq.${testDid2}`
      },
      (payload) => {
        console.log(`✅ Mensaje ${testDid1} → ${testDid2}:`, payload.eventType)
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `from_did=eq.${testDid2},to_did=eq.${testDid1}`
      },
      (payload) => {
        console.log(`✅ Mensaje ${testDid2} → ${testDid1}:`, payload.eventType)
      }
    )
    .subscribe((status) => {
      console.log(`📡 Estado de conversación ${conversationId}: ${status}`)
    })

  // Esperar un momento para la suscripción
  await new Promise(resolve => setTimeout(resolve, 2000))

  console.log('✅ Configuración de realtime probada')
  console.log('💡 Si ves "SUBSCRIBED", realtime está funcionando correctamente')
  console.log('💡 Los channels de conversación permiten comunicación bidireccional entre DIDs')

  // Limpiar suscripciones
  await channel.unsubscribe()
  await conversationChannel.unsubscribe()
}

async function main(): Promise<void> {
  console.log('📡 Script de configuración de Supabase Realtime')
  console.log('=' .repeat(60))

  await enableRealtime()
  await testRealtime()

  console.log('\n✅ Configuración de Realtime completada!')
  console.log('💡 Recuerda reiniciar tu aplicación web después de habilitar realtime')
}

// Ejecutar script si es llamado directamente
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Error ejecutando el script:', error)
    process.exit(1)
  })
}

export { main as setupRealtime }