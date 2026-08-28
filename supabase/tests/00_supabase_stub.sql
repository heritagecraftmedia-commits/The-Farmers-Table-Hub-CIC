-- Minimal stand-in for the Supabase-managed schemas, so the migration chain
-- can be validated locally exactly as it would run on the real project.
create extension if not exists pgcrypto;

create schema if not exists auth;
create schema if not exists storage;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  created_at timestamptz default now(),
  last_sign_in_at timestamptz,
  raw_user_meta_data jsonb default '{}'::jsonb
);

-- auth.uid() / auth.role() are provided by Supabase at runtime.
-- These match Supabase's own definitions, which read the claim either as a
-- flat GUC (older PostgREST) or out of the request.jwt.claims JSON (newer).
create or replace function auth.uid() returns uuid
  language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;

create or replace function auth.role() returns text
  language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'),
    'anon'
  )
$$;

-- Supabase exposes the signed-in user's metadata to RLS through auth.users;
-- radio_is_staff() reads it, so the grants below mirror the real project.


create table if not exists storage.buckets (
  id text primary key,
  name text not null,
  public boolean default false,
  created_at timestamptz default now()
);

create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets(id),
  name text,
  owner uuid,
  created_at timestamptz default now()
);
alter table storage.objects enable row level security;

-- directory_listings is created by an earlier TFT migration; the radio
-- migrations reference it by foreign key.
create table if not exists directory_listings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  location text,
  description text,
  website text,
  tier text default 'free',
  status text default 'pending',
  affiliate_links jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
