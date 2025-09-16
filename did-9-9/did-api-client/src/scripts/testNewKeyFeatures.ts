import { DIDAPIClient } from '../client/DIDAPIClient';
import dotenv from 'dotenv';

dotenv.config();

const client = new DIDAPIClient(process.env.API_BASE_URL || 'http://localhost:3000/api/v1');

async function testNewKeyFeatures() {
  try {
    console.log('🔑 Testing New Key Features...\n');
    
    // Create a test DID first
    const testDID = {
      did: 'did:web:test/newfeatures',
      document: {
        '@context': ['https://www.w3.org/ns/did/v1'],
        id: 'did:web:test/newfeatures',
        verificationMethod: [{
          id: 'did:web:test/newfeatures#key-1',
          type: 'Ed25519VerificationKey2020',
          controller: 'did:web:test/newfeatures',
          publicKeyMultibase: 'z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK'
        }],
        authentication: ['did:web:test/newfeatures#key-1']
      }
    };

    console.log('📝 Creating test DID...');
    const createResult = await client.createDID(testDID);
    
    if (createResult.success) {
      console.log('✅ DID Created:', createResult.data?.did.did);
      console.log('🔑 Initial keys:');
      createResult.data?.keys.forEach((key, index) => {
        console.log(`   Key ${index + 1}: ${key.name} (${key.key_type}) - ${key.key_usage} - Active: ${key.active}`);
      });

      // Test 1: Add a new authentication key
      console.log('\n🧪 Test 1: Adding new authentication key...');
      const authKeyRequest = {
        name: 'backup-auth-key',
        key_type: 'ed25519' as const,
        key_usage: 'authentication' as const,
        active: true
      };

      const addAuthResult = await client.addKey(testDID.did, authKeyRequest);
      if (addAuthResult.success) {
        console.log('✅ Authentication key added successfully');
        console.log('🔑 Updated keys:');
        addAuthResult.data?.keys.forEach((key, index) => {
          console.log(`   Key ${index + 1}: ${key.name} (${key.key_type}) - ${key.key_usage} - Active: ${key.active}`);
        });
      }

      // Test 2: Add a new assertion method key
      console.log('\n🧪 Test 2: Adding assertion method key...');
      const assertionKeyRequest = {
        name: 'credential-signing-key',
        key_type: 'ed25519' as const,
        key_usage: 'assertionMethod' as const,
        active: true
      };

      const addAssertionResult = await client.addKey(testDID.did, assertionKeyRequest);
      if (addAssertionResult.success) {
        console.log('✅ Assertion method key added successfully');
        console.log('🔑 Updated keys:');
        addAssertionResult.data?.keys.forEach((key, index) => {
          console.log(`   Key ${index + 1}: ${key.name} (${key.key_type}) - ${key.key_usage} - Active: ${key.active}`);
        });
      }

      // Test 3: Add a new key agreement key
      console.log('\n🧪 Test 3: Adding key agreement key...');
      const agreementKeyRequest = {
        name: 'communication-key',
        key_type: 'x25519' as const,
        key_usage: 'keyAgreement' as const,
        active: true
      };

      const addAgreementResult = await client.addKey(testDID.did, agreementKeyRequest);
      if (addAgreementResult.success) {
        console.log('✅ Key agreement key added successfully');
        console.log('🔑 Updated keys:');
        addAgreementResult.data?.keys.forEach((key, index) => {
          console.log(`   Key ${index + 1}: ${key.name} (${key.key_type}) - ${key.key_usage} - Active: ${key.active}`);
        });
      }

      // Test 4: Deactivate a key
      console.log('\n🧪 Test 4: Deactivating a key...');
      const keysToDeactivate = addAgreementResult.data?.keys || [];
      if (keysToDeactivate.length > 0) {
        const keyToDeactivate = keysToDeactivate[0];
        console.log(`Deactivating key: ${keyToDeactivate.name} (${keyToDeactivate.id})`);
        
        const deactivateResult = await client.updateKeyActive(
          testDID.did, 
          keyToDeactivate.id, 
          { active: false }
        );
        
        if (deactivateResult.success) {
          console.log('✅ Key deactivated successfully');
          console.log('🔑 Updated keys:');
          deactivateResult.data?.keys.forEach((key, index) => {
            console.log(`   Key ${index + 1}: ${key.name} (${key.key_type}) - ${key.key_usage} - Active: ${key.active}`);
          });
        }
      }

      // Test 5: Reactivate the key
      console.log('\n🧪 Test 5: Reactivating the key...');
      if (keysToDeactivate.length > 0) {
        const keyToReactivate = keysToDeactivate[0];
        console.log(`Reactivating key: ${keyToReactivate.name} (${keyToReactivate.id})`);
        
        const reactivateResult = await client.updateKeyActive(
          testDID.did, 
          keyToReactivate.id, 
          { active: true }
        );
        
        if (reactivateResult.success) {
          console.log('✅ Key reactivated successfully');
          console.log('🔑 Final keys:');
          reactivateResult.data?.keys.forEach((key, index) => {
            console.log(`   Key ${index + 1}: ${key.name} (${key.key_type}) - ${key.key_usage} - Active: ${key.active}`);
          });
        }
      }

      // Test 6: Show DID Document structure
      console.log('\n🧪 Test 6: DID Document structure...');
      const finalDID = await client.getDID(testDID.did);
      if (finalDID.success) {
        console.log('📄 DID Document:');
        console.log(JSON.stringify(finalDID.data?.document.document, null, 2));
      }

      // Clean up
      console.log('\n🧹 Cleaning up...');
      await client.deleteDID(testDID.did);
      console.log('✅ Test DID deleted');
      
    } else {
      console.log('❌ Failed to create DID:', createResult.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  testNewKeyFeatures();
}

export { testNewKeyFeatures };
