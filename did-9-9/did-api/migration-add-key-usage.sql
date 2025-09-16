-- Migration: Add key_usage field to private_keys table
-- This migration adds a 'key_usage' field to specify how each key is used in the DID Document

-- Add the key_usage column to private_keys table
ALTER TABLE private_keys 
ADD COLUMN IF NOT EXISTS key_usage VARCHAR(20);

-- Update existing records with default key usage based on key_type
UPDATE private_keys 
SET key_usage = CASE 
    WHEN key_type = 'ed25519' THEN 'authentication'
    WHEN key_type = 'x25519' THEN 'keyAgreement'
    ELSE 'authentication'
END
WHERE key_usage IS NULL;

-- Make the key_usage field NOT NULL after setting default values
ALTER TABLE private_keys 
ALTER COLUMN key_usage SET NOT NULL;

-- Add an index for better performance when querying by key_usage
CREATE INDEX IF NOT EXISTS idx_private_keys_key_usage ON private_keys(key_usage);

-- Add a comment to document the purpose of the key_usage field
COMMENT ON COLUMN private_keys.key_usage IS 'Specifies how the key is used in the DID Document: authentication, assertionMethod, or keyAgreement';

-- Add a check constraint to ensure valid key_usage values
ALTER TABLE private_keys 
ADD CONSTRAINT check_key_usage 
CHECK (key_usage IN ('authentication', 'assertionMethod', 'keyAgreement'));
