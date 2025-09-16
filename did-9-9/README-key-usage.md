# Campo `key_usage` en Claves Privadas

## 📋 Resumen

Se ha agregado un campo `key_usage` a la tabla `private_keys` que especifica cómo se utiliza cada clave en el DID Document. Este campo puede tener valores de `authentication`, `assertionMethod`, o `keyAgreement`, y afecta directamente la estructura del DID Document generado.

## 🔄 Cambios Implementados

### 1. Base de Datos

**Tabla `private_keys` actualizada:**
```sql
ALTER TABLE private_keys 
ADD COLUMN key_usage VARCHAR(20) NOT NULL;
```

**Valores permitidos:**
- `authentication`: Para autenticación y firmas
- `assertionMethod`: Para aserciones y credenciales
- `keyAgreement`: Para acuerdo de claves y cifrado

**Índices agregados:**
```sql
CREATE INDEX idx_private_keys_key_usage ON private_keys(key_usage);
```

### 2. Tipos TypeScript

**Nuevo tipo `KeyUsage`:**
```typescript
export type KeyUsage = 'authentication' | 'assertionMethod' | 'keyAgreement';
```

**Interfaz `PrivateKeyRecord` actualizada:**
```typescript
export interface PrivateKeyRecord {
  id: string;
  did_id: string;
  key_type: 'ed25519' | 'x25519';
  name: string;
  key_usage: KeyUsage;  // ← NUEVO CAMPO
  encrypted_private_key: string;
  public_key: string;
  key_derivation_path: string;
  created_at: string;
  updated_at: string;
}
```

### 3. Generación de Claves

**Asignación automática por tipo de clave:**
- **Ed25519**: `authentication` (para firmas digitales)
- **X25519**: `keyAgreement` (para acuerdo de claves)

### 4. Generación de DID Document

**Función `generateDIDDocumentFromKeys`:**
```typescript
static generateDIDDocumentFromKeys(did: string, keys: PrivateKeyRecord[]): DIDDocument {
  // Genera verificationMethod para todas las claves
  const verificationMethods = keys.map((key, index) => ({
    id: `${did}#key-${index + 1}`,
    type: key.key_type === 'ed25519' ? 'Ed25519VerificationKey2020' : 'X25519KeyAgreementKey2020',
    controller: did,
    publicKeyMultibase: key.public_key
  }));

  // Agrupa claves por uso
  const authenticationKeys = keys.filter(k => k.key_usage === 'authentication').map((_, i) => `${did}#key-${i + 1}`);
  const assertionMethodKeys = keys.filter(k => k.key_usage === 'assertionMethod').map((_, i) => `${did}#key-${i + 1}`);
  const keyAgreementKeys = keys.filter(k => k.key_usage === 'keyAgreement').map((_, i) => `${did}#key-${i + 1}`);

  return {
    '@context': ['https://www.w3.org/ns/did/v1', ...],
    id: did,
    verificationMethod: verificationMethods,
    ...(authenticationKeys.length > 0 && { authentication: authenticationKeys }),
    ...(assertionMethodKeys.length > 0 && { assertionMethod: assertionMethodKeys }),
    ...(keyAgreementKeys.length > 0 && { keyAgreement: keyAgreementKeys }),
    controller: did
  };
}
```

## 🎯 Impacto en DID Documents

### Estructura del DID Document

El campo `key_usage` determina qué propiedades se incluyen en el DID Document:

| Key Usage | DID Document Property | Descripción |
|-----------|----------------------|-------------|
| `authentication` | `authentication` | Claves para autenticación y firmas |
| `assertionMethod` | `assertionMethod` | Claves para aserciones y credenciales |
| `keyAgreement` | `keyAgreement` | Claves para acuerdo de claves y cifrado |

### Ejemplo de DID Document Generado

```json
{
  "@context": [
    "https://www.w3.org/ns/did/v1",
    "https://w3id.org/security/suites/ed25519-2020/v1",
    "https://w3id.org/security/suites/x25519-2020/v1"
  ],
  "id": "did:web:example/user",
  "verificationMethod": [
    {
      "id": "did:web:example/user#key-1",
      "type": "Ed25519VerificationKey2020",
      "controller": "did:web:example/user",
      "publicKeyMultibase": "n4s0ZuZSUNUhLVAQ5+C2zS4YAN2TCwazX4yI7uf21eo="
    },
    {
      "id": "did:web:example/user#key-2",
      "type": "X25519KeyAgreementKey2020",
      "controller": "did:web:example/user",
      "publicKeyMultibase": "roVxcN6p8JvxN8IXa6CZM/eZSUsIU6hkETiWfOC44Rk="
    }
  ],
  "authentication": ["did:web:example/user#key-1"],
  "keyAgreement": ["did:web:example/user#key-2"],
  "controller": "did:web:example/user"
}
```

## 📊 Estado Actual

### Estadísticas de la Base de Datos
- **Total DIDs**: 26
- **Total Claves**: 52
- **Distribución por uso**:
  - `authentication`: 26 claves (50%)
  - `keyAgreement`: 26 claves (50%)
- **Distribución por tipo**:
  - `ed25519`: 26 claves (50%)
  - `x25519`: 26 claves (50%)

### Patrones de Uso
- **DIDs de uso mixto**: 26 (todos los DIDs actuales)
- **DIDs solo autenticación**: 0
- **DIDs solo acuerdo de claves**: 0

## 🧪 Scripts de Prueba

### 1. Verificar Key Usage
```bash
cd did-api-client
npx ts-node src/scripts/checkKeyUsage.ts
```

### 2. Demostrar Impacto en DID Document
```bash
cd did-api-client
npx ts-node src/scripts/demonstrateKeyUsage.ts
```

### 3. Probar Funcionalidad Básica
```bash
cd did-api-client
npx ts-node src/scripts/testKeyUsage.ts
```

## 🔧 Uso del Campo `key_usage`

### Crear DID con Key Usage Automático
```typescript
const result = await client.createDID({
  did: 'did:web:user/alice',
  document: { /* DID document */ }
});

