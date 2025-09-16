const bip39 = require('bip39');

// Generar mnemónicos únicos para cada DID
const mnemonics = [
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon',
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon',
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon',
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon'
];

// Generar mnemónicos únicos reales
const uniqueMnemonics = [];
for (let i = 0; i < 5; i++) {
    const mnemonic = bip39.generateMnemonic();
    uniqueMnemonics.push(mnemonic);
    console.log(`DID ${i + 1}: ${mnemonic}`);
}

console.log('\n-- SQL para insertar DIDs con mnemónicos únicos --');
console.log('INSERT INTO dids (did, mnemonic) VALUES');

const dids = [
    'did:web:user/alice',
    'did:web:user/bob', 
    'did:web:user/charlie',
    'did:web:user/diana',
    'did:web:user/eve'
];

dids.forEach((did, index) => {
    const comma = index < dids.length - 1 ? ',' : ';';
    console.log(`('${did}', '${uniqueMnemonics[index]}')${comma}`);
});
