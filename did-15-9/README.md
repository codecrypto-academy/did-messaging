# Innovation DID API - Sistema Completo de Gestión de DIDs

Este proyecto implementa un sistema completo de gestión de DIDs (Decentralized Identifiers) con operaciones CRUD, criptografía avanzada y pruebas automatizadas, siguiendo las especificaciones del README original.

## 🏗️ Arquitectura del Sistema

```
did-15-9/
├── did-api/                 # API RESTful en TypeScript/Express
│   ├── src/
│   │   ├── config/         # Configuración de Supabase
│   │   ├── controllers/    # Controladores de la API
│   │   ├── middleware/     # Middleware de validación y errores
│   │   ├── models/         # Modelos de datos
│   │   ├── routes/         # Rutas de la API
│   │   ├── types/          # Tipos TypeScript
│   │   └── utils/          # Utilidades criptográficas
│   └── package.json
├── did-api-client/         # Cliente TypeScript para pruebas
│   ├── src/
│   │   ├── client/         # Cliente de la API
│   │   ├── scripts/        # Scripts de prueba y generación
│   │   └── types/          # Tipos TypeScript
│   └── package.json
├── docker-compose.yml      # Configuración de Supabase local
├── supabase-schema.sql     # Esquema de base de datos
└── setup-supabase.sh       # Script de configuración
```

## 🚀 Características Implementadas

### ✅ API CRUD para DIDs
- **Crear DID**: Generación automática de documentos DID y claves
- **Leer DID**: Obtener DID, documento y claves
- **Actualizar DID**: Modificar documento y claves
- **Eliminar DID**: Eliminación completa con cascada
- **Listar DIDs**: Obtener todos los DIDs

### ✅ Gestión de Claves Criptográficas
- **BIP39/BIP32**: Generación de claves desde mnemonic
- **Ed25519**: Para autenticación y assertionMethod
- **X25519**: Para keyAgreement (Diffie-Hellman)
- **Cifrado**: Almacenamiento seguro de claves privadas
- **Derivación**: Paths específicos según especificación

### ✅ Pruebas Criptográficas
- **Firma Digital**: Usando assertionMethod con Ed25519
- **Key Agreement**: Diffie-Hellman con X25519
- **Verificación**: Validación de firmas y claves compartidas

### ✅ Sistema de Mensajería Encriptada
- **Encriptación Diffie-Hellman**: Mensajes seguros entre DIDs
- **Selección de Claves**: Especificación de qué clave del remitente usar
- **Almacenamiento Seguro**: Mensajes encriptados en base de datos
- **Gestión de Claves**: Soporte para múltiples claves por DID

### ✅ Base de Datos Supabase
- **Docker**: Instancia local con Docker Compose
- **Esquema**: Tablas para DIDs, documentos y claves
- **Seguridad**: Row Level Security (RLS)
- **Índices**: Optimización de consultas

## 🛠️ Instalación y Configuración

### Prerrequisitos
- Node.js 18+
- Docker y Docker Compose
- npm o yarn

### 1. Configurar Supabase Local

```bash
# Iniciar Supabase con Docker
./setup-supabase.sh
```

### 2. Instalar Dependencias

```bash
# API
cd did-api
npm install

# Cliente
cd ../did-api-client
npm install
```

### 3. Configurar Variables de Entorno

```bash
# API
cd did-api
cp env.example .env
# Editar .env con las credenciales de Supabase

# Cliente
cd ../did-api-client
cp env.example .env
# Editar .env con la URL de la API
```

### 4. Compilar y Ejecutar

```bash
# API
cd did-api
npm run build
npm run dev

# Cliente (en otra terminal)
cd did-api-client
npm run build
npm run dev
```

## 📚 Uso de la API

### Endpoints Principales

