-- ============================================================
-- RLS Admin Hardening
-- The Farmers Table Hub CIC
--
-- Run AFTER supabase-schema.sql and all earlier migrations.
-- Safe to re-run (idempotent).
--
-- WHY THIS EXISTS
-- ---------------
-- Before this migration the project used three different, mutually
-- inconsistent ideas of "admin", two of which were not security boundaries
-- at all:
--
--   1. supabase-schema.sql:  auth.role() = 'authenticated'
--      True for ANY logged-in user. Any maker who signed up could read and
--      write raw_leads / qualified_leads / enriched_leads (pre-consent
--      scraped personal data on real people), staff, founder_jobs,
--      outreach_log, system_controls, and every other maker's
--      claimed_vendors row.
--
--   2. 20260317_radio_events.sql and 20260825_radio_v1.sql:
--      auth.users.raw_user_meta_data->>'role' = 'founder'
--      raw_user_meta_data is written from the client. Any logged-in user can
--      call supabase.auth.updateUser({ data: { role: 'founder' } }) and
--      promote themselves. This was a straightforward privilege escalation.
--
--   3. 20260317_create_directory_listings.sql:  profiles.role = 'founder'
--      The only sound model of the three, but the profiles table was never
--      created by any migration in this repo.
--
-- This migration settles on ONE model: a server-controlled profiles table,
-- read through SECURITY DEFINER helper functions. Roles can only be changed
-- by an existing admin or by the service_role key, never by the user
-- themselves.
-- ============================================================


-- ------------------------------------------------------------
-- 1. profiles — the single source of truth for authorisation
-- ------------------------------------------------------------

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  is_admin boolean not null default false,
  role text not null default 'member',
  created_at timestamp with time zone default now()
);

-- Tolerate a profiles table that already exists in the live database with
-- only some of these columns (the directory_listings migration assumed a
-- `role` column; the original RLS patch assumed `is_admin`).
alter table profiles add column if not exists is_admin boolean not null default false;
alter table profiles add column if not exists role text not null default 'member';
alter table profiles add column if not exists created_at timestamp with time zone default now();

alter table profiles enable row level security;

-- Backfill a profile row for every existing auth user.
insert into profiles (id, is_admin, role)
select u.id, false, 'member' from auth.users u
on conflict (id) do nothing;


-- ------------------------------------------------------------
-- 2. Authorisation helpers
-- ------------------------------------------------------------
-- SECURITY DEFINER so they can read profiles without tripping over the RLS
-- policies on profiles itself (which would otherwise recurse).
-- search_path is pinned so a caller cannot shadow `profiles` with their own
-- table and fake an admin result.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select p.is_admin or p.role = 'founder' from profiles p where p.id = auth.uid()),
    false
  );
$$;

-- Radio staff, per src/pages/StudioDashboardV1.md:
--   Founder: full control
--   Radio Manager: manage library, playlists, programmes and adverts
--   Presenter/Staff: prepare today's slot, add/reorder items, cue next item
-- Kept as a separate role so the Studio Dashboard spec still holds after
-- admin access is narrowed.
create or replace function public.is_radio_staff()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select p.is_admin or p.role in ('founder', 'radio_manager', 'staff', 'presenter')
     from profiles p where p.id = auth.uid()),
    false
  );
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.is_radio_staff() from public;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_radio_staff() to anon, authenticated;


-- ------------------------------------------------------------
-- 3. profiles policies
-- ------------------------------------------------------------
-- NOTE — deliberate deviation from the patch supplied with this task.
-- That patch included:
--     create policy "users_update_own_profile_nonadmin" on profiles
--       for update using (auth.uid() = id);
-- For an UPDATE policy with no WITH CHECK, Postgres reuses the USING
-- expression as the WITH CHECK. That policy therefore lets a user update
-- their OWN row to is_admin = true — reintroducing exactly the privilege
-- escalation this migration removes. Its name says "nonadmin" but nothing
-- enforces that.
--
-- profiles has no user-editable fields, so users get read-only access to
-- their own row and nothing more. Role changes go through an admin or the
-- service_role key.

drop policy if exists "users_read_own_profile" on profiles;
create policy "users_read_own_profile" on profiles
  for select using (auth.uid() = id);

