-- ============================================================================
-- The Farmers Table Hub CIC — least-privilege permissions, RLS and role model
-- Target project: lyitsfxbdpxezcwdeuvd  (TFT only — NOT the HCM project)
--
-- Run AFTER:
--   supabase-schema.sql
--   20260317_create_directory_listings.sql
--   20260317_seed_directory_listings.sql
--   20260317_outreach_columns.sql
--   20260317_radio_events.sql
--   20260825_radio_v1.sql
--   20260825_radio_v2_alignment.sql
--   20260826_rls_admin_hardening.sql
--   20260827_untracked_tables.sql
--
-- Idempotent: safe to run repeatedly. Creates no duplicate policies, drops
-- only policies this project owns, and deletes no data.
--
-- WHAT THIS ADDS OVER 20260826_rls_admin_hardening.sql
-- ----------------------------------------------------
-- The hardening migration removed the three broken admin models and settled on
-- profiles + is_admin(). This one builds the actual role model on top of it:
--
--   1. `role` was unconstrained free text with no CHECK. A typo silently
--      removed access; any string was accepted. Now a closed set.
--   2. `is_admin` and `role` were two independent sources of truth that could
--      disagree. Now one, kept consistent by trigger.
--   3. Founder and admin were the same thing in the database. The Finance /
--      Records / Safe Mode split existed ONLY in CommandCenter.tsx — i.e. in
--      the frontend, which is not a security boundary. Now is_founder().
--      (See section 5.)
--   4. No contributor tier existed. is_radio_staff() lumped presenters in with
--      the founder, so a presenter could delete the entire radio library.
--   5. The PUBLIC directory page reads every column of directory_listings,
--      including contact_email, phone and the outreach moderation fields, for
--      145 real UK businesses. See section 7 — this is the most serious
--      finding and needs an app change deployed with this migration.
--   6. `notes` had no owner column, so every staff account could read and
--      delete the founder's private notepad.
--   7. There was no audit log of any kind.
--   8. No storage bucket or object policy existed in source control.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 0. Preconditions
-- ----------------------------------------------------------------------------
-- Fail loudly rather than half-applying against the wrong database.

do $$
begin
  if to_regclass('public.profiles') is null then
    raise exception
      'public.profiles is missing. Run 20260826_rls_admin_hardening.sql first.';
  end if;
  if to_regclass('public.directory_listings') is null then
    raise exception
      'public.directory_listings is missing. Run the directory migrations first.';
  end if;
end $$;


-- ----------------------------------------------------------------------------
-- 1. The role model
-- ----------------------------------------------------------------------------
-- One closed set of roles. Ordered least to most privileged:
--
--   member         signed-in visitor. Own profile, own claimed listing.
--   contributor    trusted presenter. Prepares radio content; owns what they
--                  create. Cannot touch sponsors, finance or other people's
--                  media.
--   radio_manager  contributor + the whole radio library, schedule and
--                  sponsors.
--   admin          TFT operational content: directory, applications, feedback,
--                  the lead pipeline, events, stories, radio. Cannot grant
--                  roles.
--   founder        admin + role administration, staff records, system
--                  controls, full audit visibility.
--
-- 'staff' and 'presenter' are accepted because 20260826 already wrote them
-- into is_radio_staff(); both are treated as `contributor`.

-- Normalise before constraining, so an unexpected live value cannot fail the
-- constraint and abort the migration. Nothing is deleted.
update profiles set role = 'contributor'
  where role in ('staff', 'presenter');

update profiles set role = 'member'
  where role is null
     or role not in ('member','contributor','radio_manager','admin','founder');

-- An account that was admin only via the legacy boolean keeps its access:
-- promote it into the role model rather than silently demoting it.
update profiles set role = 'admin'
  where is_admin = true and role not in ('admin','founder');

alter table profiles drop constraint if exists profiles_role_allowed;
alter table profiles add constraint profiles_role_allowed
  check (role in ('member','contributor','radio_manager','admin','founder'));

-- From here on `is_admin` is a derived legacy mirror of `role`, kept only
-- because 20260826 and existing app code read it. The trigger in section 3
-- keeps it consistent; it is no longer independently writable.
update profiles set is_admin = (role in ('admin','founder'))
  where is_admin is distinct from (role in ('admin','founder'));


-- ----------------------------------------------------------------------------
-- 2. Authorisation helpers
-- ----------------------------------------------------------------------------
-- Every function here is SECURITY DEFINER for one reason only: to read
-- `profiles` without recursing into the RLS policies on `profiles` itself.
-- Each one:
--   * pins search_path, so a caller cannot create their own `profiles` in a
--     schema earlier on the path and fake the answer;
--   * is `stable`, takes no caller-supplied input, and uses no dynamic SQL,
--     so there is nothing to inject;
--   * only ever reads. None of them can write a role, so none of them can be
--     turned into an escalation path.
-- EXECUTE is revoked from PUBLIC and granted explicitly.

