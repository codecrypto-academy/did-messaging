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

interface TableInfo {
  name: string
  description: string
}

// Orden específico para respetar foreign keys: borrar dependencias primero
const tables: TableInfo[] = [
  { name: 'messages', description: 'Mensajes entre DIDs (debe borrarse antes que conversations)' },
  { name: 'conversations', description: 'Conversaciones' },
  { name: 'private_keys', description: 'Claves privadas de DIDs' },
  { name: 'did_documents', description: 'Documentos DID' },
  { name: 'dids', description: 'DIDs principales' },
]

async function clearTable(tableName: string): Promise<void> {
  console.log(`🗑️  Borrando registros de la tabla: ${tableName}`)

  try {
    // Primero obtener todos los registros para ver cuántos hay y su estructura
    const { data: allRecords, error: selectError } = await supabase
      .from(tableName)
      .select('*')

    if (selectError) {
      console.error(`❌ Error accediendo a ${tableName}:`, selectError.message)
      return
    }

    if (!allRecords || allRecords.length === 0) {
      console.log(`✅ Tabla ${tableName} ya está vacía`)
      return
    }

    console.log(`📋 Estructura de ${tableName}:`, Object.keys(allRecords[0]))

    // Estrategias específicas por tabla
    let success = false

    if (tableName === 'messages') {
      // Para messages, intentar borrar por id
      let deletedCount = 0
      for (const record of allRecords) {
        try {
          const { error: deleteError } = await supabase
            .from('messages')
            .delete()
            .eq('id', record.id)

          if (!deleteError) deletedCount++
        } catch (e) {
          console.log(`Error borrando mensaje ${record.id}:`, e)
        }
      }
      console.log(`✅ ${deletedCount} mensajes borrados de ${allRecords.length}`)
      success = deletedCount > 0
    } else if (tableName === 'conversations') {
      // Para conversations, intentar por conversation_id o id
      let deletedCount = 0
      for (const record of allRecords) {
        try {
          const idField = record.conversation_id || record.id
          const { error: deleteError } = await supabase
            .from('conversations')
            .delete()
            .eq(record.conversation_id ? 'conversation_id' : 'id', idField)

          if (!deleteError) deletedCount++
        } catch (e) {
          console.log(`Error borrando conversación:`, e)
        }
      }
      console.log(`✅ ${deletedCount} conversaciones borradas de ${allRecords.length}`)
      success = deletedCount > 0
    } else {
      // Para otras tablas, intentar métodos generales

      // Método 1: usar created_at
      const { error: error1 } = await supabase
        .from(tableName)
        .delete()
        .gt('created_at', '1900-01-01')

      if (!error1) {
        console.log(`✅ Tabla ${tableName} limpiada exitosamente (${allRecords.length} registros)`)
        success = true
      } else {
        // Método 2: borrar uno por uno
        console.log(`⚠️  Intentando método alternativo para ${tableName}...`)
        let deletedCount = 0
        for (const record of allRecords) {
          try {
            const idField = record.id || record.did_id || record.key_id
            if (idField) {
              const { error: deleteError } = await supabase
                .from(tableName)
                .delete()
                .eq('id', idField)

              if (!deleteError) deletedCount++
            }
          } catch (e) {
            console.log(`Error borrando registro:`, e)
          }
        }
        console.log(`✅ ${deletedCount} registros borrados de ${tableName}`)
        success = deletedCount > 0
      }
    }

    if (!success) {
      console.error(`❌ No se pudieron borrar registros de ${tableName}`)
    }

  } catch (error) {
    console.error(`❌ Error inesperado en ${tableName}:`, error)
  }
}

async function showTableCounts(): Promise<void> {
  console.log('\n📊 Conteo de registros actual:')

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table.name)
        .select('*', { count: 'exact', head: true })

      if (error) {
        console.log(`   ${table.name}: Error - ${error.message}`)
      } else {
        console.log(`   ${table.name}: ${count || 0} registros - ${table.description}`)
      }
    } catch (error) {
      console.log(`   ${table.name}: Error inesperado`)
    }
  }
}

async function confirmAction(): Promise<boolean> {
  const readline = require('readline')
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((resolve) => {
    rl.question('\n⚠️  ¿Estás seguro de que quieres borrar TODOS los registros? (y/N): ', (answer: string) => {
      rl.close()
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes')
    })
  })
}

async function main(): Promise<void> {
  console.log('🧹 Script para limpiar la base de datos de Supabase')
  console.log('=' .repeat(50))

  // Mostrar conteo actual
  await showTableCounts()

  // Confirmar acción
  const confirmed = await confirmAction()

  if (!confirmed) {
    console.log('❌ Operación cancelada')
    return
  }

  console.log('\n🚀 Iniciando limpieza de base de datos...')
  console.log('📝 Orden de borrado: messages → conversations → private_keys → did_documents → dids')

  // Borrar en orden correcto (respetando foreign keys)
  for (const table of tables) {
    await clearTable(table.name)
    // Pequeña pausa entre operaciones
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.log('\n📊 Conteo después de la limpieza:')
  await showTableCounts()

  console.log('\n✅ Limpieza de base de datos completada!')
}

// Ejecutar script si es llamado directamente
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Error ejecutando el script:', error)
    process.exit(1)
  })
}

export { main as clearDatabase }