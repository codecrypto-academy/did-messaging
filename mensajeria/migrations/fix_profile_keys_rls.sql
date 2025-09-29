-- Fix RLS policies for profile_keys to allow public key access for encryption
-- Users should be able to read public keys of other users for encryption purposes

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can view their own profile keys" ON public.profile_keys;

-- Create new policy that allows users to view public keys of other users
-- but only for keyAgreement keys (needed for encryption)
CREATE POLICY "Users can view public keyAgreement keys for encryption"
  ON public.profile_keys FOR SELECT
  USING (
    key_usage = 'keyAgreement' 
    AND curve_type = 'x25519'
  );

-- Keep the existing policies for other operations
-- (INSERT, UPDATE, DELETE policies remain the same)
