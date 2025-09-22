# 💬 Mensajería - Aplicación de Chat en Tiempo Real

Una aplicación de mensajería moderna construida con Next.js y Supabase local, inspirada en WhatsApp.

## ✨ Características

- 🔐 **Autenticación completa** con Supabase Auth
- 💬 **Chat en tiempo real** con mensajes instantáneos
- 👥 **Conversaciones privadas y grupales**
- 🔍 **Búsqueda de usuarios** para crear conversaciones
- 📱 **Diseño responsivo** tipo WhatsApp
- ⚡ **Tiempo real** con Supabase Realtime
- 🎨 **Interfaz moderna** con Tailwind CSS

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+ 
- Supabase CLI
- npm o yarn

### Instalación

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar Supabase local:**
   ```bash
   # Instalar Supabase CLI si no lo tienes
   npm install -g supabase
   
   # Ejecutar el script de configuración
   ./setup-local-supabase.sh
   ```

3. **Iniciar la aplicación:**
   ```bash
   npm run dev
   ```

4. **Abrir en el navegador:**
   ```
   http://localhost:3000
   ```

## 🗄️ Base de Datos

La aplicación utiliza las siguientes tablas:

- `profiles` - Perfiles de usuario
- `conversations` - Conversaciones (privadas y grupales)
- `conversation_participants` - Participantes de conversaciones
- `messages` - Mensajes de chat

### Esquema de Base de Datos

```sql
-- Ver database-schema.sql para el esquema completo
```

## 🔧 Configuración

### Variables de Entorno

El archivo `.env.local` ya está configurado para Supabase local:

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Supabase Local

- **Studio:** http://localhost:54323
- **API:** http://localhost:54321
- **DB:** localhost:54322

## 📱 Uso

### Registro e Inicio de Sesión

1. Abre la aplicación en tu navegador
2. Regístrate con tu email y contraseña
3. Tu perfil se creará automáticamente

### Crear Conversaciones

1. Haz clic en "Nueva Conversación"
2. Elige entre conversación privada o grupo
3. Selecciona los participantes
4. Para grupos, opcionalmente añade un nombre

### Enviar Mensajes

1. Selecciona una conversación
2. Escribe tu mensaje en el campo de texto
3. Presiona Enter o haz clic en el botón de enviar

## 🏗️ Estructura del Proyecto

```
src/
├── app/                    # Páginas de Next.js
├── components/
│   ├── auth/              # Componentes de autenticación
│   └── chat/              # Componentes de chat
├── contexts/              # Contextos de React
├── lib/                   # Utilidades y configuración
└── types/                 # Tipos de TypeScript
```

## 🛠️ Tecnologías

- **Frontend:** Next.js 15, React 19, TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Realtime)
- **Autenticación:** Supabase Auth
- **Iconos:** Lucide React
- **Fechas:** date-fns

## 📝 Scripts Disponibles

```bash
npm run dev          # Desarrollo
npm run build        # Construcción
npm run start        # Producción
npm run lint         # Linter
```

## 🔄 Funcionalidades en Tiempo Real

- **Mensajes instantáneos** - Los mensajes aparecen inmediatamente
- **Actualizaciones de conversación** - Las conversaciones se actualizan en tiempo real
- **Indicadores de estado** - Información de usuarios en línea

## 🎨 Personalización

### Colores

Los colores principales se pueden personalizar en `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6', // Azul principal
        secondary: '#6B7280', // Gris secundario
      }
    }
  }
}
```

### Temas

La aplicación soporta modo claro y oscuro automáticamente.

## 🐛 Solución de Problemas

### Supabase no inicia

```bash
# Reiniciar Supabase
supabase stop
supabase start
```

### Problemas de base de datos

```bash
# Resetear base de datos
supabase db reset
```

### Problemas de dependencias

```bash
# Limpiar e instalar
rm -rf node_modules package-lock.json
npm install
```

## 📄 Licencia

MIT License - ver LICENSE para más detalles.

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Si tienes problemas o preguntas, por favor abre un issue en GitHub.

---

¡Disfruta chateando! 💬✨