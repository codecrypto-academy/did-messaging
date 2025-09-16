# Nuevas Funcionalidades de Claves - API DID

## 📋 Resumen

Se han implementado nuevas funcionalidades para gestionar claves en DIDs existentes, incluyendo la capacidad de agregar nuevas claves, controlar su estado activo/inactivo, y actualizar automáticamente el DID Document.

## 🚀 Nuevas Funcionalidades

### 1. **Agregar Nuevas Claves a DIDs Existentes**

**Endpoint:** `POST /api/v1/dids/:did/keys`

**Request Body:**
```json
{
  "name": "backup-auth-key",
  "key_type": "ed25519",
  "key_usage": "authentication",
  "active": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Key added successfully",
  "data": {
    "did": { /* DID info */ },
    "document": { /* Updated DID Document */ },
    "keys": [ /* All keys including new one */ ]
  }
}
```

### 2. **Controlar Estado Activo/Inactivo de Claves**

**Endpoint:** `PUT /api/v1/dids/:did/keys/:keyId/active`

**Request Body:**
```json
{
  "active": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Key deactivated successfully",
  "data": {
    "did": { /* DID info */ },
    "document": { /* Updated DID Document */ },
    "keys": [ /* All keys with updated status */ ]
  }
}
```

### 3. **Paths de Derivación Mejorados**

**Base Path:** `m/222333'/0'/0'/0/0`

**Nuevo Sistema:**
- Clave 1: `m/222333'/0'/0'/0/0`
- Clave 2: `m/222333'/0'/0'/0/1`
- Clave 3: `m/222333'/0'/0'/0/2`
- etc.

### 4. **Campo `active` en Base de Datos**

**Nueva columna en `private_keys`:**
```sql
active BOOLEAN NOT NULL DEFAULT TRUE
```

**Índice de rendimiento:**
```sql
CREATE INDEX idx_private_keys_active ON private_keys(active);
```

## 🎯 Impacto en DID Documents

### Claves Activas vs Inactivas

- **Claves Activas**: Se incluyen en el DID Document
- **Claves Inactivas**: Se excluyen del DID Document
- **Actualización Automática**: El DID Document se actualiza automáticamente cuando cambia el estado de las claves

### Ejemplo de DID Document con Múltiples Claves

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
      "publicKeyMultibase": "..."
    },
    {
      "id": "did:web:example/user#key-2",
      "type": "X25519KeyAgreementKey2020",
      "controller": "did:web:example/user",
      "publicKeyMultibase": "..."
    }
  ],
  "authentication": ["did:web:example/user#key-1"],
  "keyAgreement": ["did:web:example/user#key-2"],
  "controller": "did:web:example/user"
}
```

## 🧪 Scripts de Prueba

### 1. Probar Nuevas Funcionalidades
```bash
cd did-api-client
npx ts-node src/scripts/testNewKeyFeatures.ts
```

### 2. Verificar Key Usage
```bash
npx ts-node src/scripts/checkKeyUsage.ts
```

### 3. Demostrar Impacto en DID Document
```bash
npx ts-node src/scripts/demonstrateKeyUsage.ts
```

## 📊 Casos de Uso

### 1. **Gestión de Claves de Respaldo**
```typescript
// Agregar clave de respaldo
await client.addKey('did:web:user/alice', {
  name: 'backup-signing-key',
  key_type: 'ed25519',
  key_usage: 'authentication',
  active: false  // Inactiva por defecto
});

// Activar en caso de emergencia
await client.updateKeyActive(
  'did:web:user/alice', 
  keyId, 
  { active: true }
);
```

### 2. **Rotación de Claves**
```typescript
// Agregar nueva clave
await client.addKey('did:web:user/alice', {
  name: 'new-signing-key',
  key_type: 'ed25519',
  key_usage: 'authentication',
  active: true
});

// Desactivar clave antigua
await client.updateKeyActive(
  'did:web:user/alice', 
  oldKeyId, 
  { active: false }
);
```

### 3. **Claves Especializadas**
```typescript
// Clave para credenciales
await client.addKey('did:web:user/alice', {
  name: 'credential-signing-key',
  key_type: 'ed25519',
  key_usage: 'assertionMethod',
  active: true
});

// Clave para comunicación
await client.addKey('did:web:user/alice', {
  name: 'communication-key',
  key_type: 'x25519',
  key_usage: 'keyAgreement',
  active: true
});
```

## 🔧 Configuración y Migración

### Aplicar Migraciones
```bash
# Aplicar migración de campo active
./apply-active-migration.sh

# Aplicar migración de key_usage (si no se ha hecho)
./apply-key-usage-migration.sh
```

### Verificar Estado
```bash
# Verificar que todas las claves tienen campo active
cd did-api-client
npx ts-node src/scripts/checkKeyUsage.ts
```

## 📈 Estadísticas de Prueba

### Resultados del Test
- ✅ **Agregar claves**: Funcionando correctamente
- ✅ **Desactivar claves**: Funcionando correctamente
- ✅ **Reactivar claves**: Funcionando correctamente
- ✅ **Actualización de DID Document**: Automática y correcta
- ✅ **Paths de derivación**: Generados correctamente con numeración secuencial

### Tipos de Claves Soportados
- **Ed25519**: Para autenticación y aserciones
- **X25519**: Para acuerdo de claves y cifrado

### Usos de Claves Soportados
- **authentication**: Para autenticación
- **assertionMethod**: Para aserciones y credenciales
- **keyAgreement**: Para acuerdo de claves

## 🎯 Beneficios

1. **Flexibilidad**: Agregar claves según necesidades específicas
2. **Seguridad**: Control granular del estado de las claves
3. **Escalabilidad**: Soporte para múltiples claves por DID
4. **Estándares**: Cumple con especificaciones W3C DID
5. **Automatización**: Actualización automática del DID Document
6. **Trazabilidad**: Paths de derivación únicos y secuenciales

## 🔮 Futuras Mejoras

### 1. **Gestión Avanzada de Claves**
- Rotación automática de claves
- Políticas de expiración
- Notificaciones de cambio de estado

### 2. **Métricas y Monitoreo**
- Dashboard de claves activas/inactivas
- Historial de cambios
- Alertas de seguridad

### 3. **Integración con Wallets**
- Soporte para hardware wallets
- Integración con extensiones de navegador
- APIs para aplicaciones móviles

## ✅ Verificación de Funcionalidad

### 1. **Endpoints Funcionando**
- ✅ `POST /api/v1/dids/:did/keys`
- ✅ `PUT /api/v1/dids/:did/keys/:keyId/active`

### 2. **Base de Datos Actualizada**
- ✅ Campo `active` agregado
- ✅ Índices de rendimiento creados
- ✅ Migraciones aplicadas correctamente

### 3. **DID Documents Actualizados**
- ✅ Solo claves activas incluidas
- ✅ Estructura correcta según key_usage
- ✅ Actualización automática funcionando

¡Las nuevas funcionalidades de claves están completamente implementadas y funcionando! 🚀
