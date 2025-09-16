#!/bin/bash

echo "🚀 Setting up Innovation DID Project..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install API dependencies
echo "📦 Installing API dependencies..."
cd did-api
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install API dependencies"
    exit 1
fi

# Build API
echo "🔨 Building API..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Failed to build API"
    exit 1
fi

# Install Client dependencies
echo "📦 Installing Client dependencies..."
cd ../did-api-client
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install Client dependencies"
    exit 1
fi

# Build Client
echo "🔨 Building Client..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Failed to build Client"
    exit 1
fi

cd ..

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Set up your Supabase project:"
echo "   - Create a project at https://supabase.com"
echo "   - Get your project URL and API keys"
echo ""
echo "2. Configure the API server:"
echo "   cd did-api"
echo "   cp env.example .env"
echo "   # Edit .env with your Supabase credentials"
echo ""
echo "3. Set up the database:"
echo "   - Go to your Supabase SQL Editor"
echo "   - Run the contents of did-api/supabase-schema.sql"
echo ""
echo "4. Start the API server:"
echo "   cd did-api"
echo "   npm run dev"
echo ""
echo "5. Test with the client:"
echo "   cd did-api-client"
echo "   cp env.example .env"
echo "   npm run test"
echo ""
echo "📖 For detailed instructions, see the README files in each directory."
