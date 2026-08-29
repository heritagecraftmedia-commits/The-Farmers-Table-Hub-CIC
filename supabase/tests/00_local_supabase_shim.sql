-- Local reproduction of the parts of a Supabase project that the TFT
-- migrations depend on. NOT part of the deliverable migration; test harness only.

create extension if not exists pgcrypto;

-- Roles, as Supabase creates them.
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticator') then
    create role authenticator login noinherit;
  end if;
end $$;

grant anon, authenticated, service_role to authenticator;
grant anon, authenticated, service_role to postgres;

create schema if not exists auth;
create schema if not exists storage;
create schema if not exists extensions;

grant usage on schema public to anon, authenticated, service_role;
grant usage on schema auth to anon, authenticated, service_role;
grant usage on schema storage to anon, authenticated, service_role;

-- auth.users, trimmed to the columns the TFT migrations and app touch.
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  raw_user_meta_data jsonb default '{}'::jsonb,
  raw_app_meta_data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Supabase's JWT accessors. These read the request-scoped GUC that PostgREST
-- sets per request; that is exactly how a real request is authorised.
create or replace function auth.jwt() returns jsonb
language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb,
    '{}'::jsonb
  );
$$;

create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(auth.jwt()->>'sub', '')::uuid;
$$;

create or replace function auth.role() returns text
language sql stable as $$
  select coalesce(auth.jwt()->>'role', 'anon');
$$;

create or replace function auth.email() returns text
language sql stable as $$
  select auth.jwt()->>'email';
$$;

grant execute on function auth.jwt(), auth.uid(), auth.role(), auth.email()
  to anon, authenticated, service_role;
grant select on auth.users to anon, authenticated, service_role;

-- storage.buckets / storage.objects, matching the shape RLS policies use.
create table if not exists storage.buckets (
  id text primary key,
  name text not null,
  owner uuid,
  public boolean default false,
  file_size_limit bigint,
  allowed_mime_types text[],
  created_at timestamptz default now()
);

create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets(id),
  name text,
  owner uuid,
  owner_id text,
  metadata jsonb,
  path_tokens text[] generated always as (string_to_array(name, '/')) stored,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table storage.objects enable row level security;
alter table storage.buckets enable row level security;

create or replace function storage.foldername(name text) returns text[]
language sql immutable as $$
  select string_to_array(name, '/');
$$;

create or replace function storage.filename(name text) returns text
language sql immutable as $$
  select (string_to_array(name, '/'))[array_length(string_to_array(name,'/'),1)];
$$;

grant execute on function storage.foldername(text), storage.filename(text)
  to anon, authenticated, service_role;
grant all on storage.objects, storage.buckets to anon, authenticated, service_role;

-- Supabase's blanket table grants on public. RLS, not GRANT, is the boundary.
alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public
  grant execute on functions to anon, authenticated, service_role;
