
-- Add columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mnemonic text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS did text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS diddocument jsonb;

-- Create profile_keys table
CREATE TABLE IF NOT EXISTS public.profile_keys (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade,
  derived_path text not null,
  curve_type text not null check (curve_type in ('ed25519', 'x25519')),
  key_usage text not null check (key_usage in ('authorization', 'keyAgreement', 'assertion')),
  public_key text not null,
  private_key text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profile_keys_profile_id ON public.profile_keys (profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_keys_curve_type ON public.profile_keys (profile_id, curve_type);
CREATE INDEX IF NOT EXISTS idx_profile_keys_key_usage ON public.profile_keys (profile_id, key_usage);

-- Enable RLS
ALTER TABLE public.profile_keys enable row level security;

-- Create RLS policies
CREATE POLICY "Users can view their own profile keys"
  ON public.profile_keys for select
  USING (profile_id = auth.uid());

CREATE POLICY "Users can insert their own profile keys"
  ON public.profile_keys for insert
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update their own profile keys"
  ON public.profile_keys for update
  USING (profile_id = auth.uid());

CREATE POLICY "Users can delete their own profile keys"
  ON public.profile_keys for delete
  USING (profile_id = auth.uid());

-- Add trigger
CREATE TRIGGER handle_updated_at before update on public.profile_keys
  for each row execute procedure public.handle_updated_at();
