#!/bin/bash

# Script to apply encryption migration to the database

echo "🔐 Applying encryption migration to database..."

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first."
    echo "   Visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in a Supabase project directory."
    echo "   Please run this script from the mensajeria directory."
    exit 1
fi

# Apply the migration
echo "📝 Applying migration: add_encryption_fields.sql"

# Check if we're in local development mode
if [ -f "supabase/config.toml" ]; then
    echo "   Using local Supabase instance..."
    # For local development, apply the migration directly using psql
    psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f migrations/add_encryption_fields.sql
    if [ $? -eq 0 ]; then
        echo "   ✅ Migration applied to local database"
    else
        echo "   ❌ Failed to apply migration to local database"
        exit 1
    fi
else
    # For remote projects, use db push
    supabase db push --include-all
    if [ $? -ne 0 ]; then
        echo "   ❌ Migration failed. Please check the error messages above."
        exit 1
    fi
fi

if [ $? -eq 0 ]; then
    echo "✅ Migration applied successfully!"
    echo ""
    echo "🔐 Encryption features are now available:"
    echo "   - Messages can be encrypted using Diffie-Hellman key agreement"
    echo "   - x25519 curve is used for key agreement"
    echo "   - AES-GCM is used for message encryption"
    echo "   - Sender's public key is included in encrypted messages"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Make sure users have keyAgreement keys configured"
    echo "   2. Messages will be automatically encrypted when both users have keys"
    echo "   3. Messages will be automatically decrypted when displayed"
else
    echo "❌ Migration failed. Please check the error messages above."
    exit 1
fi