create or replace function public.current_user_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select auth.uid();
$$;

comment on function public.current_user_id() is
  'The calling user''s auth.users id, or NULL when unauthenticated.';

create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select p.role from profiles p where p.id = auth.uid()),
    'public'
  );
$$;

comment on function public.current_app_role() is
  'Authoritative TFT role from public.profiles. Never reads user_metadata.';

-- Founder — highest application role. Deliberately NOT a bypass of RLS:
-- it is just another explicit predicate, so every founder read and write is
-- still attributable and auditable.
create or replace function public.is_founder()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select p.role = 'founder' from profiles p where p.id = auth.uid()),
    false
  );
$$;

-- Admin — admin or founder. Same name and meaning as 20260826 so existing
-- policies keep working; the definition now reads `role` rather than the
-- boolean, with the boolean kept as a fallback for a row the trigger has not
-- yet normalised.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select p.role in ('admin','founder') or p.is_admin
     from profiles p where p.id = auth.uid()),
    false
  );
$$;

-- Radio manager — the whole radio operation, but not roles, staff records or
-- system controls.
create or replace function public.is_radio_manager()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select p.role in ('radio_manager','admin','founder')
     from profiles p where p.id = auth.uid()),
    false
  );
$$;

-- Contributor — trusted to create content, not to manage other people's.
-- Same name/semantics as 20260826's is_radio_staff() so nothing breaks; the
-- membership test now runs off the constrained role set.
create or replace function public.is_radio_staff()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select p.role in ('contributor','radio_manager','admin','founder')
     from profiles p where p.id = auth.uid()),
    false
  );
$$;

create or replace function public.is_contributor()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_radio_staff();
$$;

-- Signed in at all. Used where "any member" is genuinely the right boundary.
create or replace function public.is_member()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select auth.uid() is not null;
$$;

-- Content management, as distinct from system administration. This is the
-- predicate to reach for on ordinary editorial tables.
create or replace function public.can_manage_content()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_admin();
$$;

do $$
declare fn text;
begin
  foreach fn in array array[
    'current_user_id()', 'current_app_role()', 'is_founder()', 'is_admin()',
    'is_radio_manager()', 'is_radio_staff()', 'is_contributor()',
    'is_member()', 'can_manage_content()'
  ] loop
    execute format('revoke all on function public.%s from public', fn);
    execute format('grant execute on function public.%s to anon, authenticated, service_role', fn);
  end loop;
end $$;

-- Pin the search_path on the pre-existing trigger helper too (section 5 of the
-- brief). It touches no relation, but an unpinned search_path on any function
-- reachable from a trigger is a needless loose end.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ----------------------------------------------------------------------------
-- 3. Audit log
-- ----------------------------------------------------------------------------
-- Append-only. Records who changed what, for the changes that matter to
-- authorisation and to the human-in-the-loop commitments: role grants,
-- listing approval/publication, outreach approval, and system control flips.
--
-- No foreign key to auth.users on actor_id, deliberately: deleting an account
-- must not remove the record of what it did.

create table if not exists security_audit_log (
  id           bigint generated always as identity primary key,
  occurred_at  timestamptz not null default now(),
  actor_id     uuid,
  actor_role   text,
  action       text not null,
  table_name   text,
  record_id    text,
  old_value    jsonb,
  new_value    jsonb
);

create index if not exists security_audit_log_occurred_idx
  on security_audit_log (occurred_at desc);
create index if not exists security_audit_log_actor_idx
  on security_audit_log (actor_id);
create index if not exists security_audit_log_action_idx
  on security_audit_log (action);

alter table security_audit_log enable row level security;

-- Read only, and even that is split. There are NO insert/update/delete
-- policies on this table by design: with RLS on, the absence of a policy is a
-- deny. Rows arrive only through record_audit_event() below.
drop policy if exists "founder_read_audit_log" on security_audit_log;
create policy "founder_read_audit_log" on security_audit_log
  for select using (public.is_founder());

-- An admin can see operational history but not the role-grant history that
-- would show them how privilege was handed out.
drop policy if exists "admin_read_operational_audit_log" on security_audit_log;
create policy "admin_read_operational_audit_log" on security_audit_log
  for select using (public.is_admin() and action not like 'role.%');

-- Defence in depth: PostgREST's roles lose the table-level write grants too,
-- so a future mistaken policy still cannot open a write path.
revoke insert, update, delete, truncate on security_audit_log from anon, authenticated;

-- Append-only, enforced below RLS. A trigger fires for the service_role key
-- as well, which BYPASSRLS does not cover — so not even the service key can
-- rewrite history through the API.
create or replace function public.audit_log_is_append_only()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  raise exception 'security_audit_log is append-only (attempted %)', tg_op;
end;
$$;

drop trigger if exists security_audit_log_append_only on security_audit_log;
create trigger security_audit_log_append_only
  before update or delete on security_audit_log
  for each row execute procedure public.audit_log_is_append_only();