drop policy if exists "users_update_own_profile_nonadmin" on profiles;

drop policy if exists "admin_manage_profiles" on profiles;
create policy "admin_manage_profiles" on profiles
  for all using (public.is_admin()) with check (public.is_admin());


-- ------------------------------------------------------------
-- 4. Create a profile automatically on signup
-- ------------------------------------------------------------
-- Always false/'member'. New accounts are never privileged, whatever the
-- client sent in options.data at signup.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, is_admin, role)
  values (new.id, false, 'member')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ------------------------------------------------------------
-- 5. Lead pipeline — admin only (pre-consent scraped personal data)
-- ------------------------------------------------------------

drop policy if exists "authenticated_full_access" on raw_leads;
drop policy if exists "admin_only_raw_leads" on raw_leads;
create policy "admin_only_raw_leads" on raw_leads
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "authenticated_full_access" on qualified_leads;
drop policy if exists "admin_only_qualified_leads" on qualified_leads;
create policy "admin_only_qualified_leads" on qualified_leads
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "authenticated_full_access" on enriched_leads;
drop policy if exists "admin_only_enriched_leads" on enriched_leads;
create policy "admin_only_enriched_leads" on enriched_leads
  for all using (public.is_admin()) with check (public.is_admin());

-- NOTE — deliberate deviation from the supplied patch.
-- The patch added:
--     create policy "public_read_published_enriched_leads" on enriched_leads
--       for select using (status = 'published');
-- Two problems:
--   (a) Nothing in this codebase ever sets status = 'published'. The statuses
--       actually used are 'draft', 'invited' and 'claimed'
--       (src/services/aiAgentService.ts, src/pages/ClaimListing.tsx), so the
--       policy would match no rows and silently break the claim flow that
--       src/pages/ClaimListing.tsx depends on.
--   (b) A blanket SELECT policy lets anyone enumerate the whole table. These
--       rows are scraped contact data on real businesses that have not yet
--       consented — bulk-readable by anon is precisely what the project's
--       GDPR commitment rules out.
-- Instead, claiming goes through a SECURITY DEFINER function that returns a
-- single row by id, only once a human has invited it, and only the fields the
-- claimant needs to see about themselves. See section 6.

drop policy if exists "authenticated_full_access" on outreach_log;
drop policy if exists "admin_only_outreach_log" on outreach_log;
create policy "admin_only_outreach_log" on outreach_log
  for all using (public.is_admin()) with check (public.is_admin());


-- ------------------------------------------------------------
-- 6. Claim flow — single-row lookup, no bulk enumeration
-- ------------------------------------------------------------
-- The maker receives /claim/:id by email. They are normally NOT logged in
-- (there is no public signup in this app), so this has to work for anon —
-- but only for a row a human has already approved for outreach, and only one
-- row at a time.

