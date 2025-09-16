-- Migration: Add active field to private_keys table
-- This migration adds an 'active' field to enable/disable keys

-- Add the active column to private_keys table
ALTER TABLE private_keys 
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;

-- Update existing records to be active by default
UPDATE private_keys 
SET active = TRUE
WHERE active IS NULL;

-- Make the active field NOT NULL after setting default values
ALTER TABLE private_keys 
ALTER COLUMN active SET NOT NULL;

-- Add an index for better performance when querying by active status
CREATE INDEX IF NOT EXISTS idx_private_keys_active ON private_keys(active);

-- Add a comment to document the purpose of the active field
COMMENT ON COLUMN private_keys.active IS 'Indicates whether the key is active and should be included in the DID Document';
