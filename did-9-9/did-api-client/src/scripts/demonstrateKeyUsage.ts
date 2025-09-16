import { DIDAPIClient } from '../client/DIDAPIClient';
import { PrivateKeyRecord, DIDDocument } from '../types/api';
import dotenv from 'dotenv';

dotenv.config();

const client = new DIDAPIClient(process.env.API_BASE_URL || 'http://localhost:3000/api/v1');

// Function to generate DID Document based on keys and their usage
function generateDIDDocumentFromKeys(did: string, keys: PrivateKeyRecord[]): DIDDocument {
  const verificationMethods = keys.map((key, index) => ({
    id: `${did}#key-${index + 1}`,
    type: key.key_type === 'ed25519' ? 'Ed25519VerificationKey2020' : 'X25519KeyAgreementKey2020',
    controller: did,
    publicKeyMultibase: key.public_key
  }));

  // Group keys by usage
  const authenticationKeys: string[] = [];
  const assertionMethodKeys: string[] = [];
  const keyAgreementKeys: string[] = [];

  keys.forEach((key, index) => {
    const keyId = `${did}#key-${index + 1}`;
    switch (key.key_usage) {
      case 'authentication':
        authenticationKeys.push(keyId);
        break;
      case 'assertionMethod':
        assertionMethodKeys.push(keyId);
        break;
      case 'keyAgreement':
        keyAgreementKeys.push(keyId);
        break;
    }
  });

  return {
    '@context': [
      'https://www.w3.org/ns/did/v1',
      'https://w3id.org/security/suites/ed25519-2020/v1',
      'https://w3id.org/security/suites/x25519-2020/v1'
    ],
    id: did,
    verificationMethod: verificationMethods,
    ...(authenticationKeys.length > 0 && { authentication: authenticationKeys }),
    ...(assertionMethodKeys.length > 0 && { assertionMethod: assertionMethodKeys }),
    ...(keyAgreementKeys.length > 0 && { keyAgreement: keyAgreementKeys }),
    controller: did
  };
}

async function demonstrateKeyUsage() {
  try {
    console.log('🎯 Demonstrating Key Usage Impact on DID Document Generation\n');
    
    // Create a test DID
    const testDID = {
      did: 'did:web:demo/keyusage',
      document: {
        '@context': ['https://www.w3.org/ns/did/v1'],
        id: 'did:web:demo/keyusage',
        verificationMethod: [{
          id: 'did:web:demo/keyusage#key-1',
          type: 'Ed25519VerificationKey2020',
          controller: 'did:web:demo/keyusage',
          publicKeyMultibase: 'z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK'
        }],
        authentication: ['did:web:demo/keyusage#key-1']
      }
    };

    console.log('📝 Creating test DID...');
    const createResult = await client.createDID(testDID);
    
    if (createResult.success) {
      console.log('✅ DID Created:', createResult.data?.did.did);
      
      // Get the DID with all keys
      const getResult = await client.getDID(testDID.did);
      
      if (getResult.success && getResult.data?.keys) {
        console.log('\n🔑 Keys Information:');
        getResult.data.keys.forEach((key, index) => {
          console.log(`   Key ${index + 1}:`);
          console.log(`     Type: ${key.key_type}`);
          console.log(`     Name: ${key.name}`);
          console.log(`     Usage: ${key.key_usage}`);
          console.log(`     Public Key: ${key.public_key.substring(0, 30)}...`);
          console.log('');
        });

        // Demonstrate how key usage affects DID Document generation
        console.log('📄 Generating DID Document based on key usage...');
        const generatedDocument = generateDIDDocumentFromKeys(
          testDID.did, 
          getResult.data.keys
        );

        console.log('\n🎯 Generated DID Document:');
        console.log(JSON.stringify(generatedDocument, null, 2));

        // Show the impact of key usage
        console.log('\n📊 Key Usage Impact Analysis:');
        
        const authKeys = getResult.data.keys.filter(k => k.key_usage === 'authentication');
        const assertionKeys = getResult.data.keys.filter(k => k.key_usage === 'assertionMethod');
        const agreementKeys = getResult.data.keys.filter(k => k.key_usage === 'keyAgreement');

        console.log(`   Authentication keys: ${authKeys.length}`);
        if (authKeys.length > 0) {
          console.log(`     → DID Document includes 'authentication' property`);
        }

        console.log(`   Assertion Method keys: ${assertionKeys.length}`);
        if (assertionKeys.length > 0) {
          console.log(`     → DID Document includes 'assertionMethod' property`);
        }

        console.log(`   Key Agreement keys: ${agreementKeys.length}`);
        if (agreementKeys.length > 0) {
          console.log(`     → DID Document includes 'keyAgreement' property`);
        }

        // Show verification methods
        console.log(`\n🔧 Verification Methods: ${generatedDocument.verificationMethod?.length || 0}`);
        generatedDocument.verificationMethod?.forEach((vm: any, index: number) => {
          console.log(`   Method ${index + 1}: ${vm.id}`);
          console.log(`     Type: ${vm.type}`);
          console.log(`     Controller: ${vm.controller}`);
        });

        // Show how different key usages create different DID Document structures
        console.log('\n🎭 Different Key Usage Scenarios:');
        
        console.log('\n1️⃣ Authentication-only DID:');
        const authOnlyKeys = getResult.data.keys.filter(k => k.key_usage === 'authentication');
        if (authOnlyKeys.length > 0) {
          const authOnlyDoc = generateDIDDocumentFromKeys(testDID.did, authOnlyKeys);
          console.log('   Properties:', Object.keys(authOnlyDoc).filter(k => k !== '@context' && k !== 'id' && k !== 'controller'));
        }

        console.log('\n2️⃣ Key Agreement-only DID:');
        const agreementOnlyKeys = getResult.data.keys.filter(k => k.key_usage === 'keyAgreement');
        if (agreementOnlyKeys.length > 0) {
          const agreementOnlyDoc = generateDIDDocumentFromKeys(testDID.did, agreementOnlyKeys);
          console.log('   Properties:', Object.keys(agreementOnlyDoc).filter(k => k !== '@context' && k !== 'id' && k !== 'controller'));
        }

        console.log('\n3️⃣ Mixed Usage DID (current):');
        console.log('   Properties:', Object.keys(generatedDocument).filter(k => k !== '@context' && k !== 'id' && k !== 'controller'));

      } else {
        console.log('❌ Failed to retrieve DID');
      }

      // Clean up
      console.log('\n🧹 Cleaning up...');
      await client.deleteDID(testDID.did);
      console.log('✅ Test DID deleted');
      
    } else {
      console.log('❌ Failed to create DID:', createResult.message);
    }

  } catch (error) {
    console.error('❌ Demonstration failed:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  demonstrateKeyUsage();
}

export { demonstrateKeyUsage };