-- The only writer. SECURITY DEFINER so it can insert past the (deliberately
-- absent) insert policy. It takes no expression, builds no dynamic SQL, and
-- cannot read or write any other table, so it grants no privilege beyond
-- appending one row.
create or replace function public.record_audit_event(
  p_action      text,
  p_table_name  text,
  p_record_id   text,
  p_old_value   jsonb default null,
  p_new_value   jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into security_audit_log
    (actor_id, actor_role, action, table_name, record_id, old_value, new_value)
  values
    (auth.uid(), public.current_app_role(), p_action, p_table_name, p_record_id,
     p_old_value, p_new_value);
end;
$$;

-- Not callable from the API. Triggers invoke it internally; letting a client
-- call it directly would let anyone fabricate an administrator action, which
-- is exactly what section 11 of the brief rules out.
revoke all on function public.record_audit_event(text, text, text, jsonb, jsonb) from public;
revoke all on function public.record_audit_event(text, text, text, jsonb, jsonb) from anon, authenticated;


-- ----------------------------------------------------------------------------
-- 4. profiles — the authority, and the escalation guard
-- ----------------------------------------------------------------------------
-- 20260826 gave users read-only access to their own row because the table had
-- no user-owned fields. That is safe but it also means the "user cannot
-- promote themselves" property was never actually exercised: there was no
-- UPDATE path at all to test.
--
-- One genuinely user-owned field is added, with the permissions split as the
-- brief requires: the user may change their display name and nothing else.
-- The escalation test in tests/20_privilege_escalation_tests.sql is then a
-- real test — the user HAS a write path into their own row and still cannot
-- move `role`.

alter table profiles add column if not exists display_name text;
alter table profiles add column if not exists updated_at timestamptz default now();

-- Is this a server-side/bootstrap caller rather than an end user? True in the
-- Supabase SQL editor and for the service_role key. This is the escape hatch
-- that lets the first founder be created; it is reachable only by someone who
-- already holds the service key or database credentials.
create or replace function public.is_service_context()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select auth.uid() is null or auth.role() = 'service_role';
$$;
revoke all on function public.is_service_context() from public;
grant execute on function public.is_service_context() to anon, authenticated, service_role;

-- The guard. Runs below RLS and therefore also applies to the service_role
-- key, which BYPASSRLS exempts from policies but not from triggers.
create or replace function public.enforce_profile_authority()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  founders_left integer;
begin
  if tg_op = 'INSERT' then
    -- A new account is never privileged, whatever the client sent at signup.
    if not (public.is_founder() or public.is_service_context()) then
      new.role := 'member';
    end if;
    new.is_admin := (new.role in ('admin','founder'));
    return new;
  end if;

  -- UPDATE ------------------------------------------------------------------
  -- The row's identity is not a user-editable field.
  if new.id is distinct from old.id then
    raise exception 'profiles.id cannot be changed';
  end if;

  if new.role is distinct from old.role then
    if not (public.is_founder() or public.is_service_context()) then
      raise exception
        'Only a founder may change a profile role (attempted % -> % on %)',
        old.role, new.role, old.id;
    end if;

    -- Do not let the last founder be demoted; that would leave the project
    -- with no one able to grant roles again without database credentials.
    if old.role = 'founder' and new.role <> 'founder' then
      select count(*) into founders_left
        from profiles where role = 'founder' and id <> old.id;
      if founders_left = 0 then
        raise exception 'Cannot demote the last remaining founder';
      end if;
    end if;

    perform public.record_audit_event(
      case when new.role in ('admin','founder') then 'role.granted'
           else 'role.changed' end,
      'profiles', old.id::text,
      jsonb_build_object('role', old.role),
      jsonb_build_object('role', new.role));
  end if;

  -- is_admin is derived from role. It is not independently settable, so it
  -- cannot drift away from the role and cannot be used as a second, quieter
  -- escalation path.
  new.is_admin := (new.role in ('admin','founder'));
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_enforce_authority on profiles;
create trigger profiles_enforce_authority
  before insert or update on profiles
  for each row execute procedure public.enforce_profile_authority();

-- Policies. Note every UPDATE policy below carries an explicit WITH CHECK.
drop policy if exists "users_read_own_profile" on profiles;
create policy "users_read_own_profile" on profiles
  for select using (auth.uid() = id);

-- An admin can see who holds which role (they need to, to do their job) but
-- cannot change one. Role administration is founder-only.
drop policy if exists "admin_read_profiles" on profiles;
create policy "admin_read_profiles" on profiles
  for select using (public.is_admin());

-- Replaces 20260826's "admin_manage_profiles", which let any admin promote
-- anyone — including themselves to founder.
drop policy if exists "admin_manage_profiles" on profiles;
drop policy if exists "founder_manage_profiles" on profiles;
create policy "founder_manage_profiles" on profiles
  for all using (public.is_founder()) with check (public.is_founder());

-- The user's own writable surface. The WITH CHECK pins identity and role;
-- the trigger above pins them again below RLS.
drop policy if exists "users_update_own_display_name" on profiles;
create policy "users_update_own_display_name" on profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role = public.current_app_role());

