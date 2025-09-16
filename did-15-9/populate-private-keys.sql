-- Script para poblar la tabla private_keys con claves generadas desde los mnemónicos únicos

-- Primero, vamos a ver qué DIDs tenemos
SELECT id, did, LEFT(mnemonic, 30) || '...' as mnemonic_preview FROM dids ORDER BY did;
