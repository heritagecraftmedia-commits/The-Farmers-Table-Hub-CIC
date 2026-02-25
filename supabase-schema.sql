-- ============================================================
-- The Farmers Table Hub CIC — Full Supabase Schema
-- Copy-paste this into Supabase SQL Editor → Run
-- ============================================================

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

-- 6. EVENTS (What's On — public noticeboard)
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

-- 7. STAFF
create table if not exists staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  email text,
  status text default 'active',
  joined_at timestamp with time zone default now()
);

-- 8. RADIO SHOWS
create table if not exists radio_shows (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  host text,
  schedule text,
  status text default 'planned',
  last_broadcast text
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

insert into system_controls (key, value) values
  ('discovery_enabled', true),
  ('qualification_enabled', true),
  ('enrichment_enabled', false),
  ('outreach_enabled', false),
  ('maintenance_mode', false)
on conflict (key) do nothing;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table raw_leads enable row level security;
alter table qualified_leads enable row level security;
alter table enriched_leads enable row level security;
alter table outreach_log enable row level security;
alter table claimed_vendors enable row level security;
alter table events enable row level security;
alter table staff enable row level security;
alter table radio_shows enable row level security;
alter table founder_jobs enable row level security;
alter table maker_stories enable row level security;
alter table system_controls enable row level security;

-- Allow authenticated users full access (admin via service_role)
create policy "authenticated_full_access" on raw_leads for all using (auth.role() = 'authenticated');
create policy "authenticated_full_access" on qualified_leads for all using (auth.role() = 'authenticated');
create policy "authenticated_full_access" on enriched_leads for all using (auth.role() = 'authenticated');
create policy "authenticated_full_access" on outreach_log for all using (auth.role() = 'authenticated');
create policy "authenticated_full_access" on staff for all using (auth.role() = 'authenticated');
create policy "authenticated_full_access" on radio_shows for all using (auth.role() = 'authenticated');
create policy "authenticated_full_access" on founder_jobs for all using (auth.role() = 'authenticated');
create policy "authenticated_full_access" on system_controls for all using (auth.role() = 'authenticated');

-- Makers can read/update their own claimed listing
create policy "makers_own_listing" on claimed_vendors for select using (auth.uid() = user_id);
create policy "makers_update_own" on claimed_vendors for update using (auth.uid() = user_id);
create policy "admin_claimed" on claimed_vendors for all using (auth.role() = 'authenticated');

-- Public read access for published content
create policy "public_events" on events for select using (approved = true);
create policy "admin_events" on events for all using (auth.role() = 'authenticated');
create policy "public_stories" on maker_stories for select using (published = true);
create policy "admin_stories" on maker_stories for all using (auth.role() = 'authenticated');

-- 12. EVENT MAKERS (Junction table for cross-links)
create table if not exists event_makers (
  event_id uuid references events(id) on delete cascade,
  maker_id uuid, -- Reference to claimed_vendors, enriched_leads, or directory_listing
  maker_name text, -- Fallback name
  primary key (event_id, maker_id)
);

alter table event_makers enable row level security;
create policy "public_read_event_makers" on event_makers for select using (true);
create policy "authenticated_full_event_makers" on event_makers for all using (auth.role() = 'authenticated');

-- Everyone can insert a story (submission form) - but restricted to authenticated users for better security if preferred.
-- If you want public (anon) submissions, keep 'with check (true)' but it's safer to use 'to authenticated'.
create policy "public_story_insert" on maker_stories for insert with check (true);

-- Makers can only insert their own claim
create policy "claimed_vendors_insert_owner" on claimed_vendors for insert to authenticated with check (auth.uid() = user_id);
