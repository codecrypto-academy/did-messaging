# Scripts para Generación de DIDs

Este documento describe los scripts disponibles para generar DIDs del estilo `did:web:user/alice` en el sistema.

## 🚀 Scripts Disponibles

### 1. Script Básico - `generate-dids.sh`

Genera 20 DIDs del estilo `did:web:user/*` con nombres predefinidos.

```bash
./generate-dids.sh
```

**Características:**
- ✅ Genera 20 DIDs automáticamente
- ✅ Usa nombres predefinidos (alice, bob, charlie, etc.)
- ✅ Incluye servicios completos
- ✅ Verifica cada DID creado
- ✅ Muestra estadísticas de la base de datos

### 2. Script Avanzado - `generate-dids-advanced.sh`

Script configurable con múltiples opciones.

```bash
./generate-dids-advanced.sh [opciones]
```

**Opciones disponibles:**
- `-c, --count <número>`: Número de DIDs a generar (default: 10)
- `-p, --prefix <string>`: Prefijo del DID (default: "user")
- `-d, --domain <string>`: Dominio para servicios (default: "example.com")
- `--no-services`: No incluir endpoints de servicios
- `--no-social`: No incluir URLs de perfiles sociales
- `-o, --output <archivo>`: Guardar resultados en archivo JSON
- `--config <archivo>`: Cargar configuración desde archivo JSON
- `-h, --help`: Mostrar ayuda

**Ejemplos:**

```bash
# Generar 5 DIDs con prefijo "org"
./generate-dids-advanced.sh --count 5 --prefix org

# Generar DIDs para una empresa específica
./generate-dids-advanced.sh --prefix employee --domain mycompany.com --count 10

# Generar DIDs sin servicios
./generate-dids-advanced.sh --count 15 --no-services

# Guardar resultados en archivo
./generate-dids-advanced.sh --count 20 --output results.json

# Usar archivo de configuración
./generate-dids-advanced.sh --config config-example.json
```

### 3. Script de Verificación - `checkDIDs.ts`

Verifica y muestra estadísticas de los DIDs en la base de datos.

```bash
cd did-api-client
npx ts-node src/scripts/checkDIDs.ts
```

**Características:**
- ✅ Muestra total de DIDs en la base de datos
- ✅ Agrupa DIDs por método
- ✅ Muestra ejemplos de DIDs creados
- ✅ Información de servicios y claves

## 📋 Archivos de Configuración

### `config-example.json`

```json
{
  "count": 15,
  "prefix": "user",
  "domain": "mycompany.com",
  "includeServices": true,
  "includeSocialProfiles": true
}
```

## 🎯 Tipos de DIDs Generados

### Formato Básico
```
did:web:user/alice
did:web:user/bob
did:web:user/charlie
```

### Formato Organizacional
```
did:web:org/alice
did:web:org/bob
did:web:org/charlie
```

### Formato Personalizado
```
did:web:employee/john
did:web:customer/mary
did:web:partner/techcorp
```

## 🔧 Servicios Incluidos

Cada DID generado incluye los siguientes servicios:

1. **VerifiableCredentialService**: Para credenciales verificables
2. **HubService**: Para servicios de hub
3. **ProfileService**: Para perfiles de usuario

**URLs de ejemplo:**
- `https://example.com/vc/alice/`
- `https://example.com/hub/alice/`
- `https://example.com/profile/alice/`

## 🔑 Claves Criptográficas

Cada DID incluye:

1. **Ed25519**: Para firmas digitales y autenticación
2. **X25519**: Para acuerdo de claves y cifrado

Las claves privadas se almacenan encriptadas en la base de datos.

## 📊 Estadísticas Actuales

Para verificar el estado actual de la base de datos:

```bash
cd did-api-client
npx ts-node src/scripts/checkDIDs.ts
```

## 🚀 Uso Rápido

1. **Iniciar el sistema:**
   ```bash
   ./start-local.sh
   ```

2. **Generar DIDs básicos:**
   ```bash
   ./generate-dids.sh
   ```

3. **Generar DIDs personalizados:**
   ```bash
   ./generate-dids-advanced.sh --count 10 --prefix employee --domain mycompany.com
   ```

4. **Verificar resultados:**
   ```bash
   cd did-api-client && npx ts-node src/scripts/checkDIDs.ts
   ```

## 🔍 Verificación en Supabase Studio

Puedes ver todos los DIDs generados en:
- **URL**: http://localhost:54323
- **Tablas**: `dids`, `did_documents`, `private_keys`

## 📝 Archivos de Resultados

Los scripts avanzados pueden generar archivos JSON con:
- Configuración utilizada
- Lista de DIDs creados exitosamente
- Errores encontrados
- Estadísticas de éxito
- Timestamps de creación

## 🛠️ Personalización

Para crear tus propios scripts, puedes usar las funciones exportadas:

```typescript
import { generateMultipleDIDs, generateDIDsWithConfig } from './src/scripts/generateDIDs';
import { checkDIDs } from './src/scripts/checkDIDs';
```

## 🎉 Resultados Esperados

Con los scripts configurados correctamente, deberías ver:

- ✅ 100% de éxito en la creación de DIDs
- ✅ Verificación automática de cada DID
- ✅ Estadísticas detalladas de la base de datos
- ✅ Archivos de resultados (si se especifica)
- ✅ Logs detallados del proceso
