import { DIDAPIClient } from '../client/DIDAPIClient';
import dotenv from 'dotenv';

dotenv.config();

const client = new DIDAPIClient(process.env.API_BASE_URL || 'http://localhost:3000/api/v1');

async function checkKeysWithNames() {
  try {
    console.log('🔑 Checking keys with names in database...\n');
    
    const result = await client.getAllDIDs(1, 10);
    
    if (result.success) {
      console.log(`📈 Total DIDs in database: ${result.data.total}`);
      console.log(`📄 Checking first ${result.data.dids.length} DIDs:\n`);
      
      for (const didData of result.data.dids) {
        console.log(`📝 DID: ${didData.did.did}`);
        console.log(`   Created: ${new Date(didData.did.created_at).toLocaleString()}`);
        console.log(`   Services: ${didData.document.document.service?.length || 0}`);
        console.log(`   Keys:`);
        
        didData.keys.forEach(key => {
          console.log(`     - ${key.key_type} (${key.name}): ${key.public_key.substring(0, 20)}...`);
        });
        
        console.log('');
      }
      
      // Summary of key names
      const keyNames: { [key: string]: number } = {};
      result.data.dids.forEach(didData => {
        didData.keys.forEach(key => {
          keyNames[key.name] = (keyNames[key.name] || 0) + 1;
        });
      });
      
      console.log('📊 Key names summary:');
      Object.entries(keyNames).forEach(([name, count]) => {
        console.log(`   - ${name}: ${count} keys`);
      });
      
    } else {
      console.log('❌ Failed to get DIDs');
    }
  } catch (error) {
    console.error('❌ Error checking keys:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  checkKeysWithNames();
}

export { checkKeysWithNames };
