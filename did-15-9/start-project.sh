#!/bin/bash

echo "🚀 Starting Innovation DID Project"
echo "=================================="

# Verificar que Docker esté ejecutándose
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "✅ Docker is running"

# Verificar que Node.js esté instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

echo "✅ Node.js is installed: $(node --version)"

# Iniciar Supabase
echo ""
echo "🗄️ Starting Supabase..."
docker-compose up -d

# Esperar a que Supabase esté listo
echo "⏳ Waiting for Supabase to be ready..."
sleep 15

# Verificar que la base de datos esté lista
until docker exec did-supabase-db pg_isready -U postgres; do
    echo "⏳ Waiting for database..."
    sleep 2
done

echo "✅ Database is ready!"

# Aplicar esquema
echo ""
echo "📊 Applying database schema..."
docker exec -i did-supabase-db psql -U postgres -d postgres < supabase-schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Schema applied successfully!"
else
    echo "❌ Failed to apply schema"
    exit 1
fi

# Instalar dependencias de la API
echo ""
echo "📦 Installing API dependencies..."
cd did-api
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install API dependencies"
        exit 1
    fi
fi
echo "✅ API dependencies installed"

# Instalar dependencias del cliente
echo ""
echo "📦 Installing client dependencies..."
cd ../did-api-client
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install client dependencies"
        exit 1
    fi
fi
echo "✅ Client dependencies installed"

# Compilar proyectos
echo ""
echo "🔨 Building projects..."
cd ../did-api
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Failed to build API"
    exit 1
fi
echo "✅ API built successfully"

cd ../did-api-client
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Failed to build client"
    exit 1
fi
echo "✅ Client built successfully"

# Crear archivos de configuración si no existen
echo ""
echo "⚙️ Setting up configuration files..."

# API .env
if [ ! -f "did-api/.env" ]; then
    echo "📝 Creating API .env file..."
    cat > did-api/.env << EOF
# Supabase Configuration (Local)
SUPABASE_URL=http://localhost:54322
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# Server Configuration
PORT=3000
NODE_ENV=development

# Encryption Configuration (32 character key for AES-256)
ENCRYPTION_KEY=your_32_character_encryption_key_here

# Anvil Mnemonic (for key derivation)
ANVIL_MNEMONIC=test test test test test test test test test test test junk
EOF
    echo "✅ API .env file created"
else
    echo "✅ API .env file already exists"
fi

# Client .env
if [ ! -f "did-api-client/.env" ]; then
    echo "📝 Creating client .env file..."
    cat > did-api-client/.env << EOF
# API Configuration
API_BASE_URL=http://localhost:3000/api/v1
EOF
    echo "✅ Client .env file created"
else
    echo "✅ Client .env file already exists"
fi

echo ""
echo "🎉 Project setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Start the API server:"
echo "   cd did-api && npm run dev"
echo ""
echo "2. In another terminal, test with the client:"
echo "   cd did-api-client && npm run test"
echo ""
echo "3. Or generate example DIDs:"
echo "   cd did-api-client && npm run generate-dids generate 5"
echo ""
echo "🌐 URLs:"
echo "   API: http://localhost:3000"
echo "   Supabase Studio: http://localhost:54323"
echo "   Health Check: http://localhost:3000/health"
echo ""
echo "💡 To stop the project: docker-compose down"
