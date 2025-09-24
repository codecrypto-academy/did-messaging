const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan las variables de entorno')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifySchemaChanges() {
  console.log('🔍 Verificando cambios de schema...')
  
  try {
    // 1. Check profiles table columns
    console.log('📊 Verificando tabla profiles...')
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, mnemonic, did, diddocument')
      .limit(1)
    
    if (profilesError) {
      if (profilesError.code === '42703') {
        console.log('❌ Columnas mnemonic, did y/o diddocument no existen en profiles')
        console.log('   Necesitas ejecutar: ALTER TABLE public.profiles ADD COLUMN mnemonic text;')
        console.log('   Necesitas ejecutar: ALTER TABLE public.profiles ADD COLUMN did text;')
        console.log('   Necesitas ejecutar: ALTER TABLE public.profiles ADD COLUMN diddocument jsonb;')
      } else {
        console.log('❌ Error verificando profiles:', profilesError.message)
      }
    } else {
      console.log('✅ Tabla profiles con columnas mnemonic, did y diddocument verificada')
    }

    // 2. Check profile_keys table
    console.log('📊 Verificando tabla profile_keys...')
    
    const { data: keys, error: keysError } = await supabase
      .from('profile_keys')
      .select('id, profile_id, derived_path, curve_type, key_usage, public_key, private_key')
      .limit(1)
    
    if (keysError) {
      if (keysError.code === 'PGRST205') {
        console.log('❌ Tabla profile_keys no existe')
        console.log('   Necesitas ejecutar el SQL completo en Supabase SQL Editor')
      } else {
        console.log('❌ Error verificando profile_keys:', keysError.message)
      }
    } else {
      console.log('✅ Tabla profile_keys verificada')
    }

    // 3. Test insert permissions
    console.log('📊 Verificando permisos de inserción...')
    
    // Try to insert a test record (we'll delete it immediately)
    const testProfileId = '00000000-0000-0000-0000-000000000000' // Dummy ID
    
    const { error: insertError } = await supabase
      .from('profile_keys')
      .insert({
        profile_id: testProfileId,
        derived_path: 'm/44\'/0\'/0\'/0/0',
        curve_type: 'ed25519',
        key_usage: 'authorization',
        public_key: 'test',
        private_key: 'test'
      })
    
    if (insertError) {
      if (insertError.code === 'PGRST205') {
        console.log('❌ Tabla profile_keys no existe - no se puede probar inserción')
      } else if (insertError.code === '23503') {
        console.log('✅ Tabla profile_keys existe y permite inserción (error de foreign key esperado)')
      } else {
        console.log('⚠️  Error de inserción:', insertError.message)
      }
    } else {
      console.log('✅ Inserción de prueba exitosa')
      
      // Clean up test record
      await supabase
        .from('profile_keys')
        .delete()
        .eq('profile_id', testProfileId)
    }

    // 4. Summary
    console.log('')
    console.log('📋 RESUMEN:')
    
    if (profilesError && profilesError.code === '42703') {
      console.log('❌ profiles: Faltan columnas mnemonic y diddocument')
    } else {
      console.log('✅ profiles: Columnas verificadas')
    }
    
    if (keysError && keysError.code === 'PGRST205') {
      console.log('❌ profile_keys: Tabla no existe')
    } else {
      console.log('✅ profile_keys: Tabla verificada')
    }
    
    console.log('')
    if ((profilesError && profilesError.code === '42703') || (keysError && keysError.code === 'PGRST205')) {
      console.log('🎯 ACCIÓN REQUERIDA:')
      console.log('   Ejecuta el SQL en Supabase SQL Editor:')
      console.log('   https://supabase.com/dashboard')
      console.log('')
      console.log('   SQL a ejecutar:')
      console.log('   ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mnemonic text;')
      console.log('   ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS did text;')
      console.log('   ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS diddocument jsonb;')
      console.log('   CREATE TABLE IF NOT EXISTS public.profile_keys (...);')
    } else {
      console.log('🎉 ¡Schema actualizado correctamente!')
      console.log('   El sistema de perfiles DID está listo para usar')
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

// Ejecutar verificación
verifySchemaChanges()
  .then(() => {
    console.log('✨ Verificación completada')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  })