-- Users may not create or delete profile rows; the signup trigger owns that.
revoke insert, delete on profiles from anon, authenticated;
revoke update on profiles from anon;
revoke select on profiles from anon;

-- handle_new_user() re-stated so this migration is self-contained, and so the
-- role it writes matches the constrained set above.
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
revoke all on function public.handle_new_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ----------------------------------------------------------------------------
-- 5. Founder-only: staff records and system controls
-- ----------------------------------------------------------------------------
-- CommandCenter.tsx gates Finance, Records and Safe Mode on founder. That gate
-- is a rendering decision in a React component — it is not a security boundary
-- and does nothing to a caller using the Supabase client directly. The two
-- tables behind Records and Safe Mode are moved to founder-only here so the
-- split the application already claims to make is actually enforced.
--
-- Consequence to be aware of before deploying: an account with role='admin'
-- loses access to `staff` and `system_controls`. That is the intent. If an
-- admin needs them, they need role='founder'.

drop policy if exists "admin_only_staff" on staff;
drop policy if exists "founder_only_staff" on staff;
create policy "founder_only_staff" on staff
  for all using (public.is_founder()) with check (public.is_founder());

drop policy if exists "admin_only_system_controls" on system_controls;
drop policy if exists "founder_only_system_controls" on system_controls;
create policy "founder_only_system_controls" on system_controls
  for all using (public.is_founder()) with check (public.is_founder());

-- Flipping an agent toggle or maintenance mode is an administrative act and
-- is recorded as one.
create or replace function public.audit_system_controls()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.record_audit_event(
    'system_control.changed', 'system_controls', new.key,
    to_jsonb(old), to_jsonb(new));
  return new;
end;
$$;

drop trigger if exists system_controls_audit on system_controls;
create trigger system_controls_audit
  after update on system_controls
  for each row when (old.value is distinct from new.value)
  execute procedure public.audit_system_controls();


-- ----------------------------------------------------------------------------
-- 6. Ownership where it was missing
-- ----------------------------------------------------------------------------

-- 6a. notes — a private notepad that was shared with every staff account.
-- 20260827 gave it `for all using (is_radio_staff())`, so any presenter could
-- read, edit and delete the founder's notes. Notes.tsx never sent an owner
-- because there was no column to send it in.

alter table notes add column if not exists user_id uuid default auth.uid();
create index if not exists notes_user_idx on notes (user_id);

-- Rows that predate this column have user_id NULL. They are not deleted and
-- not reassigned; they become visible to the founder only, who can claim them.
drop policy if exists "staff_manage_notes" on notes;
drop policy if exists "users_manage_own_notes" on notes;
create policy "users_manage_own_notes" on notes
  for all
  using (
    public.is_radio_staff()
    and (user_id = auth.uid() or (user_id is null and public.is_founder()))
  )
  with check (
    public.is_radio_staff()
    and user_id = auth.uid()
  );

-- 6b. radio_media / radio_playlists / radio_playlist_items — contributor tier.
-- StudioDashboardV1.md gives a presenter "prepare today's slot, add/reorder
-- items". 20260826 implemented that as is_radio_staff() FOR ALL, which also
-- lets a presenter delete the entire station library. Ownership closes that.

alter table radio_media       add column if not exists created_by uuid default auth.uid();
alter table radio_playlists   add column if not exists created_by uuid default auth.uid();
alter table radio_playlist_items add column if not exists created_by uuid default auth.uid();

create index if not exists radio_media_created_by_idx     on radio_media (created_by);
create index if not exists radio_playlists_created_by_idx on radio_playlists (created_by);

-- radio_media: everyone on the team can see the library; a contributor may add
-- to it and change what they added; a radio manager owns the whole library.
drop policy if exists "radio_staff_manage_media" on radio_media;
drop policy if exists "radio_staff_read_media" on radio_media;
drop policy if exists "contributor_add_media" on radio_media;
drop policy if exists "contributor_edit_own_media" on radio_media;
drop policy if exists "contributor_delete_own_media" on radio_media;
drop policy if exists "radio_manager_manage_media" on radio_media;

create policy "radio_staff_read_media" on radio_media
  for select using (public.is_radio_staff());
create policy "contributor_add_media" on radio_media
  for insert with check (public.is_radio_staff() and created_by = auth.uid());
create policy "contributor_edit_own_media" on radio_media
  for update
  using (public.is_radio_staff() and created_by = auth.uid())
  with check (public.is_radio_staff() and created_by = auth.uid());
create policy "contributor_delete_own_media" on radio_media
  for delete using (public.is_radio_staff() and created_by = auth.uid());
create policy "radio_manager_manage_media" on radio_media
  for all using (public.is_radio_manager()) with check (public.is_radio_manager());

