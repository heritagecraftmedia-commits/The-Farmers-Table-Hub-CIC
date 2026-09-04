-- ============================================================
-- Core tables: events + radio_shows
-- ============================================================
-- WHY THIS FILE EXISTS
--
-- `events` and `radio_shows` were only ever defined in the repo-root
-- `supabase-schema.sql`, which is applied by hand in the Supabase SQL
-- editor and is NOT part of the migration sequence. Every environment
-- built from `supabase/migrations` alone therefore lacks both tables,
-- and these foreign keys fail:
--
--   20260825_radio_v1.sql  radio_ad_slots.show_id    -> radio_shows(id)
--                          radio_broadcasts.show_id  -> radio_shows(id)
--                          radio_broadcasts.event_id -> events(id)
--   20260829_radio_v3_...  ~8 further FKs to both tables
--
-- The column definitions below are copied verbatim from
-- `supabase-schema.sql` sections 6 and 8. They are NOT a new design:
-- they are the existing production shape, moved into the migration
-- sequence so a fresh database matches a live one. Confirmed against
-- the application code:
--
--   events      hubService.addEvent inserts exactly title, description,
--               start_date, end_date, location, venue, website_url,
--               craft_type, source, approved.
--               stationService.getPromotableEvents selects
--               id, title, start_date, venue, location, approved.
--   radio_shows radioService.getShows reads id, title, host, schedule,
--               status, last_broadcast.
--
-- `create table if not exists` makes this a no-op on any database that
-- already ran supabase-schema.sql. Nothing is dropped or overwritten.
-- ============================================================

-- ------------------------------------------------------------
-- events (What's On noticeboard) — supabase-schema.sql §6
-- ------------------------------------------------------------

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  location text,
  venue text,
  website_url text,
  craft_type text,
  source text default 'Manual',
  approved boolean default false,
  created_at timestamp with time zone default now()
);

alter table events enable row level security;

-- Same two policies as supabase-schema.sql. No later migration defines
-- policies for `events`, so they are reproduced here rather than left to
-- a file that does not exist.
drop policy if exists "public_events" on events;
create policy "public_events" on events
  for select using (approved = true);

drop policy if exists "admin_events" on events;
create policy "admin_events" on events
  for all using (auth.role() = 'authenticated');

create index if not exists events_start_date_idx on events (start_date);
create index if not exists events_approved_idx   on events (approved) where approved = true;


-- ------------------------------------------------------------
-- radio_shows (programme record) — supabase-schema.sql §8
-- ------------------------------------------------------------
-- 20260829_radio_v3_station.sql extends this table with the station
-- build's columns (slug, presenter_id, content_status, ...) and widens
-- the status check. Only the base shape belongs here.

create table if not exists radio_shows (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  host text,
  schedule text,
  status text default 'planned',
  last_broadcast text
);

alter table radio_shows enable row level security;

-- DELIBERATE OMISSION — supabase-schema.sql line 168 also creates
--   create policy "authenticated_full_access" on radio_shows
--     for all using (auth.role() = 'authenticated');
-- which lets any signed-in listener create and edit programmes. It is
-- not reproduced here. 20260828_tft_permissions_rls.sql and
-- 20260829_radio_v3_station.sql both supply the real policies; until
-- they run, RLS-enabled-with-no-policy denies all access, which is the
-- safe failure mode. V3 still drops the policy by name so live
-- databases that already carry it are cleaned up.


-- ------------------------------------------------------------
-- event_makers (which makers appear at which event)
-- ------------------------------------------------------------
-- supabase-schema.sql, after §11. Lives here rather than in
-- 20260315_base_schema_tables.sql because it foreign-keys events.
-- Read and written by hubService.getEventMakers/linkMakerToEvent and
-- by src/pages/Members.tsx. 20260828_tft_permissions_rls.sql defines
-- its policy, so only the base public-read one is reproduced here.

create table if not exists event_makers (
  event_id uuid references events(id) on delete cascade,
  maker_id uuid, -- claimed_vendors, enriched_leads or directory_listings
  maker_name text, -- fallback display name
  primary key (event_id, maker_id)
);

alter table event_makers enable row level security;

drop policy if exists "public_read_event_makers" on event_makers;
create policy "public_read_event_makers" on event_makers
  for select using (true);
