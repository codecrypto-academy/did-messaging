-- Crear tabla de mensajes
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_did TEXT NOT NULL,
  to_did TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_messages_from_did ON messages(from_did);
CREATE INDEX IF NOT EXISTS idx_messages_to_did ON messages(to_did);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_fecha ON messages(fecha DESC);

-- Habilitar Row Level Security (RLS)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo puedan ver sus propios mensajes
CREATE POLICY "Users can view their own messages" ON messages
  FOR SELECT USING (auth.uid() = user_id);

-- Política para que los usuarios solo puedan insertar sus propios mensajes
CREATE POLICY "Users can insert their own messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para que los usuarios solo puedan actualizar sus propios mensajes
CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (auth.uid() = user_id);

-- Función para actualizar el campo updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at en cada modificación
CREATE OR REPLACE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Crear vista para conversaciones (agrupando mensajes entre DIDs)
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
  MAX(fecha) as last_message_date,
  user_id
FROM messages
GROUP BY
  conversation_id, did1, did2, user_id
ORDER BY last_message_date DESC;