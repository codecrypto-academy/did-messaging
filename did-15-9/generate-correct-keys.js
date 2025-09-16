const bip39 = require('bip39');
const { BIP32Factory } = require('bip32');
const ecc = require('tiny-secp256k1');
const { ed25519 } = require('@noble/curves/ed25519');
const { x25519 } = require('@noble/curves/ed25519');

const bip32 = BIP32Factory(ecc);
const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

function generateKeys() {
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const hdkey = bip32.fromSeed(seed);
    
    const keys = [
        { name: 'auth-key', path: "m/44'/0'/0'/0/0", type: 'ed25519', usage: 'authentication' },
        { name: 'assertion-key', path: "m/44'/0'/0'/0/1", type: 'ed25519', usage: 'assertionMethod' },
        { name: 'key-agreement-1', path: "m/44'/0'/0'/1/0", type: 'x25519', usage: 'keyAgreement' },
        { name: 'key-agreement-2', path: "m/44'/0'/0'/1/1", type: 'x25519', usage: 'keyAgreement' },
        { name: 'key-agreement-3', path: "m/44'/0'/0'/1/2", type: 'x25519', usage: 'keyAgreement' }
    ];
    
    keys.forEach(key => {
        const derivedKey = hdkey.derivePath(key.path);
        if (!derivedKey.privateKey) throw new Error('Failed to derive private key');
        
        const privateKey = new Uint8Array(derivedKey.privateKey);
        let publicKey;
        
        if (key.type === 'ed25519') {
            publicKey = ed25519.getPublicKey(privateKey);
        } else {
            // Para X25519, convertir desde Ed25519
            const hash = require('@noble/hashes/sha256').sha256(privateKey);
            const x25519PrivateKey = hash.slice(0, 32);
            publicKey = x25519.getPublicKey(x25519PrivateKey);
        }
        
        console.log(`${key.name}:`);
        console.log(`  Private: ${Buffer.from(privateKey).toString('hex')}`);
        console.log(`  Public:  ${Buffer.from(publicKey).toString('hex')}`);
        console.log('');
    });
}

generateKeys();
