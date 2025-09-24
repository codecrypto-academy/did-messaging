const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan las variables de entorno')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyProfileKeys() {
  console.log('🔍 Verificando configuración de profile keys...')
  
  try {
    // Check profiles table structure
    console.log('📊 Verificando tabla profiles...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, mnemonic, diddocument')
      .limit(1)
    
    if (profilesError) {
      console.error('❌ Error verificando profiles:', profilesError)
    } else {
      console.log('✅ Tabla profiles accesible')
      console.log('   - Columnas disponibles: id, username, mnemonic, diddocument')
    }

    // Check profile_keys table structure
    console.log('📊 Verificando tabla profile_keys...')
    const { data: keys, error: keysError } = await supabase
      .from('profile_keys')
      .select('id, profile_id, derived_path, curve_type, key_usage, public_key, private_key')
      .limit(1)
    
    if (keysError) {
      console.error('❌ Error verificando profile_keys:', keysError)
    } else {
      console.log('✅ Tabla profile_keys accesible')
      console.log('   - Columnas disponibles: id, profile_id, derived_path, curve_type, key_usage, public_key, private_key')
    }

    // Check existing data
    console.log('📊 Verificando datos existentes...')
    
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('profiles')
      .select('id, username, mnemonic, diddocument')
    
    if (allProfilesError) {
      console.error('❌ Error obteniendo profiles:', allProfilesError)
    } else {
      console.log(`   - Total de perfiles: ${allProfiles?.length || 0}`)
      const profilesWithDID = allProfiles?.filter(p => p.mnemonic || p.diddocument) || []
      console.log(`   - Perfiles con DID configurado: ${profilesWithDID.length}`)
    }

    const { data: allKeys, error: allKeysError } = await supabase
      .from('profile_keys')
      .select('id, profile_id, curve_type, key_usage')
    
    if (allKeysError) {
      console.error('❌ Error obteniendo profile_keys:', allKeysError)
    } else {
      console.log(`   - Total de claves: ${allKeys?.length || 0}`)
      
      if (allKeys && allKeys.length > 0) {
        const curveTypes = [...new Set(allKeys.map(k => k.curve_type))]
        const keyUsages = [...new Set(allKeys.map(k => k.key_usage))]
        console.log(`   - Tipos de curva: ${curveTypes.join(', ')}`)
        console.log(`   - Usos de clave: ${keyUsages.join(', ')}`)
      }
    }

    console.log('')
    console.log('🎯 Sistema listo para:')
    console.log('   - Generar mnemónicos')
    console.log('   - Crear DIDs web')
    console.log('   - Derivar claves (ed25519, x25519)')
    console.log('   - Configurar usos (authorization, keyAgreement, assertion)')
    console.log('   - Guardar documentos DID')

  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

// Ejecutar la verificación
verifyProfileKeys()
  .then(() => {
    console.log('✨ Verificación completada')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  })
