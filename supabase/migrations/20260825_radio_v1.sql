-- Farmers Table Radio V1
-- Real radio operating data. No demo businesses, advertisers, presenters or sponsors are seeded.

create table if not exists radio_playlists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  duration_seconds integer not null default 0,
  status text not null default 'draft' check (status in ('draft','ready','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists radio_media (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text,
  category text not null check (category in ('music','jingle','community','ad','emergency')),
  file_url text not null,
  duration_seconds integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists radio_playlist_items (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references radio_playlists(id) on delete cascade,
  media_id uuid not null references radio_media(id) on delete restrict,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  unique (playlist_id, order_index)
);

create table if not exists radio_sponsors (
  id uuid primary key default gen_random_uuid(),
  directory_listing_id uuid references directory_listings(id) on delete set null,
  business_name text not null,
  contact_name text,
  contact_email text,
  package text not null check (package in ('15s','30s','60s','sponsorship')),
  ad_script text,
  audio_url text,
  reads_per_show integer not null default 1,
  status text not null default 'active' check (status in ('active','paused','expired')),
  renewal_date date,
  created_at timestamptz not null default now()
);

create table if not exists radio_ad_slots (
  id uuid primary key default gen_random_uuid(),
  sponsor_id uuid not null references radio_sponsors(id) on delete cascade,
  show_id uuid references radio_shows(id) on delete set null,
  show_day text not null,
  time_slot time not null,
  duration_seconds integer not null default 30,
  status text not null default 'scheduled' check (status in ('scheduled','played','skipped')),
  played_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists radio_broadcasts (
  id uuid primary key default gen_random_uuid(),
  show_id uuid references radio_shows(id) on delete set null,
  playlist_id uuid references radio_playlists(id) on delete set null,
  title text not null,
  broadcast_type text not null default 'scheduled' check (broadcast_type in ('scheduled','live','outside')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  event_id uuid references events(id) on delete set null,
  status text not null default 'scheduled' check (status in ('scheduled','live','completed','cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists radio_playlist_items_playlist_idx on radio_playlist_items(playlist_id, order_index);
create index if not exists radio_ad_slots_time_idx on radio_ad_slots(show_day, time_slot);
create index if not exists radio_broadcasts_start_idx on radio_broadcasts(starts_at);

alter table radio_playlists enable row level security;
alter table radio_media enable row level security;
alter table radio_playlist_items enable row level security;
alter table radio_sponsors enable row level security;
alter table radio_ad_slots enable row level security;
alter table radio_broadcasts enable row level security;

-- Public users can read only active/public radio content.
create policy "Public can read ready radio playlists" on radio_playlists for select using (status = 'ready');
create policy "Public can read active radio media" on radio_media for select using (is_active = true);
create policy "Public can read playlist items" on radio_playlist_items for select using (exists (select 1 from radio_playlists p where p.id = playlist_id and p.status = 'ready'));
create policy "Public can read active sponsors" on radio_sponsors for select using (status = 'active');
create policy "Public can read scheduled ad slots" on radio_ad_slots for select using (status = 'scheduled');
create policy "Public can read scheduled broadcasts" on radio_broadcasts for select using (status in ('scheduled','live','completed'));

-- Radio staff can manage operational content. Founder retains full control.
create policy "Radio staff manage radio playlists" on radio_playlists for all using (
  exists (select 1 from auth.users where auth.users.id = auth.uid() and (auth.users.raw_user_meta_data->>'role') in ('founder','radio_manager','staff'))
) with check (
  exists (select 1 from auth.users where auth.users.id = auth.uid() and (auth.users.raw_user_meta_data->>'role') in ('founder','radio_manager','staff'))
);
create policy "Radio staff manage radio media" on radio_media for all using (
  exists (select 1 from auth.users where auth.users.id = auth.uid() and (auth.users.raw_user_meta_data->>'role') in ('founder','radio_manager','staff'))
) with check (
  exists (select 1 from auth.users where auth.users.id = auth.uid() and (auth.users.raw_user_meta_data->>'role') in ('founder','radio_manager','staff'))
);
create policy "Radio staff manage playlist items" on radio_playlist_items for all using (
  exists (select 1 from auth.users where auth.users.id = auth.uid() and (auth.users.raw_user_meta_data->>'role') in ('founder','radio_manager','staff'))
) with check (
  exists (select 1 from auth.users where auth.users.id = auth.uid() and (auth.users.raw_user_meta_data->>'role') in ('founder','radio_manager','staff'))
);
create policy "Radio staff manage radio sponsors" on radio_sponsors for all using (
  exists (select 1 from auth.users where auth.users.id = auth.uid() and (auth.users.raw_user_meta_data->>'role') in ('founder','radio_manager','staff'))
) with check (
  exists (select 1 from auth.users where auth.users.id = auth.uid() and (auth.users.raw_user_meta_data->>'role') in ('founder','radio_manager','staff'))
);
create policy "Radio staff manage ad slots" on radio_ad_slots for all using (
  exists (select 1 from auth.users where auth.users.id = auth.uid() and (auth.users.raw_user_meta_data->>'role') in ('founder','radio_manager','staff'))
) with check (
  exists (select 1 from auth.users where auth.users.id = auth.uid() and (auth.users.raw_user_meta_data->>'role') in ('founder','radio_manager','staff'))
);
create policy "Radio staff manage broadcasts" on radio_broadcasts for all using (
  exists (select 1 from auth.users where auth.users.id = auth.uid() and (auth.users.raw_user_meta_data->>'role') in ('founder','radio_manager','staff'))
) with check (
  exists (select 1 from auth.users where auth.users.id = auth.uid() and (auth.users.raw_user_meta_data->>'role') in ('founder','radio_manager','staff'))
);
