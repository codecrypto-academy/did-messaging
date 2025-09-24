const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan las variables de entorno')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addMissingColumns() {
  console.log('🔄 Agregando columnas faltantes a la tabla profiles...')
  
  try {
    // 1. Check current state
    console.log('📊 Verificando estado actual...')
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username')
      .limit(1)
    
    if (profilesError) {
      console.error('❌ Error accediendo a profiles:', profilesError)
      return
    }
    
    console.log('✅ Tabla profiles accesible')
    
    // 2. Try to add mnemonic column
    console.log('📝 Agregando columna mnemonic...')
    try {
      const { error: mnemonicError } = await supabase
        .from('profiles')
        .select('mnemonic')
        .limit(1)
      
      if (mnemonicError && mnemonicError.code === '42703') {
        console.log('   - Columna mnemonic no existe, necesitamos crearla')
        console.log('   ⚠️  Ejecuta: ALTER TABLE public.profiles ADD COLUMN mnemonic text;')
      } else {
        console.log('   ✅ Columna mnemonic ya existe')
      }
    } catch (e) {
      console.log('   - Error verificando mnemonic:', e.message)
    }
    
    // 3. Try to add did column
    console.log('📝 Agregando columna did...')
    try {
      const { error: didError } = await supabase
        .from('profiles')
        .select('did')
        .limit(1)
      
      if (didError && didError.code === '42703') {
        console.log('   - Columna did no existe, necesitamos crearla')
        console.log('   ⚠️  Ejecuta: ALTER TABLE public.profiles ADD COLUMN did text;')
      } else {
        console.log('   ✅ Columna did ya existe')
      }
    } catch (e) {
      console.log('   - Error verificando did:', e.message)
    }
    
    // 4. Try to add diddocument column
    console.log('📝 Agregando columna diddocument...')
    try {
      const { error: diddocError } = await supabase
        .from('profiles')
        .select('diddocument')
        .limit(1)
      
      if (diddocError && diddocError.code === '42703') {
        console.log('   - Columna diddocument no existe, necesitamos crearla')
        console.log('   ⚠️  Ejecuta: ALTER TABLE public.profiles ADD COLUMN diddocument jsonb;')
      } else {
        console.log('   ✅ Columna diddocument ya existe')
      }
    } catch (e) {
      console.log('   - Error verificando diddocument:', e.message)
    }
    
    console.log('')
    console.log('🎯 INSTRUCCIONES URGENTES:')
    console.log('')
    console.log('1. Ve a Supabase SQL Editor: https://supabase.com/dashboard')
    console.log('2. Ejecuta estos comandos UNO POR UNO:')
    console.log('')
    console.log('-- Comando 1:')
    console.log('ALTER TABLE public.profiles ADD COLUMN mnemonic text;')
    console.log('')
    console.log('-- Comando 2:')
    console.log('ALTER TABLE public.profiles ADD COLUMN did text;')
    console.log('')
    console.log('-- Comando 3:')
    console.log('ALTER TABLE public.profiles ADD COLUMN diddocument jsonb;')
    console.log('')
    console.log('3. Después de cada comando, verifica que no hay errores')
    console.log('4. Ejecuta este script de nuevo para verificar:')
    console.log('   node scripts/add-missing-columns.js')
    
    // 5. Create a simple test to verify columns exist
    console.log('')
    console.log('🧪 Después de ejecutar los comandos, ejecuta:')
    console.log('   node scripts/verify-schema-changes.js')
    console.log('   para verificar que todo esté correcto')

  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

// Ejecutar
addMissingColumns()
  .then(() => {
    console.log('✨ Script completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  })
