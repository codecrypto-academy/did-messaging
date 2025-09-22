# Configuración de Realtime para Conversaciones DID

## 🎯 Objetivo

Establecer comunicación en tiempo real entre DIDs usando channels únicos basados en la combinación de los DIDs participantes.

## 📋 Pasos para configurar

### 1. Verificar que Supabase está ejecutándose

```bash
# Asegúrate de que Supabase local está activo
supabase status
```

### 2. Ejecutar script de habilitación de Realtime

```bash
cd scripts
npm run enable-realtime
```

**O manualmente:**
```bash
npx tsx enable-realtime-sql.ts
```

### 3. Si el script automático falla, configurar manualmente

1. Abre Supabase Studio: http://localhost:54323
2. Ve a **Database → Replication**
3. En la sección **Realtime**, habilita las tablas:
   - ✅ `messages`
   - ✅ `conversations`
4. Eventos a habilitar: `INSERT`, `UPDATE`, `DELETE`

**O ejecuta estos comandos SQL en el SQL Editor:**

```sql
-- Habilitar realtime para la tabla messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Habilitar realtime para la tabla conversations
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
```

### 4. Probar la configuración

```bash
npm run setup-realtime
```

Este script probará:
- ✅ Conexión a las tablas
- ✅ Suscripción a channels de conversación
- ✅ Channels bidireccionales entre DIDs

## 🔧 Cómo funcionan los Channels

### Channel ID único por conversación

```typescript
// Ejemplo: DID A = "did:example:alice", DID B = "did:example:bob"
// Channel ID = "did:example:alice-did:example:bob" (ordenado lexicográficamente)

function createConversationChannelId(did1: string, did2: string): string {
  return did1 < did2 ? `${did1}-${did2}` : `${did2}-${did1}`
}
```

### Suscripción bidireccional

El sistema escucha mensajes en ambas direcciones:
- `FROM did:example:alice TO did:example:bob`
- `FROM did:example:bob TO did:example:alice`

### Uso en el código

```typescript
import { useConversationRealtime } from '@/hooks/useConversationRealtime'

const { isConnected } = useConversationRealtime({
  did1: "did:example:alice",
  did2: "did:example:bob",
  onNewMessage: (message) => {
    console.log('Nuevo mensaje:', message)
  }
})
```

## 🐛 Solución de problemas

### ❌ "Channel not subscribed"

1. Verifica que realtime está habilitado para las tablas
2. Revisa que las variables de entorno están configuradas
3. Confirma que Supabase local está ejecutándose

### ❌ "Permission denied"

1. Verifica las políticas RLS en las tablas
2. Asegúrate de estar autenticado correctamente
3. Revisa que `user_id` coincide con el usuario autenticado

### ❌ "Messages not appearing in real-time"

1. Abre las herramientas de desarrollador del navegador
2. Ve a la consola y busca mensajes de realtime
3. Verifica que el estado de conexión muestra "connected"

## 📡 Estados de conexión

- 🟡 **connecting**: Estableciendo conexión
- 🟢 **connected**: Canal activo y funcionando
- 🔴 **error**: Error en la conexión
- ⚪ **disconnected**: Sin conexión activa

## 🔍 Debugging

Para ver logs detallados en la consola del navegador:

```javascript
// Activar logs de Supabase Realtime
window.localStorage.setItem('supabase.debug', 'true')
```

## ✅ Verificación exitosa

Si todo está configurado correctamente, deberías ver:

1. En los logs del script: `✅ Realtime habilitado automáticamente para messages`
2. En el navegador: Estado "connected" en el chat
3. Mensajes apareciendo instantáneamente entre ventanas/usuarios

## 🚀 Próximos pasos

Una vez configurado, los channels se crean automáticamente cuando:
1. Un usuario selecciona dos DIDs para chatear
2. Se establece la conexión realtime
3. Los mensajes fluyen bidireccionalmente en tiempo real