-- ============================================================
-- Base schema tables (from supabase-schema.sql)
-- ============================================================
-- WHY THIS FILE EXISTS
--
-- The repo-root `supabase-schema.sql` is a copy-paste-into-the-SQL-editor
-- file. It was never part of the migration sequence, so the eleven tables
-- it defines exist in the live database but in no migration. Every later
-- migration assumes them:
--
--   20260826_rls_admin_hardening.sql   raw_leads, qualified_leads,
--                                      enriched_leads, outreach_log,
--                                      claimed_vendors, staff,
--                                      founder_jobs, maker_stories,
--                                      system_controls
--   20260827_untracked_tables.sql      staff
--   20260828_tft_permissions_rls.sql   all of the above
--
-- Applying supabase/migrations to a fresh database therefore failed at
-- 20260826 with: ERROR: relation "raw_leads" does not exist.
--
-- Every definition below is copied verbatim from supabase-schema.sql
-- sections 1-5 and 7, 9-11. Nothing here is new or redesigned — this is
-- the existing production shape moved into the migration sequence.
--
-- `events`, `radio_shows` and `event_makers` are NOT here: they are in
-- 20260318_core_tables_events_radio_shows.sql, which must follow the
-- directory work. `profiles` is in 20260316_extensions_auth_profiles.sql.
--
-- RLS is enabled to match supabase-schema.sql. The blanket
-- "authenticated_full_access" policies it also creates are deliberately
-- NOT reproduced — 20260826 and 20260828 replace them with the real
-- role model, and RLS-with-no-policy denies all access in the meantime.
-- ============================================================

create extension if not exists pgcrypto;

-- 1. RAW LEADS (AI Discovery Agent output)
create table if not exists raw_leads (
  id uuid primary key default gen_random_uuid(),
  source_platform text,
  profile_url text,
  display_name text,
  bio_text text,
  location_hint text,
  category_hint text,
  discovered_at timestamp with time zone default now()
);

-- 2. QUALIFIED LEADS (AI Qualification Agent output)
create table if not exists qualified_leads (
  id uuid primary key default gen_random_uuid(),
  raw_lead_id uuid references raw_leads(id) on delete cascade,
  artisan_score integer check (artisan_score between 1 and 5),
  qualification_notes text,
  qualified boolean default false,
  reviewed boolean default false,
  created_at timestamp with time zone default now()
);

-- 3. ENRICHED LEADS (AI Enrichment Agent output — draft directory listings)
create table if not exists enriched_leads (
  id uuid primary key default gen_random_uuid(),
  vendor_name text,
  vendor_type text,
  craft_category text,
  location text,
  website text,
  public_email text,
  social_links jsonb default '{}',
  summary text,
  listing_tier text default 'free',
  status text default 'draft',
  created_at timestamp with time zone default now()
);

-- 4. OUTREACH LOG (AI Outreach Agent drafts — never auto-sent)
create table if not exists outreach_log (
  id uuid primary key default gen_random_uuid(),
  enriched_lead_id uuid references enriched_leads(id) on delete cascade,
  contact_method text,
  message_sent text,
  sent_at timestamp with time zone,
  response text
);

-- 5. CLAIMED VENDORS (Makers who claimed their listing)
create table if not exists claimed_vendors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  enriched_lead_id uuid references enriched_leads(id),
  vendor_name text,
  craft_category text,
  location text,
  bio text,
  website text,
  social_links jsonb default '{}',
  listing_tier text default 'free',
  featured_until timestamp with time zone,
  approved boolean default false,
  published boolean default false,
  claimed_at timestamp with time zone default now()
);

-- 7. STAFF
create table if not exists staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  email text,
  status text default 'active',
  joined_at timestamp with time zone default now()
);

-- 9. FOUNDER JOBS
create table if not exists founder_jobs (
  id uuid primary key default gen_random_uuid(),
  task text not null,
  priority text default 'Medium',
  status text default 'pending',
  due_date text
);

-- 10. MAKER STORIES (3-question format)
create table if not exists maker_stories (
  id uuid primary key default gen_random_uuid(),
  maker_name text not null,
  craft text,
  image text,
  q1 text, -- How did you learn your craft?
  q2 text, -- What tools can't you work without?
  q3 text, -- What does a good making day look like?
  published boolean default false,
  created_at timestamp with time zone default now()
);

-- 11. SYSTEM CONTROLS (agent toggles)
create table if not exists system_controls (
  key text primary key,
  value boolean default false,
  updated_at timestamp with time zone default now()
);

-- Operational feature flags, not content. Copied from supabase-schema.sql
-- with the same values and the same on-conflict guard.
insert into system_controls (key, value) values
  ('discovery_enabled', true),
  ('qualification_enabled', true),
  ('enrichment_enabled', false),
  ('outreach_enabled', false),
  ('maintenance_mode', false)
on conflict (key) do nothing;

alter table raw_leads       enable row level security;
alter table qualified_leads enable row level security;
alter table enriched_leads  enable row level security;
alter table outreach_log    enable row level security;
alter table claimed_vendors enable row level security;
alter table staff           enable row level security;
alter table founder_jobs    enable row level security;
alter table maker_stories   enable row level security;
alter table system_controls enable row level security;
