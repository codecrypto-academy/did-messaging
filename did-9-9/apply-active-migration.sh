#!/bin/bash

echo "🔄 Applying migration: Add active field to private_keys table..."

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

# Apply the migration
echo "📊 Applying migration from did-api/migration-add-active-field.sql..."
if [ -f "did-api/migration-add-active-field.sql" ]; then
    psql "$DB_URL" -f did-api/migration-add-active-field.sql
    if [ $? -eq 0 ]; then
        echo "✅ Migration applied successfully!"
    else
        echo "❌ Failed to apply migration"
        exit 1
    fi
else
    echo "❌ Migration file not found: did-api/migration-add-active-field.sql"
    exit 1
fi

echo ""
echo "🎉 Migration completed!"
echo "🌐 Supabase Studio: http://localhost:54323"
echo "🔗 API URL: $(supabase status | grep 'API URL' | awk '{print $3}')"
echo ""
echo "💡 The 'active' field has been added to the private_keys table"
echo "💡 All existing keys are set to active: true"
