-- Script para resetear la base de datos con mnemónicos únicos reales

-- Limpiar todas las tablas
DELETE FROM private_keys;
DELETE FROM did_documents;
DELETE FROM dids;

-- Insertar DIDs con mnemónicos únicos reales
INSERT INTO dids (did, mnemonic) VALUES
('did:web:user/alice', 'flat snap pyramid cash raven spray shrug famous tomato prosper sibling tumble'),
('did:web:user/bob', 'figure garage angry picnic history ginger list maid jaguar oven spirit tank'),
('did:web:user/charlie', 'arm gentle work grab timber retire source wage student boil mule seven'),
('did:web:user/diana', 'fork wet coil security fox theme flag narrow hire drastic winter wrist'),
('did:web:user/eve', 'border robot member table animal electric left web kitten parade sugar capable');

-- Mostrar los DIDs insertados
SELECT did, LEFT(mnemonic, 50) || '...' as mnemonic_preview FROM dids ORDER BY did;
