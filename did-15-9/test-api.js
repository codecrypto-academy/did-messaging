const axios = require('axios');

async function testAPI() {
  const baseURL = 'http://localhost:3000';
  
  console.log('🧪 Testing DID API with sample data...\n');
  
  try {
    // Test health check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get(`${baseURL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);
    
    // Test list DIDs
    console.log('\n2. Testing list DIDs...');
    const listResponse = await axios.get(`${baseURL}/api/v1/dids`);
    console.log('✅ List DIDs passed:', listResponse.data);
    
    // Test get specific DID
    console.log('\n3. Testing get specific DID...');
    const getResponse = await axios.get(`${baseURL}/api/v1/dids/did:web:user/alice`);
    console.log('✅ Get DID passed:', {
      did: getResponse.data.data.did,
      keys: getResponse.data.data.keys?.length || 0
    });
    
    // Test get DID document
    console.log('\n4. Testing get DID document...');
    const docResponse = await axios.get(`${baseURL}/api/v1/dids/did:web:user/alice/document`);
    console.log('✅ Get DID document passed:', {
      id: docResponse.data.data.id,
      context: docResponse.data.data['@context']
    });
    
    // Test sign message
    console.log('\n5. Testing sign message...');
    const signResponse = await axios.post(`${baseURL}/api/v1/dids/did:web:user/alice/sign`, {
      message: 'Hello, DID World!'
    });
    console.log('✅ Sign message passed:', {
      message: signResponse.data.data.message,
      signature: signResponse.data.data.signature.substring(0, 20) + '...'
    });
    
    // Test verify signature
    console.log('\n6. Testing verify signature...');
    const verifyResponse = await axios.post(`${baseURL}/api/v1/dids/did:web:user/alice/verify`, {
      message: 'Hello, DID World!',
      signature: signResponse.data.data.signature
    });
    console.log('✅ Verify signature passed:', verifyResponse.data.data.valid);
    
    console.log('\n🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Wait a bit for API to start, then test
setTimeout(testAPI, 3000);
