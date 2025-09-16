import { DIDAPIClient } from '../client/DIDAPIClient';
import dotenv from 'dotenv';

dotenv.config();

const client = new DIDAPIClient(process.env.API_BASE_URL || 'http://localhost:3000/api/v1');

async function testKeyUsage() {
  try {
    console.log('🔑 Testing Key Usage functionality...\n');
    
    // Create a test DID
    const testDID = {
      did: 'did:web:test/keyusage',
      document: {
        '@context': ['https://www.w3.org/ns/did/v1'],
        id: 'did:web:test/keyusage',
        verificationMethod: [{
          id: 'did:web:test/keyusage#key-1',
          type: 'Ed25519VerificationKey2020',
          controller: 'did:web:test/keyusage',
          publicKeyMultibase: 'z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK'
        }],
        authentication: ['did:web:test/keyusage#key-1']
      }
    };

    console.log('📝 Creating test DID...');
    const createResult = await client.createDID(testDID);
    
    if (createResult.success) {
      console.log('✅ DID Created:', createResult.data?.did.did);
      console.log('\n🔑 Keys with usage information:');
      
      createResult.data?.keys.forEach((key, index) => {
        console.log(`   Key ${index + 1}:`);
        console.log(`     Type: ${key.key_type}`);
        console.log(`     Name: ${key.name}`);
        console.log(`     Usage: ${key.key_usage}`);
        console.log(`     Public Key: ${key.public_key.substring(0, 20)}...`);
        console.log('');
      });

      // Test getting the DID to verify key usage is stored correctly
      console.log('🔍 Retrieving DID to verify key usage...');
      const getResult = await client.getDID(testDID.did);
      
      if (getResult.success) {
        console.log('✅ DID Retrieved successfully');
        console.log('\n📊 Key Usage Summary:');
        
        const usageCount: { [key: string]: number } = {};
        getResult.data?.keys.forEach(key => {
          usageCount[key.key_usage] = (usageCount[key.key_usage] || 0) + 1;
        });
        
        Object.entries(usageCount).forEach(([usage, count]) => {
          console.log(`   - ${usage}: ${count} keys`);
        });

        // Show how the DID Document would be structured based on key usage
        console.log('\n📄 DID Document structure based on key usage:');
        const authKeys = getResult.data?.keys.filter(k => k.key_usage === 'authentication') || [];
        const assertionKeys = getResult.data?.keys.filter(k => k.key_usage === 'assertionMethod') || [];
        const agreementKeys = getResult.data?.keys.filter(k => k.key_usage === 'keyAgreement') || [];

        if (authKeys.length > 0) {
          console.log(`   Authentication: ${authKeys.length} keys`);
        }
        if (assertionKeys.length > 0) {
          console.log(`   Assertion Method: ${assertionKeys.length} keys`);
        }
        if (agreementKeys.length > 0) {
          console.log(`   Key Agreement: ${agreementKeys.length} keys`);
        }

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
    console.error('❌ Test failed:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  testKeyUsage();
}

export { testKeyUsage };
