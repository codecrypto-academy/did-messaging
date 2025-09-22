#!/usr/bin/env npx tsx

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Cargar variables de entorno del archivo .env.local del proyecto web
dotenv.config({ path: path.join(__dirname, '../web/.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar definidas')
  console.log('💡 Asegúrate de tener estas variables en web/.env.local:')
  console.log('   NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321')
  console.log('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key')
  process.exit(1)
}

// Crear cliente con service role key para tener permisos de administrador
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const realtimeTables = ['messages', 'conversations']

async function enableRealtimeSQL(): Promise<void> {
  console.log('🔧 Habilitando Realtime usando comandos SQL directos...')
  console.log('=' .repeat(60))

  for (const tableName of realtimeTables) {
    console.log(`\n📡 Habilitando realtime para: ${tableName}`)

    try {
      // Verificar si la tabla existe primero
      const { error: checkError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })

      if (checkError) {
        console.log(`   ❌ Tabla ${tableName} no encontrada: ${checkError.message}`)
        continue
      }

      console.log(`   ✅ Tabla ${tableName} encontrada`)

      // Habilitar realtime usando SQL directo
      const sql = `ALTER PUBLICATION supabase_realtime ADD TABLE public.${tableName};`
      console.log(`   🔧 Ejecutando: ${sql}`)

      const { error } = await supabase.rpc('exec_sql', {
        sql: sql
      })

      if (error) {
        // Intentar con otro método si el primero falla
        console.log(`   ⚠️  Método 1 falló, intentando método alternativo...`)

        const { data: data2, error: error2 } = await supabase
          .from('pg_publication_tables')
          .select('*')
          .eq('pubname', 'supabase_realtime')
          .eq('tablename', tableName)

        if (error2) {
          console.log(`   ❌ No se pudo verificar realtime para ${tableName}`)
          console.log(`   📝 Ejecuta manualmente en Supabase Studio SQL Editor:`)
          console.log(`      ${sql}`)
        } else if (data2 && data2.length > 0) {
          console.log(`   ✅ Realtime ya está habilitado para ${tableName}`)
        } else {
          console.log(`   📝 Habilita manualmente en Supabase Studio:`)
          console.log(`      Database → Replication → Enable realtime for '${tableName}'`)
        }
      } else {
        console.log(`   ✅ Realtime habilitado exitosamente para ${tableName}`)
      }

    } catch (error: any) {
      console.error(`   ❌ Error procesando ${tableName}:`, error.message)
    }
  }

  console.log('\n' + '=' .repeat(60))
  console.log('📋 Instrucciones finales:')
  console.log('   1. Verifica en Supabase Studio: http://localhost:54323')
  console.log('   2. Ve a Database → Replication')
  console.log('   3. Confirma que las tablas messages y conversations tienen realtime habilitado')
  console.log('   4. Si no están habilitadas, usa el botón "Enable" en cada tabla')
  console.log('\n💡 Alternativamente, ejecuta estos comandos SQL en el SQL Editor:')

  for (const tableName of realtimeTables) {
    console.log(`   ALTER PUBLICATION supabase_realtime ADD TABLE public.${tableName};`)
  }
}

async function testRealtimeEnabled(): Promise<void> {
  console.log('\n🧪 Probando si realtime está habilitado...')

  for (const tableName of realtimeTables) {
    console.log(`\n📡 Probando suscripción a ${tableName}...`)

    const testChannel = supabase
      .channel(`test-${tableName}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName
        },
        () => {
          console.log(`✅ ${tableName}: Recibiendo eventos de realtime`)
        }
      )
      .subscribe((status) => {
        console.log(`   📡 Estado de ${tableName}: ${status}`)
        if (status === 'SUBSCRIBED') {
          console.log(`   ✅ Realtime funcionando para ${tableName}`)
        } else if (status === 'CHANNEL_ERROR') {
          console.log(`   ❌ Error en realtime para ${tableName}`)
        }
      })

    // Esperar un momento para la suscripción
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Limpiar
    await testChannel.unsubscribe()
  }
}

async function main(): Promise<void> {
  console.log('🚀 Script para habilitar Realtime en Supabase')
  console.log('=' .repeat(60))

  await enableRealtimeSQL()
  await testRealtimeEnabled()

  console.log('\n✅ Configuración de Realtime completada!')
  console.log('💡 Los channels se crean automáticamente cuando los clientes se suscriben')
  console.log('💡 Cada conversación entre DIDs usa un channel único basado en los DIDs')
}

// Ejecutar script si es llamado directamente
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Error ejecutando el script:', error)
    process.exit(1)
  })
}

export { main as enableRealtimeSQL }