create or replace function public.get_claimable_listing(listing_id uuid)
returns table (
  id uuid,
  vendor_name text,
  craft_category text,
  location text,
  website text,
  summary text,
  status text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select e.id, e.vendor_name, e.craft_category, e.location,
         e.website, e.summary, e.status
  from enriched_leads e
  where e.id = listing_id
    and e.status in ('invited', 'claimed');
$$;

revoke all on function public.get_claimable_listing(uuid) from public;
grant execute on function public.get_claimable_listing(uuid) to anon, authenticated;

-- Records the claim itself. Always lands unapproved and unpublished — the
-- founder still has to approve it before it appears anywhere public.
create or replace function public.submit_listing_claim(
  listing_id uuid,
  p_vendor_name text,
  p_craft_category text,
  p_location text,
  p_bio text,
  p_website text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  new_id uuid;
begin
  if not exists (
    select 1 from enriched_leads e
    where e.id = listing_id and e.status in ('invited', 'claimed')
  ) then
    raise exception 'Listing is not open for claiming';
  end if;

  insert into claimed_vendors (
    user_id, enriched_lead_id, vendor_name, craft_category,
    location, bio, website, approved, published
  )
  values (
    auth.uid(), listing_id, p_vendor_name, p_craft_category,
    p_location, p_bio, p_website, false, false
  )
  returning id into new_id;

  update enriched_leads set status = 'claimed' where id = listing_id;

  return new_id;
end;
$$;

revoke all on function public.submit_listing_claim(uuid, text, text, text, text, text) from public;
grant execute on function public.submit_listing_claim(uuid, text, text, text, text, text) to anon, authenticated;


-- ------------------------------------------------------------
-- 7. Internal / operational tables — admin only
-- ------------------------------------------------------------

drop policy if exists "authenticated_full_access" on staff;
drop policy if exists "admin_only_staff" on staff;
create policy "admin_only_staff" on staff
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "authenticated_full_access" on founder_jobs;
drop policy if exists "admin_only_founder_jobs" on founder_jobs;
create policy "admin_only_founder_jobs" on founder_jobs
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "authenticated_full_access" on system_controls;
drop policy if exists "admin_only_system_controls" on system_controls;
create policy "admin_only_system_controls" on system_controls
  for all using (public.is_admin()) with check (public.is_admin());


-- ------------------------------------------------------------
-- 8. Radio shows — public read, radio staff manage
-- ------------------------------------------------------------
-- Kept as radio staff rather than admin-only so the role model in
-- src/pages/StudioDashboardV1.md still works.

drop policy if exists "authenticated_full_access" on radio_shows;
drop policy if exists "admin_only_radio_shows" on radio_shows;
drop policy if exists "public_read_radio_shows" on radio_shows;
create policy "public_read_radio_shows" on radio_shows
  for select using (true);
create policy "radio_staff_manage_radio_shows" on radio_shows
  for all using (public.is_radio_staff()) with check (public.is_radio_staff());


-- ------------------------------------------------------------
-- 9. Claimed vendors
-- ------------------------------------------------------------

drop policy if exists "admin_claimed" on claimed_vendors;
drop policy if exists "admin_only_claimed_vendors" on claimed_vendors;
create policy "admin_only_claimed_vendors" on claimed_vendors
  for all using (public.is_admin()) with check (public.is_admin());

-- Makers keep access to their own row. Re-created here so this migration is
-- self-contained if the base schema is applied fresh.
drop policy if exists "makers_own_listing" on claimed_vendors;
create policy "makers_own_listing" on claimed_vendors
  for select using (auth.uid() = user_id);

-- A maker must not be able to approve or publish themselves.
drop policy if exists "makers_update_own" on claimed_vendors;
create policy "makers_update_own" on claimed_vendors
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and approved = false and published = false);

-- Direct inserts stay restricted to the owning user; anonymous claims go
-- through public.submit_listing_claim() above.
drop policy if exists "claimed_vendors_insert_owner" on claimed_vendors;
create policy "claimed_vendors_insert_owner" on claimed_vendors
  for insert to authenticated with check (auth.uid() = user_id);


-- ------------------------------------------------------------
-- 10. Public content — events, stories, event/maker links
-- ------------------------------------------------------------

drop policy if exists "admin_events" on events;
drop policy if exists "admin_only_events" on events;
create policy "admin_only_events" on events
  for all using (public.is_admin()) with check (public.is_admin());
-- public_events (approved = true) from the base schema is left as-is.

drop policy if exists "admin_stories" on maker_stories;
drop policy if exists "admin_only_maker_stories" on maker_stories;
create policy "admin_only_maker_stories" on maker_stories
  for all using (public.is_admin()) with check (public.is_admin());

-- Public story submissions stay open, but a submission must not be able to
-- publish itself. The base schema's `with check (true)` allowed
-- published = true straight from the form.
drop policy if exists "public_story_insert" on maker_stories;
create policy "public_story_insert" on maker_stories
  for insert with check (published = false);

drop policy if exists "authenticated_full_event_makers" on event_makers;
drop policy if exists "admin_only_event_makers" on event_makers;
create policy "admin_only_event_makers" on event_makers
  for all using (public.is_admin()) with check (public.is_admin());
-- public_read_event_makers is left as-is.


-- ------------------------------------------------------------
-- 11. directory_listings — replace the profiles.role check
-- ------------------------------------------------------------
-- The original policy referenced profiles.role directly. Routed through
-- is_admin() so there is one definition of admin.

drop policy if exists "Founder can do everything" on directory_listings;
drop policy if exists "admin_only_directory_listings" on directory_listings;
create policy "admin_only_directory_listings" on directory_listings
  for all using (public.is_admin()) with check (public.is_admin());
-- "Public can view active listings" (status = 'active') is left as-is.


-- ------------------------------------------------------------
-- 12. Radio tables — remove the user_metadata escalation
-- ------------------------------------------------------------
-- Every policy below previously trusted
-- auth.users.raw_user_meta_data->>'role', which the user controls.

drop policy if exists "Founder can manage radio events" on radio_events;
create policy "admin_manage_radio_events" on radio_events
  for all using (public.is_admin()) with check (public.is_admin());
-- "Public can read radio events" is left as-is.

drop policy if exists "Radio staff manage radio playlists" on radio_playlists;
create policy "radio_staff_manage_playlists" on radio_playlists
  for all using (public.is_radio_staff()) with check (public.is_radio_staff());

drop policy if exists "Radio staff manage radio media" on radio_media;
create policy "radio_staff_manage_media" on radio_media
  for all using (public.is_radio_staff()) with check (public.is_radio_staff());

drop policy if exists "Radio staff manage playlist items" on radio_playlist_items;
create policy "radio_staff_manage_playlist_items" on radio_playlist_items
  for all using (public.is_radio_staff()) with check (public.is_radio_staff());

drop policy if exists "Radio staff manage radio sponsors" on radio_sponsors;
create policy "radio_staff_manage_sponsors" on radio_sponsors
  for all using (public.is_radio_staff()) with check (public.is_radio_staff());

drop policy if exists "Radio staff manage ad slots" on radio_ad_slots;
create policy "radio_staff_manage_ad_slots" on radio_ad_slots
  for all using (public.is_radio_staff()) with check (public.is_radio_staff());

drop policy if exists "Radio staff manage broadcasts" on radio_broadcasts;
create policy "radio_staff_manage_broadcasts" on radio_broadcasts
  for all using (public.is_radio_staff()) with check (public.is_radio_staff());

-- radio_sponsors holds sponsor contact details (contact_name, contact_email).
-- The v1 policy exposed those to anon via "Public can read active sponsors".
-- Narrowed: the public radio page only needs the business name and ad audio,
-- so contact details are no longer publicly readable.
drop policy if exists "Public can read active sponsors" on radio_sponsors;

create or replace view public_radio_sponsors as
  select id, business_name, package, audio_url, status
  from radio_sponsors
  where status = 'active';

grant select on public_radio_sponsors to anon, authenticated;


-- ------------------------------------------------------------
-- 13. Outreach approval gate
-- ------------------------------------------------------------
-- supabase/functions/directory-outreach previously emailed every listing with
-- outreach_status = 'not_contacted' on a single POST, with no per-recipient
-- human approval. These columns make approval an explicit, recorded, per-row
-- act by a named admin, which is what the project's human-in-the-loop
-- commitment requires.

alter table directory_listings
  add column if not exists outreach_approved boolean not null default false,
  add column if not exists outreach_approved_by uuid references auth.users(id),
  add column if not exists outreach_approved_at timestamp with time zone,
  add column if not exists outreach_opted_out boolean not null default false;

create index if not exists directory_listings_outreach_idx
  on directory_listings(outreach_status, outreach_approved)
  where outreach_approved = true;


-- ============================================================
-- AFTER RUNNING THIS FILE
-- ============================================================
-- Nobody is an admin yet. Grant the founder's own account, using the UUID
-- from Supabase Dashboard -> Authentication -> Users:
--
--   update profiles set is_admin = true, role = 'founder'
--   where id = 'FOUNDER-UUID-HERE';
--
-- Radio staff, if and when they exist:
--
--   update profiles set role = 'radio_manager' where id = 'STAFF-UUID-HERE';
--
-- Verify as a second, non-admin test user — each of these must return
-- zero rows rather than data:
--
--   select * from raw_leads;
--   select * from qualified_leads;
--   select * from enriched_leads;
--   select * from staff;
--   select * from founder_jobs;
--   select * from system_controls;
--   select * from outreach_log;
--   select * from claimed_vendors;   -- only their own row, if any
--
-- And this must fail rather than promote them:
--
--   update profiles set is_admin = true where id = auth.uid();
-- ============================================================
