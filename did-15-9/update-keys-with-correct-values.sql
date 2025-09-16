-- Actualizar claves con valores correctos generados por BIP32

-- auth-key
UPDATE private_keys 
SET 
    encrypted_private_key = 'e284129cc0922579a535bbf4d1a3b25773090d28c909bc0fed73b5e0222cc372',
    public_key = '3c35d187ea9428787cb3343d4a724fc961902012bbce5ce4f43369861e19127f'
WHERE name = 'auth-key' AND key_type = 'ed25519';

-- assertion-key
UPDATE private_keys 
SET 
    encrypted_private_key = '5c1141f60edd3095579529db7e88d964cb0a9ec0f814f6a10cd5cbd763078a0c',
    public_key = 'ae49ad9baea563bc2e33d971f010d4c34fc583b94830d4ae1b70829a676b1937'
WHERE name = 'assertion-key' AND key_type = 'ed25519';

-- key-agreement-1
UPDATE private_keys 
SET 
    encrypted_private_key = '78df181d8d74216a5c1398689b35aada58cc42e5f056b6126c1c4f6e236294c7',
    public_key = '147eaaf1eba0446f68cb18930f4676a2f0d12488989d49ab14641b31cd99397a'
WHERE name = 'key-agreement-1' AND key_type = 'x25519';

-- key-agreement-2
UPDATE private_keys 
SET 
    encrypted_private_key = '57f3997c7615a0539ad86397ecbe2b1b20013301db0d63819cae947a94c71a56',
    public_key = '1c4b5f6d69e684bfeca29a75fd31c79b8d32ee4242425ca92d1be629bd8d1b48'
WHERE name = 'key-agreement-2' AND key_type = 'x25519';

-- key-agreement-3
UPDATE private_keys 
SET 
    encrypted_private_key = '179cc36a94bf2eb024c744de12a0d94072bdf902f11f8ef3db0f4c5359ea1017',
    public_key = '9f7ff60d482f1258ba5657f49f60c6798faa6f03486bb3484059bb5253ae0d7b'
WHERE name = 'key-agreement-3' AND key_type = 'x25519';

-- Mostrar las claves actualizadas
SELECT 
    name,
    key_type,
    key_usage,
    encrypted_private_key,
    public_key
FROM private_keys 
ORDER BY name;
