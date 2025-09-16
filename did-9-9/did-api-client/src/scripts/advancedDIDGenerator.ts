import { DIDAPIClient } from '../client/DIDAPIClient';
import { CreateDIDRequest } from '../types/api';
import dotenv from 'dotenv';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
dotenv.config();

const client = new DIDAPIClient(process.env.API_BASE_URL || 'http://localhost:3000/api/v1');

interface DIDGenerationConfig {
  count: number;
  prefix: string;
  domain: string;
  includeServices: boolean;
  includeSocialProfiles: boolean;
  outputFile?: string;
}

// Configuración por defecto
const defaultConfig: DIDGenerationConfig = {
  count: 10,
  prefix: 'user',
  domain: 'example.com',
  includeServices: true,
  includeSocialProfiles: true
};

// Lista de nombres para generar DIDs únicos
const namePool = [
  'alice', 'bob', 'charlie', 'diana', 'eve', 'frank', 'grace', 'henry', 'iris', 'jack',
  'kate', 'leo', 'mary', 'nick', 'olivia', 'peter', 'quinn', 'rachel', 'steve', 'tina',
  'uma', 'victor', 'wendy', 'xavier', 'yara', 'zoe', 'adam', 'beth', 'carl', 'dora',
  'eric', 'fiona', 'george', 'helen', 'ivan', 'julia', 'kevin', 'luna', 'mike', 'nina'
];

// Función para generar nombres únicos
function generateUniqueNames(count: number): string[] {
  const names: string[] = [];
  let index = 0;
  
  while (names.length < count && index < namePool.length * 10) {
    const baseName = namePool[index % namePool.length];
    const suffix = Math.floor(index / namePool.length);
    const name = suffix > 0 ? `${baseName}${suffix}` : baseName;
    
    if (!names.includes(name)) {
      names.push(name);
    }
    index++;
  }
  
  return names;
}

// Función para generar un DID document avanzado
function generateAdvancedDIDDocument(did: string, username: string, config: DIDGenerationConfig) {
  const services: any[] = [];
  
  if (config.includeServices) {
    services.push(
      {
        id: `${did}#vcs`,
        type: 'VerifiableCredentialService',
        serviceEndpoint: `https://${config.domain}/vc/${username}/`
      },
      {
        id: `${did}#hub`,
        type: 'HubService',
        serviceEndpoint: `https://${config.domain}/hub/${username}/`
      },
      {
        id: `${did}#profile`,
        type: 'ProfileService',
        serviceEndpoint: `https://${config.domain}/profile/${username}/`
      }
    );
  }
  
  const alsoKnownAs: string[] = [
    `https://${config.domain}/users/${username}`
  ];
  
  if (config.includeSocialProfiles) {
    alsoKnownAs.push(
      `https://social.${config.domain}/@${username}`,
      `https://${config.domain}/u/${username}`
    );
  }

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
    service: services,
    alsoKnownAs: alsoKnownAs,
    controller: did
  };
}

