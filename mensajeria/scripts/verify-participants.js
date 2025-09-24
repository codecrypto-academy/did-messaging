const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan las variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyParticipants() {
  console.log('🔍 Verificando participantes en conversaciones...')
  
  try {
    // Obtener todas las conversaciones con sus participantes
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select(`
        id,
        name,
        is_group,
        created_by,
        created_at,
        conversation_participants (
          user_id,
          profiles (
            username,
            full_name
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (convError) {
      console.error('❌ Error obteniendo conversaciones:', convError)
      return
    }

    console.log(`📊 Total de conversaciones encontradas: ${conversations?.length || 0}`)
    console.log('')

    conversations?.forEach((conv, index) => {
      console.log(`💬 Conversación ${index + 1}:`)
      console.log(`   ID: ${conv.id}`)
      console.log(`   Nombre: ${conv.name || 'Sin nombre'}`)
      console.log(`   Es grupo: ${conv.is_group ? 'Sí' : 'No'}`)
      console.log(`   Creada por: ${conv.created_by}`)
      console.log(`   Fecha: ${new Date(conv.created_at).toLocaleString()}`)
      console.log(`   Participantes (${conv.conversation_participants?.length || 0}):`)
      
      conv.conversation_participants?.forEach((participant, pIndex) => {
        const profile = participant.profiles
        console.log(`     ${pIndex + 1}. ${profile?.username || 'Sin username'} (${profile?.full_name || 'Sin nombre'}) - ID: ${participant.user_id}`)
      })
      
      // Verificar si es conversación privada
      if (!conv.is_group && conv.conversation_participants?.length === 2) {
        console.log('   ✅ Conversación privada correcta (2 participantes)')
      } else if (!conv.is_group && conv.conversation_participants?.length !== 2) {
        console.log('   ⚠️  Conversación privada con número incorrecto de participantes')
      } else if (conv.is_group) {
        console.log('   📢 Conversación de grupo')
      }
      
      console.log('')
    })

    // Verificar que todas las conversaciones privadas tengan exactamente 2 participantes
    const privateConversations = conversations?.filter(conv => !conv.is_group) || []
    const correctPrivateConversations = privateConversations.filter(conv => conv.conversation_participants?.length === 2)
    
    console.log('📈 Resumen:')
    console.log(`   - Conversaciones privadas: ${privateConversations.length}`)
    console.log(`   - Conversaciones privadas correctas (2 participantes): ${correctPrivateConversations.length}`)
    console.log(`   - Conversaciones de grupo: ${conversations?.filter(conv => conv.is_group).length || 0}`)

  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

// Ejecutar la verificación
verifyParticipants()
  .then(() => {
    console.log('✨ Verificación completada')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  })
