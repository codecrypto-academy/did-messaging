# DID API Server

A comprehensive CRUD API for managing Decentralized Identifiers (DIDs) and DID Documents using Supabase, TypeScript, and Express. This implementation includes cryptographic key management using BIP39, BIP32, Ed25519, and X25519 standards with encrypted private key storage.

## Features

- ✅ **CRUD Operations**: Create, Read, Update, Delete DIDs and DID Documents
- 🔐 **Cryptographic Security**: BIP39/BIP32 key derivation with Ed25519/X25519 support
- 🔒 **Encrypted Storage**: Private keys are encrypted before database storage
- 🗄️ **Supabase Integration**: PostgreSQL database with real-time capabilities
- 📝 **TypeScript**: Full type safety and modern development experience
- 🧪 **Comprehensive Testing**: Complete test suite with TypeScript client
- 🛡️ **Security**: Helmet, CORS, input validation, and error handling

## Architecture

```
did-api/
├── src/
│   ├── config/          # Supabase configuration
│   ├── controllers/     # API route handlers
│   ├── middleware/      # Validation and error handling
│   ├── models/          # Database models and business logic
│   ├── routes/          # Express route definitions
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Cryptographic utilities
│   └── index.ts         # Application entry point
├── supabase-schema.sql  # Database schema
└── package.json
```

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account and project
- TypeScript knowledge

## Installation

1. **Clone and navigate to the project:**
   ```bash
   cd did-api
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your Supabase credentials:
   ```env
   SUPABASE_URL=your_supabase_url_here
   SUPABASE_ANON_KEY=your_supabase_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
   PORT=3000
   NODE_ENV=development
   ENCRYPTION_KEY=your_32_character_encryption_key_here
   ANVIL_MNEMONIC=abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about
   ```

4. **Set up the database:**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Run the contents of `supabase-schema.sql` to create the required tables

## Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Health Check
```http
GET /api/v1/health
```

### Create DID
```http
POST /api/v1/dids
Content-Type: application/json

{
  "did": "did:example:123456789abcdefghi",
  "document": {
    "@context": ["https://www.w3.org/ns/did/v1"],
    "id": "did:example:123456789abcdefghi",
    "verificationMethod": [...],
    "authentication": [...],
    "service": [...]
  }
}
```

### Get DID
```http
GET /api/v1/dids/{did}
```

### Get All DIDs
```http
GET /api/v1/dids?page=1&limit=10
```

### Update DID
```http
PUT /api/v1/dids/{did}
Content-Type: application/json

{
  "document": {
    // Updated DID document
  }
}
```

### Delete DID
```http
DELETE /api/v1/dids/{did}
```

### Get Private Key
```http
GET /api/v1/dids/{did}/keys/{keyType}
```
Where `keyType` is either `ed25519` or `x25519`.

## Cryptographic Implementation

### Key Derivation
- Uses BIP39 mnemonic (Anvil default) for seed generation
- BIP32 hierarchical deterministic key derivation
- Unique derivation paths per DID using SHA256 hash

### Key Types
- **Ed25519**: For digital signatures and authentication
- **X25519**: For key agreement and encryption

### Security Features
- Private keys encrypted with AES-256-CBC before storage
- Public keys stored in base64 format
- Derivation paths tracked for key recovery

## Database Schema

### Tables
- `dids`: Core DID records
- `did_documents`: DID document JSON storage
- `private_keys`: Encrypted private key storage

### Relationships
- One-to-one: DID ↔ DID Document
- One-to-many: DID ↔ Private Keys (Ed25519 + X25519)

## Error Handling

The API provides comprehensive error handling with:
- Input validation using Joi
- HTTP status codes
- Structured error responses
- Request/response logging

## Security Considerations

- Private keys are encrypted before database storage
- Input validation on all endpoints
- CORS and Helmet security headers
- Environment variable protection
- Row Level Security (RLS) enabled in Supabase

## Testing

Use the included TypeScript client to test the API:

```bash
cd ../did-api-client
npm install
npm run test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
