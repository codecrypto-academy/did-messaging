# 📋 Estructura del Proyecto Mensajería

## 📖 Descripción General

Aplicación de chat en tiempo real construida con **Next.js 15** y **Supabase**, que implementa funcionalidades de mensajería instantánea con autenticación de usuarios, cifrado end-to-end, y comunicación en tiempo real. La aplicación está inspirada en WhatsApp y utiliza tecnologías modernas para ofrecer una experiencia de usuario fluida y segura.

## 🛠️ Tecnologías Principales

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Backend**: Supabase (PostgreSQL + Realtime)
- **Autenticación**: Supabase Auth
- **Cifrado**: Noble cryptographic library (x25519, AES-GCM)
- **Iconos**: Lucide React
- **Fechas**: date-fns

## 📁 Estructura de Directorios

```
mensajeria/
├── 📂 src/                          # Código fuente principal
│   ├── 📂 app/                      # App Router de Next.js
│   ├── 📂 components/               # Componentes React reutilizables
│   ├── 📂 contexts/                 # Contextos de React
│   ├── 📂 hooks/                    # Custom hooks
│   ├── 📂 lib/                      # Utilidades y configuraciones
│   └── 📂 types/                    # Definiciones de tipos TypeScript
├── 📂 public/                       # Archivos estáticos
├── 📂 scripts/                      # Scripts de utilidad y migración
├── 📂 migrations/                   # Migraciones de base de datos
├── 📂 supabase/                     # Configuración de Supabase local
└── 📄 archivos de configuración    # Configuraciones del proyecto
```

---

## 📋 Descripción Detallada por Archivo

### 🗂️ Directorio Raíz

| Archivo | Descripción |
|---------|-------------|
| `package.json` | Configuración de dependencias y scripts del proyecto. Define scripts para desarrollo, build, lint y configuración de Supabase |
| `package-lock.json` | Lockfile de npm con versiones exactas de dependencias |
| `tsconfig.json` | Configuración de TypeScript con paths absolutos y configuraciones de Next.js |
| `next.config.ts` | Configuración de Next.js (actualmente configuración básica) |
| `next-env.d.ts` | Tipos de TypeScript generados por Next.js |
| `eslint.config.mjs` | Configuración de ESLint para el proyecto |
| `postcss.config.mjs` | Configuración de PostCSS para Tailwind CSS |
| `.env.local` | Variables de entorno para conexión con Supabase local |
| `.env.example` | Plantilla de variables de entorno |
| `.gitignore` | Archivos y directorios ignorados por Git |
| `README.md` | Documentación principal del proyecto con instrucciones de instalación y uso |
| `README-encryption.md` | Documentación específica sobre el sistema de cifrado implementado |

### 🏗️ Scripts de Configuración

| Archivo | Descripción |
|---------|-------------|
| `setup-local-supabase.sh` | Script para configurar e inicializar Supabase localmente |
| `setup-simple.sh` | Script de configuración simplificada |
| `start-app.sh` | Script para iniciar la aplicación de desarrollo |
| `apply-encryption-migration.sh` | Script para aplicar migraciones de cifrado |
| `apply-fix.sh` | Script para aplicar correcciones de base de datos |
| `fix-database.sh` | Script para reparar problemas de base de datos |

### 🗃️ Base de Datos y Migraciones

| Archivo | Descripción |
|---------|-------------|
| `database-schema.sql` | Esquema completo de la base de datos |
| `fix-rls-policies.sql` | Correcciones para políticas de Row Level Security |
| `fix-duplicate-messages.patch` | Parche para corregir mensajes duplicados |

#### 📂 migrations/
| Archivo | Descripción |
|---------|-------------|
| `20240101000002_add_profile_keys.sql` | Migración para añadir tabla de claves de perfil |
| `add_encryption_fields.sql` | Migración para campos de cifrado |
| `add_recipient_public_key.sql` | Migración para clave pública del destinatario |
| `add-profile-keys.sql` | Migración alternativa para claves de perfil |
| `fix_profile_keys_insert_policy.sql` | Corrección de políticas de inserción |
| `fix_profile_keys_rls.sql` | Corrección de Row Level Security para claves |

