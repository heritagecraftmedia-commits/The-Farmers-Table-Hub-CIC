-- ============================================================
-- Tables the app uses that no migration ever created
-- The Farmers Table Hub CIC
--
-- Run AFTER 20260826_rls_admin_hardening.sql. Safe to re-run.
--
-- WHY THIS EXISTS
-- ---------------
-- Eight tables were referenced from application code but defined nowhere in
-- this repo. They exist only in the live Supabase project, if at all, which
-- means their columns and — more importantly — their RLS policies were
-- invisible to code review and could not be recreated from source.
--
-- Column definitions below are derived from the exact select/insert calls in
-- src/, so they match what the code actually reads and writes. Every statement
-- is `if not exists` / `add column if not exists`, so running this against a
-- project where some of these already exist adds only what is missing and
-- changes no existing data.
--
-- IMPORTANT: `create table if not exists` will NOT reshape a table that
-- already exists with different columns. After running this, compare against
-- the live schema and reconcile anything that differs.
-- ============================================================


-- ------------------------------------------------------------
-- 1. notes — the founder/staff private notepad (src/pages/Notes.tsx)
-- ------------------------------------------------------------

create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'New Note',
  content text not null default '',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table notes add column if not exists updated_at timestamp with time zone default now();
alter table notes enable row level security;

-- Notes are internal working documents. Staff-level, never public.
drop policy if exists "staff_manage_notes" on notes;
create policy "staff_manage_notes" on notes
  for all using (public.is_radio_staff()) with check (public.is_radio_staff());

-- Notes.tsx orders by updated_at and relies on it moving on every edit.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists notes_touch_updated_at on notes;
create trigger notes_touch_updated_at
  before update on notes
  for each row execute procedure public.touch_updated_at();


-- ------------------------------------------------------------
-- 2. applications — maker / volunteer applications (src/pages/Apply.tsx)
-- ------------------------------------------------------------

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  business_name text,
  type text,
  description text,
  location text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamp with time zone default now()
);

alter table applications enable row level security;

-- Anyone may apply. Nobody but an admin may read applications back — they
-- carry names and email addresses.
drop policy if exists "public_submit_application" on applications;
create policy "public_submit_application" on applications
  for insert with check (status = 'pending');

drop policy if exists "admin_manage_applications" on applications;
create policy "admin_manage_applications" on applications
  for all using (public.is_admin()) with check (public.is_admin());


-- ------------------------------------------------------------
-- 3. feedback_book_responses — the Feedback Book (src/pages/Feedback.tsx)
-- ------------------------------------------------------------

create table if not exists feedback_book_responses (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  overall text,
  what_works text,
  what_doesnt_work text,
  whats_missing text,
  would_use text,
  who_benefits text,
  support_condition text,
  money_thoughts text,
  community_impact text,
  change_one_thing text,
  add_one_thing text,
  anything_else text,
  created_at timestamp with time zone default now()
);

alter table feedback_book_responses enable row level security;

-- Same shape as applications: open to submit, admin-only to read. Feedback is
-- given in confidence and may carry a name and email.
drop policy if exists "public_submit_feedback" on feedback_book_responses;
create policy "public_submit_feedback" on feedback_book_responses
  for insert with check (true);

drop policy if exists "admin_read_feedback" on feedback_book_responses;
create policy "admin_read_feedback" on feedback_book_responses
  for all using (public.is_admin()) with check (public.is_admin());


-- ------------------------------------------------------------
-- 4. pending_listings — AI discovery approval queue (hubService)
-- ------------------------------------------------------------
-- Holds scraped business data awaiting human review. Admin-only, like the rest
-- of the lead pipeline: this is pre-consent data on real people.

create table if not exists pending_listings (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  category text,
  location text,
  website text,
  instagram text,
  description text,
  source_url text,
  source_platform text default 'Manual',
  contact_email text,
  contact_name text,
  ai_confidence_score integer,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  discovered_at timestamp with time zone default now(),
  reviewed_at timestamp with time zone
);

alter table pending_listings enable row level security;

drop policy if exists "admin_only_pending_listings" on pending_listings;
create policy "admin_only_pending_listings" on pending_listings
  for all using (public.is_admin()) with check (public.is_admin());


-- ------------------------------------------------------------
-- 5. playlists — legacy flat radio playlist (hubService)
-- ------------------------------------------------------------
-- Distinct from radio_playlists / radio_playlist_items in the radio_v1
-- migration. The Dashboard radio tab still reads this one.

