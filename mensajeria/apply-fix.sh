#!/bin/bash

# Script para aplicar la corrección de mensajes duplicados

echo "🔧 Aplicando corrección de mensajes duplicados..."

# 1. Actualizar el import para incluir useRef
sed -i '' 's/import { useState, useEffect }/import { useState, useEffect, useRef }/' src/components/chat/ChatInterface.tsx

# 2. Agregar el ref después de la línea 26
sed -i '' '26a\
  const unsubscribeRef = useRef<(() => void) | null>(null)\
' src/components/chat/ChatInterface.tsx

# 3. Reemplazar el useEffect problemático
cat > temp_useeffect.js << 'EOF'
const fs = require('fs');

const filePath = 'src/components/chat/ChatInterface.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Reemplazar el useEffect problemático
const oldUseEffect = `  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id)
      subscribeToMessages(selectedConversation.id)
    }
  }, [selectedConversation])`;

const newUseEffect = `  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id)
      
      // Limpiar suscripción anterior si existe
      if (unsubscribeRef.current) {
        console.log('Cleaning up previous subscription')
        unsubscribeRef.current()
      }
      
      // Crear nueva suscripción y guardar función de limpieza
      const unsubscribe = subscribeToMessages(selectedConversation.id)
      unsubscribeRef.current = unsubscribe
    }
    
    // Cleanup al desmontar
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [selectedConversation])`;

content = content.replace(oldUseEffect, newUseEffect);

fs.writeFileSync(filePath, content);
console.log('✅ useEffect actualizado correctamente');
EOF

node temp_useeffect.js
rm temp_useeffect.js

echo "✅ Corrección aplicada exitosamente!"
echo "📝 Cambios realizados:"
echo "   - Agregado useRef al import"
echo "   - Agregado unsubscribeRef para manejar limpieza de suscripciones"
echo "   - Modificado useEffect para limpiar suscripciones anteriores"
echo "   - Agregado cleanup al desmontar el componente"
