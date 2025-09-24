const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan las variables de entorno')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTables() {
  console.log('🔄 Creando tablas para profile keys...')
  
  try {
    // 1. Add columns to profiles table
    console.log('📝 Agregando columnas a la tabla profiles...')
    
    // Try to add mnemonic column
    try {
      const { error: mnemonicError } = await supabase
        .rpc('exec', { sql: 'ALTER TABLE public.profiles ADD COLUMN mnemonic text;' })
      
      if (mnemonicError) {
        console.log('   - Columna mnemonic ya existe o error:', mnemonicError.message)
      } else {
        console.log('   ✅ Columna mnemonic agregada')
      }
    } catch (e) {
      console.log('   - Error agregando mnemonic:', e.message)
    }

    // Try to add diddocument column
    try {
      const { error: diddocError } = await supabase
        .rpc('exec', { sql: 'ALTER TABLE public.profiles ADD COLUMN diddocument jsonb;' })
      
      if (diddocError) {
        console.log('   - Columna diddocument ya existe o error:', diddocError.message)
      } else {
        console.log('   ✅ Columna diddocument agregada')
      }
    } catch (e) {
      console.log('   - Error agregando diddocument:', e.message)
    }

    // 2. Create profile_keys table
    console.log('📝 Creando tabla profile_keys...')
    
    const createTableSQL = `
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
    `

    try {
      const { error: tableError } = await supabase
        .rpc('exec', { sql: createTableSQL })
      
      if (tableError) {
        console.log('   - Error creando tabla:', tableError.message)
      } else {
        console.log('   ✅ Tabla profile_keys creada')
      }
    } catch (e) {
      console.log('   - Error creando tabla:', e.message)
    }

    // 3. Create indexes
    console.log('📝 Creando índices...')
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_profile_keys_profile_id ON public.profile_keys (profile_id);',
      'CREATE INDEX IF NOT EXISTS idx_profile_keys_curve_type ON public.profile_keys (profile_id, curve_type);',
      'CREATE INDEX IF NOT EXISTS idx_profile_keys_key_usage ON public.profile_keys (profile_id, key_usage);'
    ]

    for (const indexSQL of indexes) {
      try {
        const { error: indexError } = await supabase
          .rpc('exec', { sql: indexSQL })
        
        if (indexError) {
          console.log('   - Error creando índice:', indexError.message)
        } else {
          console.log('   ✅ Índice creado')
        }
      } catch (e) {
        console.log('   - Error creando índice:', e.message)
      }
    }

    // 4. Enable RLS
    console.log('📝 Habilitando RLS...')
    
    try {
      const { error: rlsError } = await supabase
        .rpc('exec', { sql: 'ALTER TABLE public.profile_keys enable row level security;' })
      
      if (rlsError) {
        console.log('   - Error habilitando RLS:', rlsError.message)
      } else {
        console.log('   ✅ RLS habilitado')
      }
    } catch (e) {
      console.log('   - Error habilitando RLS:', e.message)
    }

    // 5. Create RLS policies
    console.log('📝 Creando políticas RLS...')
    
    const policies = [
      `CREATE POLICY "Users can view their own profile keys"
        ON public.profile_keys for select
        USING (profile_id = auth.uid());`,
      
      `CREATE POLICY "Users can insert their own profile keys"
        ON public.profile_keys for insert
        WITH CHECK (profile_id = auth.uid());`,
      
      `CREATE POLICY "Users can update their own profile keys"
        ON public.profile_keys for update
        USING (profile_id = auth.uid());`,
      
      `CREATE POLICY "Users can delete their own profile keys"
        ON public.profile_keys for delete
        USING (profile_id = auth.uid());`
    ]

    for (const policySQL of policies) {
      try {
        const { error: policyError } = await supabase
          .rpc('exec', { sql: policySQL })
        
        if (policyError) {
          console.log('   - Error creando política:', policyError.message)
        } else {
          console.log('   ✅ Política creada')
        }
      } catch (e) {
        console.log('   - Error creando política:', e.message)
      }
    }

    // 6. Add trigger for updated_at
    console.log('📝 Agregando trigger updated_at...')
    
    try {
      const { error: triggerError } = await supabase
        .rpc('exec', { sql: `
          CREATE TRIGGER handle_updated_at before update on public.profile_keys
            for each row execute procedure public.handle_updated_at();
        ` })
      
      if (triggerError) {
        console.log('   - Error creando trigger:', triggerError.message)
      } else {
        console.log('   ✅ Trigger creado')
      }
    } catch (e) {
      console.log('   - Error creando trigger:', e.message)
    }

    console.log('')
    console.log('🎉 Configuración completada!')
    console.log('📋 Instrucciones para completar manualmente:')
    console.log('')
    console.log('1. Ve a tu panel de Supabase')
    console.log('2. Abre el SQL Editor')
    console.log('3. Ejecuta estos comandos:')
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

// Ejecutar la creación
createTables()
  .then(() => {
    console.log('✨ Script completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  })
