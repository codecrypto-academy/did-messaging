const bip39 = require('bip39');
const { BIP32Factory } = require('bip32');
const ecc = require('tiny-secp256k1');
const { ed25519 } = require('@noble/curves/ed25519');
const { x25519 } = require('@noble/curves/ed25519');
const { sha256 } = require('@noble/hashes/sha256');

const bip32 = BIP32Factory(ecc);

// Mnemónicos únicos de la base de datos
const mnemonics = [
    'flat snap pyramid cash raven spray shrug famous tomato prosper sibling tumble',
    'figure garage angry picnic history ginger list maid jaguar oven spirit tank',
    'arm gentle work grab timber retire source wage student boil mule seven',
    'fork wet coil security fox theme flag narrow hire drastic winter wrist',
    'border robot member table animal electric left web kitten parade sugar capable'
];

const dids = [
    'did:web:user/alice',
    'did:web:user/bob',
    'did:web:user/charlie',
    'did:web:user/diana',
    'did:web:user/eve'
];

function generateKeysForMnemonic(mnemonic, didName) {
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const hdkey = bip32.fromSeed(seed);
    
    const keys = {
        did: didName,
        mnemonic: mnemonic.substring(0, 30) + '...',
        authKey: {
            private: '',
            public: ''
        },
        assertionKey: {
            private: '',
            public: ''
        },
        keyAgreement1: {
            private: '',
            public: ''
        }
    };
    
    // Auth key (Ed25519)
    const authDerived = hdkey.derivePath("m/44'/0'/0'/0/0");
    const authPrivate = new Uint8Array(authDerived.privateKey);
    const authPublic = ed25519.getPublicKey(authPrivate);
    keys.authKey.private = Buffer.from(authPrivate).toString('hex');
    keys.authKey.public = Buffer.from(authPublic).toString('hex');
    
    // Assertion key (Ed25519)
    const assertionDerived = hdkey.derivePath("m/44'/0'/0'/0/1");
    const assertionPrivate = new Uint8Array(assertionDerived.privateKey);
    const assertionPublic = ed25519.getPublicKey(assertionPrivate);
    keys.assertionKey.private = Buffer.from(assertionPrivate).toString('hex');
    keys.assertionKey.public = Buffer.from(assertionPublic).toString('hex');
    
    // Key agreement 1 (X25519)
    const kaDerived = hdkey.derivePath("m/44'/0'/0'/1/0");
    const kaPrivate = new Uint8Array(kaDerived.privateKey);
    const kaHash = sha256(kaPrivate);
    const kaX25519Private = kaHash.slice(0, 32);
    const kaX25519Public = x25519.getPublicKey(kaX25519Private);
    keys.keyAgreement1.private = Buffer.from(kaX25519Private).toString('hex');
    keys.keyAgreement1.public = Buffer.from(kaX25519Public).toString('hex');
    
    return keys;
}

console.log('=== Generando claves únicas para cada DID ===\n');

const allKeys = [];
mnemonics.forEach((mnemonic, index) => {
    const keys = generateKeysForMnemonic(mnemonic, dids[index]);
    allKeys.push(keys);
    
    console.log(`${keys.did}:`);
    console.log(`  Mnemonic: ${keys.mnemonic}`);
    console.log(`  Auth Key:     ${keys.authKey.public.substring(0, 16)}...`);
    console.log(`  Assertion:    ${keys.assertionKey.public.substring(0, 16)}...`);
    console.log(`  Key Agree 1:  ${keys.keyAgreement1.public.substring(0, 16)}...`);
    console.log('');
});

// Verificar que todas las claves son únicas
console.log('=== Verificando unicidad ===');
const allPublicKeys = [];
allKeys.forEach(keys => {
    allPublicKeys.push(keys.authKey.public);
    allPublicKeys.push(keys.assertionKey.public);
    allPublicKeys.push(keys.keyAgreement1.public);
});

const uniqueKeys = new Set(allPublicKeys);
console.log(`Total claves públicas: ${allPublicKeys.length}`);
console.log(`Claves únicas: ${uniqueKeys.size}`);
console.log(`¿Todas las claves son únicas? ${allPublicKeys.length === uniqueKeys.size ? '✅ SÍ' : '❌ NO'}`);
