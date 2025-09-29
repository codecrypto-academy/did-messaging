-- Fix INSERT policy for profile_keys
-- Users should be able to insert their own profile keys

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can insert their own profile keys" ON public.profile_keys;

-- Create new INSERT policy that allows users to insert their own keys
CREATE POLICY "Users can insert their own profile keys"
  ON public.profile_keys FOR INSERT
  WITH CHECK (profile_id = auth.uid());
