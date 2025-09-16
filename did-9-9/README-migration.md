# Migración: Campo `name` en Claves Privadas

## 📋 Resumen

Se ha agregado un campo `name` a la tabla `private_keys` para identificar de manera legible cada par de claves criptográficas.

## 🔄 Cambios Realizados

### 1. Base de Datos

**Tabla `private_keys` actualizada:**
```sql
ALTER TABLE private_keys 
ADD COLUMN name VARCHAR(100) NOT NULL;
```

**Índices agregados:**
```sql
CREATE INDEX idx_private_keys_name ON private_keys(name);
CREATE UNIQUE INDEX idx_private_keys_did_name_unique ON private_keys(did_id, name);
```

### 2. Tipos TypeScript

**Interfaz `PrivateKeyRecord` actualizada:**
```typescript
export interface PrivateKeyRecord {
  id: string;
  did_id: string;
  key_type: 'ed25519' | 'x25519';
  name: string;                    // ← NUEVO CAMPO
  encrypted_private_key: string;
  public_key: string;
  key_derivation_path: string;
  created_at: string;
  updated_at: string;
}
```

**Interfaz `EncryptedKeyPair` actualizada:**
```typescript
export interface EncryptedKeyPair {
  encryptedPrivateKey: string;
  publicKey: string;
  keyType: 'ed25519' | 'x25519';
  name: string;                    // ← NUEVO CAMPO
  derivationPath: string;
}
```

### 3. Generación de Claves

**Nombres por defecto:**
- **Ed25519**: `signing-key` (para firmas digitales)
- **X25519**: `encryption-key` (para cifrado/acuerdo de claves)

## 🚀 Aplicación de la Migración

### Script de Migración
```bash
./apply-migration.sh
```

### Migración Manual
```bash
# Aplicar el archivo de migración
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f did-api/migration-add-name-to-keys.sql
```

## 📊 Estado Actual

### DIDs Existentes
- **Total DIDs**: 26
- **Claves con nombres**: 52 (26 × 2 claves por DID)
- **Nombres utilizados**:
  - `signing-key`: 26 claves Ed25519
  - `encryption-key`: 26 claves X25519

### Verificación
```bash
# Verificar claves con nombres
cd did-api-client
npx ts-node src/scripts/checkKeysWithNames.ts
```

## 🔧 Uso del Campo `name`

### Crear DID con Nombres Personalizados
```typescript
// Los nombres se asignan automáticamente:
// - Ed25519 → 'signing-key'
// - X25519 → 'encryption-key'

const result = await client.createDID({
  did: 'did:web:user/alice',
  document: { /* DID document */ }
});

// Acceder a los nombres de las claves
result.data.keys.forEach(key => {
  console.log(`${key.key_type}: ${key.name}`);
  // Output: ed25519: signing-key
  //         x25519: encryption-key
});
```

### Consultar Claves por Nombre
```sql
-- Buscar todas las claves de firma
SELECT * FROM private_keys WHERE name = 'signing-key';

-- Buscar claves de un DID específico por nombre
SELECT * FROM private_keys 
WHERE did_id = 'uuid-del-did' AND name = 'encryption-key';
```

## 🎯 Beneficios

1. **Identificación Clara**: Cada clave tiene un nombre descriptivo
2. **Organización**: Fácil distinguir entre claves de firma y cifrado
3. **Consultas**: Búsquedas más eficientes por nombre
4. **Extensibilidad**: Preparado para múltiples claves del mismo tipo
5. **Compatibilidad**: No rompe funcionalidad existente

## 🔮 Futuras Mejoras

### Múltiples Claves del Mismo Tipo
```typescript
// Futuro: Múltiples claves de firma
{
  name: 'primary-signing-key',
  key_type: 'ed25519'
},
{
  name: 'backup-signing-key', 
  key_type: 'ed25519'
}
```

### Nombres Personalizados
```typescript
// Futuro: Permitir nombres personalizados
const keyPairs = generateEncryptedKeyPairs(derivationPath, {
  ed25519Name: 'main-signing-key',
  x25519Name: 'communication-key'
});
```

## ✅ Verificación de la Migración

### 1. Verificar Campo en Base de Datos
```sql
SELECT name, key_type, COUNT(*) 
FROM private_keys 
GROUP BY name, key_type;
```

### 2. Verificar API
```bash
# Crear un nuevo DID y verificar nombres
curl -X POST http://localhost:3000/api/v1/dids \
  -H "Content-Type: application/json" \
  -d '{"did":"did:web:test/verification","document":{...}}'
```

### 3. Verificar Cliente
```bash
cd did-api-client
npx ts-node src/scripts/checkKeysWithNames.ts
```

## 🛠️ Rollback (Si es Necesario)

```sql
-- Eliminar índices
DROP INDEX IF EXISTS idx_private_keys_did_name_unique;
DROP INDEX IF EXISTS idx_private_keys_name;

-- Eliminar columna
ALTER TABLE private_keys DROP COLUMN name;
```

## 📝 Notas Importantes

- ✅ **Migración Reversible**: Se puede hacer rollback si es necesario
- ✅ **Compatibilidad**: No afecta funcionalidad existente
- ✅ **Índices Únicos**: Previene nombres duplicados por DID
- ✅ **Valores por Defecto**: DIDs existentes actualizados automáticamente
- ✅ **Validación**: Campo NOT NULL para garantizar consistencia
