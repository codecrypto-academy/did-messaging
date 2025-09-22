#!/bin/bash

echo "🔧 Fixing database setup for Mensajería app..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Stop any existing Supabase instance
echo "🛑 Stopping existing Supabase instances..."
supabase stop 2>/dev/null || true

# Initialize Supabase if not already done
if [ ! -d ".supabase" ]; then
    echo "📦 Initializing Supabase project..."
    supabase init
fi

# Start Supabase
echo "🚀 Starting Supabase..."
supabase start

# Wait for Supabase to be ready
echo "⏳ Waiting for Supabase to be ready..."
sleep 15

# Check if Supabase is running
if curl -s http://localhost:54321/health > /dev/null 2>&1; then
    echo "✅ Supabase is running!"
else
    echo "❌ Supabase failed to start. Trying alternative approach..."
    
    # Try to start with different port
    supabase start --port 54322
    sleep 10
fi

# Apply database schema using psql
echo "🗄️  Applying database schema..."
psql "postgresql://postgres:postgres@localhost:54322/postgres" -f database-schema.sql

# Enable realtime
echo "📡 Enabling realtime..."
psql "postgresql://postgres:postgres@localhost:54322/postgres" -c "alter publication supabase_realtime add table public.messages;"

echo "✅ Database setup complete!"
echo ""
echo "🌐 Supabase Studio: http://localhost:54323"
echo "🔗 API URL: http://localhost:54321"
echo "🚀 You can now start the app with: npm run dev"
