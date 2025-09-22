-- Agregar campos faltantes a la tabla messages existente
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS mensaje TEXT,
ADD COLUMN IF NOT EXISTS fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE NULL;

-- Actualizar registros existentes para usar encrypted_message como mensaje si mensaje está vacío
UPDATE messages
SET mensaje = encrypted_message
WHERE mensaje IS NULL OR mensaje = '';

-- Actualizar registros existentes para usar created_at como fecha si fecha está vacío
UPDATE messages
SET fecha = created_at
WHERE fecha IS NULL;

-- Crear índices adicionales si no existen
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_fecha ON messages(fecha DESC);

-- Habilitar Row Level Security (RLS) si no está habilitado
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;

-- Crear políticas temporales más permisivas para desarrollo
CREATE POLICY "Allow all for authenticated users" ON messages
  FOR ALL USING (auth.role() = 'authenticated');

-- Crear vista para conversaciones (agrupando mensajes entre DIDs)
DROP VIEW IF EXISTS conversations;
CREATE OR REPLACE VIEW conversations AS
SELECT
  CASE
    WHEN from_did < to_did THEN from_did || '-' || to_did
    ELSE to_did || '-' || from_did
  END as conversation_id,
  CASE
    WHEN from_did < to_did THEN from_did
    ELSE to_did
  END as did1,
  CASE
    WHEN from_did < to_did THEN to_did
    ELSE from_did
  END as did2,
  COUNT(*) as message_count,
  MAX(COALESCE(fecha, created_at)) as last_message_date,
  user_id
FROM messages
GROUP BY
  conversation_id, did1, did2, user_id
ORDER BY last_message_date DESC;