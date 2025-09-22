const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://localhost:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseKey)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function populateDemoData() {
  console.log('🎭 Populating demo data...')

  // Demo users data
  const demoUsers = [
    {
      email: 'alice@example.com',
      password: 'password123',
      username: 'alice',
      full_name: 'Alice Johnson'
    },
    {
      email: 'bob@example.com',
      password: 'password123',
      username: 'bob',
      full_name: 'Bob Smith'
    },
    {
      email: 'charlie@example.com',
      password: 'password123',
      username: 'charlie',
      full_name: 'Charlie Brown'
    },
    {
      email: 'diana@example.com',
      password: 'password123',
      username: 'diana',
      full_name: 'Diana Prince'
    }
  ]

  try {
    // Create demo users
    for (const userData of demoUsers) {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            username: userData.username,
            full_name: userData.full_name
          }
        }
      })

      if (error) {
        console.log(`⚠️  User ${userData.email} might already exist:`, error.message)
      } else {
        console.log(`✅ Created user: ${userData.email}`)
      }
    }

    // Wait a bit for profiles to be created
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Manually create profiles for demo users
    console.log('👤 Creating profiles for demo users...')
    
    // Create demo profiles with known UUIDs
    const demoProfiles = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        username: 'alice',
        full_name: 'Alice Johnson',
        email: 'alice@example.com'
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        username: 'bob',
        full_name: 'Bob Smith',
        email: 'bob@example.com'
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        username: 'charlie',
        full_name: 'Charlie Brown',
        email: 'charlie@example.com'
      },
      {
        id: '44444444-4444-4444-4444-444444444444',
        username: 'diana',
        full_name: 'Diana Prince',
        email: 'diana@example.com'
      }
    ]

    for (const profileData of demoProfiles) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: profileData.id,
          username: profileData.username,
          full_name: profileData.full_name
        })

      if (profileError) {
        console.log(`⚠️  Profile for ${profileData.email} might already exist:`, profileError.message)
      } else {
        console.log(`✅ Created profile for: ${profileData.email}`)
      }
    }

    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return
    }

    console.log(`📊 Found ${profiles.length} profiles`)

    // Create some demo conversations
    if (profiles.length >= 2) {
      // Create a private conversation between first two users
      const { data: conversation1, error: conv1Error } = await supabase
        .from('conversations')
        .insert({
          created_by: profiles[0].id,
          is_group: false
        })
        .select()
        .single()

      if (!conv1Error && conversation1) {
        // Add participants
        await supabase
          .from('conversation_participants')
          .insert([
            { conversation_id: conversation1.id, user_id: profiles[0].id },
            { conversation_id: conversation1.id, user_id: profiles[1].id }
          ])

        // Add some demo messages
        const messages = [
          { content: '¡Hola! ¿Cómo estás?', sender_id: profiles[0].id },
          { content: '¡Hola! Muy bien, gracias. ¿Y tú?', sender_id: profiles[1].id },
          { content: 'Todo bien por aquí. ¿Qué planes tienes para hoy?', sender_id: profiles[0].id },
          { content: 'Nada especial, solo trabajando en algunos proyectos.', sender_id: profiles[1].id }
        ]

        for (const message of messages) {
          await supabase
            .from('messages')
            .insert({
              conversation_id: conversation1.id,
              sender_id: message.sender_id,
              content: message.content,
              message_type: 'text'
            })
        }

        console.log('✅ Created demo conversation with messages')
      }

      // Create a group conversation if we have enough users
      if (profiles.length >= 3) {
        const { data: conversation2, error: conv2Error } = await supabase
          .from('conversations')
          .insert({
            name: 'Grupo de Trabajo',
            created_by: profiles[0].id,
            is_group: true
          })
          .select()
          .single()

        if (!conv2Error && conversation2) {
          // Add all users to the group
          const participants = profiles.slice(0, 3).map(profile => ({
            conversation_id: conversation2.id,
            user_id: profile.id
          }))

          await supabase
            .from('conversation_participants')
            .insert(participants)

          // Add some demo messages
          const groupMessages = [
            { content: '¡Hola equipo! ¿Cómo va el proyecto?', sender_id: profiles[0].id },
            { content: 'Todo marchando bien por aquí', sender_id: profiles[1].id },
            { content: 'Sí, estamos avanzando según lo planeado', sender_id: profiles[2].id }
          ]

          for (const message of groupMessages) {
            await supabase
              .from('messages')
              .insert({
                conversation_id: conversation2.id,
                sender_id: message.sender_id,
                content: message.content,
                message_type: 'text'
              })
          }

          console.log('✅ Created demo group conversation with messages')
        }
      }
    }

    console.log('🎉 Demo data populated successfully!')
    console.log('')
    console.log('📝 Demo users created:')
    demoUsers.forEach(user => {
      console.log(`   - ${user.email} (password: password123)`)
    })
    console.log('')
    console.log('🚀 You can now start the app with: npm run dev')

  } catch (error) {
    console.error('❌ Error populating demo data:', error)
  }
}

populateDemoData()
