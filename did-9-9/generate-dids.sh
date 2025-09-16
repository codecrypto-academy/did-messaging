#!/bin/bash

echo "🎯 DID Bulk Generator for did:web:user/* format"
echo ""

# Check if API is running
echo "🏥 Checking API health..."
if ! curl -s http://localhost:3000/api/v1/health > /dev/null; then
    echo "❌ API server is not running on http://localhost:3000"
    echo "💡 Please start the API server first:"
    echo "   cd did-api && npm run dev"
    exit 1
fi

echo "✅ API server is running"
echo ""

# Check if we're in the right directory
if [ ! -d "did-api-client" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Run the TypeScript script
echo "🚀 Starting bulk DID generation..."
echo ""

cd did-api-client
npx ts-node src/scripts/generateDIDs.ts

echo ""
echo "🎉 Script completed!"
echo ""
echo "💡 You can now:"
echo "   - View DIDs in Supabase Studio: http://localhost:54323"
echo "   - Test individual DIDs with the API client"
echo "   - Run the test suite to verify everything works"
