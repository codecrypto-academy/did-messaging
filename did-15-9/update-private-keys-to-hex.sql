-- Script para actualizar las claves privadas a formato hexadecimal sin cifrar
-- Este script genera claves privadas determinísticas basadas en el nombre y path de derivación

-- Función para generar clave privada hexadecimal determinística
CREATE OR REPLACE FUNCTION generate_private_key_hex(key_name TEXT, derivation_path TEXT, key_type TEXT)
RETURNS TEXT AS $$
DECLARE
    seed_text TEXT;
    key_hex TEXT;
BEGIN
    -- Crear seed determinístico
    seed_text := key_name || derivation_path;
    
    -- Generar hash SHA256 y tomar los primeros 32 bytes
    key_hex := encode(digest(seed_text, 'sha256'), 'hex');
    
    RETURN key_hex;
END;
$$ LANGUAGE plpgsql;

-- Actualizar claves privadas a formato hexadecimal sin cifrar
UPDATE private_keys 
SET encrypted_private_key = generate_private_key_hex(name, key_derivation_path, key_type)
WHERE encrypted_private_key LIKE 'encrypted_private_key_%';

-- Mostrar las claves privadas actualizadas
SELECT 
    name,
    key_type,
    key_usage,
    encrypted_private_key,
    public_key,
    key_derivation_path
FROM private_keys 
ORDER BY name
LIMIT 10;
