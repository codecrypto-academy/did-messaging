#!/bin/bash

# Setup script for local Supabase messaging app
echo "🚀 Setting up local Supabase for Mensajería app..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Initialize Supabase if not already initialized
if [ ! -d ".supabase" ]; then
    echo "📦 Initializing Supabase project..."
    supabase init
fi

# Start Supabase local development
echo "🔄 Starting Supabase local development..."
supabase start

# Wait for Supabase to be ready
echo "⏳ Waiting for Supabase to be ready..."
sleep 10

# Apply database schema
echo "🗄️  Applying database schema..."
supabase db reset --db-url "postgresql://postgres:postgres@localhost:54322/postgres" --file database-schema.sql

# Enable realtime for messages table
echo "📡 Enabling realtime for messages..."
supabase db reset --db-url "postgresql://postgres:postgres@localhost:54322/postgres" --file - << 'EOF'
-- Enable realtime for messages table
alter publication supabase_realtime add table public.messages;
EOF

echo "✅ Setup complete!"
echo ""
echo "🌐 Supabase Studio: http://localhost:54323"
echo "🔗 API URL: http://localhost:54321"
echo "🔑 Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
echo ""
echo "🚀 Start the Next.js app with: npm run dev"
