-- Add mnemonic and diddocument fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN mnemonic text,
ADD COLUMN diddocument jsonb;

-- Create profileKeys table
CREATE TABLE public.profile_keys (
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

-- Create indexes for better performance
CREATE INDEX ON public.profile_keys (profile_id);
CREATE INDEX ON public.profile_keys (profile_id, curve_type);
CREATE INDEX ON public.profile_keys (profile_id, key_usage);

-- Enable Row Level Security
ALTER TABLE public.profile_keys enable row level security;

-- RLS Policies for profile_keys
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

-- Add trigger for updated_at
CREATE TRIGGER handle_updated_at before update on public.profile_keys
  for each row execute procedure public.handle_updated_at();