// Las claves se asignan automáticamente:
// - Ed25519 → authentication
// - X25519 → keyAgreement
```

### Consultar Claves por Uso
```sql
-- Buscar todas las claves de autenticación
SELECT * FROM private_keys WHERE key_usage = 'authentication';

-- Buscar claves de acuerdo de claves
SELECT * FROM private_keys WHERE key_usage = 'keyAgreement';

-- Buscar claves de aserción
SELECT * FROM private_keys WHERE key_usage = 'assertionMethod';
```

### Generar DID Document Personalizado
```typescript
import { DIDModel } from './src/models/DIDModel';

const keys = await getKeysForDID('did:web:user/alice');
const didDocument = DIDModel.generateDIDDocumentFromKeys('did:web:user/alice', keys);
```

## 🎭 Escenarios de Uso

### 1. DID Solo para Autenticación
```typescript
// Solo claves Ed25519 con usage 'authentication'
const authOnlyDID = {
  verificationMethod: [/* Ed25519 keys */],
  authentication: ["did:web:example#key-1"]
  // No incluye keyAgreement ni assertionMethod
};
```

### 2. DID Solo para Acuerdo de Claves
```typescript
// Solo claves X25519 con usage 'keyAgreement'
const agreementOnlyDID = {
  verificationMethod: [/* X25519 keys */],
  keyAgreement: ["did:web:example#key-1"]
  // No incluye authentication ni assertionMethod
};
```

### 3. DID de Uso Mixto (Actual)
```typescript
// Claves Ed25519 + X25519 con usos diferentes
const mixedDID = {
  verificationMethod: [/* Ed25519 + X25519 keys */],
  authentication: ["did:web:example#key-1"],
  keyAgreement: ["did:web:example#key-2"]
  // Incluye ambos usos
};
```

## 🔮 Futuras Mejoras

### 1. Múltiples Claves del Mismo Uso
```typescript
// Futuro: Múltiples claves de autenticación
{
  name: 'primary-auth-key',
  key_usage: 'authentication',
  key_type: 'ed25519'
},
{
  name: 'backup-auth-key',
  key_usage: 'authentication', 
  key_type: 'ed25519'
}
```

### 2. Claves de Aserción
```typescript
// Futuro: Claves para credenciales
{
  name: 'credential-signing-key',
  key_usage: 'assertionMethod',
  key_type: 'ed25519'
}
```

### 3. Key Usage Personalizado
```typescript
// Futuro: Permitir asignar key_usage personalizado
const keyPairs = generateEncryptedKeyPairs(derivationPath, {
  ed25519Usage: 'assertionMethod',
  x25519Usage: 'keyAgreement'
});
```

## ✅ Verificación de la Migración

### 1. Verificar Campo en Base de Datos
```sql
SELECT key_usage, key_type, COUNT(*) 
FROM private_keys 
GROUP BY key_usage, key_type;
```

### 2. Verificar API
```bash
# Crear un nuevo DID y verificar key_usage
curl -X POST http://localhost:3000/api/v1/dids \
  -H "Content-Type: application/json" \
  -d '{"did":"did:web:test/verification","document":{...}}'
```

### 3. Verificar Cliente
```bash
cd did-api-client
npx ts-node src/scripts/checkKeyUsage.ts
```

## 🛠️ Rollback (Si es Necesario)

```sql
-- Eliminar índice
DROP INDEX IF EXISTS idx_private_keys_key_usage;

-- Eliminar restricción
ALTER TABLE private_keys DROP CONSTRAINT IF EXISTS check_key_usage;

-- Eliminar columna
ALTER TABLE private_keys DROP COLUMN key_usage;
```

## 📝 Notas Importantes

- ✅ **Migración Reversible**: Se puede hacer rollback si es necesario
- ✅ **Compatibilidad**: No afecta funcionalidad existente
- ✅ **Validación**: Restricción CHECK para valores válidos
- ✅ **Índices**: Optimización para consultas por key_usage
- ✅ **DID Document**: Generación automática basada en key_usage
- ✅ **Estándares**: Cumple con especificaciones W3C DID

## 🎯 Beneficios

1. **Estructura Clara**: DID Documents generados automáticamente según el uso de las claves
2. **Estándares W3C**: Cumple con especificaciones de DID Core
3. **Flexibilidad**: Soporte para diferentes patrones de uso
4. **Consultas Eficientes**: Búsquedas optimizadas por key_usage
5. **Extensibilidad**: Preparado para futuros usos de claves
6. **Compatibilidad**: No rompe funcionalidad existente

¡El campo `key_usage` está ahora disponible y afecta directamente la generación del DID Document! 🚀
