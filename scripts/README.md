# Scripts de Utilidades DID

Este directorio contiene scripts utilitarios para el proyecto de DIDs.

## Scripts disponibles

### clear-database.ts

Script para limpiar todos los registros de la base de datos de Supabase.

### setup-realtime.ts

Script para configurar Supabase Realtime en las tablas necesarias.

**Características:**
- 🧹 Limpia todas las tablas del proyecto DID
- 📊 Muestra conteo de registros antes y después
- ⚠️ Pide confirmación antes de ejecutar
- 🔄 Respeta el orden de foreign keys

**Tablas que limpia:**
- `messages` - Mensajes entre DIDs
- `conversations` - Conversaciones
- `private_keys` - Claves privadas de DIDs
- `did_documents` - Documentos DID
- `dids` - DIDs principales

## Instalación

```bash
cd scripts
npm install
```

## Uso

### Limpiar base de datos:
```bash
# Ejecutar el script interactivo
npm run clear-db

# Ejecutar sin confirmación (para scripts automatizados)
npm run clear-db:force

# Ejecutar directamente
npx tsx clear-database.ts
```

### Configurar Realtime:
```bash
# Ejecutar script de configuración
npm run setup-realtime

# O ejecutar directamente
npx tsx setup-realtime.ts
```

### Habilitar Realtime manualmente:

#### Opción 1: Usar Supabase Studio
1. Abre http://localhost:54323 (Supabase Studio)
2. Ve a Database → Replication
3. Habilita realtime para las tablas:
   - `messages` (eventos: INSERT, UPDATE, DELETE)
   - `conversations` (eventos: INSERT, UPDATE, DELETE)

#### Opción 2: Usar SQL
Ejecuta el archivo `enable-realtime.sql` en Supabase Studio → SQL Editor

## Configuración

El script utiliza las variables de entorno del archivo `.env.local` del proyecto web:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Seguridad

⚠️ **IMPORTANTE**: Este script borra TODOS los registros de las tablas. Úsalo solo en entornos de desarrollo.

El script:
- Pide confirmación antes de ejecutar
- Muestra el conteo de registros antes y después
- No borra la estructura de las tablas, solo los datos