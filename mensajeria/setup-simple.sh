#!/bin/bash

echo "🚀 Simple Supabase Setup for Mensajería"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Stop any existing instances
echo "🛑 Stopping existing Supabase instances..."
supabase stop 2>/dev/null || true

# Start Supabase (this will automatically run migrations)
echo "🚀 Starting Supabase with migrations..."
supabase start

# Wait a bit for everything to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if everything is working
if curl -s http://localhost:54321/health > /dev/null 2>&1; then
    echo "✅ Supabase is running successfully!"
    echo ""
    echo "🌐 Supabase Studio: http://localhost:54323"
    echo "🔗 API URL: http://localhost:54321"
    echo "🚀 Start your app with: npm run dev"
else
    echo "❌ Supabase failed to start properly"
    echo "Try running: supabase start --debug"
fi
