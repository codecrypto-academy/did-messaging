-- Crear tabla de mensajes encriptados
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    from_did VARCHAR(255) NOT NULL,
    to_did VARCHAR(255) NOT NULL,
    encrypted_message TEXT NOT NULL, -- Mensaje encriptado en base64
    sender_public_key TEXT NOT NULL, -- Clave pública del remitente para calcular shared secret
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_messages_from_did ON messages(from_did);
CREATE INDEX IF NOT EXISTS idx_messages_to_did ON messages(to_did);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Crear función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para updated_at
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_messages_updated_at();

-- Mostrar la estructura de la tabla
\d messages;