create table if not exists playlists (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text,
  duration_seconds integer not null default 0,
  category text,
  file_url text,
  order_index integer not null default 0,
  is_active boolean not null default true,
  created_at timestamp with time zone default now()
);

alter table playlists enable row level security;

create index if not exists playlists_order_idx on playlists(order_index);

drop policy if exists "public_read_active_playlist" on playlists;
create policy "public_read_active_playlist" on playlists
  for select using (is_active = true);

drop policy if exists "radio_staff_manage_playlists_legacy" on playlists;
create policy "radio_staff_manage_playlists_legacy" on playlists
  for all using (public.is_radio_staff()) with check (public.is_radio_staff());


-- ------------------------------------------------------------
-- 6. sponsor_rotations — radio sponsors (hubService)
-- ------------------------------------------------------------

create table if not exists sponsor_rotations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  product_desc text,
  contact_name text,
  contact_email text,
  package text,
  reads_per_show integer not null default 1,
  ad_script text,
  renewal_date date,
  status text not null default 'active' check (status in ('active', 'paused', 'expired')),
  created_at timestamp with time zone default now()
);

alter table sponsor_rotations enable row level security;

-- Sponsor contact details are not public. Same decision as radio_sponsors in
-- the hardening migration: staff only, with a public view for the name.
drop policy if exists "radio_staff_manage_sponsor_rotations" on sponsor_rotations;
create policy "radio_staff_manage_sponsor_rotations" on sponsor_rotations
  for all using (public.is_radio_staff()) with check (public.is_radio_staff());

create or replace view public_sponsor_rotations as
  select id, name, product_desc, package, status
  from sponsor_rotations
  where status = 'active';

grant select on public_sponsor_rotations to anon, authenticated;


-- ------------------------------------------------------------
-- 7. ad_schedules — advert slots (hubService)
-- ------------------------------------------------------------

create table if not exists ad_schedules (
  id uuid primary key default gen_random_uuid(),
  sponsor_id uuid references sponsor_rotations(id) on delete cascade,
  show_day text,
  time_slot text,
  duration_seconds integer not null default 30,
  status text not null default 'scheduled' check (status in ('scheduled', 'played', 'skipped')),
  played_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

alter table ad_schedules enable row level security;

create index if not exists ad_schedules_slot_idx on ad_schedules(show_day, time_slot);

-- getAdSchedules joins sponsor_rotations(name), so a reader needs access to
-- both. Staff only, which the join already implies.
drop policy if exists "radio_staff_manage_ad_schedules" on ad_schedules;
create policy "radio_staff_manage_ad_schedules" on ad_schedules
  for all using (public.is_radio_staff()) with check (public.is_radio_staff());


-- ------------------------------------------------------------
-- 8. social_posts — AI-drafted social posts (hubService)
-- ------------------------------------------------------------
-- Human-in-the-loop: drafts land as 'draft' and a human moves them to
-- 'approved'. Nothing here posts anywhere by itself, and the check constraint
-- keeps 'posted' from being set on insert.

create table if not exists social_posts (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  platform text,
  source_type text,
  source_id uuid,
  status text not null default 'draft' check (status in ('draft', 'approved', 'posted')),
  scheduled_at timestamp with time zone,
  posted_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

alter table social_posts enable row level security;

drop policy if exists "admin_manage_social_posts" on social_posts;
create policy "admin_manage_social_posts" on social_posts
  for all using (public.is_admin()) with check (public.is_admin());


-- ============================================================
-- AFTER RUNNING THIS FILE
-- ============================================================
-- Compare against the live schema and reconcile any column that differs —
-- `create table if not exists` cannot reshape a table that already exists:
--
--   select table_name, column_name, data_type
--   from information_schema.columns
--   where table_schema = 'public'
--     and table_name in ('notes','applications','feedback_book_responses',
--                        'pending_listings','playlists','sponsor_rotations',
--                        'ad_schedules','social_posts')
--   order by table_name, ordinal_position;
--
-- And confirm no table is left with RLS enabled but no policy, which denies
-- everything including admins:
--
--   select c.relname
--   from pg_class c
--   join pg_namespace n on n.oid = c.relnamespace
--   where n.nspname = 'public' and c.relrowsecurity
--     and not exists (select 1 from pg_policy p where p.polrelid = c.oid);
-- ============================================================