-- radio_playlists: same shape.
drop policy if exists "radio_staff_manage_playlists" on radio_playlists;
drop policy if exists "radio_staff_read_playlists" on radio_playlists;
drop policy if exists "contributor_add_playlists" on radio_playlists;
drop policy if exists "contributor_edit_own_playlists" on radio_playlists;
drop policy if exists "contributor_delete_own_playlists" on radio_playlists;
drop policy if exists "radio_manager_manage_playlists" on radio_playlists;

create policy "radio_staff_read_playlists" on radio_playlists
  for select using (public.is_radio_staff());
create policy "contributor_add_playlists" on radio_playlists
  for insert with check (public.is_radio_staff() and created_by = auth.uid());
create policy "contributor_edit_own_playlists" on radio_playlists
  for update
  using (public.is_radio_staff() and created_by = auth.uid())
  with check (public.is_radio_staff() and created_by = auth.uid());
create policy "contributor_delete_own_playlists" on radio_playlists
  for delete using (public.is_radio_staff() and created_by = auth.uid());
create policy "radio_manager_manage_playlists" on radio_playlists
  for all using (public.is_radio_manager()) with check (public.is_radio_manager());

-- radio_playlist_items: a contributor may build out a playlist they own.
drop policy if exists "radio_staff_manage_playlist_items" on radio_playlist_items;
drop policy if exists "radio_staff_read_playlist_items" on radio_playlist_items;
drop policy if exists "contributor_manage_own_playlist_items" on radio_playlist_items;
drop policy if exists "radio_manager_manage_playlist_items" on radio_playlist_items;

create policy "radio_staff_read_playlist_items" on radio_playlist_items
  for select using (public.is_radio_staff());
create policy "contributor_manage_own_playlist_items" on radio_playlist_items
  for all
  using (
    public.is_radio_staff()
    and exists (select 1 from radio_playlists p
                where p.id = radio_playlist_items.playlist_id
                  and p.created_by = auth.uid())
  )
  with check (
    public.is_radio_staff()
    and exists (select 1 from radio_playlists p
                where p.id = radio_playlist_items.playlist_id
                  and p.created_by = auth.uid())
  );
create policy "radio_manager_manage_playlist_items" on radio_playlist_items
  for all using (public.is_radio_manager()) with check (public.is_radio_manager());

-- 6c. Commercial and scheduling data — radio manager and above only.
-- These carry sponsor contact names and email addresses and decide what goes
-- to air. A presenter has no business in them.
drop policy if exists "radio_staff_manage_sponsors" on radio_sponsors;
drop policy if exists "radio_manager_manage_sponsors" on radio_sponsors;
create policy "radio_manager_manage_sponsors" on radio_sponsors
  for all using (public.is_radio_manager()) with check (public.is_radio_manager());

drop policy if exists "radio_staff_manage_ad_slots" on radio_ad_slots;
drop policy if exists "radio_manager_manage_ad_slots" on radio_ad_slots;
create policy "radio_manager_manage_ad_slots" on radio_ad_slots
  for all using (public.is_radio_manager()) with check (public.is_radio_manager());

drop policy if exists "radio_staff_manage_broadcasts" on radio_broadcasts;
drop policy if exists "radio_staff_read_broadcasts" on radio_broadcasts;
drop policy if exists "radio_manager_manage_broadcasts" on radio_broadcasts;
create policy "radio_staff_read_broadcasts" on radio_broadcasts
  for select using (public.is_radio_staff());
create policy "radio_manager_manage_broadcasts" on radio_broadcasts
  for all using (public.is_radio_manager()) with check (public.is_radio_manager());

drop policy if exists "radio_staff_manage_sponsor_rotations" on sponsor_rotations;
drop policy if exists "radio_manager_manage_sponsor_rotations" on sponsor_rotations;
create policy "radio_manager_manage_sponsor_rotations" on sponsor_rotations
  for all using (public.is_radio_manager()) with check (public.is_radio_manager());

drop policy if exists "radio_staff_manage_ad_schedules" on ad_schedules;
drop policy if exists "radio_manager_manage_ad_schedules" on ad_schedules;
create policy "radio_manager_manage_ad_schedules" on ad_schedules
  for all using (public.is_radio_manager()) with check (public.is_radio_manager());

-- Programme definitions are "manage programmes" in StudioDashboardV1.md, which
-- is the radio manager's remit. 20260826 left them at is_radio_staff(), so a
-- presenter could delete a show.
drop policy if exists "radio_staff_manage_radio_shows" on radio_shows;
drop policy if exists "radio_manager_manage_radio_shows" on radio_shows;
create policy "radio_manager_manage_radio_shows" on radio_shows
  for all using (public.is_radio_manager()) with check (public.is_radio_manager());

drop policy if exists "radio_staff_manage_playlists_legacy" on playlists;
drop policy if exists "radio_manager_manage_playlists_legacy" on playlists;
create policy "radio_manager_manage_playlists_legacy" on playlists
  for all using (public.is_radio_manager()) with check (public.is_radio_manager());


