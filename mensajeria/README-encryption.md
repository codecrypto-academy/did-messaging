# 🔐 Sistema de Cifrado de Mensajes

Este sistema implementa cifrado end-to-end para mensajes usando Diffie-Hellman key agreement con curvas x25519 y cifrado AES-GCM.

## 🚀 Características

- **Cifrado Diffie-Hellman**: Usa curvas x25519 para el intercambio de claves
- **Cifrado AES-GCM**: Algoritmo simétrico para cifrar el contenido del mensaje
- **Claves derivadas**: Las claves se derivan del mnemónico del usuario usando BIP32
- **Cifrado automático**: Los mensajes se cifran automáticamente cuando ambos usuarios tienen claves configuradas
- **Descifrado automático**: Los mensajes se descifran automáticamente al mostrarse

## 📋 Requisitos

1. **Claves de keyAgreement**: Los usuarios deben tener claves de tipo `keyAgreement` configuradas
2. **Curva x25519**: Las claves deben usar la curva x25519 (compatible con Diffie-Hellman)
3. **Migración de base de datos**: Aplicar la migración que añade campos de cifrado

## 🛠️ Configuración

### 1. Aplicar la migración de base de datos

```bash
./apply-encryption-migration.sh
```

### 2. Configurar claves de keyAgreement

Los usuarios deben configurar claves de tipo `keyAgreement` usando la interfaz de configuración DID:

1. Ir a "Configurar DID" en la aplicación
2. Agregar una nueva clave con:
   - **Tipo de curva**: `x25519`
   - **Uso de la clave**: `keyAgreement`
   - **Ruta derivada**: `m/44'/0'/0'/0/1` (recomendado para keyAgreement)

### 3. Verificar configuración

El sistema verificará automáticamente si los usuarios tienen claves de keyAgreement configuradas antes de enviar mensajes cifrados.

## 🔄 Flujo de Cifrado

### Envío de Mensaje

1. **Verificación de claves**: El sistema verifica si el remitente tiene claves de keyAgreement
2. **Obtención de clave pública**: Se obtiene la clave pública de keyAgreement del destinatario
3. **Intercambio de claves**: Se realiza Diffie-Hellman key agreement usando x25519
4. **Derivación de clave**: Se deriva una clave de cifrado usando HKDF
5. **Cifrado**: Se cifra el mensaje usando AES-GCM
6. **Almacenamiento**: Se guarda el mensaje cifrado junto con la clave pública del remitente

### Recepción de Mensaje

1. **Verificación de claves**: El sistema verifica si el receptor tiene claves de keyAgreement
2. **Obtención de clave privada**: Se obtiene la clave privada de keyAgreement del receptor
3. **Intercambio de claves**: Se realiza Diffie-Hellman key agreement con la clave pública del remitente
4. **Derivación de clave**: Se deriva la misma clave de cifrado usando HKDF
5. **Descifrado**: Se descifra el mensaje usando AES-GCM
6. **Visualización**: Se muestra el mensaje descifrado al usuario

## 📊 Estructura de Datos

### Campos añadidos a la tabla `messages`

- `encrypted_content`: Contenido cifrado del mensaje (JSON con encryptedContent, iv, tag)
- `sender_public_key`: Clave pública del remitente usada para el cifrado
- `encryption_algorithm`: Algoritmo de cifrado usado (x25519-aes-gcm)

### Estructura del contenido cifrado

```json
{
  "encryptedContent": "base64_encoded_ciphertext",
  "iv": "base64_encoded_iv",
  "tag": "base64_encoded_auth_tag"
}
```

## 🔧 API de Cifrado

### Hook `useMessageEncryption`

```typescript
const {
  sendEncryptedMessage,      // Enviar mensaje cifrado
  decryptMessageContent,     // Descifrar mensaje
  hasKeyAgreementKeys,       // Verificar si usuario tiene claves
  isEncrypting,              // Estado de cifrado
  isDecrypting               // Estado de descifrado
} = useMessageEncryption()
```

### Funciones de cifrado

```typescript
// Cifrar mensaje para almacenamiento
const { encryptedData, senderPublicKey } = await encryptMessageForStorage(
  message,
  senderPrivateKey,
  recipientPublicKey
)

// Descifrar mensaje
const decryptedMessage = await decryptMessage(
  encryptedMessage,
  recipientPrivateKey
)
```

## 🛡️ Seguridad

- **Perfect Forward Secrecy**: Cada mensaje usa una clave diferente derivada del key agreement
- **Autenticación**: AES-GCM proporciona autenticación del contenido
- **Claves efímeras**: Las claves de cifrado se derivan dinámicamente para cada mensaje
- **Almacenamiento seguro**: Las claves privadas nunca se almacenan en texto plano

## 🐛 Solución de Problemas

### Mensaje no se cifra

1. Verificar que el usuario tiene claves de keyAgreement configuradas
2. Verificar que las claves usan la curva x25519
3. Verificar que el destinatario también tiene claves de keyAgreement

### Error al descifrar mensaje

1. Verificar que el usuario tiene las claves correctas
2. Verificar que la clave pública del remitente es correcta
3. Verificar que el formato del mensaje cifrado es válido

### Indicadores visuales

- 🔒: Indica que el mensaje está cifrado
- `[Mensaje cifrado]`: Se muestra cuando no se puede descifrar
- `[Mensaje cifrado - Error al descifrar]`: Se muestra cuando hay un error de descifrado

## 📝 Notas Técnicas

- **Curva**: x25519 (Curve25519)
- **Algoritmo simétrico**: AES-GCM-256
- **Derivación de claves**: HKDF con SHA-256
- **Longitud del IV**: 96 bits (12 bytes)
- **Longitud del tag**: 128 bits (16 bytes)
- **Formato de almacenamiento**: Base64 para todos los datos binarios
