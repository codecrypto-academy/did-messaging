-- Script para actualizar las claves a formato hexadecimal
-- Este script genera claves determinísticas basadas en el nombre y path de derivación

-- Función para generar clave hexadecimal determinística
CREATE OR REPLACE FUNCTION generate_hex_key(key_name TEXT, derivation_path TEXT, key_type TEXT)
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

-- Actualizar claves públicas a formato hexadecimal
UPDATE private_keys 
SET public_key = generate_hex_key(name, key_derivation_path, key_type)
WHERE public_key LIKE 'z%';

-- Mostrar las claves actualizadas
SELECT 
    name,
    key_type,
    key_usage,
    public_key,
    key_derivation_path
FROM private_keys 
ORDER BY name;
