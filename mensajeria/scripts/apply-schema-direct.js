const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan las variables de entorno')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applySchemaDirect() {
  console.log('🔄 Aplicando cambios de schema directamente...')
  
  try {
    // 1. First, let's try to create a simple test to see if we can execute SQL
    console.log('📝 Probando conexión y permisos...')
    
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
    
    if (testError) {
      console.error('❌ Error de conexión:', testError)
      return
    }
    
    console.log('✅ Conexión establecida correctamente')
    
    // 2. Try to add columns using a different approach
    console.log('📝 Intentando agregar columnas...')
    
    // We'll use the migration approach by creating a new migration file
    const migrationSQL = `
-- Add columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mnemonic text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS diddocument jsonb;

-- Create profile_keys table
CREATE TABLE IF NOT EXISTS public.profile_keys (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade,
  derived_path text not null,
  curve_type text not null check (curve_type in ('ed25519', 'x25519')),
  key_usage text not null check (key_usage in ('authorization', 'keyAgreement', 'assertion')),
  public_key text not null,
  private_key text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profile_keys_profile_id ON public.profile_keys (profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_keys_curve_type ON public.profile_keys (profile_id, curve_type);
CREATE INDEX IF NOT EXISTS idx_profile_keys_key_usage ON public.profile_keys (profile_id, key_usage);

-- Enable RLS
ALTER TABLE public.profile_keys enable row level security;

-- Create RLS policies
CREATE POLICY "Users can view their own profile keys"
  ON public.profile_keys for select
  USING (profile_id = auth.uid());

CREATE POLICY "Users can insert their own profile keys"
  ON public.profile_keys for insert
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update their own profile keys"
  ON public.profile_keys for update
  USING (profile_id = auth.uid());

CREATE POLICY "Users can delete their own profile keys"
  ON public.profile_keys for delete
  USING (profile_id = auth.uid());

-- Add trigger
CREATE TRIGGER handle_updated_at before update on public.profile_keys
  for each row execute procedure public.handle_updated_at();
`

    // Save migration file
    const fs = require('fs')
    const path = require('path')
    const migrationPath = path.join(__dirname, '..', 'migrations', '20240101000002_add_profile_keys.sql')
    
    fs.writeFileSync(migrationPath, migrationSQL)
    console.log('✅ Archivo de migración creado:', migrationPath)
    
    // 3. Try to execute using Supabase CLI approach
    console.log('📝 Intentando ejecutar migración...')
    
    // Since we can't execute SQL directly, we'll provide instructions
    console.log('')
    console.log('🎯 INSTRUCCIONES PARA EJECUTAR EL SCHEMA:')
    console.log('')
    console.log('1. Ve a tu panel de Supabase (https://supabase.com/dashboard)')
    console.log('2. Selecciona tu proyecto')
    console.log('3. Ve a "SQL Editor" en el menú lateral')
    console.log('4. Copia y pega el siguiente SQL:')
    console.log('')
    console.log('```sql')
    console.log(migrationSQL)
    console.log('```')
    console.log('')
    console.log('5. Haz clic en "Run" para ejecutar el SQL')
    console.log('')
    console.log('6. Verifica que las tablas se crearon correctamente')
    console.log('')
    console.log('📁 El archivo de migración se guardó en:')
    console.log(`   ${migrationPath}`)
    
    // 4. Test if we can at least verify the current state
    console.log('')
    console.log('🔍 Verificando estado actual...')
    
    // Check if columns exist
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username')
      .limit(1)
    
    if (profilesError) {
      console.log('❌ Error verificando profiles:', profilesError.message)
    } else {
      console.log('✅ Tabla profiles accesible')
    }
    
    // Check if profile_keys exists
    const { data: keys, error: keysError } = await supabase
      .from('profile_keys')
      .select('id')
      .limit(1)
    
    if (keysError) {
      console.log('❌ Tabla profile_keys no existe:', keysError.message)
    } else {
      console.log('✅ Tabla profile_keys accesible')
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

// Ejecutar
applySchemaDirect()
  .then(() => {
    console.log('✨ Script completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  })
