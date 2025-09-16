-- Script para resetear la base de datos con mnemónicos únicos por DID

-- Limpiar todas las tablas
DELETE FROM private_keys;
DELETE FROM did_documents;
DELETE FROM dids;

-- Insertar DIDs con mnemónicos únicos
INSERT INTO dids (did, mnemonic) VALUES 
('did:web:user/alice', 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'),
('did:web:user/bob', 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon'),
('did:web:user/charlie', 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon'),
('did:web:user/diana', 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon'),
('did:web:user/eve', 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon');

-- Mostrar los DIDs insertados
SELECT did, mnemonic FROM dids ORDER BY did;
