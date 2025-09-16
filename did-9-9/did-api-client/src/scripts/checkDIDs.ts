import { DIDAPIClient } from '../client/DIDAPIClient';
import dotenv from 'dotenv';

dotenv.config();

const client = new DIDAPIClient(process.env.API_BASE_URL || 'http://localhost:3000/api/v1');

async function checkDIDs() {
  try {
    console.log('📊 Checking DIDs in database...\n');
    
    const result = await client.getAllDIDs(1, 100);
    
    if (result.success) {
      console.log(`📈 Total DIDs in database: ${result.data.total}`);
      console.log(`📄 DIDs in current page: ${result.data.dids.length}`);
      
      // Count by DID method
      const methods: { [key: string]: number } = {};
      result.data.dids.forEach(didData => {
        const method = didData.did.did.split(':')[1];
        methods[method] = (methods[method] || 0) + 1;
      });
      
      console.log('\n📋 DIDs by method:');
      Object.entries(methods).forEach(([method, count]) => {
        console.log(`   - did:${method}: ${count}`);
      });
      
      console.log('\n📝 Sample DIDs:');
      result.data.dids.slice(0, 5).forEach(didData => {
        console.log(`   - ${didData.did.did}`);
        console.log(`     Created: ${new Date(didData.did.created_at).toLocaleString()}`);
        console.log(`     Services: ${didData.document.document.service?.length || 0}`);
        console.log(`     Keys: ${didData.keys.length}`);
        console.log('');
      });
      
      if (result.data.dids.length > 5) {
        console.log(`   ... and ${result.data.dids.length - 5} more`);
      }
    } else {
      console.log('❌ Failed to get DIDs');
    }
  } catch (error) {
    console.error('❌ Error checking DIDs:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  checkDIDs();
}

export { checkDIDs };