-- ----------------------------------------------------------------------------
-- 7. Public reads — stop shipping private columns to anonymous visitors
-- ----------------------------------------------------------------------------
-- 7a. directory_listings. THE MOST SERIOUS FINDING IN THIS MIGRATION.
--
-- The policy from the directory migration was:
--     create policy "Public can view active listings"
--       on directory_listings for select using (status = 'active');
--
-- RLS filters rows, not columns. `src/pages/Directory.tsx` — the PUBLIC
-- directory page — calls `hubService.getListings()`, which issues
-- `select('*')`. So every anonymous visitor to the directory is served, for
-- all 145 seeded real UK food businesses:
--
--     contact_email, phone, outreach_status, outreach_date, response,
--     claimed, outreach_approved, outreach_approved_by, outreach_opted_out
--
-- Directory.tsx then hides the email in JSX unless the tier is Supporter or
-- Featured (line 229). That is a rendering decision taken after the data has
-- already been delivered to the browser; the values are in the network
-- response either way. It is both the private-contact-data exposure and the
-- "internal moderation fields exposed through public queries" that section 8
-- of the brief rules out.
--
-- Fix: anonymous and member reads move to a curated view. Direct table access
-- becomes admin-only.
--
-- >>> THIS REQUIRES THE APP PATCH IN app-patches/ TO SHIP WITH IT. <<<
-- Deploy the app patch FIRST (it works against the old and the new database),
-- then run this migration. If the migration lands first, Directory.tsx's
-- select('*') is refused and the page falls back to mock listings.

drop policy if exists "Public can view active listings" on directory_listings;

-- Curated public projection. Contact details appear only for the tiers that
-- pay for a public contact block; a free scraped listing never exposes them.
create or replace view public_directory_listings
with (security_barrier = true) as
  select
    d.id,
    d.name,
    d.category,
    d.location,
    d.description,
    d.website,
    d.tier,
    d.status,
    d.created_at,
    case when d.tier in ('supporter','featured') then d.contact_email end as contact_email,
    case when d.tier in ('supporter','featured') then d.phone end          as phone
  from directory_listings d
  where d.status = 'active'
    and d.outreach_opted_out = false;

comment on view public_directory_listings is
  'Public projection of directory_listings. Runs with the definer''s rights on '
  'purpose so anon can read it without a SELECT policy on the base table; the '
  'column list is the security boundary. Outreach/moderation columns are '
  'absent, and contact details appear only for paid tiers.';

-- Privileges for this view are set in 7e below, read-only.

-- anon has no legitimate direct use of the base table any more.
revoke all on directory_listings from anon;

-- 7b. radio_shows — was `for select using (true)`, which published every row
-- including status='planned'/'draft' shows that have not been announced.
drop policy if exists "public_read_radio_shows" on radio_shows;
create policy "public_read_radio_shows" on radio_shows
  for select using (
    status in ('scheduled','live','archived')
    or public.is_radio_staff()
  );

-- 7c. event_makers — was `using (true)`, so the maker line-up of an event that
-- had not been approved yet was publicly readable.
drop policy if exists "public_read_event_makers" on event_makers;
create policy "public_read_event_makers" on event_makers
  for select using (
    exists (select 1 from events e
            where e.id = event_makers.event_id and e.approved = true)
  );

-- 7d. The two views 20260826/20260827 created are re-stated here with an
-- explicit security_barrier and a comment recording why they run with the
-- definer's rights: they are the mechanism that lets the public radio page
-- read a sponsor's business name without reading their contact details.
create or replace view public_radio_sponsors
with (security_barrier = true) as
  select id, business_name, package, audio_url, status
  from radio_sponsors
  where status = 'active';

create or replace view public_sponsor_rotations
with (security_barrier = true) as
  select id, name, product_desc, package, status
  from sponsor_rotations
  where status = 'active';

-- 7e. Views are tables as far as GRANT is concerned, and Supabase's default
-- privileges hand anon ALL on everything in `public` — views included.
--
-- public_radio_sponsors and public_sponsor_rotations are simple enough to be
-- auto-updatable, and they run with the view owner's rights so that anon can
-- read them without a SELECT policy on the base table. Those two facts
-- together mean a write through the view also runs as the owner, and so
-- bypasses the base table's RLS entirely.
--
-- Verified locally before writing this: as `anon`, with no JWT,
--     delete from public_radio_sponsors;
-- removed the underlying radio_sponsors row. `grant select ... to anon` on
-- its own does not withdraw the blanket INSERT/UPDATE/DELETE that the default
-- privileges already granted. This applies to the two views as they exist in
-- 20260826 and 20260827 today, not only to the one added above.
--
-- Read-only, explicitly, on every public view.
do $$
declare v text;
begin
  foreach v in array array[
    'public_directory_listings', 'public_radio_sponsors', 'public_sponsor_rotations'
  ] loop
    if to_regclass('public.' || v) is not null then
      execute format('revoke all on public.%I from anon, authenticated', v);
      execute format('grant select on public.%I to anon, authenticated', v);
    end if;
  end loop;
