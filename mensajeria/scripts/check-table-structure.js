const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan las variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTableStructure() {
  console.log('🔍 Verificando estructura y datos de conversation_participants...')
  
  try {
    // Obtener todos los registros de conversation_participants
    const { data: participants, error: participantsError } = await supabase
      .from('conversation_participants')
      .select(`
        id,
        conversation_id,
        user_id,
        joined_at,
        conversations (
          id,
          name,
          is_group,
          created_by
        ),
        profiles (
          username,
          full_name
        )
      `)
      .order('joined_at', { ascending: false })

    if (participantsError) {
      console.error('❌ Error obteniendo participantes:', participantsError)
      return
    }

    console.log(`📊 Total de registros en conversation_participants: ${participants?.length || 0}`)
    console.log('')

    // Agrupar por conversación
    const conversationsMap = new Map()
    
    participants?.forEach(participant => {
      const convId = participant.conversation_id
      if (!conversationsMap.has(convId)) {
        conversationsMap.set(convId, {
          conversation: participant.conversations,
          participants: []
        })
      }
      conversationsMap.get(convId).participants.push(participant)
    })

    // Mostrar cada conversación y sus participantes
    conversationsMap.forEach((data, convId) => {
      const conv = data.conversation
      const participants = data.participants
      
      console.log(`💬 Conversación: ${convId}`)
      console.log(`   Nombre: ${conv?.name || 'Sin nombre'}`)
      console.log(`   Es grupo: ${conv?.is_group ? 'Sí' : 'No'}`)
      console.log(`   Creada por: ${conv?.created_by}`)
      console.log(`   Participantes (${participants.length}):`)
      
      participants.forEach((participant, index) => {
        const profile = participant.profiles
        const isCreator = participant.user_id === conv?.created_by
        console.log(`     ${index + 1}. ${profile?.username || 'Sin username'} (${profile?.full_name || 'Sin nombre'})`)
        console.log(`        - User ID: ${participant.user_id}`)
        console.log(`        - Es creador: ${isCreator ? 'Sí' : 'No'}`)
        console.log(`        - Fecha de unión: ${new Date(participant.joined_at).toLocaleString()}`)
      })
      
      // Verificar si es conversación privada
      if (!conv?.is_group) {
        if (participants.length === 2) {
          console.log('   ✅ Conversación privada correcta (2 participantes: origen + destino)')
        } else {
          console.log(`   ⚠️  Conversación privada con ${participants.length} participantes (debería tener 2)`)
        }
      } else {
        console.log('   📢 Conversación de grupo')
      }
      
      console.log('')
    })

    console.log('📈 Resumen de la estructura:')
    console.log('   - Cada conversación privada debe tener exactamente 2 participantes')
    console.log('   - Un participante es el creador (origen)')
    console.log('   - Un participante es el destinatario (destino)')
    console.log('   - Ambos se registran en la tabla conversation_participants')

  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

// Ejecutar la verificación
checkTableStructure()
  .then(() => {
    console.log('✨ Verificación de estructura completada')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  })