```bash
# Health Check
GET /health

# CRUD DIDs
POST   /api/v1/dids              # Crear DID
GET    /api/v1/dids              # Listar DIDs
GET    /api/v1/dids/:did         # Obtener DID
PUT    /api/v1/dids/:did         # Actualizar DID
DELETE /api/v1/dids/:did         # Eliminar DID

# Documento DID
GET    /api/v1/dids/:did/document # Obtener documento

# Operaciones Criptográficas
POST   /api/v1/dids/:did/sign           # Firmar mensaje
POST   /api/v1/dids/:did/verify         # Verificar firma
POST   /api/v1/dids/:did/key-agreement  # Key agreement

# Mensajería Encriptada
POST   /api/v1/dids/:did/send-message   # Enviar mensaje encriptado
POST   /api/v1/dids/:did/read-message   # Leer mensaje desencriptado
GET    /api/v1/dids/:did/messages       # Listar mensajes
```

### Ejemplo de Uso

```bash
# Crear un DID
curl -X POST http://localhost:3000/api/v1/dids \
  -H "Content-Type: application/json" \
  -d '{"did": "did:web:user/alice"}'

# Firmar un mensaje
curl -X POST http://localhost:3000/api/v1/dids/did:web:user/alice/sign \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, DID World!"}'

# Enviar mensaje encriptado
curl -X POST http://localhost:3000/api/v1/dids/did:web:user/alice/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "to_did": "did:web:user/bob",
    "message": "Mensaje secreto para Bob",
    "sender_key_name": "key-agreement-1"
  }'

# Leer mensaje encriptado
curl -X POST http://localhost:3000/api/v1/dids/did:web:user/bob/read-message \
  -H "Content-Type: application/json" \
  -d '{"message_id": "MESSAGE_ID"}'

# Listar mensajes
curl http://localhost:3000/api/v1/dids/did:web:user/bob/messages
```

## 💬 Sistema de Mensajería Encriptada

### Características Principales

- **Encriptación End-to-End**: Mensajes seguros usando Diffie-Hellman
- **Selección de Claves**: Especificación de qué clave del remitente usar
- **Almacenamiento Seguro**: Mensajes encriptados en base de datos
- **Múltiples Claves**: Soporte para diferentes claves por DID

### Flujo de Encriptación

1. **Envío**: El remitente especifica qué clave usar (`sender_key_name`)
2. **Diffie-Hellman**: Se genera shared secret entre claves X25519
3. **AES-256-CBC**: El mensaje se encripta con el shared secret
4. **Almacenamiento**: Se guarda el mensaje encriptado + metadatos de clave
5. **Lectura**: El destinatario usa su clave privada + clave pública del remitente

### Ejemplo de Flujo Completo

```bash
# 1. Alice envía mensaje a Bob usando key-agreement-1
curl -X POST http://localhost:3000/api/v1/dids/did:web:user/alice/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "to_did": "did:web:user/bob",
    "message": "Mensaje secreto para Bob",
    "sender_key_name": "key-agreement-1"
  }'

# Respuesta: {"success":true,"data":{"message_id":"abc123",...}}

# 2. Bob lee el mensaje usando el message_id
curl -X POST http://localhost:3000/api/v1/dids/did:web:user/bob/read-message \
  -H "Content-Type: application/json" \
  -d '{"message_id": "abc123"}'

# Respuesta: {"success":true,"data":{"message":"Mensaje secreto para Bob",...}}

# 3. Bob lista todos sus mensajes
curl http://localhost:3000/api/v1/dids/did:web:user/bob/messages
```

## 🧪 Pruebas

### Ejecutar Todas las Pruebas

```bash
cd did-api-client
npm run test
```

### Pruebas Criptográficas Específicas

```bash
cd did-api-client
npm run test:crypto
```

### Generar DIDs de Ejemplo

```bash
cd did-api-client
npm run generate-dids generate 10
```

## 🔐 Especificaciones Criptográficas

### Mnemonic de Prueba
```
test test test test test test test test test test test junk
```