end $$;


-- ----------------------------------------------------------------------------
-- 8. The claim flow and the approval trail
-- ----------------------------------------------------------------------------
-- get_claimable_listing() and submit_listing_claim() are the only two paths
-- anon has into enriched_leads, and they are SECURITY DEFINER, so they get the
-- same treatment as the helpers: pinned search_path, no dynamic SQL, and no
-- ability to write anything the caller could turn into privilege.
--
-- submit_listing_claim() gains one restriction it did not have: a listing can
-- only be claimed once. Previously any caller holding a listing id could post
-- unlimited claims against it, and status stayed claimable afterwards, so the
-- table could be flooded and a genuine claim buried.

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
    where e.id = listing_id and e.status = 'invited'
  ) then
    raise exception 'Listing is not open for claiming';
  end if;

  if exists (
    select 1 from claimed_vendors c where c.enriched_lead_id = listing_id
  ) then
    raise exception 'This listing has already been claimed';
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

  perform public.record_audit_event(
    'listing.claim_submitted', 'claimed_vendors', new_id::text,
    null, jsonb_build_object('enriched_lead_id', listing_id));

  return new_id;
end;
$$;

revoke all on function public.submit_listing_claim(uuid, text, text, text, text, text) from public;
grant execute on function public.submit_listing_claim(uuid, text, text, text, text, text)
  to anon, authenticated;

-- Approving or publishing someone's listing is an administrative act.
create or replace function public.audit_claimed_vendor_decision()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.record_audit_event(
    'listing.moderated', 'claimed_vendors', new.id::text,
    jsonb_build_object('approved', old.approved, 'published', old.published),
    jsonb_build_object('approved', new.approved, 'published', new.published));
  return new;
end;
$$;

drop trigger if exists claimed_vendors_audit on claimed_vendors;
create trigger claimed_vendors_audit
  after update on claimed_vendors
  for each row when (old.approved is distinct from new.approved
                  or old.published is distinct from new.published)
  execute procedure public.audit_claimed_vendor_decision();

-- Outreach approval is the human-in-the-loop gate on emailing a real business.
create or replace function public.audit_outreach_approval()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.record_audit_event(
    'outreach.approved', 'directory_listings', new.id::text,
    jsonb_build_object('outreach_approved', old.outreach_approved),
    jsonb_build_object('outreach_approved', new.outreach_approved,
                       'approved_by', new.outreach_approved_by));
  return new;
end;
$$;

drop trigger if exists directory_listings_outreach_audit on directory_listings;
create trigger directory_listings_outreach_audit
  after update on directory_listings
  for each row when (old.outreach_approved is distinct from new.outreach_approved)
  execute procedure public.audit_outreach_approval();


-- ----------------------------------------------------------------------------
-- 9. Table privileges — the layer underneath RLS
-- ----------------------------------------------------------------------------
-- Supabase grants anon and authenticated ALL privileges on every table in
-- `public` and relies on RLS alone to hold the line. That works, but it means
-- one mistaken policy is the only thing between an anonymous caller and a
-- write. Withdrawing the grants anon has no use for makes a future policy
-- slip inert rather than exploitable.
--
-- anon keeps INSERT on exactly the three tables the public site legitimately
-- writes to, and SELECT on the public-facing content tables. Nothing else.

