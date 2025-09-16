-- Migration: Add name field to private_keys table
-- This migration adds a 'name' field to identify each key pair

-- Add the name column to private_keys table
ALTER TABLE private_keys 
ADD COLUMN IF NOT EXISTS name VARCHAR(100);

-- Update existing records with default names based on key_type
UPDATE private_keys 
SET name = CASE 
    WHEN key_type = 'ed25519' THEN 'signing-key'
    WHEN key_type = 'x25519' THEN 'encryption-key'
    ELSE 'unknown-key'
END
WHERE name IS NULL;

-- Make the name field NOT NULL after setting default values
ALTER TABLE private_keys 
ALTER COLUMN name SET NOT NULL;

-- Add an index for better performance when querying by name
CREATE INDEX IF NOT EXISTS idx_private_keys_name ON private_keys(name);

-- Add a unique constraint to ensure each DID has unique key names
-- This prevents duplicate key names within the same DID
CREATE UNIQUE INDEX IF NOT EXISTS idx_private_keys_did_name_unique 
ON private_keys(did_id, name);

-- Add a comment to document the purpose of the name field
COMMENT ON COLUMN private_keys.name IS 'Human-readable name for the key pair (e.g., "signing-key", "encryption-key", "backup-key")';
