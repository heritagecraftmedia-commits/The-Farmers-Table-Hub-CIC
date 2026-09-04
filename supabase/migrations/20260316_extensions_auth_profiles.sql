-- ============================================================
-- Extensions + auth foundation (profiles)
-- ============================================================
-- WHY THIS FILE EXISTS
--
-- A fresh database could not be built from supabase/migrations at all.
-- 20260317_create_directory_listings.sql creates:
--
--   CREATE POLICY "Founder can do everything" ON directory_listings
--     USING (EXISTS (SELECT 1 FROM profiles WHERE ...))
--
-- but `profiles` is not created until 20260826_rls_admin_hardening.sql,
-- five migrations later. Applying the set in order fails on the very
-- first file with: ERROR: relation "profiles" does not exist.
--
-- Live databases do not show this because profiles was created by hand
-- ahead of the migrations. This file puts the dependency where the
-- ordering needs it: extensions and the auth foundation first.
--
-- The table definition is identical to the one in
-- 20260826_rls_admin_hardening.sql section 1, which remains the
-- authoritative source for the auth model (its helper functions, the
-- backfill and the policies all still run there). `create table if not
-- exists` plus `add column if not exists` means whichever file runs
-- first wins and the other is a no-op. Nothing is dropped or reshaped.
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  is_admin boolean not null default false,
  role text not null default 'member',
  created_at timestamp with time zone default now()
);

-- Same tolerance as 20260826: a live profiles table may predate one or
-- other of these columns.
alter table profiles add column if not exists is_admin boolean not null default false;
alter table profiles add column if not exists role text not null default 'member';
alter table profiles add column if not exists created_at timestamp with time zone default now();

alter table profiles enable row level security;

-- No policies here on purpose. 20260826_rls_admin_hardening.sql section 3
-- owns the profiles policies and 20260828_tft_permissions_rls.sql
-- tightens them. RLS enabled with no policy denies all access, which is
-- the safe state for the window between this file and those.
