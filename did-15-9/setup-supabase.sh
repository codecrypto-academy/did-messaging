#!/bin/bash

echo "🏠 Setting up Innovation DID Project with Local Supabase..."

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running."
    echo "💡 Please start Docker and try again"
    exit 1
fi

echo "✅ Docker is running"

# Start Supabase with Docker Compose
echo "🚀 Starting Supabase with Docker Compose..."
docker-compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Check if database is ready
until docker exec did-supabase-db pg_isready -U postgres; do
    echo "⏳ Waiting for database..."
    sleep 2
done

echo "✅ Database is ready!"

# Apply the schema
echo "📊 Applying database schema..."
docker exec -i did-supabase-db psql -U postgres -d postgres < supabase-schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Schema applied successfully!"
else
    echo "❌ Failed to apply schema"
    exit 1
fi

echo ""
echo "🎉 Local Supabase setup completed!"
echo ""
echo "📋 Database Information:"
echo "🌐 Supabase Studio: http://localhost:54323"
echo "🔗 Database URL: postgresql://postgres:postgres@localhost:54322/postgres"
echo ""
echo "💡 To stop Supabase: docker-compose down"
echo "💡 To reset database: docker-compose down -v && docker-compose up -d"
