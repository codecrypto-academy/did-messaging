-- Insertar todas las claves privadas generadas desde los mnemónicos únicos

INSERT INTO private_keys (did_id, key_type, name, key_usage, active, encrypted_private_key, public_key, key_derivation_path) VALUES
('8883539e-b950-4a98-a3f7-a2643acef270', 'ed25519', 'auth-key', 'authentication', true, 'a8214eaf3c2078f68d8b35703f03668169ca57c6523d14a33667f66a7689667c', '1b0230b5ffb1a9e1373e6aea77cba45b1df55129ec9d37841904be23401cb4ee', 'm/44''/0''/0''/0/0'),
('8883539e-b950-4a98-a3f7-a2643acef270', 'ed25519', 'assertion-key', 'assertionMethod', true, '76ef4b79541ed0e4624026dfb1ec50d2565ad02aeb6c7da408f6c1484f6625be', '48a7f6bca05cdf0509eaa0f6c65e68213f5b6864803fcf41cf366960359f3609', 'm/44''/0''/0''/0/1'),
('8883539e-b950-4a98-a3f7-a2643acef270', 'x25519', 'key-agreement-1', 'keyAgreement', true, '382497f1351bba99863b3b590efa9dcc416a542a62ea2bc57a963d93c922044d', 'a606a7bd7027a65977b9a054211d36f61dc9519a98a1b87ac3c8a5879d4d5865', 'm/44''/0''/0''/1/0'),
('8883539e-b950-4a98-a3f7-a2643acef270', 'x25519', 'key-agreement-2', 'keyAgreement', true, 'c32854827a42085f57d58382522ed8cccae800a12196e114ac5aedafbaf36565', '380e454c8a030e184fd52bb1a5b239995615fa7e156ea5587a99f0358432cf32', 'm/44''/0''/0''/1/1'),
('8883539e-b950-4a98-a3f7-a2643acef270', 'x25519', 'key-agreement-3', 'keyAgreement', true, 'f5fa1320742b5828894af1d32b9342380124346ef78cf04c0a1a294a0ba6f119', '39214a11552cfda39c1350e057d2ebfaad7b520b708ad715d3008490e0556e73', 'm/44''/0''/0''/1/2'),
('d927569b-dcf7-4963-9eb7-bcfd2d979df3', 'ed25519', 'auth-key', 'authentication', true, '2859fa6c68580dde7211535dd09fc75a8c31dafa9c3a32e661b919b9126a758c', '9353bde336c59fff7cdd4769ccd0ffcb24c8a781e210c9d5a3424b33dd89fb9f', 'm/44''/0''/0''/0/0'),
('d927569b-dcf7-4963-9eb7-bcfd2d979df3', 'ed25519', 'assertion-key', 'assertionMethod', true, '3d2c28714cf4afc53b0b5176e7e8420059da1df83a83c843b8e0b63111c4d439', 'af282c2bf365efe5555e4fc42228dff7e4fa924332c8511ebe9d02907861ee1e', 'm/44''/0''/0''/0/1'),
('d927569b-dcf7-4963-9eb7-bcfd2d979df3', 'x25519', 'key-agreement-1', 'keyAgreement', true, '4ad92fa88436d5143b5e9c5024e85e58d97b3834558001999859a678d4d78ac1', '9b67916ebd8aaa74fd9bb0ac78cacb583947fbfe26973fd2dda5d8d57470e246', 'm/44''/0''/0''/1/0'),
('d927569b-dcf7-4963-9eb7-bcfd2d979df3', 'x25519', 'key-agreement-2', 'keyAgreement', true, 'c72fbdd77444b83cc3aaaede3c149abea7a7496a371f2ffcb398a7d8a824d818', 'eccedc7d268d8200a8abd63359b1af6eaca9da3e98e8008fdd99e8c0e412643c', 'm/44''/0''/0''/1/1'),
('d927569b-dcf7-4963-9eb7-bcfd2d979df3', 'x25519', 'key-agreement-3', 'keyAgreement', true, '55eb27f8213d1812f6b6c7b2f945dd19dbc4448b37513e528b7080006ba23980', 'bfa578a3e552e578b164aa511407bceae563229f3ed6bbe43390bf00c4285e6e', 'm/44''/0''/0''/1/2'),
('2ab07011-71bd-4b5b-94b8-e4db523630ab', 'ed25519', 'auth-key', 'authentication', true, 'a7c4e9013b34d0941795b357b2d9cfdfc6284af5a8503fee0aa693613039ab83', '92c94c06550bf822c788ef351fb438364968621edd34c9c9859b01b33935c99f', 'm/44''/0''/0''/0/0'),
('2ab07011-71bd-4b5b-94b8-e4db523630ab', 'ed25519', 'assertion-key', 'assertionMethod', true, 'ac65aead1665714f66886fdec6f2fa4e3f36aca539f4609119293167a9a73900', '9e374c23372b1e27932a702feeef575274aade8602b1308b735afeb369ce157a', 'm/44''/0''/0''/0/1'),
('2ab07011-71bd-4b5b-94b8-e4db523630ab', 'x25519', 'key-agreement-1', 'keyAgreement', true, '28f589524e938071c8a8cdc396345a8198e20a2f426ecf6eda430a25809f6d73', '149020006e8ada8a6aeab213a0b3a8b417c2ec2853e07ece62262b6cd8e6555e', 'm/44''/0''/0''/1/0'),
('2ab07011-71bd-4b5b-94b8-e4db523630ab', 'x25519', 'key-agreement-2', 'keyAgreement', true, '697a61508b3421b5d3c101762583b010ebb94d5efe8568550e6ad69575c87a36', 'afc268c79c0c8ae707b1c07c41d6b83bdd1301aebc985431995317183a035f61', 'm/44''/0''/0''/1/1'),
('2ab07011-71bd-4b5b-94b8-e4db523630ab', 'x25519', 'key-agreement-3', 'keyAgreement', true, '336a5db520afa041431fe7b34b0273e605a1a7fe6fb9c11192e09210df832138', 'd46aed4774c988b824457a232d0f7a0b47cf08d708d387b3705d07bae4ef4776', 'm/44''/0''/0''/1/2'),
('931c8162-a90c-48f0-baad-c175df71a0c7', 'ed25519', 'auth-key', 'authentication', true, '10ffddc4a0e5120d6e7a2095c5988a35fb279a5c14be673bbac9d692cc0940ed', '2867fd4d72fca43f6b882bfd88ff218a2e1a95dcd66b9670c80e340d03e67fc5', 'm/44''/0''/0''/0/0'),
('931c8162-a90c-48f0-baad-c175df71a0c7', 'ed25519', 'assertion-key', 'assertionMethod', true, '8ecffae66cc93fef7c09fb581aa02173c4726e7a8371afec732700d0c05fbb56', '9055d96b6f024dd5aad694699d9ac5c4b9739c97952e453bd216596211229cc9', 'm/44''/0''/0''/0/1'),
('931c8162-a90c-48f0-baad-c175df71a0c7', 'x25519', 'key-agreement-1', 'keyAgreement', true, '6bbb897f58932bdb08b5da21de6bf53763df694383d0f61a2e80e9ed33c01f6a', 'b3b4e229d06f944613e66c1430c6e044341f2559b8330445dcac0d4b9be8e86f', 'm/44''/0''/0''/1/0'),
('931c8162-a90c-48f0-baad-c175df71a0c7', 'x25519', 'key-agreement-2', 'keyAgreement', true, 'c6d24af4aa8967bce74f0446b95d52dbb7a540b032d75e1dbbcd92518c6c48c0', '3893402d8f437f5628d2980e6153af49a1d7ef5a03d589198a36ab081caecd35', 'm/44''/0''/0''/1/1'),
('931c8162-a90c-48f0-baad-c175df71a0c7', 'x25519', 'key-agreement-3', 'keyAgreement', true, 'e3836de114c8fe1d3848ee0190449cd1723ee593c83f91e728c75971d8e2c2a1', '2cc142baa001c1b75402bf9c468838733b0dbad50df317917ef7b4ff87089972', 'm/44''/0''/0''/1/2'),
('f91c37f0-85f0-4f2c-b64f-8a0ce44c7f6d', 'ed25519', 'auth-key', 'authentication', true, '64f2afbab93f8e07152468e318d9ddede129b08682d943079eca76fef14973da', '411543934f3268a13bbfa6399bc4f7428b4a6691600fb17ff8b58450022eb607', 'm/44''/0''/0''/0/0'),
('f91c37f0-85f0-4f2c-b64f-8a0ce44c7f6d', 'ed25519', 'assertion-key', 'assertionMethod', true, '7a552cd146a699020f8da878dcea9488861b742227c9160d70405c43388dea2d', '086de961489a267946c910b2080f72264a933e0fa2345dbea0c59740cf171ab7', 'm/44''/0''/0''/0/1'),
('f91c37f0-85f0-4f2c-b64f-8a0ce44c7f6d', 'x25519', 'key-agreement-1', 'keyAgreement', true, '99c0c9c6400fb4f8460439fbb924ed34df2eb938b3bb0f9bef31a50e162153eb', '0b722f5a6960bcc74764dc430b125e4a7e237c66e564e6de210e0da17cc79879', 'm/44''/0''/0''/1/0'),
('f91c37f0-85f0-4f2c-b64f-8a0ce44c7f6d', 'x25519', 'key-agreement-2', 'keyAgreement', true, '919a75ef1cceaac36557b073afaf9bdb2d2b79556fa20d6cc777640930eba936', '3863d9d2c8e5f73fdeabf58e7fcaccec08a9315732be580fef9c46690c3e3023', 'm/44''/0''/0''/1/1'),
('f91c37f0-85f0-4f2c-b64f-8a0ce44c7f6d', 'x25519', 'key-agreement-3', 'keyAgreement', true, 'c84493185ae5c1420e656ada6fe2620fe87a20a8b7c0b258cd68b903fdd1d585', '5d9863663ed708b5bdfff65725a291cd836a4b93477672b3a6a9a6aab0ca725a', 'm/44''/0''/0''/1/2');

-- Mostrar resumen de claves insertadas
SELECT 
    d.did,
    COUNT(pk.id) as total_keys,
    COUNT(CASE WHEN pk.key_type = 'ed25519' THEN 1 END) as ed25519_keys,
    COUNT(CASE WHEN pk.key_type = 'x25519' THEN 1 END) as x25519_keys
FROM dids d
LEFT JOIN private_keys pk ON d.id = pk.did_id
GROUP BY d.id, d.did
ORDER BY d.did;