// Función para generar DIDs con configuración personalizada
async function generateDIDsWithConfig(config: DIDGenerationConfig) {
  console.log('🚀 Starting advanced DID generation...\n');
  console.log('📋 Configuration:');
  console.log(`   Count: ${config.count}`);
  console.log(`   Prefix: ${config.prefix}`);
  console.log(`   Domain: ${config.domain}`);
  console.log(`   Services: ${config.includeServices ? 'Yes' : 'No'}`);
  console.log(`   Social Profiles: ${config.includeSocialProfiles ? 'Yes' : 'No'}`);
  console.log('');

  const usernames = generateUniqueNames(config.count);
  const results = {
    successful: [] as string[],
    failed: [] as { did: string; error: string }[],
    generated: [] as any[]
  };

  for (let i = 0; i < usernames.length; i++) {
    const username = usernames[i];
    const did = `did:web:${config.prefix}/${username}`;
    
    console.log(`📝 Creating DID ${i + 1}/${usernames.length}: ${did}`);
    
    try {
      const createRequest: CreateDIDRequest = {
        did,
        document: generateAdvancedDIDDocument(did, username, config)
      };

      const result = await client.createDID(createRequest);
      
      if (result.success) {
        console.log(`✅ Created: ${did}`);
        console.log(`   📄 Document ID: ${result.data?.document.id}`);
        console.log(`   🔑 Keys: ${result.data?.keys.length} generated`);
        console.log(`   🔗 Services: ${result.data?.document.document.service?.length || 0}`);
        
        results.successful.push(did);
        results.generated.push({
          did,
          username,
          documentId: result.data?.document.id,
          keysCount: result.data?.keys.length,
          servicesCount: result.data?.document.document.service?.length || 0
        });
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

  // Save results to file if requested
  if (config.outputFile) {
    const outputPath = join(process.cwd(), config.outputFile);
    const outputData = {
      config,
      timestamp: new Date().toISOString(),
      summary: {
        total: usernames.length,
        successful: results.successful.length,
        failed: results.failed.length,
        successRate: ((results.successful.length / usernames.length) * 100).toFixed(1) + '%'
      },
      results: results.generated,
      errors: results.failed
    };
    
    writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
    console.log(`💾 Results saved to: ${outputPath}`);
  }

  // Summary
  console.log('📊 Generation Summary:');
  console.log(`✅ Successful: ${results.successful.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`📈 Success Rate: ${((results.successful.length / usernames.length) * 100).toFixed(1)}%`);
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failed DIDs:');
    results.failed.forEach(failure => {
      console.log(`   - ${failure.did}: ${failure.error}`);
    });
  }

  return results;
}

// Función para cargar configuración desde archivo
function loadConfigFromFile(filePath: string): DIDGenerationConfig {
  try {
    const configData = JSON.parse(readFileSync(filePath, 'utf8'));
    return { ...defaultConfig, ...configData };
  } catch (error) {
    console.log(`⚠️  Could not load config from ${filePath}, using defaults`);
    return defaultConfig;
  }
}

// Función principal con argumentos de línea de comandos
async function main() {
  const args = process.argv.slice(2);
  
  let config = { ...defaultConfig };
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--count':
      case '-c':
        config.count = parseInt(args[++i]) || 10;
        break;
      case '--prefix':
      case '-p':
        config.prefix = args[++i] || 'user';
        break;
      case '--domain':
      case '-d':
        config.domain = args[++i] || 'example.com';
        break;
      case '--no-services':
        config.includeServices = false;
        break;
      case '--no-social':
        config.includeSocialProfiles = false;
        break;
      case '--output':
      case '-o':
        config.outputFile = args[++i];
        break;
      case '--config':
        config = loadConfigFromFile(args[++i]);
        break;
      case '--help':
      case '-h':
        console.log(`
🎯 Advanced DID Generator

Usage: npx ts-node src/scripts/advancedDIDGenerator.ts [options]

Options:
  -c, --count <number>     Number of DIDs to generate (default: 10)
  -p, --prefix <string>    DID prefix (default: "user")
  -d, --domain <string>    Domain for services (default: "example.com")
  --no-services            Don't include service endpoints
  --no-social              Don't include social profile URLs
  -o, --output <file>      Save results to JSON file
  --config <file>          Load configuration from JSON file
  -h, --help               Show this help message

Examples:
  npx ts-node src/scripts/advancedDIDGenerator.ts --count 5
  npx ts-node src/scripts/advancedDIDGenerator.ts --prefix org --domain mycompany.com
  npx ts-node src/scripts/advancedDIDGenerator.ts --count 20 --output results.json
        `);
        process.exit(0);
    }
  }

  try {
    console.log('🎯 Advanced DID Generator\n');
    
    // Check API health
    console.log('🏥 Checking API health...');
    const health = await client.healthCheck();
    if (!health.success) {
      throw new Error('API is not healthy');
    }
    console.log('✅ API is healthy\n');
    
    // Generate DIDs
    const results = await generateDIDsWithConfig(config);
    
    console.log('\n🎉 Advanced DID generation completed!');
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { generateDIDsWithConfig, loadConfigFromFile, DIDGenerationConfig };
