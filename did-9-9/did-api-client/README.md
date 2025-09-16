# DID API Client

A TypeScript client for testing and interacting with the DID API server. This client provides a comprehensive interface for all CRUD operations and includes a complete test suite.

## Features

- ✅ **Full API Coverage**: All CRUD operations for DIDs and DID Documents
- 🔐 **Private Key Access**: Retrieve encrypted private keys (Ed25519/X25519)
- 📊 **Pagination Support**: Handle large datasets with pagination
- 🧪 **Comprehensive Testing**: Complete test suite with real API calls
- 📝 **TypeScript**: Full type safety and IntelliSense support
- 🚀 **Easy Integration**: Simple client instantiation and method calls

## Installation

1. **Navigate to the client directory:**
   ```bash
   cd did-api-client
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your API server URL:
   ```env
   API_BASE_URL=http://localhost:3000/api/v1
   ```

## Usage

### Basic Usage

```typescript
import { DIDAPIClient } from './src/client/DIDAPIClient';

const client = new DIDAPIClient('http://localhost:3000/api/v1');

// Health check
const health = await client.healthCheck();
console.log(health);

// Create a DID
const createRequest = {
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
    authentication: ['did:example:123456789abcdefghi#key-1']
  }
};

const result = await client.createDID(createRequest);
console.log('DID created:', result.data?.did.did);
```

### Available Methods

#### Health Check
```typescript
const health = await client.healthCheck();
```

#### Create DID
```typescript
const result = await client.createDID(createRequest);
```

#### Get DID
```typescript
const did = await client.getDID('did:example:123456789abcdefghi');
```

#### Get All DIDs
```typescript
const allDIDs = await client.getAllDIDs(1, 10); // page, limit
```

#### Update DID
```typescript
const updated = await client.updateDID('did:example:123456789abcdefghi', updateRequest);
```

#### Delete DID
```typescript
const deleted = await client.deleteDID('did:example:123456789abcdefghi');
```

#### Get Private Key
```typescript
const ed25519Key = await client.getPrivateKey('did:example:123456789abcdefghi', 'ed25519');
const x25519Key = await client.getPrivateKey('did:example:123456789abcdefghi', 'x25519');
```

## Running Tests

The client includes a comprehensive test suite that demonstrates all API functionality:

```bash
npm run test
```

### Test Coverage

The test suite covers:
1. ✅ Health check
2. ✅ DID creation with full document
3. ✅ DID retrieval
4. ✅ Private key retrieval (both Ed25519 and X25519)
5. ✅ DID document updates
6. ✅ Pagination with multiple DIDs
7. ✅ DID deletion
8. ✅ Error handling

### Test Output

The tests provide detailed logging:
- 🚀 Request logging (method, URL)
- ✅ Success responses with status codes
- ❌ Error handling and validation
- 📊 Data verification and counts

## Development

### Build
```bash
npm run build
```

### Development Mode
```bash
npm run dev
```

### TypeScript Compilation
```bash
npx tsc
```

## Error Handling

The client provides comprehensive error handling:

```typescript
try {
  const result = await client.createDID(request);
  console.log('Success:', result.data);
} catch (error) {
  console.error('Error:', error.message);
  console.error('Status:', error.status);
  console.error('Data:', error.data);
}
```

## Configuration

### Custom Base URL
```typescript
const client = new DIDAPIClient('https://your-api-server.com/api/v1');
```

### Environment Variables
```env
API_BASE_URL=http://localhost:3000/api/v1
```

## TypeScript Support

The client is fully typed with comprehensive interfaces:

- `DIDDocument`: W3C DID Document structure
- `VerificationMethod`: Cryptographic verification methods
- `Service`: DID service endpoints
- `APIResponse`: Standardized API responses
- `PaginatedResponse`: Paginated data responses

## Integration Examples

### Express.js Integration
```typescript
import express from 'express';
import { DIDAPIClient } from './src/client/DIDAPIClient';

const app = express();
const didClient = new DIDAPIClient();

app.get('/proxy/dids/:did', async (req, res) => {
  try {
    const result = await didClient.getDID(req.params.did);
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});
```

### React Integration
```typescript
import { DIDAPIClient } from './src/client/DIDAPIClient';

const useDIDClient = () => {
  const [client] = useState(() => new DIDAPIClient());
  
  const createDID = useCallback(async (request) => {
    return await client.createDID(request);
  }, [client]);
  
  return { createDID, client };
};
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