### 📂 scripts/
Scripts de utilidad para desarrollo y mantenimiento:

| Archivo | Descripción |
|---------|-------------|
| `add-missing-columns.js` | Añade columnas faltantes a las tablas |
| `apply-migration-direct.js` | Aplica migraciones directamente |
| `apply-migration.js` | Aplica migraciones con validación |
| `apply-schema-direct.js` | Aplica esquema directamente |
| `check-table-structure.js` | Verifica estructura de tablas |
| `clear-all-data.js` | Limpia todos los datos de la base de datos |
| `create-tables-manual.js` | Crea tablas manualmente |
| `execute-schema-changes.js` | Ejecuta cambios de esquema |
| `populate-demo-data.js` | Pobla la base de datos con datos de demostración |
| `verify-participants.js` | Verifica participantes de conversaciones |
| `verify-profile-keys.js` | Verifica claves de perfil |
| `verify-schema-changes.js` | Verifica cambios de esquema |

### 🧪 Scripts de Usuarios de Prueba

| Archivo | Descripción |
|---------|-------------|
| `create-alice-user.js` | Crea usuario de prueba "Alice" |
| `create-second-user.js` | Crea segundo usuario de prueba |
| `create-test-user.js` | Crea usuario de prueba genérico |

---

## 🎯 Código Fuente (src/)

### 📱 App Router (`src/app/`)

| Archivo | Descripción |
|---------|-------------|
| `layout.tsx` | Layout raíz de la aplicación. Configura fuentes (Geist), metadatos, y el AuthProvider que envuelve toda la aplicación |
| `page.tsx` | Página principal. Controla la renderización condicional entre AuthPage (para usuarios no autenticados) y ChatInterface (para usuarios autenticados) |
| `globals.css` | Estilos globales con Tailwind CSS |
| `favicon.ico` | Icono de la aplicación |

### 🧩 Componentes (`src/components/`)

#### 🔐 Autenticación (`auth/`)
| Archivo | Descripción |
|---------|-------------|
| `AuthPage.tsx` | Página principal de autenticación que alterna entre formularios de login y registro |
| `LoginForm.tsx` | Formulario de inicio de sesión con email y contraseña |
| `SignUpForm.tsx` | Formulario de registro con email, contraseña y nombre de usuario |

#### 💬 Chat (`chat/`)
| Archivo | Descripción |
|---------|-------------|
| `ChatInterface.tsx` | **Componente principal del chat**. Orquesta toda la funcionalidad: gestión de conversaciones, mensajes, cifrado, y suscripciones en tiempo real |
| `ConversationList.tsx` | Lista lateral de conversaciones con búsqueda y selección |
| `MessageArea.tsx` | Área principal de mensajes con entrada de texto y envío |
| `UserProfile.tsx` | Perfil de usuario en la barra lateral |
| `NewConversationModal.tsx` | Modal para crear nuevas conversaciones (privadas o grupales) |
| `ProfileDialog.tsx` | Dialog para configurar claves DID y cifrado |
| `ProfileModal.tsx` | Modal alternativo de perfil |
| `AddKeyDialog.tsx` | Dialog para añadir nuevas claves de cifrado |
| `DatabaseError.tsx` | Componente de error para problemas de base de datos |

#### 🛠️ Utilidades
| Archivo | Descripción |
|---------|-------------|
| `DebugAuth.tsx` | Componente de debug para mostrar información de autenticación en desarrollo |

### 🔄 Contextos (`src/contexts/`)

| Archivo | Descripción |
|---------|-------------|
| `AuthContext.tsx` | **Contexto principal de autenticación**. Maneja estado de usuario, sesión, y funciones de login/logout/registro usando Supabase Auth |

### 🎣 Hooks Personalizados (`src/hooks/`)

