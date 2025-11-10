-- Supabase initialization SQL: profiles, credit_transactions, storage buckets, policies
-- Run this in Supabase SQL editor. Adjust as needed for your project.

begin;

-- Ensure pgcrypto for gen_random_uuid
create extension if not exists pgcrypto;

-- Profiles table (create if missing)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  username text,
  first_name text,
  last_name text,
  avatar_url text,
  banner_url text,
  avatar_path text,
  banner_path text,
  is_subscriber boolean default false,
  credits integer default 0,
  role text default 'user',
  is_admin boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add columns if the table already exists
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists banner_url text;
alter table public.profiles add column if not exists avatar_path text;
alter table public.profiles add column if not exists banner_path text;
alter table public.profiles add column if not exists credits integer default 0;
alter table public.profiles add column if not exists role text default 'user';
alter table public.profiles add column if not exists is_admin boolean default false;

-- RLS policies for profiles
alter table public.profiles enable row level security;
drop policy if exists "Profiles select own" on public.profiles;
create policy "Profiles select own" on public.profiles for select using (auth.uid() = id);

drop policy if exists "Profiles update own" on public.profiles;
create policy "Profiles update own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Automatically create a profile row on user sign-up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Credit transactions table
create table if not exists public.credit_transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('earn','spend','purchase')),
  amount integer not null,
  note text,
  created_at timestamptz default now()
);

alter table public.credit_transactions enable row level security;
drop policy if exists "Transactions select own" on public.credit_transactions;
create policy "Transactions select own" on public.credit_transactions for select using (auth.uid() = user_id);

drop policy if exists "Transactions insert own" on public.credit_transactions;
create policy "Transactions insert own" on public.credit_transactions for insert with check (auth.uid() = user_id);

-- Storage buckets
insert into storage.buckets (id, name, public)
values ('avatars','avatars', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('banners','banners', false)
on conflict (id) do nothing;

-- Storage objects policies
alter table storage.objects enable row level security;

-- Select own files (private buckets)
drop policy if exists "Users select own avatars" on storage.objects;
create policy "Users select own avatars" on storage.objects for select
  using (bucket_id = 'avatars' and split_part(name, '/', 1) = auth.uid()::text);

drop policy if exists "Users select own banners" on storage.objects;
create policy "Users select own banners" on storage.objects for select
  using (bucket_id = 'banners' and split_part(name, '/', 1) = auth.uid()::text);

-- Authenticated users manage their own files within folder prefix (first path segment is user id)
drop policy if exists "Users insert own avatars" on storage.objects;
create policy "Users insert own avatars" on storage.objects for insert
  with check (bucket_id = 'avatars' and split_part(name, '/', 1) = auth.uid()::text);

drop policy if exists "Users update own avatars" on storage.objects;
create policy "Users update own avatars" on storage.objects for update
  using (bucket_id = 'avatars' and split_part(name, '/', 1) = auth.uid()::text);

drop policy if exists "Users delete own avatars" on storage.objects;
create policy "Users delete own avatars" on storage.objects for delete
  using (bucket_id = 'avatars' and split_part(name, '/', 1) = auth.uid()::text);

drop policy if exists "Users insert own banners" on storage.objects;
create policy "Users insert own banners" on storage.objects for insert
  with check (bucket_id = 'banners' and split_part(name, '/', 1) = auth.uid()::text);

drop policy if exists "Users update own banners" on storage.objects;
create policy "Users update own banners" on storage.objects for update
  using (bucket_id = 'banners' and split_part(name, '/', 1) = auth.uid()::text);

drop policy if exists "Users delete own banners" on storage.objects;
create policy "Users delete own banners" on storage.objects for delete
  using (bucket_id = 'banners' and split_part(name, '/', 1) = auth.uid()::text);

-- Backfill avatar_path and banner_path from existing public URLs, if present
update public.profiles
set avatar_path = regexp_replace(avatar_url, '^.*?/storage/v1/object/public/avatars/', '')
where avatar_path is null and avatar_url is not null and avatar_url like '%/storage/v1/object/public/avatars/%';

update public.profiles
set banner_path = regexp_replace(banner_url, '^.*?/storage/v1/object/public/banners/', '')
where banner_path is null and banner_url is not null and banner_url like '%/storage/v1/object/public/banners/%';

-- RPC to backfill paths and return counts
create or replace function public.backfill_profile_paths()
returns jsonb
language plpgsql
security definer
as $$
declare
  affected_avatars integer := 0;
  affected_banners integer := 0;
begin
  update public.profiles
    set avatar_path = regexp_replace(avatar_url, '^.*?/storage/v1/object/public/avatars/', '')
  where avatar_path is null and avatar_url is not null and avatar_url like '%/storage/v1/object/public/avatars/%';
  GET DIAGNOSTICS affected_avatars = ROW_COUNT;

  update public.profiles
    set banner_path = regexp_replace(banner_url, '^.*?/storage/v1/object/public/banners/', '')
  where banner_path is null and banner_url is not null and banner_url like '%/storage/v1/object/public/banners/%';
  GET DIAGNOSTICS affected_banners = ROW_COUNT;

  return jsonb_build_object('avatars', affected_avatars, 'banners', affected_banners);
end;
$$;

commit;
