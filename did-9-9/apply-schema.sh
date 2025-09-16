#!/bin/bash

echo "🗄️ Applying DID API schema to local Supabase..."

# Check if Supabase is running
if ! supabase status &> /dev/null; then
    echo "❌ Supabase is not running locally"
    echo "💡 Start it with: supabase start"
    exit 1
fi

# Get the database URL
DB_URL=$(supabase status | grep "DB URL" | awk '{print $3}')

if [ -z "$DB_URL" ]; then
    echo "❌ Could not get database URL from Supabase status"
    exit 1
fi

echo "🔗 Database URL: $DB_URL"

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ psql is not installed"
    echo "💡 Install PostgreSQL client tools"
    exit 1
fi

# Apply the schema
echo "📊 Applying schema from did-api/supabase-schema.sql..."
if [ -f "did-api/supabase-schema.sql" ]; then
    psql "$DB_URL" -f did-api/supabase-schema.sql
    if [ $? -eq 0 ]; then
        echo "✅ Schema applied successfully!"
    else
        echo "❌ Failed to apply schema"
        exit 1
    fi
else
    echo "❌ Schema file not found: did-api/supabase-schema.sql"
    exit 1
fi

echo ""
echo "🎉 Database schema is ready!"
echo "🌐 Supabase Studio: http://localhost:54323"
echo "🔗 API URL: $(supabase status | grep 'API URL' | awk '{print $3}')"
