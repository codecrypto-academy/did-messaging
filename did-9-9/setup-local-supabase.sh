#!/bin/bash

echo "🏠 Setting up Innovation DID Project with Local Supabase..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo "📦 Please install it first:"
    echo "   npm install -g supabase"
    echo "   or visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

echo "✅ Supabase CLI found: $(supabase --version)"

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "🔧 Initializing Supabase project..."
    supabase init
fi

# Start Supabase locally
echo "🚀 Starting Supabase locally..."
supabase start

if [ $? -ne 0 ]; then
    echo "❌ Failed to start Supabase locally"
    echo "💡 Make sure Docker is running and try again"
    exit 1
fi

# Get the local Supabase URL and keys
echo "📋 Getting local Supabase configuration..."
SUPABASE_URL=$(supabase status | grep "API URL" | awk '{print $3}')
SUPABASE_ANON_KEY=$(supabase status | grep "anon key" | awk '{print $3}')
SUPABASE_SERVICE_KEY=$(supabase status | grep "service_role key" | awk '{print $3}')

echo "✅ Supabase is running locally!"
echo "🌐 API URL: $SUPABASE_URL"
echo "🔑 Anon Key: $SUPABASE_ANON_KEY"
echo "🔑 Service Key: $SUPABASE_SERVICE_KEY"

# Create .env file for the API
echo "📝 Creating .env file for API..."
cat > did-api/.env << EOF
# Supabase Configuration (Local)
SUPABASE_URL=$SUPABASE_URL
SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_KEY

# Server Configuration
PORT=3000
NODE_ENV=development

# Encryption Configuration
ENCRYPTION_KEY=your_32_character_encryption_key_here

# Anvil Mnemonic (for key derivation)
ANVIL_MNEMONIC=abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about
EOF

echo "✅ Created did-api/.env file"

# Create .env file for the client
echo "📝 Creating .env file for client..."
cat > did-api-client/.env << EOF
# API Configuration
API_BASE_URL=http://localhost:3000/api/v1
EOF

echo "✅ Created did-api-client/.env file"

# Apply the database schema
echo "🗄️ Applying database schema..."
supabase db reset --linked

# Run the schema SQL
echo "📊 Creating database tables..."
supabase db push

# Check if the schema file exists and apply it
if [ -f "did-api/supabase-schema.sql" ]; then
    echo "📋 Applying custom schema..."
    supabase db push --include-all
    # Alternative: psql "$SUPABASE_URL" -f did-api/supabase-schema.sql
fi

echo ""
echo "🎉 Local Supabase setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Start the API server:"
echo "   cd did-api"
echo "   npm run dev"
echo ""
echo "2. Test with the client:"
echo "   cd did-api-client"
echo "   npm run test"
echo ""
echo "🌐 Supabase Studio: http://localhost:54323"
echo "🔗 API URL: $SUPABASE_URL"
echo ""
echo "💡 To stop Supabase: supabase stop"
echo "💡 To reset database: supabase db reset"
