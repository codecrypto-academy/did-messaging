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

function generateDIDDocument(didData) {
    const seed = bip39.mnemonicToSeedSync(didData.mnemonic);
    const hdkey = bip32.fromSeed(seed);
    
    const verificationMethods = [];
    const authentication = [];
    const assertionMethod = [];
    const keyAgreement = [];
    
    // Auth key (Ed25519) - m/44'/0'/0'/0/0
    const authDerived = hdkey.derivePath("m/44'/0'/0'/0/0");
    const authPrivate = new Uint8Array(authDerived.privateKey);
    const authPublic = ed25519.getPublicKey(authPrivate);
    const authPublicHex = Buffer.from(authPublic).toString('hex');
    
    verificationMethods.push({
        id: `${didData.did}#key-1`,
        type: 'Ed25519VerificationKey2020',
        controller: didData.did,
        publicKeyMultibase: authPublicHex
    });
    authentication.push(`${didData.did}#key-1`);
    
    // Assertion key (Ed25519) - m/44'/0'/0'/0/1
    const assertionDerived = hdkey.derivePath("m/44'/0'/0'/0/1");
    const assertionPrivate = new Uint8Array(assertionDerived.privateKey);
    const assertionPublic = ed25519.getPublicKey(assertionPrivate);
    const assertionPublicHex = Buffer.from(assertionPublic).toString('hex');
    
    verificationMethods.push({
        id: `${didData.did}#key-2`,
        type: 'Ed25519VerificationKey2020',
        controller: didData.did,
        publicKeyMultibase: assertionPublicHex
    });
    assertionMethod.push(`${didData.did}#key-2`);
    
    // Key agreement 1 (X25519) - m/44'/0'/0'/1/0
    const ka1Derived = hdkey.derivePath("m/44'/0'/0'/1/0");
    const ka1Private = new Uint8Array(ka1Derived.privateKey);
    const ka1Hash = sha256(ka1Private);
    const ka1X25519Private = ka1Hash.slice(0, 32);
    const ka1X25519Public = x25519.getPublicKey(ka1X25519Private);
    const ka1PublicHex = Buffer.from(ka1X25519Public).toString('hex');
    
    verificationMethods.push({
        id: `${didData.did}#key-3`,
        type: 'X25519KeyAgreementKey2020',
        controller: didData.did,
        publicKeyMultibase: ka1PublicHex
    });
    keyAgreement.push(`${didData.did}#key-3`);
    
    // Key agreement 2 (X25519) - m/44'/0'/0'/1/1
    const ka2Derived = hdkey.derivePath("m/44'/0'/0'/1/1");
    const ka2Private = new Uint8Array(ka2Derived.privateKey);
    const ka2Hash = sha256(ka2Private);
    const ka2X25519Private = ka2Hash.slice(0, 32);
    const ka2X25519Public = x25519.getPublicKey(ka2X25519Private);
    const ka2PublicHex = Buffer.from(ka2X25519Public).toString('hex');
    
    verificationMethods.push({
        id: `${didData.did}#key-4`,
        type: 'X25519KeyAgreementKey2020',
        controller: didData.did,
        publicKeyMultibase: ka2PublicHex
    });
    keyAgreement.push(`${didData.did}#key-4`);
    
    // Key agreement 3 (X25519) - m/44'/0'/0'/1/2
    const ka3Derived = hdkey.derivePath("m/44'/0'/0'/1/2");
    const ka3Private = new Uint8Array(ka3Derived.privateKey);
    const ka3Hash = sha256(ka3Private);
    const ka3X25519Private = ka3Hash.slice(0, 32);
    const ka3X25519Public = x25519.getPublicKey(ka3X25519Private);
    const ka3PublicHex = Buffer.from(ka3X25519Public).toString('hex');
    
    verificationMethods.push({
        id: `${didData.did}#key-5`,
        type: 'X25519KeyAgreementKey2020',
        controller: didData.did,
        publicKeyMultibase: ka3PublicHex
    });
    keyAgreement.push(`${didData.did}#key-5`);
    
    const didDocument = {
        '@context': ['https://www.w3.org/ns/did/v1'],
        id: didData.did,
        verificationMethod: verificationMethods,
        authentication: authentication,
        assertionMethod: assertionMethod,
        keyAgreement: keyAgreement
    };
    
    return {
        did_id: didData.id,
        document: didDocument
    };
}

console.log('=== Generando documentos DID para todos los DIDs ===\n');

const documents = [];
didsData.forEach(didData => {
    const doc = generateDIDDocument(didData);
    documents.push(doc);
    
    console.log(`${didData.did}:`);
    console.log(`  - ${doc.document.verificationMethod.length} verification methods`);
    console.log(`  - ${doc.document.authentication.length} authentication keys`);
    console.log(`  - ${doc.document.assertionMethod.length} assertion method keys`);
    console.log(`  - ${doc.document.keyAgreement.length} key agreement keys`);
    console.log('');
});

console.log('=== SQL para insertar documentos DID ===');
console.log('INSERT INTO did_documents (did_id, document) VALUES');

documents.forEach((doc, index) => {
    const comma = index < documents.length - 1 ? ',' : ';';
    const documentJson = JSON.stringify(doc.document).replace(/'/g, "''");
    console.log(`('${doc.did_id}', '${documentJson}')${comma}`);
});

console.log(`\nTotal documentos a insertar: ${documents.length}`);
