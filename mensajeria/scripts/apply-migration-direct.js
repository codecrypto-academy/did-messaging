const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan las variables de entorno')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  console.log('🔄 Aplicando migración de profile keys...')
  
  try {
    // 1. Add columns to profiles table
    console.log('📝 Agregando columnas a la tabla profiles...')
    
    // Add mnemonic column
    const { error: mnemonicError } = await supabase
      .from('profiles')
      .select('mnemonic')
      .limit(1)
    
    if (mnemonicError && mnemonicError.code === 'PGRST116') {
      console.log('   - Agregando columna mnemonic...')
      // We'll need to use raw SQL for ALTER TABLE
      console.log('   ⚠️  Necesitamos ejecutar ALTER TABLE manualmente')
    } else {
      console.log('   ✅ Columna mnemonic ya existe')
    }
    
    // Add diddocument column
    const { error: diddocError } = await supabase
      .from('profiles')
      .select('diddocument')
      .limit(1)
    
    if (diddocError && diddocError.code === 'PGRST116') {
      console.log('   - Agregando columna diddocument...')
      console.log('   ⚠️  Necesitamos ejecutar ALTER TABLE manualmente')
    } else {
      console.log('   ✅ Columna diddocument ya existe')
    }
    
    // 2. Create profile_keys table
    console.log('📝 Creando tabla profile_keys...')
    
    const { error: tableError } = await supabase
      .from('profile_keys')
      .select('id')
      .limit(1)
    
    if (tableError && tableError.code === 'PGRST116') {
      console.log('   ⚠️  Tabla profile_keys no existe, necesitamos crearla manualmente')
    } else {
      console.log('   ✅ Tabla profile_keys ya existe')
    }
    
    console.log('')
    console.log('📋 Para completar la migración, ejecuta estos comandos SQL en tu base de datos:')
    console.log('')
    console.log('-- Agregar columnas a profiles:')
    console.log('ALTER TABLE public.profiles ADD COLUMN mnemonic text;')
    console.log('ALTER TABLE public.profiles ADD COLUMN diddocument jsonb;')
    console.log('')
    console.log('-- Crear tabla profile_keys:')
    console.log('CREATE TABLE public.profile_keys (')
    console.log('  id uuid default uuid_generate_v4() primary key,')
    console.log('  profile_id uuid references public.profiles(id) on delete cascade,')
    console.log('  derived_path text not null,')
    console.log('  curve_type text not null check (curve_type in (\'ed25519\', \'x25519\')),')
    console.log('  key_usage text not null check (key_usage in (\'authorization\', \'keyAgreement\', \'assertion\')),')
    console.log('  public_key text not null,')
    console.log('  private_key text not null,')
    console.log('  created_at timestamp with time zone default timezone(\'utc\'::text, now()) not null,')
    console.log('  updated_at timestamp with time zone default timezone(\'utc\'::text, now()) not null')
    console.log(');')
    console.log('')
    console.log('-- Crear índices:')
    console.log('CREATE INDEX ON public.profile_keys (profile_id);')
    console.log('CREATE INDEX ON public.profile_keys (profile_id, curve_type);')
    console.log('CREATE INDEX ON public.profile_keys (profile_id, key_usage);')
    console.log('')
    console.log('-- Habilitar RLS:')
    console.log('ALTER TABLE public.profile_keys enable row level security;')
    
  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

// Ejecutar la migración
applyMigration()
  .then(() => {
    console.log('✨ Verificación completada')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  })
