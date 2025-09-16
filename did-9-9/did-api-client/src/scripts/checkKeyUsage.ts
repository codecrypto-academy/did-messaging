import { DIDAPIClient } from '../client/DIDAPIClient';
import dotenv from 'dotenv';

dotenv.config();

const client = new DIDAPIClient(process.env.API_BASE_URL || 'http://localhost:3000/api/v1');

async function checkKeyUsage() {
  try {
    console.log('🔍 Checking Key Usage in all DIDs...\n');
    
    const result = await client.getAllDIDs(1, 50);
    
    if (result.success) {
      console.log(`📈 Total DIDs in database: ${result.data.total}`);
      console.log(`📄 Checking ${result.data.dids.length} DIDs:\n`);
      
      let totalKeys = 0;
      const usageStats: { [key: string]: number } = {};
      const typeStats: { [key: string]: number } = {};
      
      for (const didData of result.data.dids) {
        console.log(`📝 DID: ${didData.did.did}`);
        console.log(`   Created: ${new Date(didData.did.created_at).toLocaleString()}`);
        console.log(`   Keys: ${didData.keys.length}`);
        
        didData.keys.forEach((key, index) => {
          console.log(`     Key ${index + 1}:`);
          console.log(`       Type: ${key.key_type}`);
          console.log(`       Name: ${key.name}`);
          console.log(`       Usage: ${key.key_usage}`);
          console.log(`       Public Key: ${key.public_key.substring(0, 20)}...`);
          
          // Count statistics
          totalKeys += 1;
          usageStats[key.key_usage] = (usageStats[key.key_usage] || 0) + 1;
          typeStats[key.key_type] = (typeStats[key.key_type] || 0) + 1;
        });
        
        console.log('');
      }
      
      // Summary statistics
      console.log('📊 Key Usage Summary:');
      Object.entries(usageStats).forEach(([usage, count]) => {
        const percentage = ((count / totalKeys) * 100).toFixed(1);
        console.log(`   - ${usage}: ${count} keys (${percentage}%)`);
      });
      
      console.log('\n📊 Key Type Summary:');
      Object.entries(typeStats).forEach(([type, count]) => {
        const percentage = ((count / totalKeys) * 100).toFixed(1);
        console.log(`   - ${type}: ${count} keys (${percentage}%)`);
      });
      
      console.log(`\n📈 Total Keys: ${totalKeys}`);
      
      // Check for any missing key_usage
      const missingUsage = result.data.dids.some(didData => 
        didData.keys.some(key => !key.key_usage)
      );
      
      if (missingUsage) {
        console.log('\n⚠️  Warning: Some keys are missing key_usage field');
      } else {
        console.log('\n✅ All keys have key_usage field');
      }
      
      // Show key usage patterns
      console.log('\n🎯 Key Usage Patterns:');
      const authOnlyDIDs = result.data.dids.filter(didData => 
        didData.keys.every(key => key.key_usage === 'authentication')
      );
      const agreementOnlyDIDs = result.data.dids.filter(didData => 
        didData.keys.every(key => key.key_usage === 'keyAgreement')
      );
      const mixedDIDs = result.data.dids.filter(didData => {
        const usages = new Set(didData.keys.map(key => key.key_usage));
        return usages.size > 1;
      });
      
      console.log(`   - Authentication-only DIDs: ${authOnlyDIDs.length}`);
      console.log(`   - Key Agreement-only DIDs: ${agreementOnlyDIDs.length}`);
      console.log(`   - Mixed usage DIDs: ${mixedDIDs.length}`);
      
    } else {
      console.log('❌ Failed to get DIDs');
    }
  } catch (error) {
    console.error('❌ Error checking key usage:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  checkKeyUsage();
}

export { checkKeyUsage };
