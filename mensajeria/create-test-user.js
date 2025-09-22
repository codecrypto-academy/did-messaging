const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://localhost:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTestUser() {
  console.log('🧪 Creating test user...')

  // Create a test user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: 'test@example.com',
    password: 'password123',
    options: {
      data: {
        username: 'testuser',
        full_name: 'Test User'
      }
    }
  })

  if (authError) {
    console.error('Error creating user:', authError)
    return
  }

  console.log('✅ Test user created:', authData.user?.email)

  // Wait a bit for the profile to be created by the trigger
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Check if profile was created
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)

  if (profileError) {
    console.error('Error fetching profile:', profileError)
  } else if (profiles && profiles.length > 0) {
    console.log('✅ Profile created automatically:', profiles[0])
  } else {
    console.log('⚠️  Profile not created automatically, creating manually...')
    
    // Create profile manually
    const { error: createProfileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        username: 'testuser',
        full_name: 'Test User'
      })

    if (createProfileError) {
      console.error('Error creating profile:', createProfileError)
    } else {
      console.log('✅ Profile created manually')
    }
  }

  console.log('🎉 Test user setup complete!')
  console.log('📧 Email: test@example.com')
  console.log('🔑 Password: password123')
}

createTestUser()
