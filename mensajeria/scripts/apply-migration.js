const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan las variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  console.log('Variables encontradas:')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  console.log('🔄 Aplicando migración de profile keys...')
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'migrations', 'add-profile-keys.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('📄 Contenido de la migración:')
    console.log(migrationSQL)
    console.log('')
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL })
    
    if (error) {
      console.error('❌ Error aplicando migración:', error)
      
      // Try to execute each statement separately
      console.log('🔄 Intentando ejecutar cada statement por separado...')
      
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0)
      
      for (const statement of statements) {
        console.log(`📝 Ejecutando: ${statement.substring(0, 50)}...`)
        
        const { error: stmtError } = await supabase.rpc('exec_sql', { sql: statement + ';' })
        
        if (stmtError) {
          console.error(`❌ Error en statement: ${stmtError.message}`)
        } else {
          console.log('✅ Statement ejecutado correctamente')
        }
      }
    } else {
      console.log('✅ Migración aplicada exitosamente')
    }
    
    // Verify the tables exist
    console.log('🔍 Verificando que las tablas se crearon correctamente...')
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['profiles', 'profile_keys'])
    
    if (tablesError) {
      console.error('❌ Error verificando tablas:', tablesError)
    } else {
      console.log('📊 Tablas encontradas:', tables?.map(t => t.table_name))
    }
    
  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

// Ejecutar la migración
applyMigration()
  .then(() => {
    console.log('✨ Migración completada')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  })
