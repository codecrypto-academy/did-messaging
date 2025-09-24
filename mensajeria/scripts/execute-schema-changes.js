const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan las variables de entorno')
  console.log('Variables encontradas:')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function executeSchemaChanges() {
  console.log('🔄 Ejecutando cambios de schema...')
  
  try {
    // 1. Add columns to profiles table
    console.log('📝 Agregando columnas a la tabla profiles...')
    
    // Add mnemonic column
    const { error: mnemonicError } = await supabase
      .from('profiles')
      .select('mnemonic')
      .limit(1)
    
    if (mnemonicError && mnemonicError.code === '42703') {
      console.log('   - Agregando columna mnemonic...')
      // We need to use a different approach since exec function doesn't exist
      console.log('   ⚠️  Necesitamos ejecutar manualmente: ALTER TABLE public.profiles ADD COLUMN mnemonic text;')
    } else {
      console.log('   ✅ Columna mnemonic ya existe')
    }
    
    // Add diddocument column
    const { error: diddocError } = await supabase
      .from('profiles')
      .select('diddocument')
      .limit(1)
    
    if (diddocError && diddocError.code === '42703') {
      console.log('   - Agregando columna diddocument...')
      console.log('   ⚠️  Necesitamos ejecutar manualmente: ALTER TABLE public.profiles ADD COLUMN diddocument jsonb;')
    } else {
      console.log('   ✅ Columna diddocument ya existe')
    }

    // 2. Check if profile_keys table exists
    console.log('📝 Verificando tabla profile_keys...')
    
    const { error: tableError } = await supabase
      .from('profile_keys')
      .select('id')
      .limit(1)
    
    if (tableError && tableError.code === 'PGRST205') {
      console.log('   ⚠️  Tabla profile_keys no existe')
      console.log('   Necesitamos ejecutar manualmente la creación de la tabla')
    } else {
      console.log('   ✅ Tabla profile_keys ya existe')
    }

    // 3. Try to create the table using a different approach
    console.log('📝 Intentando crear tabla usando RPC...')
    
    // Create a function to execute SQL
    const createTableFunction = `
      CREATE OR REPLACE FUNCTION create_profile_keys_table()
      RETURNS void AS $$
      BEGIN
        -- Add columns to profiles if they don't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'mnemonic') THEN
          ALTER TABLE public.profiles ADD COLUMN mnemonic text;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'diddocument') THEN
          ALTER TABLE public.profiles ADD COLUMN diddocument jsonb;
        END IF;
        
        -- Create profile_keys table if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profile_keys') THEN
          CREATE TABLE public.profile_keys (
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
          CREATE INDEX idx_profile_keys_profile_id ON public.profile_keys (profile_id);
          CREATE INDEX idx_profile_keys_curve_type ON public.profile_keys (profile_id, curve_type);
          CREATE INDEX idx_profile_keys_key_usage ON public.profile_keys (profile_id, key_usage);
          
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
        END IF;
      END;
      $$ LANGUAGE plpgsql;
    `

    try {
      const { error: functionError } = await supabase
        .rpc('exec', { sql: createTableFunction })
      
      if (functionError) {
        console.log('   - Error creando función:', functionError.message)
      } else {
        console.log('   ✅ Función creada')
        
        // Execute the function
        const { error: execError } = await supabase
          .rpc('create_profile_keys_table')
        
        if (execError) {
          console.log('   - Error ejecutando función:', execError.message)
        } else {
          console.log('   ✅ Tabla y columnas creadas exitosamente')
        }
      }
    } catch (e) {
      console.log('   - Error con RPC:', e.message)
    }

    // 4. Verify the changes
    console.log('🔍 Verificando cambios...')
    
    // Check profiles columns
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, mnemonic, diddocument')
      .limit(1)
    
    if (profilesError) {
      console.log('   - Error verificando profiles:', profilesError.message)
    } else {
      console.log('   ✅ Tabla profiles verificada')
    }

    // Check profile_keys table
    const { data: keys, error: keysError } = await supabase
      .from('profile_keys')
      .select('id')
      .limit(1)
    
    if (keysError) {
      console.log('   - Error verificando profile_keys:', keysError.message)
    } else {
      console.log('   ✅ Tabla profile_keys verificada')
    }

    console.log('')
    console.log('📋 Si los comandos automáticos fallaron, ejecuta manualmente en Supabase SQL Editor:')
    console.log('')
    console.log('-- Agregar columnas a profiles:')
    console.log('ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mnemonic text;')
    console.log('ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS diddocument jsonb;')
    console.log('')
    console.log('-- Crear tabla profile_keys:')
    console.log('CREATE TABLE IF NOT EXISTS public.profile_keys (')
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
    console.log('CREATE INDEX IF NOT EXISTS idx_profile_keys_profile_id ON public.profile_keys (profile_id);')
    console.log('CREATE INDEX IF NOT EXISTS idx_profile_keys_curve_type ON public.profile_keys (profile_id, curve_type);')
    console.log('CREATE INDEX IF NOT EXISTS idx_profile_keys_key_usage ON public.profile_keys (profile_id, key_usage);')
    console.log('')
    console.log('-- Habilitar RLS:')
    console.log('ALTER TABLE public.profile_keys enable row level security;')
    console.log('')
    console.log('-- Crear políticas RLS:')
    console.log('CREATE POLICY "Users can view their own profile keys" ON public.profile_keys for select USING (profile_id = auth.uid());')
    console.log('CREATE POLICY "Users can insert their own profile keys" ON public.profile_keys for insert WITH CHECK (profile_id = auth.uid());')
    console.log('CREATE POLICY "Users can update their own profile keys" ON public.profile_keys for update USING (profile_id = auth.uid());')
    console.log('CREATE POLICY "Users can delete their own profile keys" ON public.profile_keys for delete USING (profile_id = auth.uid());')
    console.log('')
    console.log('-- Agregar trigger:')
    console.log('CREATE TRIGGER handle_updated_at before update on public.profile_keys for each row execute procedure public.handle_updated_at();')

  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

// Ejecutar los cambios
executeSchemaChanges()
  .then(() => {
    console.log('✨ Ejecución completada')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  })
