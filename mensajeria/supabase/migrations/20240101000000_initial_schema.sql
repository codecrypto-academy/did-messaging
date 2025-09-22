-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create users table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create conversations table
create table public.conversations (
  id uuid default uuid_generate_v4() primary key,
  name text,
  is_group boolean default false,
  created_by uuid references public.profiles(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create conversation_participants table (many-to-many)
create table public.conversation_participants (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(conversation_id, user_id)
);

-- Create messages table
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete cascade,
  content text not null,
  message_type text default 'text',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better performance
create index on public.messages (conversation_id, created_at desc);
create index on public.conversation_participants (user_id);
create index on public.conversation_participants (conversation_id);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;

-- RLS Policies

-- Profiles policies
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using ( true );

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile"
  on public.profiles for update
  using ( auth.uid() = id );

-- Conversations policies
create policy "Users can view conversations they participate in"
  on public.conversations for select
  using (
    exists (
      select 1 from public.conversation_participants
      where conversation_id = conversations.id
      and user_id = auth.uid()
    )
  );

create policy "Users can create conversations"
  on public.conversations for insert
  with check ( auth.uid() = created_by );

-- Conversation participants policies
create policy "Users can view participants of their conversations"
  on public.conversation_participants for select
  using (
    exists (
      select 1 from public.conversation_participants cp2
      where cp2.conversation_id = conversation_participants.conversation_id
      and cp2.user_id = auth.uid()
    )
  );

create policy "Conversation creators can add participants"
  on public.conversation_participants for insert
  with check (
    exists (
      select 1 from public.conversations
      where id = conversation_id
      and created_by = auth.uid()
    )
  );

-- Messages policies
create policy "Users can view messages from their conversations"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversation_participants
      where conversation_id = messages.conversation_id
      and user_id = auth.uid()
    )
  );

create policy "Users can insert messages to their conversations"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversation_participants
      where conversation_id = messages.conversation_id
      and user_id = auth.uid()
    )
  );

-- Function to automatically create a profile for new users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to automatically create profile on user signup
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger handle_updated_at before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.conversations
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.messages
  for each row execute procedure public.handle_updated_at();
