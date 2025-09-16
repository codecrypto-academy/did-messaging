-- Insertar datos de ejemplo para el sistema DID

-- Insertar DIDs de ejemplo
INSERT INTO dids (did) VALUES 
('did:web:user/alice'),
('did:web:user/bob'),
('did:web:user/charlie'),
('did:web:user/diana'),
('did:web:user/eve');

-- Obtener los IDs de los DIDs insertados
-- Insertar documentos DID de ejemplo
INSERT INTO did_documents (did_id, document) 
SELECT 
    d.id,
    jsonb_build_object(
        'id', d.did,
        '@context', jsonb_build_array(
            'https://www.w3.org/ns/did/v1',
            'https://w3id.org/security/suites/ed25519-2020/v1',
            'https://w3id.org/security/suites/x25519-2020/v1'
        ),
        'controller', d.did,
        'alsoKnownAs', jsonb_build_array(
            'https://example.com/users/' || split_part(d.did, ':', 3),
            'https://social.example.com/@' || split_part(d.did, ':', 3)
        ),
        'service', jsonb_build_array(
            jsonb_build_object(
                'id', d.did || '#vcs',
                'type', 'VerifiableCredentialService',
                'serviceEndpoint', 'https://example.com/vc/' || split_part(d.did, ':', 3) || '/'
            ),
            jsonb_build_object(
                'id', d.did || '#hub',
                'type', 'HubService',
                'serviceEndpoint', 'https://example.com/hub/' || split_part(d.did, ':', 3) || '/'
            ),
            jsonb_build_object(
                'id', d.did || '#profile',
                'type', 'ProfileService',
                'serviceEndpoint', 'https://example.com/profile/' || split_part(d.did, ':', 3) || '/'
            )
        ),
        'authentication', jsonb_build_array(d.did || '#key-1'),
        'assertionMethod', jsonb_build_array(d.did || '#key-1'),
        'keyAgreement', jsonb_build_array(d.did || '#key-2'),
        'verificationMethod', jsonb_build_array(
            jsonb_build_object(
                'id', d.did || '#key-1',
                'type', 'Ed25519VerificationKey2020',
                'controller', d.did,
                'publicKeyMultibase', 'z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK'
            ),
            jsonb_build_object(
                'id', d.did || '#key-2',
                'type', 'X25519KeyAgreementKey2020',
                'controller', d.did,
                'publicKeyMultibase', 'z6LSbysY2xFMRpGMhb7tFTLMpeuPRaqaWM1yECx2AtzE3KCc'
            )
        )
    )
FROM dids d;

-- Insertar claves privadas de ejemplo (cifradas)
-- Nota: Estas son claves de ejemplo cifradas, no claves reales
INSERT INTO private_keys (did_id, key_type, name, key_usage, active, encrypted_private_key, public_key, key_derivation_path)
SELECT 
    d.id,
    'ed25519',
    'auth-key',
    'authentication',
    true,
    'encrypted_private_key_auth_' || d.id,
    'z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
    'm/44''/0''/0''/0/0'
FROM dids d;

INSERT INTO private_keys (did_id, key_type, name, key_usage, active, encrypted_private_key, public_key, key_derivation_path)
SELECT 
    d.id,
    'ed25519',
    'assertion-key',
    'assertionMethod',
    true,
    'encrypted_private_key_assertion_' || d.id,
    'z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
    'm/44''/0''/0''/0/1'
FROM dids d;

INSERT INTO private_keys (did_id, key_type, name, key_usage, active, encrypted_private_key, public_key, key_derivation_path)
SELECT 
    d.id,
    'x25519',
    'key-agreement-1',
    'keyAgreement',
    true,
    'encrypted_private_key_ka1_' || d.id,
    'z6LSbysY2xFMRpGMhb7tFTLMpeuPRaqaWM1yECx2AtzE3KCc',
    'm/44''/0''/0''/1/0'
FROM dids d;

INSERT INTO private_keys (did_id, key_type, name, key_usage, active, encrypted_private_key, public_key, key_derivation_path)
SELECT 
    d.id,
    'x25519',
    'key-agreement-2',
    'keyAgreement',
    true,
    'encrypted_private_key_ka2_' || d.id,
    'z6LSbysY2xFMRpGMhb7tFTLMpeuPRaqaWM1yECx2AtzE3KCc',
    'm/44''/0''/0''/1/1'
FROM dids d;

INSERT INTO private_keys (did_id, key_type, name, key_usage, active, encrypted_private_key, public_key, key_derivation_path)
SELECT 
    d.id,
    'x25519',
    'key-agreement-3',
    'keyAgreement',
    true,
    'encrypted_private_key_ka3_' || d.id,
    'z6LSbysY2xFMRpGMhb7tFTLMpeuPRaqaWM1yECx2AtzE3KCc',
    'm/44''/0''/0''/1/2'
FROM dids d;

-- Mostrar resumen de datos insertados
SELECT 'DIDs creados:' as tipo, count(*) as cantidad FROM dids
UNION ALL
SELECT 'Documentos DID:', count(*) FROM did_documents
UNION ALL
SELECT 'Claves privadas:', count(*) FROM private_keys;