| Archivo | Descripción |
|---------|-------------|
| `useMessageEncryption.ts` | **Hook principal de cifrado**. Maneja todo el flujo de cifrado/descifrado de mensajes usando x25519 + AES-GCM. Incluye gestión de claves, envío de mensajes cifrados y descifrado |
| `useTypingIndicator.ts` | Hook para indicadores de escritura en tiempo real |

### 📚 Librerías y Utilidades (`src/lib/`)

| Archivo | Descripción |
|---------|-------------|
| `encryption.ts` | **Librería principal de cifrado**. Implementa Diffie-Hellman (x25519) para acuerdo de claves y AES-GCM para cifrado simétrico. Incluye todas las funciones criptográficas |
| `supabase.ts` | Configuración y cliente de Supabase |
| `database.types.ts` | Tipos TypeScript generados automáticamente desde el esquema de Supabase |

### 📝 Tipos (`src/types/`)

| Archivo | Descripción |
|---------|-------------|
| `chat.ts` | Definiciones de tipos para mensajes, conversaciones, perfiles y participantes |

### 🖼️ Recursos Públicos (`public/`)

| Archivo | Descripción |
|---------|-------------|
| `file.svg` | Icono de archivo |
| `globe.svg` | Icono de globo |
| `next.svg` | Logo de Next.js |
| `vercel.svg` | Logo de Vercel |
| `window.svg` | Icono de ventana |

### ⚙️ Configuración Supabase (`supabase/`)

| Archivo | Descripción |
|---------|-------------|
| `config.toml` | Configuración de Supabase local |
| `.branches/_current_branch` | Rama actual de Supabase |
| `.temp/cli-latest` | Archivos temporales del CLI |
| `migrations/20240101000000_initial_schema.sql` | Esquema inicial de la base de datos |
| `migrations/20240101000001_enable_realtime.sql` | Habilitación de funcionalidades en tiempo real |

---

## 🔒 Sistema de Cifrado

La aplicación implementa un robusto sistema de cifrado end-to-end:

### 🔑 Componentes Clave:
- **Diffie-Hellman (x25519)**: Para acuerdo seguro de claves
- **AES-GCM**: Para cifrado simétrico de mensajes
- **HKDF**: Para derivación de claves de cifrado
- **Web Crypto API**: Para operaciones criptográficas seguras

### 📋 Flujo de Cifrado:
1. Cada usuario genera un par de claves x25519
2. Para enviar un mensaje, se realiza acuerdo de claves con el destinatario
3. Se deriva una clave de cifrado usando HKDF
4. El mensaje se cifra con AES-GCM
5. Se almacena el mensaje cifrado con metadatos necesarios

---

## 🗄️ Esquema de Base de Datos

### 📊 Tablas Principales:
- **`profiles`**: Perfiles de usuario
- **`profile_keys`**: Claves criptográficas de usuarios
- **`conversations`**: Conversaciones (privadas y grupales)
- **`conversation_participants`**: Participantes de conversaciones
- **`messages`**: Mensajes (cifrados y no cifrados)

---

## 🚀 Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Construcción para producción
npm run start        # Servidor de producción
npm run lint         # Análisis de código
npm run setup        # Configuración de Supabase
npm run demo         # Datos de demostración
npm run start-app    # Inicio completo de la aplicación
```

---

## 🔧 Configuración de Desarrollo

### 📋 Requisitos:
- Node.js 18+
- Supabase CLI
- PostgreSQL (local via Supabase)

### 🏃‍♂️ Inicio Rápido:
1. `npm install` - Instalar dependencias
2. `npm run setup` - Configurar Supabase local
3. `npm run dev` - Iniciar desarrollo

### 🌐 URLs Locales:
- **Aplicación**: http://localhost:3000
- **Supabase Studio**: http://localhost:54323
- **API**: http://localhost:54321
- **Base de datos**: localhost:54322

---

*Documento generado automáticamente para el proyecto Mensajería - Una aplicación de chat moderna con cifrado end-to-end*