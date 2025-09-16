import { DIDAPIClient } from '../client/DIDAPIClient';
import { CreateDIDRequest } from '../types/api';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const client = new DIDAPIClient(process.env.API_BASE_URL || 'http://localhost:3000/api/v1');

// Lista de usuarios para generar DIDs
const users = [
  'alice',
  'bob',
  'charlie',
  'diana',
  'eve',
  'frank',
  'grace',
  'henry',
  'iris',
  'jack',
  'kate',
  'leo',
  'mary',
  'nick',
  'olivia',
  'peter',
  'quinn',
  'rachel',
  'steve',
  'tina'
];

// Función para generar un DID document completo
function generateDIDDocument(did: string, username: string) {
  return {
    '@context': [
      'https://www.w3.org/ns/did/v1',
      'https://w3id.org/security/suites/ed25519-2020/v1',
      'https://w3id.org/security/suites/x25519-2020/v1'
    ],
    id: did,
    verificationMethod: [
      {
        id: `${did}#key-1`,
        type: 'Ed25519VerificationKey2020',
        controller: did,
        publicKeyMultibase: 'z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK'
      },
      {
        id: `${did}#key-2`,
        type: 'X25519KeyAgreementKey2020',
        controller: did,
        publicKeyMultibase: 'z6LSbysY2xFMRpGMhb7tFTLMpeuPRaqaWM1yECx2AtzE3KCc'
      }
    ],
    authentication: [`${did}#key-1`],
    assertionMethod: [`${did}#key-1`],
    keyAgreement: [`${did}#key-2`],
    service: [
      {
        id: `${did}#vcs`,
        type: 'VerifiableCredentialService',
        serviceEndpoint: `https://example.com/vc/${username}/`
      },
      {
        id: `${did}#hub`,
        type: 'HubService',
        serviceEndpoint: `https://example.com/hub/${username}/`
      },
      {
        id: `${did}#profile`,
        type: 'ProfileService',
        serviceEndpoint: `https://example.com/profile/${username}/`
      }
    ],
    alsoKnownAs: [
      `https://example.com/users/${username}`,
      `https://social.example.com/@${username}`
    ],
    controller: did
  };
}

// Función para generar DIDs en lote
async function generateMultipleDIDs() {
  console.log('🚀 Starting bulk DID generation...\n');

  const results = {
    successful: [] as string[],
    failed: [] as { did: string; error: string }[]
  };

  for (let i = 0; i < users.length; i++) {
    const username = users[i];
    const did = `did:web:user/${username}`;
    
    console.log(`📝 Creating DID ${i + 1}/${users.length}: ${did}`);
    
    try {
      const createRequest: CreateDIDRequest = {
        did,
        document: generateDIDDocument(did, username)
      };

      const result = await client.createDID(createRequest);
      
      if (result.success) {
        console.log(`✅ Created: ${did}`);
        console.log(`   📄 Document ID: ${result.data?.document.id}`);
        console.log(`   🔑 Keys: ${result.data?.keys.length} generated`);
        results.successful.push(did);
      } else {
        console.log(`❌ Failed: ${did} - ${result.message}`);
        results.failed.push({ did, error: result.message || 'Unknown error' });
      }
    } catch (error: any) {
      console.log(`❌ Error creating ${did}: ${error.message}`);
      results.failed.push({ did, error: error.message });
    }
    
    console.log(''); // Empty line for readability
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Summary
  console.log('📊 Generation Summary:');
  console.log(`✅ Successful: ${results.successful.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`📈 Success Rate: ${((results.successful.length / users.length) * 100).toFixed(1)}%`);
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failed DIDs:');
    results.failed.forEach(failure => {
      console.log(`   - ${failure.did}: ${failure.error}`);
    });
  }

  if (results.successful.length > 0) {
    console.log('\n✅ Successfully Created DIDs:');
    results.successful.forEach(did => {
      console.log(`   - ${did}`);
    });
  }

  return results;
}

// Función para verificar los DIDs creados
async function verifyCreatedDIDs(dids: string[]) {
  console.log('\n🔍 Verifying created DIDs...\n');
  
  for (const did of dids) {
    try {
      const result = await client.getDID(did);
      if (result.success) {
        console.log(`✅ Verified: ${did}`);
        console.log(`   📄 Services: ${result.data?.document.document.service?.length || 0}`);
        console.log(`   🔑 Keys: ${result.data?.keys.length}`);
      } else {
        console.log(`❌ Verification failed: ${did}`);
      }
    } catch (error: any) {
      console.log(`❌ Error verifying ${did}: ${error.message}`);
    }
  }
}

// Función para obtener estadísticas de la base de datos
async function getDatabaseStats() {
  console.log('\n📊 Database Statistics:');
  
  try {
    const result = await client.getAllDIDs(1, 100);
    if (result.success) {
      console.log(`📈 Total DIDs in database: ${result.data.total}`);
      console.log(`📄 DIDs in current page: ${result.data.dids.length}`);
      
      // Count by DID method
      const didMethods: { [key: string]: number } = {};
      result.data.dids.forEach(didData => {
        const method = didData.did.did.split(':')[1];
        didMethods[method] = (didMethods[method] || 0) + 1;
      });
      
      console.log('\n📋 DIDs by method:');
      Object.entries(didMethods).forEach(([method, count]) => {
        console.log(`   - did:${method}: ${count}`);
      });
    }
  } catch (error: any) {
    console.log(`❌ Error getting database stats: ${error.message}`);
  }
}

// Función principal
async function main() {
  try {
    console.log('🎯 DID Bulk Generator for did:web:user/* format\n');
    
    // Check API health
    console.log('🏥 Checking API health...');
    const health = await client.healthCheck();
    if (!health.success) {
      throw new Error('API is not healthy');
    }
    console.log('✅ API is healthy\n');
    
    // Generate DIDs
    const results = await generateMultipleDIDs();
    
    // Verify successful DIDs
    if (results.successful.length > 0) {
      await verifyCreatedDIDs(results.successful);
    }
    
    // Show database statistics
    await getDatabaseStats();
    
    console.log('\n🎉 Bulk DID generation completed!');
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { generateMultipleDIDs, verifyCreatedDIDs, getDatabaseStats };
