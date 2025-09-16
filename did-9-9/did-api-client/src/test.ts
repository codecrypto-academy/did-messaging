import { DIDAPIClient } from './client/DIDAPIClient';
import { CreateDIDRequest, UpdateDIDRequest } from './types/api';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const client = new DIDAPIClient(process.env.API_BASE_URL || 'http://localhost:3000/api/v1');

async function runTests() {
  console.log('🧪 Starting DID API Tests...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const healthResponse = await client.healthCheck();
    console.log('✅ Health Check:', healthResponse);
    console.log('');

    // Test 2: Create a DID
    console.log('2️⃣ Testing DID Creation...');
    const createRequest: CreateDIDRequest = {
      did: 'did:example:123456789abcdefghi',
      document: {
        '@context': ['https://www.w3.org/ns/did/v1'],
        id: 'did:example:123456789abcdefghi',
        verificationMethod: [
          {
            id: 'did:example:123456789abcdefghi#key-1',
            type: 'Ed25519VerificationKey2020',
            controller: 'did:example:123456789abcdefghi',
            publicKeyMultibase: 'z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK'
          }
        ],
        authentication: ['did:example:123456789abcdefghi#key-1'],
        assertionMethod: ['did:example:123456789abcdefghi#key-1'],
        keyAgreement: [
          {
            id: 'did:example:123456789abcdefghi#key-2',
            type: 'X25519KeyAgreementKey2020',
            controller: 'did:example:123456789abcdefghi',
            publicKeyMultibase: 'z6LSbysY2xFMRpGMhb7tFTLMpeuPRaqaWM1yECx2AtzE3KCc'
          }
        ],
        service: [
          {
            id: 'did:example:123456789abcdefghi#vcs',
            type: 'VerifiableCredentialService',
            serviceEndpoint: 'https://example.com/vc/'
          }
        ]
      }
    };

    const createResponse = await client.createDID(createRequest);
    console.log('✅ DID Created:', createResponse.data?.did.did);
    console.log('📄 Document ID:', createResponse.data?.document.id);
    console.log('🔑 Keys Generated:', createResponse.data?.keys.length);
    console.log('');

    const createdDID = createResponse.data!.did.did;

    // Test 3: Get the created DID
    console.log('3️⃣ Testing DID Retrieval...');
    const getResponse = await client.getDID(createdDID);
    console.log('✅ DID Retrieved:', getResponse.data?.did.did);
    console.log('📄 Document Context:', getResponse.data?.document.document['@context']);
    console.log('');

    // Test 4: Get private keys
    console.log('4️⃣ Testing Private Key Retrieval...');
    const ed25519Key = await client.getPrivateKey(createdDID, 'ed25519');
    console.log('✅ Ed25519 Private Key Retrieved:', ed25519Key.data?.privateKey.length, 'bytes');
    
    const x25519Key = await client.getPrivateKey(createdDID, 'x25519');
    console.log('✅ X25519 Private Key Retrieved:', x25519Key.data?.privateKey.length, 'bytes');
    console.log('');

    // Test 5: Update DID document
    console.log('5️⃣ Testing DID Document Update...');
    const updateRequest: UpdateDIDRequest = {
      document: {
        ...getResponse.data!.document.document,
        service: [
          {
            id: 'did:example:123456789abcdefghi#vcs',
            type: 'VerifiableCredentialService',
            serviceEndpoint: 'https://updated-example.com/vc/'
          },
          {
            id: 'did:example:123456789abcdefghi#hub',
            type: 'HubService',
            serviceEndpoint: 'https://example.com/hub/'
          }
        ]
      }
    };

    const updateResponse = await client.updateDID(createdDID, updateRequest);
    console.log('✅ DID Updated:', updateResponse.data?.did.did);
    console.log('📄 Services Count:', updateResponse.data?.document.document.service?.length);
    console.log('');

    // Test 6: Get all DIDs
    console.log('6️⃣ Testing Get All DIDs...');
    const allDIDsResponse = await client.getAllDIDs(1, 10);
    console.log('✅ Total DIDs:', allDIDsResponse.data.total);
    console.log('📄 Current Page:', allDIDsResponse.data.page);
    console.log('📄 DIDs in this page:', allDIDsResponse.data.dids.length);
    console.log('');

    // Test 7: Create another DID for testing
    console.log('7️⃣ Testing Multiple DIDs...');
    const createRequest2: CreateDIDRequest = {
      did: 'did:example:987654321fedcba',
      document: {
        '@context': 'https://www.w3.org/ns/did/v1',
        id: 'did:example:987654321fedcba',
        verificationMethod: [
          {
            id: 'did:example:987654321fedcba#key-1',
            type: 'Ed25519VerificationKey2020',
            controller: 'did:example:987654321fedcba',
            publicKeyMultibase: 'z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK'
          }
        ],
        authentication: ['did:example:987654321fedcba#key-1']
      }
    };

    const createResponse2 = await client.createDID(createRequest2);
    console.log('✅ Second DID Created:', createResponse2.data?.did.did);
    console.log('');

    // Test 8: Get all DIDs again
    console.log('8️⃣ Testing Get All DIDs (Updated)...');
    const allDIDsResponse2 = await client.getAllDIDs(1, 10);
    console.log('✅ Total DIDs:', allDIDsResponse2.data.total);
    console.log('📄 DIDs in this page:', allDIDsResponse2.data.dids.length);
    console.log('');

    // Test 9: Delete the second DID
    console.log('9️⃣ Testing DID Deletion...');
    const deleteResponse = await client.deleteDID(createRequest2.did);
    console.log('✅ DID Deleted:', deleteResponse.message);
    console.log('');

    // Test 10: Verify deletion
    console.log('🔟 Testing DID Deletion Verification...');
    try {
      await client.getDID(createRequest2.did);
      console.log('❌ DID still exists (unexpected)');
    } catch (error) {
      console.log('✅ DID successfully deleted (not found)');
    }
    console.log('');

    // Test 11: Clean up - delete the first DID
    console.log('🧹 Cleaning up...');
    const deleteResponse2 = await client.deleteDID(createdDID);
    console.log('✅ First DID Deleted:', deleteResponse2.message);
    console.log('');

    console.log('🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

export { runTests };
