# Innovation DID Project

A comprehensive Decentralized Identity (DID) system implementing W3C DID standards with cryptographic key management using BIP39, BIP32, Ed25519, and X25519.

## Project Structure

```
innovation-did/
├── did-api/                 # Express.js API server
├── did-api-client/          # TypeScript client
└── README.md               # This file
```

## Features

- 🔐 **Cryptographic Security**: BIP39/BIP32 with Ed25519/X25519
- 🗄️ **Supabase Integration**: PostgreSQL with encrypted storage
- 🚀 **RESTful API**: Complete CRUD operations
- 🧪 **TypeScript Client**: Comprehensive testing suite
- 🛡️ **Security**: Encrypted private keys, input validation

## Quick Start

### For Local Supabase Development
```bash
# Setup with local Supabase (recommended for development)
./setup-local-supabase.sh
```

### For Cloud Supabase
```bash
# Setup with cloud Supabase
./setup.sh
```

### Manual Setup

#### 1. Set Up Supabase

**Local Development:**
1. Install Supabase CLI: `npm install -g supabase`
2. Start Supabase: `supabase start`
3. Apply schema: `./apply-schema.sh`

**Cloud Setup:**
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the database schema from `did-api/supabase-schema.sql`

#### 2. Start the API Server
```bash
cd did-api
npm install
cp env.example .env
# Edit .env with your Supabase credentials
npm run dev
```

#### 3. Test with the Client
```bash
cd did-api-client
npm install
cp env.example .env
npm run test
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/dids` | Create new DID |
| GET | `/api/v1/dids` | List all DIDs |
| GET | `/api/v1/dids/{did}` | Get specific DID |
| PUT | `/api/v1/dids/{did}` | Update DID document |
| DELETE | `/api/v1/dids/{did}` | Delete DID |
| GET | `/api/v1/dids/{did}/keys/{type}` | Get private key |

## Standards Compliance

- W3C DID Core specification
- BIP39/BIP32 cryptographic standards
- Ed25519/X25519 key algorithms
- AES-256-CBC encryption

## Documentation

- [API Server Documentation](did-api/README.md)
- [Client Documentation](did-api-client/README.md)

## License

MIT License