const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://localhost:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createAliceUser() {
  console.log('🧪 Creating Alice user...')

  // First, let's check if alice already exists
  const { data: existingUsers } = await supabase.auth.getUser()
  
  // Try to sign in with alice first
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'alice@example.com',
    password: 'password123'
  })

  if (signInError && signInError.message.includes('Invalid login credentials')) {
    // User doesn't exist, create it
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'alice@example.com',
      password: 'password123',
      options: {
        data: {
          username: 'alice',
          full_name: 'Alice Johnson'
        }
      }
    })

    if (authError) {
      console.error('Error creating Alice user:', authError)
      return
    }

    console.log('✅ Alice user created:', authData.user?.email)
  } else if (signInData?.user) {
    console.log('✅ Alice user already exists, signed in:', signInData.user.email)
  }

  // Wait a bit for the profile to be created by the trigger
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Check if profile was created
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')

  if (profileError) {
    console.error('Error fetching profiles:', profileError)
  } else {
    console.log('📊 Current profiles:', profiles?.map(p => ({ 
      id: p.id, 
      username: p.username, 
      full_name: p.full_name 
    })))
  }

  console.log('🎉 Alice user setup complete!')
  console.log('📧 Email: alice@example.com')
  console.log('🔑 Password: password123')
}

createAliceUser()
