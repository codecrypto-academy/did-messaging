const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan las variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function clearAllData() {
  console.log('🧹 Iniciando limpieza de datos...')
  
  try {
    // 1. Borrar todos los mensajes
    console.log('📝 Borrando mensajes...')
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
    if (messagesError) {
      console.error('❌ Error borrando mensajes:', messagesError)
    } else {
      console.log('✅ Mensajes borrados exitosamente')
    }

    // 2. Borrar todos los participantes de conversaciones
    console.log('👥 Borrando participantes de conversaciones...')
    const { error: participantsError } = await supabase
      .from('conversation_participants')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
    if (participantsError) {
      console.error('❌ Error borrando participantes:', participantsError)
    } else {
      console.log('✅ Participantes borrados exitosamente')
    }

    // 3. Borrar todas las conversaciones
    console.log('💬 Borrando conversaciones...')
    const { error: conversationsError } = await supabase
      .from('conversations')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
    if (conversationsError) {
      console.error('❌ Error borrando conversaciones:', conversationsError)
    } else {
      console.log('✅ Conversaciones borradas exitosamente')
    }

    console.log('🎉 Limpieza completada exitosamente!')
    console.log('📊 Resumen:')
    console.log('   - Mensajes: Borrados')
    console.log('   - Participantes: Borrados') 
    console.log('   - Conversaciones: Borradas')
    console.log('   - Perfiles: Conservados (no se borraron)')

  } catch (error) {
    console.error('❌ Error inesperado durante la limpieza:', error)
  }
}

// Ejecutar la limpieza
clearAllData()
  .then(() => {
    console.log('✨ Script de limpieza finalizado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  })
