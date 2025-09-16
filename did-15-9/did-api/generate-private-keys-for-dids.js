const bip39 = require('bip39');
const { BIP32Factory } = require('bip32');
const ecc = require('tiny-secp256k1');
const { ed25519 } = require('@noble/curves/ed25519');
const { x25519 } = require('@noble/curves/ed25519');
const { sha256 } = require('@noble/hashes/sha256');

const bip32 = BIP32Factory(ecc);

// Datos de los DIDs de la base de datos
const didsData = [
    {
        id: '8883539e-b950-4a98-a3f7-a2643acef270',
        did: 'did:web:user/alice',
        mnemonic: 'flat snap pyramid cash raven spray shrug famous tomato prosper sibling tumble'
    },
    {
        id: 'd927569b-dcf7-4963-9eb7-bcfd2d979df3',
        did: 'did:web:user/bob',
        mnemonic: 'figure garage angry picnic history ginger list maid jaguar oven spirit tank'
    },
    {
        id: '2ab07011-71bd-4b5b-94b8-e4db523630ab',
        did: 'did:web:user/charlie',
        mnemonic: 'arm gentle work grab timber retire source wage student boil mule seven'
    },
    {
        id: '931c8162-a90c-48f0-baad-c175df71a0c7',
        did: 'did:web:user/diana',
        mnemonic: 'fork wet coil security fox theme flag narrow hire drastic winter wrist'
    },
    {
        id: 'f91c37f0-85f0-4f2c-b64f-8a0ce44c7f6d',
        did: 'did:web:user/eve',
        mnemonic: 'border robot member table animal electric left web kitten parade sugar capable'
    }
];

function generateKeysForDID(didData) {
    const seed = bip39.mnemonicToSeedSync(didData.mnemonic);
    const hdkey = bip32.fromSeed(seed);
    
    const keys = [];
    
    // Auth key (Ed25519) - m/44'/0'/0'/0/0
    const authDerived = hdkey.derivePath("m/44'/0'/0'/0/0");
    const authPrivate = new Uint8Array(authDerived.privateKey);
    const authPublic = ed25519.getPublicKey(authPrivate);
    
    keys.push({
        did_id: didData.id,
        key_type: 'ed25519',
        name: 'auth-key',
        key_usage: 'authentication',
        active: true,
        encrypted_private_key: Buffer.from(authPrivate).toString('hex'),
        public_key: Buffer.from(authPublic).toString('hex'),
        key_derivation_path: "m/44'/0'/0'/0/0"
    });
    
    // Assertion key (Ed25519) - m/44'/0'/0'/0/1
    const assertionDerived = hdkey.derivePath("m/44'/0'/0'/0/1");
    const assertionPrivate = new Uint8Array(assertionDerived.privateKey);
    const assertionPublic = ed25519.getPublicKey(assertionPrivate);
    
    keys.push({
        did_id: didData.id,
        key_type: 'ed25519',
        name: 'assertion-key',
        key_usage: 'assertionMethod',
        active: true,
        encrypted_private_key: Buffer.from(assertionPrivate).toString('hex'),
        public_key: Buffer.from(assertionPublic).toString('hex'),
        key_derivation_path: "m/44'/0'/0'/0/1"
    });
    
    // Key agreement 1 (X25519) - m/44'/0'/0'/1/0
    const ka1Derived = hdkey.derivePath("m/44'/0'/0'/1/0");
    const ka1Private = new Uint8Array(ka1Derived.privateKey);
    const ka1Hash = sha256(ka1Private);
    const ka1X25519Private = ka1Hash.slice(0, 32);
    const ka1X25519Public = x25519.getPublicKey(ka1X25519Private);
    
    keys.push({
        did_id: didData.id,
        key_type: 'x25519',
        name: 'key-agreement-1',
        key_usage: 'keyAgreement',
        active: true,
        encrypted_private_key: Buffer.from(ka1X25519Private).toString('hex'),
        public_key: Buffer.from(ka1X25519Public).toString('hex'),
        key_derivation_path: "m/44'/0'/0'/1/0"
    });
    
    // Key agreement 2 (X25519) - m/44'/0'/0'/1/1
    const ka2Derived = hdkey.derivePath("m/44'/0'/0'/1/1");
    const ka2Private = new Uint8Array(ka2Derived.privateKey);
    const ka2Hash = sha256(ka2Private);
    const ka2X25519Private = ka2Hash.slice(0, 32);
    const ka2X25519Public = x25519.getPublicKey(ka2X25519Private);
    
    keys.push({
        did_id: didData.id,
        key_type: 'x25519',
        name: 'key-agreement-2',
        key_usage: 'keyAgreement',
        active: true,
        encrypted_private_key: Buffer.from(ka2X25519Private).toString('hex'),
        public_key: Buffer.from(ka2X25519Public).toString('hex'),
        key_derivation_path: "m/44'/0'/0'/1/1"
    });
    
    // Key agreement 3 (X25519) - m/44'/0'/0'/1/2
    const ka3Derived = hdkey.derivePath("m/44'/0'/0'/1/2");
    const ka3Private = new Uint8Array(ka3Derived.privateKey);
    const ka3Hash = sha256(ka3Private);
    const ka3X25519Private = ka3Hash.slice(0, 32);
    const ka3X25519Public = x25519.getPublicKey(ka3X25519Private);
    
    keys.push({
        did_id: didData.id,
        key_type: 'x25519',
        name: 'key-agreement-3',
        key_usage: 'keyAgreement',
        active: true,
        encrypted_private_key: Buffer.from(ka3X25519Private).toString('hex'),
        public_key: Buffer.from(ka3X25519Public).toString('hex'),
        key_derivation_path: "m/44'/0'/0'/1/2"
    });
    
    return keys;
}

console.log('=== Generando claves privadas para todos los DIDs ===\n');

let allKeys = [];
didsData.forEach(didData => {
    const keys = generateKeysForDID(didData);
    allKeys = allKeys.concat(keys);
    
    console.log(`${didData.did}:`);
    console.log(`  - ${keys.length} claves generadas`);
    keys.forEach(key => {
        console.log(`    ${key.name} (${key.key_type}): ${key.public_key.substring(0, 16)}...`);
    });
    console.log('');
});

console.log('=== SQL para insertar claves privadas ===');
console.log('INSERT INTO private_keys (did_id, key_type, name, key_usage, active, encrypted_private_key, public_key, key_derivation_path) VALUES');

allKeys.forEach((key, index) => {
    const comma = index < allKeys.length - 1 ? ',' : ';';
    console.log(`('${key.did_id}', '${key.key_type}', '${key.name}', '${key.key_usage}', ${key.active}, '${key.encrypted_private_key}', '${key.public_key}', '${key.key_derivation_path}')${comma}`);
});

console.log(`\nTotal claves a insertar: ${allKeys.length}`);
