# DID Messaging Platform

Una plataforma de mensajería segura estilo Telegram que utiliza tecnología de identidad digital descentralizada (DID) para autenticación, cifrado y comunicación entre usuarios.

## Descripción del Proyecto

Este proyecto implementa un sistema de mensajería que aprovecha los estándares W3C de identidad digital descentralizada para proporcionar comunicación segura y privada. Los usuarios pueden crear y gestionar múltiples identidades digitales (DID) y enviar mensajes cifrados utilizando criptografía de clave pública.

## Arquitectura del Sistema

### Frontend
- **Aplicación Móvil**: Flutter
  - Interfaz principal para usuarios finales
  - Gestión de DIDs y mensajería
  - Suscripción a cambios en tiempo real

- **Aplicación Web**: Next.js
  - Registro y resolución de DIDs
  - Panel de administración
  - Interfaz web complementaria

### Backend
- **Base de Datos**: Supabase
  - Almacenamiento cifrado de datos
  - Suscripciones en tiempo real
  - Gestión de usuarios y mensajes

- **API de Resolución**: Next.js
  - Resolver DID:web público
  - Servicios de registro DID
  - API RESTful para operaciones DID

### Identidad Digital
- **Estándares W3C**:
  - DID (Decentralized Identifiers)
  - DID Documents
  - DID Resolver
  - DID Registry

- **Criptografía**:
  - BIP39: Generación de frases mnemónicas
  - BIP32: Derivación jerárquica de claves
  - JWT: Tokens de autenticación
  - Cifrado de clave pública/privada

- **Componentes DID**:
  - DID Controller
  - DID Agent
  - DID Wallet

## Funcionalidades Principales

### Gestión de Identidad Digital

#### Creación y Registro de DIDs
- **Generación de Claves**: Utiliza BIP39 para generar frases mnemónicas seguras
- **Derivación de Claves**: Implementa BIP32 para la derivación jerárquica de claves privadas
- **Registro DID**: Permite crear y registrar múltiples DIDs por usuario
- **Almacenamiento Seguro**: Las claves privadas se almacenan cifradas en Supabase

#### Resolución de DIDs
- **DID Resolver Público**: API que permite a cualquier aplicación resolver DIDs
- **Formato DID:web**: Implementación del método `did:web` según estándares W3C
- **Documentos DID**: Generación y gestión de DID Documents completos
- **Verificación de Identidad**: Validación criptográfica de la autenticidad de los DIDs

### Sistema de Mensajería

#### Cifrado y Seguridad
- **Cifrado de Mensajes**: Utiliza la clave pública del destinatario (keyAgreement) para cifrar mensajes
- **Firma Digital**: Los mensajes van firmados con la clave privada del remitente (assertion key)
- **Cifrado Punto a Punto**: Garantiza que solo el destinatario puede leer los mensajes
- **Integridad de Mensajes**: Verificación criptográfica de la autenticidad del remitente

#### Comunicación
- **Mensajes de Texto**: Soporte completo para mensajería de texto
- **Recursos URL**: Capacidad de incluir enlaces a recursos externos
- **Tiempo Real**: Suscripción a cambios en tiempo real mediante Supabase
- **Multi-DID**: Selección de diferentes DIDs para enviar mensajes

### Características Técnicas

#### Almacenamiento y Persistencia
- **Base de Datos Cifrada**: Todos los datos sensibles se almacenan cifrados en Supabase
- **Tiempo Real**: Suscripciones automáticas a cambios en la base de datos
- **Escalabilidad**: Arquitectura preparada para manejar múltiples usuarios y mensajes
- **Backup Seguro**: Respaldo cifrado de claves y datos importantes

#### Interoperabilidad
- **Estándares W3C**: Cumplimiento total con especificaciones DID 1.0 y 1.1
- **API Pública**: Resolver DID accesible para terceros
- **Formato Estándar**: Compatibilidad con otros sistemas DID
- **Multiplataforma**: Aplicación móvil y web complementarias

## Limitaciones Actuales

- **Tipo de Mensajes**: Solo se admiten mensajes de texto con URLs a recursos
- **Método DID**: Implementación limitada a `did:web` en esta versión
- **Plataforma Móvil**: Desarrollo inicial enfocado en Flutter

## Referencias Técnicas

- [W3C DID Core 1.0](https://www.w3.org/TR/did-1.0/#did-documents)
- [W3C DID Core 1.1](https://www.w3.org/TR/did-1.1/)
- [BIP32](https://github.com/bitcoin/bips/tree/master/bip-0032)
- [BIP39 Wordlist](https://www.blockplate.com/pages/bip-39-wordlist?srsltid=AfmBOop6zOXNZnkOidJjAmBQt35_0DyzJaj4efF5WndihlNW4MggcKvc)
- [BIP39](https://github.com/bitcoin/bips/tree/master/bip-0039)
- https://github.com/bitcoin/bips
- [Diagrama de arquitectura](https://lucid.app/lucidchart/3acc4e8e-ff65-4c33-ac4f-59e7ce0b62d2/edit?viewport_loc=-69%2C-180%2C1609%2C1139%2C0_0&invitationId=inv_e06e3ff8-e52b-45e1-93e5-3571a5e50f9a)

## Componentes del Proyecto

1. **DID Register (Next.js)**: Servicio de registro y resolución de DIDs web
2. **API Resolver (Next.js)**: API pública para resolución de DID Documents  
3. **Aplicación Móvil (Flutter)**: Cliente principal para usuarios finales
4. **Base de Datos (Supabase)**: Almacenamiento cifrado y servicios en tiempo real