do $$
declare t text;
begin
  foreach t in array array[
    'raw_leads','qualified_leads','enriched_leads','outreach_log',
    'claimed_vendors','staff','founder_jobs','system_controls','notes',
    'pending_listings','social_posts','directory_listings','profiles',
    'radio_media','radio_playlists','radio_playlist_items','radio_sponsors',
    'radio_ad_slots','radio_broadcasts','radio_shows','radio_events',
    'playlists','sponsor_rotations','ad_schedules','events','event_makers',
    'maker_stories','applications','feedback_book_responses',
    'security_audit_log'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format('revoke insert, update, delete, truncate on public.%I from anon', t);
    end if;
  end loop;
end $$;

-- The three legitimate anonymous write paths. Each is still gated by a WITH
-- CHECK policy that pins the incoming row to an unprivileged state.
grant insert on applications             to anon;   -- status must be 'pending'
grant insert on feedback_book_responses  to anon;   -- write-only; admin reads
grant insert on maker_stories            to anon;   -- published must be false

-- Note on `authenticated`: an admin or founder session authenticates as the
-- same Postgres role as an ordinary member, so table-level GRANTs cannot tell
-- them apart. Withdrawing a grant from `authenticated` would withdraw it from
-- admins too. The boundary between member and admin is therefore RLS, and only
-- RLS; the grants above are the separate, coarser boundary between anonymous
-- and signed-in, where the two do map cleanly onto Postgres roles.


-- ----------------------------------------------------------------------------
-- 10. Storage
-- ----------------------------------------------------------------------------
-- One bucket is in use: `radio-audio`, written by radioService.uploadMediaFile
-- and read back through getPublicUrl(). No bucket or object policy for it has
-- ever existed in source control; AUDIT.md section 3.5 flagged it as unaudited.
--
-- The bucket stays public-read, deliberately and narrowly: every object in it
-- is broadcast audio intended for the on-air player, and getPublicUrl() has no
-- meaning otherwise. That is a decision about this bucket's contents, not a
-- default — a bucket holding anything else must not be public, and object
-- policies below still govern who may write.
--
-- Writes are restricted to radio staff, and to their own objects. The upload
-- path is currently flat (`<uuid>-<filename>`), so ownership is enforced on
-- storage.objects.owner. The folder rule additionally reserves any
-- `<user-id>/...` prefix to that user, so a future per-user namespace cannot
-- be written across.

do $$
begin
  if to_regnamespace('storage') is null then
    raise notice 'storage schema not present — skipping storage policies';
    return;
  end if;

  insert into storage.buckets (id, name, public)
  values ('radio-audio', 'radio-audio', true)
  on conflict (id) do update set public = true;

  -- Object policies -------------------------------------------------------
  execute $p$ drop policy if exists "radio_audio_public_read" on storage.objects $p$;
  execute $p$
    create policy "radio_audio_public_read" on storage.objects
      for select using (bucket_id = 'radio-audio')
  $p$;

  execute $p$ drop policy if exists "radio_audio_staff_upload" on storage.objects $p$;
  execute $p$
    create policy "radio_audio_staff_upload" on storage.objects
      for insert to authenticated
      with check (
        bucket_id = 'radio-audio'
        and public.is_radio_staff()
        and owner = auth.uid()
        and (
          array_length(storage.foldername(name), 1) is null
          or array_length(storage.foldername(name), 1) = 1
          or (storage.foldername(name))[1] = auth.uid()::text
        )
      )
  $p$;

  execute $p$ drop policy if exists "radio_audio_owner_update" on storage.objects $p$;
  execute $p$
    create policy "radio_audio_owner_update" on storage.objects
      for update to authenticated
      using  (bucket_id = 'radio-audio'
              and (owner = auth.uid() or public.is_radio_manager()))
      with check (bucket_id = 'radio-audio'
              and (owner = auth.uid() or public.is_radio_manager()))
  $p$;

  execute $p$ drop policy if exists "radio_audio_owner_delete" on storage.objects $p$;
  execute $p$
    create policy "radio_audio_owner_delete" on storage.objects
      for delete to authenticated
      using (bucket_id = 'radio-audio'
             and (owner = auth.uid() or public.is_radio_manager()))
  $p$;

  -- Bucket administration is founder-only. Creating a bucket, or flipping one
  -- to public, is the single change most likely to expose everything in it.
  execute $p$ drop policy if exists "buckets_public_read" on storage.buckets $p$;
  execute $p$
    create policy "buckets_public_read" on storage.buckets
      for select using (public = true or public.is_radio_staff())
  $p$;

  execute $p$ drop policy if exists "buckets_founder_manage" on storage.buckets $p$;
  execute $p$
    create policy "buckets_founder_manage" on storage.buckets
      for all using (public.is_founder()) with check (public.is_founder())
  $p$;

exception
  when insufficient_privilege then
    raise notice
      'Insufficient privilege on the storage schema. Re-run section 10 in the '
      'Supabase SQL editor (which runs as postgres) or as supabase_storage_admin.';
end $$;


-- ----------------------------------------------------------------------------
-- 11. Seed idempotency
-- ----------------------------------------------------------------------------
-- Found while rebuilding this schema from empty: the directory seed is NOT
-- idempotent, despite carrying `on conflict do nothing`.
--
-- Both 20260317_create_directory_listings.sql and
-- 20260317_seed_directory_listings.sql INSERT the producer list without
-- naming an id, so every row gets a fresh gen_random_uuid(). The only unique
-- constraint on the table is the primary key, so ON CONFLICT can never match
-- and never fires. Running the seed a second time inserts all 145 listings
-- again — verified locally: two passes produced 290 rows, 145 duplicated
-- names, all of them publicly visible.
--
-- A unique index on the business name makes the existing ON CONFLICT clauses
-- do what they were written to do. Nothing is deleted: if duplicates are
-- already present the index cannot be built, so this reports them and leaves
-- the data alone for a human to merge.

do $$
declare dupes integer;
begin
  select count(*) into dupes from (
    select lower(btrim(name)) from directory_listings
    group by 1 having count(*) > 1
  ) d;

  if dupes > 0 then
    raise notice
      'directory_listings already holds % duplicated business name(s). '
      'Not creating the unique index and NOT deleting anything — merge them '
      'by hand, then re-run this migration. Review with: '
      'select lower(btrim(name)), count(*) from directory_listings '
      'group by 1 having count(*) > 1;', dupes;
  else
    create unique index if not exists directory_listings_name_unique
      on directory_listings (lower(btrim(name)));
  end if;
end $$;

commit;
