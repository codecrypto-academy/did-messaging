-- Script para resetear la base de datos y crear registros nuevos con claves hexadecimales

-- Limpiar todas las tablas
DELETE FROM private_keys;
DELETE FROM did_documents;
DELETE FROM dids;

-- Resetear secuencias
ALTER SEQUENCE dids_id_seq RESTART WITH 1;
ALTER SEQUENCE did_documents_id_seq RESTART WITH 1;
ALTER SEQUENCE private_keys_id_seq RESTART WITH 1;

-- Insertar DIDs de ejemplo
INSERT INTO dids (did) VALUES 
('did:web:user/alice'),
('did:web:user/bob'),
('did:web:user/charlie'),
('did:web:user/diana'),
('did:web:user/eve');

-- Insertar documentos DID
INSERT INTO did_documents (did_id, document) 
SELECT 
    d.id,
    jsonb_build_object(
        '@context', 'https://www.w3.org/ns/did/v1',
        'id', d.did,
        'verificationMethod', jsonb_build_array(
            jsonb_build_object(
                'id', d.did || '#key-1',
                'type', 'Ed25519VerificationKey2020',
                'controller', d.did,
                'publicKeyMultibase', '3c35d187ea9428787cb3343d4a724fc961902012bbce5ce4f43369861e19127f'
            ),
            jsonb_build_object(
                'id', d.did || '#key-2',
                'type', 'Ed25519VerificationKey2020',
                'controller', d.did,
                'publicKeyMultibase', 'ae49ad9baea563bc2e33d971f010d4c34fc583b94830d4ae1b70829a676b1937'
            ),
            jsonb_build_object(
                'id', d.did || '#key-3',
                'type', 'X25519KeyAgreementKey2020',
                'controller', d.did,
                'publicKeyMultibase', '147eaaf1eba0446f68cb18930f4676a2f0d12488989d49ab14641b31cd99397a'
            ),
            jsonb_build_object(
                'id', d.did || '#key-4',
                'type', 'X25519KeyAgreementKey2020',
                'controller', d.did,
                'publicKeyMultibase', '1c4b5f6d69e684bfeca29a75fd31c79b8d32ee4242425ca92d1be629bd8d1b48'
            ),
            jsonb_build_object(
                'id', d.did || '#key-5',
                'type', 'X25519KeyAgreementKey2020',
                'controller', d.did,
                'publicKeyMultibase', '9f7ff60d482f1258ba5657f49f60c6798faa6f03486bb3484059bb5253ae0d7b'
            )
        ),
        'authentication', jsonb_build_array(d.did || '#key-1'),
        'assertionMethod', jsonb_build_array(d.did || '#key-2'),
        'keyAgreement', jsonb_build_array(
            d.did || '#key-3',
            d.did || '#key-4',
            d.did || '#key-5'
        )
    )
FROM dids d;

-- Insertar claves privadas para cada DID
INSERT INTO private_keys (did_id, key_type, name, key_usage, active, encrypted_private_key, public_key, key_derivation_path)
SELECT 
    d.id,
    'ed25519',
    'auth-key',
    'authentication',
    true,
    'e284129cc0922579a535bbf4d1a3b25773090d28c909bc0fed73b5e0222cc372',
    '3c35d187ea9428787cb3343d4a724fc961902012bbce5ce4f43369861e19127f',
    'm/44''/0''/0''/0/0'
FROM dids d;

INSERT INTO private_keys (did_id, key_type, name, key_usage, active, encrypted_private_key, public_key, key_derivation_path)
SELECT 
    d.id,
    'ed25519',
    'assertion-key',
    'assertionMethod',
    true,
    '5c1141f60edd3095579529db7e88d964cb0a9ec0f814f6a10cd5cbd763078a0c',
    'ae49ad9baea563bc2e33d971f010d4c34fc583b94830d4ae1b70829a676b1937',
    'm/44''/0''/0''/0/1'
FROM dids d;

INSERT INTO private_keys (did_id, key_type, name, key_usage, active, encrypted_private_key, public_key, key_derivation_path)
SELECT 
    d.id,
    'x25519',
    'key-agreement-1',
    'keyAgreement',
    true,
    '78df181d8d74216a5c1398689b35aada58cc42e5f056b6126c1c4f6e236294c7',
    '147eaaf1eba0446f68cb18930f4676a2f0d12488989d49ab14641b31cd99397a',
    'm/44''/0''/0''/1/0'
FROM dids d;

INSERT INTO private_keys (did_id, key_type, name, key_usage, active, encrypted_private_key, public_key, key_derivation_path)
SELECT 
    d.id,
    'x25519',
    'key-agreement-2',
    'keyAgreement',
    true,
    '57f3997c7615a0539ad86397ecbe2b1b20013301db0d63819cae947a94c71a56',
    '1c4b5f6d69e684bfeca29a75fd31c79b8d32ee4242425ca92d1be629bd8d1b48',
    'm/44''/0''/0''/1/1'
FROM dids d;

INSERT INTO private_keys (did_id, key_type, name, key_usage, active, encrypted_private_key, public_key, key_derivation_path)
SELECT 
    d.id,
    'x25519',
    'key-agreement-3',
    'keyAgreement',
    true,
    '179cc36a94bf2eb024c744de12a0d94072bdf902f11f8ef3db0f4c5359ea1017',
    '9f7ff60d482f1258ba5657f49f60c6798faa6f03486bb3484059bb5253ae0d7b',
    'm/44''/0''/0''/1/2'
FROM dids d;

-- Mostrar resumen de datos insertados
SELECT 
    'DIDs' as table_name,
    COUNT(*) as count
FROM dids
UNION ALL
SELECT 
    'DID Documents' as table_name,
    COUNT(*) as count
FROM did_documents
UNION ALL
SELECT 
    'Private Keys' as table_name,
    COUNT(*) as count
FROM private_keys;

-- Mostrar algunas claves de ejemplo
SELECT 
    d.did,
    pk.name,
    pk.key_type,
    pk.key_usage,
    pk.encrypted_private_key,
    pk.public_key
FROM private_keys pk
JOIN dids d ON pk.did_id = d.id
WHERE d.did = 'did:web:user/alice'
ORDER BY pk.name;
