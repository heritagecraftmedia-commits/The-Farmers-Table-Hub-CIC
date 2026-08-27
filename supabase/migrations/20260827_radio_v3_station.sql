-- ============================================================
-- Farmers Table Hub Community Radio — V3 Station Build
-- ============================================================
-- Extends the existing radio V1 / V2 schema. Safe to run after
-- 20260825_radio_v1.sql and 20260825_radio_v2_alignment.sql.
--
-- DESIGN NOTES
--  * Nothing fictional is seeded. No presenters, businesses, sponsors,
--    advertisers, musicians, events or announcements are invented here.
--    The only seeded row is the station's own real identity.
--  * Existing tables are EXTENDED, not duplicated. radio_shows remains
--    the programme record; radio_media remains the single content library.
--    The spec names radio_programmes / radio_tracks / radio_jingles /
--    radio_adverts / radio_special_broadcasts — those are provided as
--    security-invoker VIEWS so the naming exists without duplicate data.
--  * No credentials live in this schema. Live365 (or any provider) API
--    secrets belong in Supabase project secrets / Edge Function env,
--    never in a table the anon key can reach.
-- ============================================================

-- ------------------------------------------------------------
-- 0. Shared enum + helpers
-- ------------------------------------------------------------

-- Content lifecycle shared by every piece of radio content (spec §28).
do $$
begin
  if not exists (select 1 from pg_type where typname = 'radio_status') then
    create type radio_status as enum (
      'draft', 'pending', 'approved', 'scheduled', 'live',
      'published', 'archived', 'expired', 'rejected'
    );
  end if;
end
$$;

-- Single source of truth for "is this user allowed to run the station?".
-- SECURITY DEFINER so RLS policies can call it without granting the
-- anon role any visibility of auth.users.
create or replace function radio_is_staff()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from auth.users u
    where u.id = auth.uid()
      and (u.raw_user_meta_data->>'role') in ('founder', 'radio_manager', 'staff')
  );
$$;

revoke all on function radio_is_staff() from public;
grant execute on function radio_is_staff() to authenticated, anon;

-- ------------------------------------------------------------
-- 1. Stations (spec §1, §30 multi-channel readiness)
-- ------------------------------------------------------------

create table if not exists radio_stations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  tagline text,
  description text,
  logo_url text,
  channel_type text not null default 'main'
    check (channel_type in ('main', 'specialist', 'podcast', 'event')),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The station's own identity. This is real supplied content, not demo data.
insert into radio_stations (slug, name, tagline, description, channel_type)
values (
  'farmers-table-hub-community-radio',
  'Farmers Table Hub Community Radio',
  'Connecting Communities · Celebrating Local Talent · Rooted in Rural Life',
  'Community radio for Farnham, Surrey, Hampshire and the surrounding rural communities, run by The Farmers Table Hub CIC.',
  'main'
)
on conflict (slug) do nothing;

-- ------------------------------------------------------------
-- 2. Station settings / streaming provider config (spec §2, §23, §27)
-- ------------------------------------------------------------
-- PUBLIC-SAFE FIELDS ONLY. Everything here is readable by anonymous
-- listeners because the player needs it. Never add an API key, password
-- or private endpoint to this table — use Supabase secrets instead.

create table if not exists radio_station_settings (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references radio_stations(id) on delete cascade,
  provider text not null default 'live365'
    check (provider in ('live365', 'icecast', 'shoutcast', 'radioking', 'azuracast', 'custom')),
  provider_station_id text,
  stream_url text,
  player_url text,
  metadata_url text,
  status_url text,
  listener_count_url text,
  fallback_artwork_url text,
  station_timezone text not null default 'Europe/London',
  metadata_poll_seconds integer not null default 20
    check (metadata_poll_seconds between 5 and 300),
  is_stream_enabled boolean not null default false,
  offline_message text,
  updated_at timestamptz not null default now(),
  unique (station_id)
);

comment on table radio_station_settings is
  'Public-safe streaming configuration only. Provider API credentials must live in Supabase secrets, never here.';

-- Config row for the station, with no stream connected yet.
insert into radio_station_settings (station_id, provider, is_stream_enabled, offline_message)
select s.id, 'live365', false,
       'Farmers Table Hub Community Radio is not on air yet. The live stream will appear here once it is connected.'