### Paths de Derivación
- **Ed25519 Authentication**: `m/44'/0'/0'/0/0`
- **Ed25519 AssertionMethod**: `m/44'/0'/0'/0/1`
- **X25519 KeyAgreement**: `m/44'/0'/0'/1/0`, `m/44'/0'/0'/1/1`, `m/44'/0'/0'/1/2`

### Algoritmos
- **Ed25519**: Firma digital y verificación
- **X25519**: Key agreement (Diffie-Hellman)
- **AES-256-CBC**: Cifrado de claves privadas y mensajes

## 📊 Estructura de Base de Datos

### Tabla `dids`
- `id`: UUID primario
- `did`: Identificador único del DID
- `created_at`, `updated_at`: Timestamps

### Tabla `did_documents`
- `id`: UUID primario
- `did_id`: Referencia al DID
- `document`: Documento DID en JSONB

### Tabla `private_keys`
- `id`: UUID primario
- `did_id`: Referencia al DID
- `key_type`: 'ed25519' o 'x25519'
- `name`: Nombre descriptivo de la clave
- `key_usage`: 'authentication', 'assertionMethod', 'keyAgreement'
- `active`: Estado de la clave
- `encrypted_private_key`: Clave privada en hexadecimal (sin cifrar)
- `public_key`: Clave pública en hexadecimal
- `key_derivation_path`: Path de derivación BIP32

### Tabla `messages`
- `id`: UUID primario
- `from_did`: DID del remitente
- `to_did`: DID del destinatario
- `encrypted_message`: Mensaje encriptado en base64
- `sender_public_key`: Clave pública del remitente (hexadecimal)
- `sender_key_id`: ID de la clave específica del remitente
- `sender_key_name`: Nombre de la clave específica del remitente
- `created_at`, `updated_at`: Timestamps

## 🌐 URLs de Desarrollo

- **API**: http://localhost:3000
- **Supabase Studio**: http://localhost:54323
- **Base de Datos**: postgresql://postgres:postgres@localhost:54322/postgres

## 📝 Ejemplo de Documento DID

```json
{
  "id": "did:web:user/peter",
  "@context": [
    "https://www.w3.org/ns/did/v1",
    "https://w3id.org/security/suites/ed25519-2020/v1",
    "https://w3id.org/security/suites/x25519-2020/v1"
  ],
  "controller": "did:web:user/peter",
  "authentication": ["did:web:user/peter#key-1"],
  "assertionMethod": ["did:web:user/peter#key-1"],
  "keyAgreement": ["did:web:user/peter#key-2"],
  "verificationMethod": [
    {
      "id": "did:web:user/peter#key-1",
      "type": "Ed25519VerificationKey2020",
      "controller": "did:web:user/peter",
      "publicKeyMultibase": "z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK"
    },
    {
      "id": "did:web:user/peter#key-2",
      "type": "X25519KeyAgreementKey2020",
      "controller": "did:web:user/peter",
      "publicKeyMultibase": "z6LSbysY2xFMRpGMhb7tFTLMpeuPRaqaWM1yECx2AtzE3KCc"
    }
  ]
}
```

## 🚨 Comandos de Mantenimiento

### Reiniciar Base de Datos
```bash
docker-compose down -v
docker-compose up -d
./setup-supabase.sh
```

### Limpiar DIDs de Prueba
```bash
cd did-api-client
npm run generate-dids cleanup
```

### Ver Logs
```bash
docker-compose logs -f
```

## 📋 Estado del Proyecto

- ✅ Estructura del proyecto
- ✅ Configuración de Supabase con Docker
- ✅ Esquema de base de datos
- ✅ Gestión de claves BIP39/BIP32
- ✅ API RESTful con operaciones CRUD
- ✅ Pruebas criptográficas
- ✅ Cliente TypeScript
- ✅ Sistema de mensajería encriptada
- ✅ Selección de claves específicas
- ✅ Documentación completa

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

Para soporte o preguntas, por favor abre un issue en el repositorio.