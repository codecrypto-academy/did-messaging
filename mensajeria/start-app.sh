#!/bin/bash

# Start script for Mensajería app
echo "🚀 Starting Mensajería - Chat Application"

# Check if Supabase is running
if ! curl -s http://localhost:54321/health > /dev/null; then
    echo "❌ Supabase is not running. Starting Supabase..."
    ./setup-local-supabase.sh
else
    echo "✅ Supabase is already running"
fi

# Start Next.js development server
echo "🌐 Starting Next.js development server..."
npm run dev