from radio_stations s
where s.slug = 'farmers-table-hub-community-radio'
on conflict (station_id) do nothing;

-- ------------------------------------------------------------
-- 3. Presenters (spec §8)
-- ------------------------------------------------------------

create table if not exists radio_presenters (
  id uuid primary key default gen_random_uuid(),
  station_id uuid references radio_stations(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  slug text not null unique,
  photo_url text,
  bio text,
  intro text,
  presenter_role text not null default 'presenter'
    check (presenter_role in (
      'presenter', 'producer', 'guest_presenter',
      'community_contributor', 'news', 'music_specialist'
    )),
  social_links jsonb not null default '{}'::jsonb,
  contact_email text,
  availability text,
  status radio_status not null default 'draft',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists radio_presenters_status_idx on radio_presenters(status, is_active);
create index if not exists radio_presenters_user_idx on radio_presenters(user_id);

-- Presenters may edit their own presenter record and their own episodes.
create or replace function radio_is_presenter_of(p_presenter_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from radio_presenters rp
    where rp.id = p_presenter_id
      and rp.user_id = auth.uid()
  );
$$;

revoke all on function radio_is_presenter_of(uuid) from public;
grant execute on function radio_is_presenter_of(uuid) to authenticated;

-- ------------------------------------------------------------
-- 4. Programmes — extends the existing radio_shows table (spec §4)
-- ------------------------------------------------------------
-- radio_shows already exists and is read by radioService/hubService.
-- It is extended in place rather than replaced, so nothing breaks.

alter table radio_shows add column if not exists station_id uuid references radio_stations(id) on delete set null;
alter table radio_shows add column if not exists slug text;
alter table radio_shows add column if not exists description text;
alter table radio_shows add column if not exists intro text;
alter table radio_shows add column if not exists presenter_id uuid references radio_presenters(id) on delete set null;
alter table radio_shows add column if not exists category text;
alter table radio_shows add column if not exists image_url text;
alter table radio_shows add column if not exists colour text;
alter table radio_shows add column if not exists icon text;
alter table radio_shows add column if not exists frequency text;
alter table radio_shows add column if not exists archive_enabled boolean not null default true;
alter table radio_shows add column if not exists is_featured boolean not null default false;
alter table radio_shows add column if not exists website_url text;
alter table radio_shows add column if not exists social_links jsonb not null default '{}'::jsonb;
alter table radio_shows add column if not exists content_status radio_status not null default 'draft';
alter table radio_shows add column if not exists sort_order integer not null default 0;
alter table radio_shows add column if not exists created_at timestamptz not null default now();
alter table radio_shows add column if not exists updated_at timestamptz not null default now();

-- radio_shows.status has always meant "how is this programme broadcast",
-- and hubService.updateShowStatus writes it. Keep that meaning, widen the
-- allowed values, and use content_status for the publication lifecycle.
alter table radio_shows drop constraint if exists radio_shows_status_check;
alter table radio_shows add constraint radio_shows_status_check
  check (status in ('planned', 'live', 'pre-recorded', 'automated'));

alter table radio_shows drop constraint if exists radio_shows_frequency_check;
alter table radio_shows add constraint radio_shows_frequency_check
  check (frequency is null or frequency in ('one-off', 'daily', 'weekdays', 'weekends', 'weekly', 'fortnightly', 'monthly', 'special'));

create unique index if not exists radio_shows_slug_idx on radio_shows(slug) where slug is not null;
create index if not exists radio_shows_presenter_idx on radio_shows(presenter_id);
create index if not exists radio_shows_content_status_idx on radio_shows(content_status);
create index if not exists radio_shows_featured_idx on radio_shows(is_featured) where is_featured = true;

-- Co-presenters (spec §4 "Co-presenters").
create table if not exists radio_programme_presenters (
  programme_id uuid not null references radio_shows(id) on delete cascade,
  presenter_id uuid not null references radio_presenters(id) on delete cascade,
  presenter_role text not null default 'co-presenter',
  sort_order integer not null default 0,
  primary key (programme_id, presenter_id)
);

-- Spec-named read alias. Same rows, no duplicated data.
create or replace view radio_programmes
with (security_invoker = true) as
  select * from radio_shows;

-- ------------------------------------------------------------
-- 5. Schedule engine (spec §4, §5, §6)
-- ------------------------------------------------------------
-- A rule-based schedule, not a static timetable. Recurring rules plus
-- dated overrides; the highest priority active rule for a slot wins.

create table if not exists radio_schedule (
  id uuid primary key default gen_random_uuid(),
  station_id uuid references radio_stations(id) on delete cascade,
  programme_id uuid references radio_shows(id) on delete cascade,
  schedule_type text not null default 'regular'
    check (schedule_type in ('regular', 'special', 'bank_holiday', 'christmas', 'emergency')),
  repeat_pattern text not null default 'weekly'
    check (repeat_pattern in ('once', 'daily', 'weekdays', 'weekends', 'weekly', 'fortnightly', 'monthly')),
  day_of_week integer check (day_of_week between 0 and 6),   -- 0 = Sunday
  week_of_month integer check (week_of_month between 1 and 5),
  specific_date date,                                        -- for repeat_pattern = 'once'
  start_time time not null,
  end_time time not null,
  starts_on date,                                            -- validity window
  ends_on date,
  priority integer not null default 0,                       -- higher overrides lower
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- a one-off needs a date; a weekly/fortnightly rule needs a weekday
  constraint radio_schedule_shape_check check (
    (repeat_pattern = 'once' and specific_date is not null)
    or (repeat_pattern in ('weekly', 'fortnightly') and day_of_week is not null)
    or (repeat_pattern = 'monthly' and day_of_week is not null and week_of_month is not null)
    or (repeat_pattern in ('daily', 'weekdays', 'weekends'))
  )
);

create index if not exists radio_schedule_day_idx on radio_schedule(day_of_week, start_time) where is_active;
create index if not exists radio_schedule_date_idx on radio_schedule(specific_date) where specific_date is not null;
create index if not exists radio_schedule_programme_idx on radio_schedule(programme_id);

-- ------------------------------------------------------------
-- 6. Special broadcasts (spec §18)
-- ------------------------------------------------------------
-- radio_broadcasts already exists as the concrete broadcast instance.
-- Extend it with override semantics rather than adding a parallel table.

alter table radio_broadcasts add column if not exists station_id uuid references radio_stations(id) on delete set null;
alter table radio_broadcasts add column if not exists description text;
alter table radio_broadcasts add column if not exists overrides_schedule boolean not null default false;
alter table radio_broadcasts add column if not exists priority integer not null default 100;
alter table radio_broadcasts add column if not exists presenter_id uuid references radio_presenters(id) on delete set null;
alter table radio_broadcasts add column if not exists image_url text;

alter table radio_broadcasts drop constraint if exists radio_broadcasts_broadcast_type_check;
alter table radio_broadcasts add constraint radio_broadcasts_broadcast_type_check
  check (broadcast_type in (
    'scheduled', 'live', 'outside', 'market', 'festival', 'agricultural_show',
    'christmas', 'charity', 'election', 'emergency', 'seasonal', 'special'
  ));

create index if not exists radio_broadcasts_override_idx
  on radio_broadcasts(starts_at, ends_at) where overrides_schedule = true;

-- Spec-named read alias for the override subset.
create or replace view radio_special_broadcasts
with (security_invoker = true) as
  select * from radio_broadcasts where overrides_schedule = true;

-- ------------------------------------------------------------
-- 7. Episodes / Listen Again (spec §9, §19)
-- ------------------------------------------------------------

create table if not exists radio_episodes (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references radio_shows(id) on delete cascade,
  presenter_id uuid references radio_presenters(id) on delete set null,
  media_id uuid references radio_media(id) on delete set null,
  broadcast_id uuid references radio_broadcasts(id) on delete set null,
  title text not null,
  slug text,
  description text,
  broadcast_date date,
  duration_seconds integer not null default 0,
  audio_url text,
  artwork_url text,
  transcript text,
  tags text[] not null default '{}',
  episode_category text not null default 'episode'
    check (episode_category in ('episode', 'interview', 'community_feature', 'special_broadcast')),
  is_downloadable boolean not null default false,
  status radio_status not null default 'draft',
  play_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists radio_episodes_slug_idx on radio_episodes(slug) where slug is not null;
create index if not exists radio_episodes_programme_idx on radio_episodes(programme_id, broadcast_date desc);
create index if not exists radio_episodes_status_idx on radio_episodes(status);
create index if not exists radio_episodes_category_idx on radio_episodes(episode_category);

-- ------------------------------------------------------------
-- 8. Content library — extends radio_media (spec §10, §11)
-- ------------------------------------------------------------
-- One library for music, imaging, adverts and features. radio_tracks and
-- radio_jingles are views over it, so there is no duplicate content store.

alter table radio_media add column if not exists station_id uuid references radio_stations(id) on delete set null;
alter table radio_media add column if not exists album text;
alter table radio_media add column if not exists genre text;
alter table radio_media add column if not exists release_year integer;
alter table radio_media add column if not exists artwork_url text;
alter table radio_media add column if not exists is_local_artist boolean not null default false;
alter table radio_media add column if not exists imaging_type text;
alter table radio_media add column if not exists programme_id uuid references radio_shows(id) on delete set null;
alter table radio_media add column if not exists licence_status text not null default 'unknown';
alter table radio_media add column if not exists licence_notes text;
alter table radio_media add column if not exists content_status radio_status not null default 'draft';
alter table radio_media add column if not exists notes text;
alter table radio_media add column if not exists updated_at timestamptz not null default now();

-- Music is NEVER assumed cleared for broadcast. 'unknown' is the default and
-- only 'cleared' items may be treated as broadcastable (spec §10).
alter table radio_media drop constraint if exists radio_media_licence_status_check;
alter table radio_media add constraint radio_media_licence_status_check
  check (licence_status in ('unknown', 'pending_check', 'cleared', 'restricted', 'rejected'));

-- Station imaging categories (spec §11).
alter table radio_media drop constraint if exists radio_media_imaging_type_check;
alter table radio_media add constraint radio_media_imaging_type_check
  check (imaging_type is null or imaging_type in (
    'station_id', 'jingle', 'sweeper', 'presenter_intro', 'programme_intro',
    'programme_outro', 'news_intro', 'weather_intro', 'community_intro',
    'sponsor_ident', 'advert_intro', 'emergency_announcement', 'seasonal_ident'
  ));

-- Music genre buckets (spec §10). Free text is allowed for anything else.
create index if not exists radio_media_genre_idx on radio_media(genre);
create index if not exists radio_media_licence_idx on radio_media(licence_status);
create index if not exists radio_media_imaging_idx on radio_media(imaging_type) where imaging_type is not null;
create index if not exists radio_media_local_artist_idx on radio_media(is_local_artist) where is_local_artist = true;

create or replace view radio_tracks
with (security_invoker = true) as
  select * from radio_media where media_type = 'music';

create or replace view radio_jingles
with (security_invoker = true) as
  select * from radio_media where media_type = 'jingle';

-- Imaging assigned to a programme or a schedule slot (spec §11).
create table if not exists radio_imaging_assignments (
  id uuid primary key default gen_random_uuid(),
  media_id uuid not null references radio_media(id) on delete cascade,
  programme_id uuid references radio_shows(id) on delete cascade,
  schedule_id uuid references radio_schedule(id) on delete cascade,
  slot_position text not null default 'intro'
    check (slot_position in ('intro', 'outro', 'bed', 'sweeper', 'ident')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint radio_imaging_target_check check (
    programme_id is not null or schedule_id is not null
  )
);

create index if not exists radio_imaging_programme_idx on radio_imaging_assignments(programme_id);

-- Playlists gain a programme link so the automation chain is complete:
-- Programme -> Schedule -> Playlist -> items (spec §22).
alter table radio_playlists add column if not exists programme_id uuid references radio_shows(id) on delete set null;
alter table radio_playlists add column if not exists station_id uuid references radio_stations(id) on delete set null;

-- ------------------------------------------------------------
-- 9. Advertising — extends radio_sponsors (spec §12)
-- ------------------------------------------------------------
-- radio_sponsors already holds the advertising client record and links to
-- directory_listings. Extended here; radio_adverts is a view over it.

alter table radio_sponsors add column if not exists station_id uuid references radio_stations(id) on delete set null;
alter table radio_sponsors add column if not exists website text;
alter table radio_sponsors add column if not exists category text;
alter table radio_sponsors add column if not exists start_date date;
alter table radio_sponsors add column if not exists end_date date;
alter table radio_sponsors add column if not exists artwork_url text;
alter table radio_sponsors add column if not exists notes text;
alter table radio_sponsors add column if not exists campaign_details text;
alter table radio_sponsors add column if not exists content_status radio_status not null default 'draft';
alter table radio_sponsors add column if not exists updated_at timestamptz not null default now();

-- Widened placement types (spec §12).
alter table radio_sponsors drop constraint if exists radio_sponsors_package_check;
alter table radio_sponsors add constraint radio_sponsors_package_check
  check (package in (
    '10s', '15s', '20s', '30s', '60s',
    'programme_sponsorship', 'station_sponsorship', 'event_sponsorship',
    'community_announcement', 'sponsored_feature', 'sponsorship'
  ));

create index if not exists radio_sponsors_dates_idx on radio_sponsors(start_date, end_date);

create or replace view radio_adverts
with (security_invoker = true) as
  select * from radio_sponsors;

-- ------------------------------------------------------------
-- 10. Sponsorship placements (spec §13)
-- ------------------------------------------------------------
-- A sponsor (radio_sponsors) can sponsor many different things. This is the
-- placement record, which is genuinely distinct from the client record.

create table if not exists radio_sponsorships (
  id uuid primary key default gen_random_uuid(),
  sponsor_id uuid not null references radio_sponsors(id) on delete cascade,
  programme_id uuid references radio_shows(id) on delete set null,
  broadcast_id uuid references radio_broadcasts(id) on delete set null,
  event_id uuid references events(id) on delete set null,
  sponsorship_type text not null default 'programme'
    check (sponsorship_type in (
      'programme', 'segment', 'community_feature', 'event',
      'outside_broadcast', 'special_broadcast', 'station_feature'
    )),
  package text,
  start_date date,
  end_date date,
  audio_url text,
  artwork_url text,
  status radio_status not null default 'draft',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists radio_sponsorships_sponsor_idx on radio_sponsorships(sponsor_id);
create index if not exists radio_sponsorships_programme_idx on radio_sponsorships(programme_id);

-- ------------------------------------------------------------
-- 11. Community announcements (spec §14)
-- ------------------------------------------------------------

create table if not exists radio_announcements (
  id uuid primary key default gen_random_uuid(),
  station_id uuid references radio_stations(id) on delete set null,
  title text not null,
  content text not null,
  organisation_name text,
  directory_listing_id uuid references directory_listings(id) on delete set null,
  event_id uuid references events(id) on delete set null,
  announcement_type text not null default 'notice'
    check (announcement_type in (
      'notice', 'charity', 'meeting', 'fundraiser', 'public_information',
      'volunteer', 'local_project', 'emergency'
    )),
  start_date date,
  end_date date,
  audio_url text,
  website text,
  contact_email text,
  contact_phone text,
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent')),
  status radio_status not null default 'draft',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists radio_announcements_active_idx on radio_announcements(status, is_active, start_date, end_date);
create index if not exists radio_announcements_priority_idx on radio_announcements(priority);

-- ------------------------------------------------------------
-- 12. Events integration (spec §15)
-- ------------------------------------------------------------
-- Links to the EXISTING events table. Event data is never copied.

create table if not exists radio_event_promotions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  programme_id uuid references radio_shows(id) on delete set null,
  promoted_from date,
  promoted_until date,
  priority integer not null default 0,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (event_id)
);

create index if not exists radio_event_promotions_active_idx on radio_event_promotions(is_active, promoted_until);

-- ------------------------------------------------------------
-- 13. Local information (spec §17)
-- ------------------------------------------------------------
-- Nothing is published unless a human has marked it verified.

create table if not exists radio_news (
  id uuid primary key default gen_random_uuid(),
  station_id uuid references radio_stations(id) on delete set null,
  title text not null,
  summary text,
  body text,
  category text not null default 'community'
    check (category in (
      'farnham', 'surrey', 'hampshire', 'rural', 'agriculture', 'food',
      'environment', 'heritage', 'community', 'local_business',
      'transport', 'weather', 'public_information'
    )),
  source_name text,
  source_url text,
  is_verified boolean not null default false,
  published_at timestamptz,
  status radio_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column radio_news.is_verified is
  'Must be set by a human against a named source. Unverified items are never publicly readable.';

create index if not exists radio_news_public_idx on radio_news(status, is_verified, published_at desc);

-- ------------------------------------------------------------
-- 14. Community submissions / moderation queue (spec §16)
-- ------------------------------------------------------------

create table if not exists radio_submissions (
  id uuid primary key default gen_random_uuid(),
  station_id uuid references radio_stations(id) on delete set null,
  submission_type text not null
    check (submission_type in ('music', 'announcement', 'event', 'programme_idea', 'presenter')),
  submitter_name text not null,
  submitter_email text not null,
  submitter_phone text,
  organisation text,
  title text not null,
  description text,
  local_connection text,
  file_url text,
  website text,
  preferred_date date,
  payload jsonb not null default '{}'::jsonb,
  status radio_status not null default 'pending',
  moderation_notes text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists radio_submissions_queue_idx on radio_submissions(status, created_at desc);
create index if not exists radio_submissions_type_idx on radio_submissions(submission_type);

-- ------------------------------------------------------------
-- 15. Row Level Security (spec §27)
-- ------------------------------------------------------------

alter table radio_stations            enable row level security;
alter table radio_station_settings    enable row level security;
alter table radio_presenters          enable row level security;
alter table radio_programme_presenters enable row level security;
alter table radio_schedule            enable row level security;
alter table radio_episodes            enable row level security;
alter table radio_imaging_assignments enable row level security;
alter table radio_sponsorships        enable row level security;
alter table radio_announcements       enable row level security;
alter table radio_event_promotions    enable row level security;
alter table radio_news                enable row level security;
alter table radio_submissions         enable row level security;

-- --- Stations: public reads active stations ---
drop policy if exists "radio_stations_public_read" on radio_stations;
create policy "radio_stations_public_read" on radio_stations
  for select using (is_active = true);

drop policy if exists "radio_stations_staff_manage" on radio_stations;
create policy "radio_stations_staff_manage" on radio_stations
  for all using (radio_is_staff()) with check (radio_is_staff());

-- --- Station settings: public reads (no secrets are stored here) ---
drop policy if exists "radio_station_settings_public_read" on radio_station_settings;
create policy "radio_station_settings_public_read" on radio_station_settings
  for select using (true);

drop policy if exists "radio_station_settings_staff_manage" on radio_station_settings;
create policy "radio_station_settings_staff_manage" on radio_station_settings
  for all using (radio_is_staff()) with check (radio_is_staff());

-- --- Presenters: public reads published + active only ---
drop policy if exists "radio_presenters_public_read" on radio_presenters;
create policy "radio_presenters_public_read" on radio_presenters
  for select using (status = 'published' and is_active = true);

drop policy if exists "radio_presenters_self_read" on radio_presenters;
create policy "radio_presenters_self_read" on radio_presenters
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "radio_presenters_self_update" on radio_presenters;
create policy "radio_presenters_self_update" on radio_presenters
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "radio_presenters_staff_manage" on radio_presenters;
create policy "radio_presenters_staff_manage" on radio_presenters
  for all using (radio_is_staff()) with check (radio_is_staff());

-- --- Co-presenter links follow the programme's visibility ---
drop policy if exists "radio_programme_presenters_public_read" on radio_programme_presenters;
create policy "radio_programme_presenters_public_read" on radio_programme_presenters
  for select using (
    exists (select 1 from radio_shows s where s.id = programme_id and s.content_status = 'published')
  );

drop policy if exists "radio_programme_presenters_staff_manage" on radio_programme_presenters;
create policy "radio_programme_presenters_staff_manage" on radio_programme_presenters
  for all using (radio_is_staff()) with check (radio_is_staff());

-- --- Schedule: public reads active rules for published programmes ---
drop policy if exists "radio_schedule_public_read" on radio_schedule;
create policy "radio_schedule_public_read" on radio_schedule
  for select using (
    is_active = true
    and (
      programme_id is null
      or exists (select 1 from radio_shows s where s.id = programme_id and s.content_status = 'published')
    )
  );

drop policy if exists "radio_schedule_staff_manage" on radio_schedule;
create policy "radio_schedule_staff_manage" on radio_schedule
  for all using (radio_is_staff()) with check (radio_is_staff());

-- --- Episodes: public reads published only ---
drop policy if exists "radio_episodes_public_read" on radio_episodes;
create policy "radio_episodes_public_read" on radio_episodes
  for select using (status = 'published');

drop policy if exists "radio_episodes_presenter_manage" on radio_episodes;
create policy "radio_episodes_presenter_manage" on radio_episodes
  for all to authenticated
  using (presenter_id is not null and radio_is_presenter_of(presenter_id))
  with check (presenter_id is not null and radio_is_presenter_of(presenter_id));

drop policy if exists "radio_episodes_staff_manage" on radio_episodes;
create policy "radio_episodes_staff_manage" on radio_episodes
  for all using (radio_is_staff()) with check (radio_is_staff());

-- --- Imaging assignments: staff only, not listener-facing ---
drop policy if exists "radio_imaging_staff_manage" on radio_imaging_assignments;
create policy "radio_imaging_staff_manage" on radio_imaging_assignments
  for all using (radio_is_staff()) with check (radio_is_staff());

-- --- Sponsorships: public reads only live placements ---
drop policy if exists "radio_sponsorships_public_read" on radio_sponsorships;
create policy "radio_sponsorships_public_read" on radio_sponsorships
  for select using (
    status in ('published', 'live')
    and (start_date is null or start_date <= current_date)
    and (end_date is null or end_date >= current_date)
  );

drop policy if exists "radio_sponsorships_staff_manage" on radio_sponsorships;
create policy "radio_sponsorships_staff_manage" on radio_sponsorships
  for all using (radio_is_staff()) with check (radio_is_staff());

-- --- Announcements: public reads published, active, in-window ---
drop policy if exists "radio_announcements_public_read" on radio_announcements;
create policy "radio_announcements_public_read" on radio_announcements
  for select using (
    status = 'published'
    and is_active = true
    and (start_date is null or start_date <= current_date)
    and (end_date is null or end_date >= current_date)
  );

drop policy if exists "radio_announcements_staff_manage" on radio_announcements;
create policy "radio_announcements_staff_manage" on radio_announcements
  for all using (radio_is_staff()) with check (radio_is_staff());

-- --- Event promotions: public reads active promos for approved events ---
drop policy if exists "radio_event_promotions_public_read" on radio_event_promotions;
create policy "radio_event_promotions_public_read" on radio_event_promotions
  for select using (
    is_active = true
    and exists (select 1 from events e where e.id = event_id and e.approved = true)
  );

drop policy if exists "radio_event_promotions_staff_manage" on radio_event_promotions;
create policy "radio_event_promotions_staff_manage" on radio_event_promotions
  for all using (radio_is_staff()) with check (radio_is_staff());

-- --- News: public reads verified + published only ---
drop policy if exists "radio_news_public_read" on radio_news;
create policy "radio_news_public_read" on radio_news
  for select using (status = 'published' and is_verified = true);

drop policy if exists "radio_news_staff_manage" on radio_news;
create policy "radio_news_staff_manage" on radio_news
  for all using (radio_is_staff()) with check (radio_is_staff());

-- --- Submissions: anyone may submit, nobody public may read ---
drop policy if exists "radio_submissions_public_insert" on radio_submissions;
create policy "radio_submissions_public_insert" on radio_submissions
  for insert with check (
    status = 'pending'
    and reviewed_by is null
    and reviewed_at is null
    and moderation_notes is null
  );

drop policy if exists "radio_submissions_staff_manage" on radio_submissions;
create policy "radio_submissions_staff_manage" on radio_submissions
  for all using (radio_is_staff()) with check (radio_is_staff());

-- ------------------------------------------------------------
-- 16. Repair and tighten the earlier radio policies
-- ------------------------------------------------------------
-- Two real defects are fixed here.
--
-- (a) The V1 staff policies inline `select ... from auth.users`. They are
--     declared FOR ALL, so PostgreSQL evaluates them on ANONYMOUS SELECTs
--     as well -- and anon has no grant on auth.users, so the public radio
--     page fails with "permission denied for table users". Every one of
--     them is replaced with radio_is_staff(), which is SECURITY DEFINER
--     and therefore needs no grant on auth.users.
--
-- (b) radio_shows was covered only by the base schema's
--     "authenticated_full_access" policy (auth.role() = 'authenticated'),
--     which let ANY signed-in listener create and edit programmes.
--     Spec §27 requires programme management to be staff-only.

-- (a) Replace the auth.users-inlining V1 policies.
drop policy if exists "Radio staff manage radio playlists" on radio_playlists;
create policy "radio_playlists_staff_manage" on radio_playlists
  for all using (radio_is_staff()) with check (radio_is_staff());

drop policy if exists "Radio staff manage radio media" on radio_media;
create policy "radio_media_staff_manage" on radio_media
  for all using (radio_is_staff()) with check (radio_is_staff());

drop policy if exists "Radio staff manage playlist items" on radio_playlist_items;
create policy "radio_playlist_items_staff_manage" on radio_playlist_items
  for all using (radio_is_staff()) with check (radio_is_staff());

drop policy if exists "Radio staff manage radio sponsors" on radio_sponsors;
create policy "radio_sponsors_staff_manage" on radio_sponsors
  for all using (radio_is_staff()) with check (radio_is_staff());

drop policy if exists "Radio staff manage ad slots" on radio_ad_slots;
create policy "radio_ad_slots_staff_manage" on radio_ad_slots
  for all using (radio_is_staff()) with check (radio_is_staff());

drop policy if exists "Radio staff manage broadcasts" on radio_broadcasts;
create policy "radio_broadcasts_staff_manage" on radio_broadcasts
  for all using (radio_is_staff()) with check (radio_is_staff());

-- radio_events (from 20260317_radio_events.sql) has the same shape.
-- Guarded, because that migration may not have been applied yet.
do $$
begin
  if to_regclass('public.radio_events') is not null then
    drop policy if exists "Founder can manage radio events" on radio_events;
    drop policy if exists "radio_events_staff_manage" on radio_events;
    create policy "radio_events_staff_manage" on radio_events
      for all using (radio_is_staff()) with check (radio_is_staff());
  end if;
end
$$;

-- (b) radio_shows: staff-only writes, public reads published programmes.
drop policy if exists "authenticated_full_access" on radio_shows;

drop policy if exists "radio_shows_public_read" on radio_shows;
create policy "radio_shows_public_read" on radio_shows
  for select using (content_status = 'published');

drop policy if exists "radio_shows_staff_manage" on radio_shows;
create policy "radio_shows_staff_manage" on radio_shows
  for all using (radio_is_staff()) with check (radio_is_staff());

-- Public users only need what a listener needs from the commercial tables.
drop policy if exists "Public can read active sponsors" on radio_sponsors;
create policy "radio_sponsors_public_read" on radio_sponsors
  for select using (
    status = 'active'
    and content_status = 'published'
    and (start_date is null or start_date <= current_date)
    and (end_date is null or end_date >= current_date)
  );

-- Ad slot scheduling is internal commercial data. Staff only.
drop policy if exists "Public can read scheduled ad slots" on radio_ad_slots;

-- Media is only publicly readable when published AND licence-cleared (§10).
drop policy if exists "Public can read active radio media" on radio_media;
create policy "radio_media_public_read" on radio_media
  for select using (
    is_active = true
    and content_status = 'published'
    and licence_status = 'cleared'
  );

-- ------------------------------------------------------------
-- 17. Storage buckets for radio audio and artwork
-- ------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('radio-audio', 'radio-audio', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('radio-images', 'radio-images', true)
on conflict (id) do nothing;

drop policy if exists "radio_audio_public_read" on storage.objects;
create policy "radio_audio_public_read" on storage.objects
  for select using (bucket_id in ('radio-audio', 'radio-images'));

drop policy if exists "radio_audio_staff_write" on storage.objects;
create policy "radio_audio_staff_write" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('radio-audio', 'radio-images') and radio_is_staff());

drop policy if exists "radio_audio_staff_update" on storage.objects;
create policy "radio_audio_staff_update" on storage.objects
  for update to authenticated
  using (bucket_id in ('radio-audio', 'radio-images') and radio_is_staff());

drop policy if exists "radio_audio_staff_delete" on storage.objects;
create policy "radio_audio_staff_delete" on storage.objects
  for delete to authenticated
  using (bucket_id in ('radio-audio', 'radio-images') and radio_is_staff());

-- ------------------------------------------------------------
-- 18. updated_at maintenance
-- ------------------------------------------------------------

create or replace function radio_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'radio_stations', 'radio_station_settings', 'radio_presenters', 'radio_shows',
    'radio_schedule', 'radio_episodes', 'radio_media', 'radio_sponsors',
    'radio_sponsorships', 'radio_announcements', 'radio_news'
  ]
  loop
    execute format('drop trigger if exists %I on %I', t || '_touch', t);
    execute format(
      'create trigger %I before update on %I for each row execute function radio_touch_updated_at()',
      t || '_touch', t
    );
  end loop;
end
$$;
