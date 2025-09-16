-- Agregar campo para especificar qué clave del remitente usar
ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_key_id UUID;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_key_name VARCHAR(100);

-- Crear índice para el sender_key_id
CREATE INDEX IF NOT EXISTS idx_messages_sender_key_id ON messages(sender_key_id);

-- Mostrar la estructura actualizada
\d messages;
