#!/bin/bash

echo "🚀 Starting Innovation DID Project with Local Supabase..."

# Check if Supabase is running
if ! supabase status &> /dev/null; then
    echo "❌ Supabase is not running locally"
    echo "💡 Starting Supabase..."
    supabase start
    if [ $? -ne 0 ]; then
        echo "❌ Failed to start Supabase"
        exit 1
    fi
fi

echo "✅ Supabase is running locally"

# Copy local environment file
if [ -f "did-api/env.local" ]; then
    echo "📝 Setting up local environment..."
    cp did-api/env.local did-api/.env
    cp did-api-client/env.example did-api-client/.env
    echo "✅ Environment files configured"
else
    echo "⚠️  Local environment file not found, using defaults"
fi

# Start the API server in background
echo "🚀 Starting API server..."
cd did-api
npm run dev &
API_PID=$!
cd ..

# Wait a moment for the server to start
sleep 3

# Check if API is running
if curl -s http://localhost:3000/api/v1/health > /dev/null; then
    echo "✅ API server is running on http://localhost:3000"
else
    echo "⚠️  API server might still be starting..."
fi

echo ""
echo "🎉 Project is running!"
echo ""
echo "🌐 URLs:"
echo "   API Server: http://localhost:3000"
echo "   API Health: http://localhost:3000/api/v1/health"
echo "   Supabase Studio: http://localhost:54323"
echo ""
echo "🧪 To test the API:"
echo "   cd did-api-client"
echo "   npm run test"
echo ""
echo "🛑 To stop everything:"
echo "   kill $API_PID"
echo "   supabase stop"
echo ""
echo "📋 API server PID: $API_PID"
