-- ============================================================================
-- TFT permissions matrix — privilege escalation and role separation tests
--
-- Run AFTER 10_seed_test_identities.sql, on a staging branch or the local
-- harness. Every test runs as a real Postgres role (anon / authenticated) with
-- a real request.jwt.claims — i.e. it goes through exactly the path a caller
-- using the Supabase client or curl would take, bypassing the frontend
-- entirely. That is the point: nothing here is protected by React.
--
-- Output is one row per test with PASS or FAIL.
-- The whole file runs inside a transaction and rolls back; it changes nothing.
-- ============================================================================

begin;

create temporary table tft_results (
  seq       serial primary key,
  area      text,
  test      text,
  expected  text,
  actual    text,
  status    text
);

-- Runs `stmt` as `pg_role` with `sub` as the authenticated user id, and
-- reports either OK:<rows affected> or ERR:<sqlstate>.
create or replace function pg_temp.run_as(pg_role text, sub uuid, stmt text)
returns text
language plpgsql
as $fn$
declare n integer;
begin
  execute format('set local role %I', pg_role);
  perform set_config(
    'request.jwt.claims',
    case when sub is null
         then '{"role":"anon"}'
         else json_build_object('sub', sub, 'role', 'authenticated')::text end,
    true);
  execute stmt;
  get diagnostics n = row_count;
  reset role;
  return 'OK:' || n;
exception when others then
  reset role;
  return 'ERR:' || sqlstate;
end;
$fn$;

create or replace function pg_temp.check(
  p_area text, p_test text, p_expected text, p_actual text)
returns void language sql as $fn$
  insert into tft_results (area, test, expected, actual, status)
  values (p_area, p_test, p_expected, p_actual,
          case when p_actual = p_expected then 'PASS' else 'FAIL' end);
$fn$;

-- Identities from the seed.
--   A = aaaa… member          B = bbbb… member
--   C = cccc… contributor     D = dddd… radio_manager
--   E = eeee… admin           F = ffff… founder

-- ---------------------------------------------------------------------------
-- ATTACK 1 — a normal user promotes themselves
-- ---------------------------------------------------------------------------
select pg_temp.check('escalation', 'A1  member sets own role = admin',
  'ERR:P0001',
  pg_temp.run_as('authenticated', 'aaaaaaaa-0000-4000-8000-000000000001',
    $$update profiles set role = 'admin'
      where id = 'aaaaaaaa-0000-4000-8000-000000000001'$$));

select pg_temp.check('escalation', 'A1b member sets own is_admin = true',
  'OK:1',   -- the write is allowed but the trigger derives is_admin from role
  pg_temp.run_as('authenticated', 'aaaaaaaa-0000-4000-8000-000000000001',
    $$update profiles set is_admin = true
      where id = 'aaaaaaaa-0000-4000-8000-000000000001'$$));

select pg_temp.check('escalation', 'A1c …and is_admin is still false',
  'false',
  (select is_admin::text from profiles
   where id = 'aaaaaaaa-0000-4000-8000-000000000001'));

select pg_temp.check('escalation', 'A1d member sets role = founder',
  'ERR:P0001',
  pg_temp.run_as('authenticated', 'aaaaaaaa-0000-4000-8000-000000000001',
    $$update profiles set role = 'founder'
      where id = 'aaaaaaaa-0000-4000-8000-000000000001'$$));

select pg_temp.check('escalation', 'A1e admin promotes self to founder',
  'ERR:P0001',
  pg_temp.run_as('authenticated', 'eeeeeeee-0000-4000-8000-000000000005',
    $$update profiles set role = 'founder'
      where id = 'eeeeeeee-0000-4000-8000-000000000005'$$));

-- No policy on profiles matches another user's row for a non-founder, so the
-- statement matches zero rows. A no-op is the denial here, not an error.
select pg_temp.check('escalation', 'A1f admin promotes another member to admin',
  'OK:0',
  pg_temp.run_as('authenticated', 'eeeeeeee-0000-4000-8000-000000000005',
    $$update profiles set role = 'admin'
      where id = 'aaaaaaaa-0000-4000-8000-000000000001'$$));

-- ---------------------------------------------------------------------------
-- ATTACK 2 — read another user's private profile
-- ---------------------------------------------------------------------------
select pg_temp.check('isolation', 'A2  member A reads member B profile',
  'OK:0',
  pg_temp.run_as('authenticated', 'aaaaaaaa-0000-4000-8000-000000000001',
    $$select 1 from profiles where id = 'bbbbbbbb-0000-4000-8000-000000000002'$$));

select pg_temp.check('isolation', 'A2b member A reads own profile',
  'OK:1',
  pg_temp.run_as('authenticated', 'aaaaaaaa-0000-4000-8000-000000000001',
    $$select 1 from profiles where id = 'aaaaaaaa-0000-4000-8000-000000000001'$$));

select pg_temp.check('isolation', 'A2c contributor enumerates all profiles',
  'OK:1',   -- their own row only
  pg_temp.run_as('authenticated', 'cccccccc-0000-4000-8000-000000000003',
    $$select 1 from profiles$$));

-- ---------------------------------------------------------------------------
-- ATTACK 3 — update another user's record
-- ---------------------------------------------------------------------------
select pg_temp.check('isolation', 'A3  A updates B claimed_vendors row',
  'OK:0',
  pg_temp.run_as('authenticated', 'aaaaaaaa-0000-4000-8000-000000000001',
    $$update claimed_vendors set vendor_name = 'hijacked'
      where id = '22222222-0000-4000-8000-000000000002'$$));

select pg_temp.check('isolation', 'A3b A updates own claimed_vendors row',
  'OK:1',
  pg_temp.run_as('authenticated', 'aaaaaaaa-0000-4000-8000-000000000001',
    $$update claimed_vendors set vendor_name = 'User A Bakery Ltd'
      where id = '11111111-0000-4000-8000-000000000001'$$));

select pg_temp.check('isolation', 'A3c A self-approves own listing',
  'ERR:42501',
  pg_temp.run_as('authenticated', 'aaaaaaaa-0000-4000-8000-000000000001',
    $$update claimed_vendors set approved = true, published = true
      where id = '11111111-0000-4000-8000-000000000001'$$));

-- ---------------------------------------------------------------------------
-- ATTACK 4 — delete another user's record
-- ---------------------------------------------------------------------------
select pg_temp.check('isolation', 'A4  contributor deletes founder note',
  'OK:0',
  pg_temp.run_as('authenticated', 'cccccccc-0000-4000-8000-000000000003',
    $$delete from notes where id = '33333333-0000-4000-8000-000000000003'$$));

select pg_temp.check('isolation', 'A4b contributor reads founder note',
  'OK:0',
  pg_temp.run_as('authenticated', 'cccccccc-0000-4000-8000-000000000003',
    $$select 1 from notes where id = '33333333-0000-4000-8000-000000000003'$$));

select pg_temp.check('isolation', 'A4c contributor deletes own note',
  'OK:1',
  pg_temp.run_as('authenticated', 'cccccccc-0000-4000-8000-000000000003',
    $$delete from notes where id = '44444444-0000-4000-8000-000000000004'$$));

select pg_temp.check('isolation', 'A4d contributor deletes manager radio_media',
  'OK:0',
  pg_temp.run_as('authenticated', 'cccccccc-0000-4000-8000-000000000003',
    $$delete from radio_media where id = '66666666-0000-4000-8000-000000000006'$$));

-- ---------------------------------------------------------------------------
-- ATTACK 5 — unauthenticated read of private tables
-- ---------------------------------------------------------------------------
select pg_temp.check('anon', 'A5  anon reads raw_leads',        'OK:0',
  pg_temp.run_as('anon', null, 'select 1 from raw_leads'));
select pg_temp.check('anon', 'A5b anon reads qualified_leads',  'OK:0',
  pg_temp.run_as('anon', null, 'select 1 from qualified_leads'));
select pg_temp.check('anon', 'A5c anon reads enriched_leads',   'OK:0',
  pg_temp.run_as('anon', null, 'select 1 from enriched_leads'));
select pg_temp.check('anon', 'A5d anon reads outreach_log',     'OK:0',
  pg_temp.run_as('anon', null, 'select 1 from outreach_log'));
select pg_temp.check('anon', 'A5e anon reads staff',            'OK:0',
  pg_temp.run_as('anon', null, 'select 1 from staff'));
select pg_temp.check('anon', 'A5f anon reads system_controls',  'OK:0',
  pg_temp.run_as('anon', null, 'select 1 from system_controls'));
select pg_temp.check('anon', 'A5g anon reads notes',            'OK:0',
  pg_temp.run_as('anon', null, 'select 1 from notes'));
select pg_temp.check('anon', 'A5h anon reads claimed_vendors',  'OK:0',
  pg_temp.run_as('anon', null, 'select 1 from claimed_vendors'));
select pg_temp.check('anon', 'A5i anon reads applications',     'OK:0',
  pg_temp.run_as('anon', null, 'select 1 from applications'));
select pg_temp.check('anon', 'A5j anon reads feedback',         'OK:0',
  pg_temp.run_as('anon', null, 'select 1 from feedback_book_responses'));
select pg_temp.check('anon', 'A5k anon reads pending_listings', 'OK:0',
  pg_temp.run_as('anon', null, 'select 1 from pending_listings'));
select pg_temp.check('anon', 'A5l anon reads profiles',         'ERR:42501',
  pg_temp.run_as('anon', null, 'select 1 from profiles'));
select pg_temp.check('anon', 'A5m anon reads security_audit_log','OK:0',
  pg_temp.run_as('anon', null, 'select 1 from security_audit_log'));
select pg_temp.check('anon', 'A5n anon reads sponsor contact details', 'OK:0',
  pg_temp.run_as('anon', null, 'select 1 from radio_sponsors'));
select pg_temp.check('anon', 'A5o anon reads directory_listings table', 'ERR:42501',
  pg_temp.run_as('anon', null, 'select 1 from directory_listings'));

-- ---------------------------------------------------------------------------
-- ATTACK 6 — unauthenticated writes
-- ---------------------------------------------------------------------------
select pg_temp.check('anon', 'A6  anon inserts a directory listing', 'ERR:42501',
  pg_temp.run_as('anon', null,
    $$insert into directory_listings (name, status) values ('Fake Co','active')$$));
select pg_temp.check('anon', 'A6b anon updates an event', 'ERR:42501',
  pg_temp.run_as('anon', null, $$update events set approved = true$$));
select pg_temp.check('anon', 'A6c anon deletes a maker story', 'ERR:42501',
  pg_temp.run_as('anon', null, $$delete from maker_stories$$));
select pg_temp.check('anon', 'A6d anon inserts a profile', 'ERR:42501',
  pg_temp.run_as('anon', null,
    $$insert into profiles (id, role) values (gen_random_uuid(), 'founder')$$));
select pg_temp.check('anon', 'A6e anon writes system_controls', 'ERR:42501',
  pg_temp.run_as('anon', null, $$update system_controls set value = true$$));
select pg_temp.check('anon', 'A6f anon submits a self-published story', 'ERR:42501',
  pg_temp.run_as('anon', null,
    $$insert into maker_stories (maker_name, published) values ('X', true)$$));

-- ---------------------------------------------------------------------------
-- ATTACK 7 — contributor attempts admin-only operations
-- ---------------------------------------------------------------------------
select pg_temp.check('roles', 'A7  contributor writes system_controls', 'OK:0',
  pg_temp.run_as('authenticated', 'cccccccc-0000-4000-8000-000000000003',
    $$update system_controls set value = true$$));
select pg_temp.check('roles', 'A7b contributor reads staff', 'OK:0',
  pg_temp.run_as('authenticated', 'cccccccc-0000-4000-8000-000000000003',
    $$select 1 from staff$$));
select pg_temp.check('roles', 'A7c contributor reads the lead pipeline', 'OK:0',
  pg_temp.run_as('authenticated', 'cccccccc-0000-4000-8000-000000000003',
    $$select 1 from enriched_leads$$));
select pg_temp.check('roles', 'A7d contributor reads sponsor contact details', 'OK:0',
  pg_temp.run_as('authenticated', 'cccccccc-0000-4000-8000-000000000003',
    $$select 1 from radio_sponsors$$));
select pg_temp.check('roles', 'A7e contributor reads applications', 'OK:0',
  pg_temp.run_as('authenticated', 'cccccccc-0000-4000-8000-000000000003',
    $$select 1 from applications$$));
select pg_temp.check('roles', 'A7f admin reads staff (founder-only)', 'OK:0',
  pg_temp.run_as('authenticated', 'eeeeeeee-0000-4000-8000-000000000005',
    $$select 1 from staff$$));
select pg_temp.check('roles', 'A7g admin writes system_controls (founder-only)', 'OK:0',
  pg_temp.run_as('authenticated', 'eeeeeeee-0000-4000-8000-000000000005',
    $$update system_controls set value = true$$));

select pg_temp.check('roles', 'A7h contributor deletes a radio programme', 'OK:0',
  pg_temp.run_as('authenticated', 'cccccccc-0000-4000-8000-000000000003',
    $$delete from radio_shows$$));

-- ---------------------------------------------------------------------------
-- ATTACK 9 — alter your own ownership / creator field
-- ---------------------------------------------------------------------------
select pg_temp.check('escalation', 'A9  A reassigns own listing to B', 'ERR:42501',
  pg_temp.run_as('authenticated', 'aaaaaaaa-0000-4000-8000-000000000001',
    $$update claimed_vendors set user_id = 'bbbbbbbb-0000-4000-8000-000000000002'
      where id = '11111111-0000-4000-8000-000000000001'$$));

select pg_temp.check('escalation', 'A9b A inserts a listing owned by B', 'ERR:42501',
  pg_temp.run_as('authenticated', 'aaaaaaaa-0000-4000-8000-000000000001',
    $$insert into claimed_vendors (user_id, vendor_name)
      values ('bbbbbbbb-0000-4000-8000-000000000002', 'Impersonated')$$));

select pg_temp.check('escalation', 'A9c contributor reassigns own media to manager',
  'ERR:42501',
  pg_temp.run_as('authenticated', 'cccccccc-0000-4000-8000-000000000003',
    $$update radio_media set created_by = 'dddddddd-0000-4000-8000-000000000004'
      where id = '55555555-0000-4000-8000-000000000005'$$));

select pg_temp.check('escalation', 'A9d contributor uploads media as someone else',
  'ERR:42501',
  pg_temp.run_as('authenticated', 'cccccccc-0000-4000-8000-000000000003',
    $$insert into radio_media (title, media_type, audio_url, created_by)
      values ('Spoof','music','https://x.test/a.mp3',
              'dddddddd-0000-4000-8000-000000000004')$$));

select pg_temp.check('escalation', 'A9e member changes own profile id', 'ERR:P0001',
  pg_temp.run_as('authenticated', 'aaaaaaaa-0000-4000-8000-000000000001',
    $$update profiles set id = 'bbbbbbbb-0000-4000-8000-000000000002'
      where id = 'aaaaaaaa-0000-4000-8000-000000000001'$$));

-- ---------------------------------------------------------------------------
-- ATTACK 10 — another user's storage objects
-- ---------------------------------------------------------------------------
select pg_temp.check('storage', 'A10  contributor deletes manager audio', 'OK:0',
  pg_temp.run_as('authenticated', 'cccccccc-0000-4000-8000-000000000003',
    $$delete from storage.objects
      where id = '99999999-0000-4000-8000-000000000009'$$));

select pg_temp.check('storage', 'A10b contributor overwrites manager audio', 'OK:0',
  pg_temp.run_as('authenticated', 'cccccccc-0000-4000-8000-000000000003',
    $$update storage.objects set name = 'hijacked.mp3'
      where id = '99999999-0000-4000-8000-000000000009'$$));

select pg_temp.check('storage', 'A10c contributor uploads into manager namespace',
  'ERR:42501',
  pg_temp.run_as('authenticated', 'cccccccc-0000-4000-8000-000000000003',
    $$insert into storage.objects (bucket_id, name, owner)
      values ('radio-audio',
              'dddddddd-0000-4000-8000-000000000004/sneaky.mp3',
              'cccccccc-0000-4000-8000-000000000003')$$));

select pg_temp.check('storage', 'A10d contributor uploads owned by another user',
  'ERR:42501',
  pg_temp.run_as('authenticated', 'cccccccc-0000-4000-8000-000000000003',
    $$insert into storage.objects (bucket_id, name, owner)
      values ('radio-audio', 'x.mp3',
              'dddddddd-0000-4000-8000-000000000004')$$));

select pg_temp.check('storage', 'A10e member (non-staff) uploads audio', 'ERR:42501',
  pg_temp.run_as('authenticated', 'aaaaaaaa-0000-4000-8000-000000000001',
    $$insert into storage.objects (bucket_id, name, owner)
      values ('radio-audio', 'member.mp3',
              'aaaaaaaa-0000-4000-8000-000000000001')$$));

select pg_temp.check('storage', 'A10f contributor deletes own audio', 'OK:1',
  pg_temp.run_as('authenticated', 'cccccccc-0000-4000-8000-000000000003',
    $$delete from storage.objects
      where id = '88888888-0000-4000-8000-000000000008'$$));

select pg_temp.check('storage', 'A10g member creates a public bucket', 'ERR:42501',
  pg_temp.run_as('authenticated', 'aaaaaaaa-0000-4000-8000-000000000001',
    $$insert into storage.buckets (id, name, public)
      values ('exfil','exfil',true)$$));

-- ---------------------------------------------------------------------------
-- AUDIT LOG
-- ---------------------------------------------------------------------------
select pg_temp.check('audit', 'AU1 member reads audit log', 'OK:0',
  pg_temp.run_as('authenticated', 'aaaaaaaa-0000-4000-8000-000000000001',
    $$select 1 from security_audit_log$$));

select pg_temp.check('audit', 'AU2 member fabricates an admin action', 'ERR:42501',
  pg_temp.run_as('authenticated', 'aaaaaaaa-0000-4000-8000-000000000001',
    $$insert into security_audit_log (action) values ('role.granted')$$));

select pg_temp.check('audit', 'AU3 admin fabricates an admin action', 'ERR:42501',
  pg_temp.run_as('authenticated', 'eeeeeeee-0000-4000-8000-000000000005',
    $$insert into security_audit_log (action) values ('role.granted')$$));

select pg_temp.check('audit', 'AU4 member calls record_audit_event directly', 'ERR:42501',
  pg_temp.run_as('authenticated', 'aaaaaaaa-0000-4000-8000-000000000001',
    $$select public.record_audit_event('role.granted','profiles','x')$$));

-- Generate one auditable event, then check who can see it.
insert into security_audit_log (actor_id, action, table_name, record_id)
  values ('ffffffff-0000-4000-8000-000000000006', 'role.granted', 'profiles', 'seed');
insert into security_audit_log (actor_id, action, table_name, record_id)
  values ('eeeeeeee-0000-4000-8000-000000000005', 'listing.moderated', 'claimed_vendors', 'seed');

select pg_temp.check('audit', 'AU5 founder sees role-grant history', 'OK:1',
  pg_temp.run_as('authenticated', 'ffffffff-0000-4000-8000-000000000006',
    $$select 1 from security_audit_log where action = 'role.granted' limit 1$$));

select pg_temp.check('audit', 'AU6 admin cannot see role-grant history', 'OK:0',
  pg_temp.run_as('authenticated', 'eeeeeeee-0000-4000-8000-000000000005',
    $$select 1 from security_audit_log where action = 'role.granted'$$));

select pg_temp.check('audit', 'AU7 admin sees operational history', 'OK:1',
  pg_temp.run_as('authenticated', 'eeeeeeee-0000-4000-8000-000000000005',
    $$select 1 from security_audit_log where action = 'listing.moderated'$$));

select pg_temp.check('audit', 'AU8 founder cannot edit an audit record', 'ERR:42501',
  pg_temp.run_as('authenticated', 'ffffffff-0000-4000-8000-000000000006',
    $$update security_audit_log set action = 'nothing.happened'$$));

select pg_temp.check('audit', 'AU9 founder cannot delete an audit record', 'ERR:42501',
  pg_temp.run_as('authenticated', 'ffffffff-0000-4000-8000-000000000006',
    $$delete from security_audit_log$$));

-- The service_role key bypasses RLS and keeps its table grants, so it reaches
-- the append-only trigger. Not even the service key can rewrite history.
select pg_temp.check('audit', 'AU10 service_role cannot edit an audit record',
  'ERR:P0001',
  pg_temp.run_as('service_role', null,
    $$update security_audit_log set action = 'nothing.happened'$$));

select pg_temp.check('audit', 'AU11 service_role cannot delete an audit record',
  'ERR:P0001',
  pg_temp.run_as('service_role', null,
    $$delete from security_audit_log$$));

-- ---------------------------------------------------------------------------
-- PRIVATE DATA EXPOSURE — the public directory
-- ---------------------------------------------------------------------------
select pg_temp.check('exposure', 'EX1 anon reads the public directory view',
  'OK:' || (select count(*) from directory_listings
            where status = 'active' and outreach_opted_out = false),
  pg_temp.run_as('anon', null, $$select 1 from public_directory_listings$$));

select pg_temp.check('exposure', 'EX2 public view hides free-tier contact email',
  '0',
  (select count(*)::text from public_directory_listings
   where tier = 'free' and contact_email is not null));

select pg_temp.check('exposure', 'EX3 public view exposes no moderation columns',
  '0',
  (select count(*)::text from information_schema.columns
   where table_name = 'public_directory_listings'
     and column_name in ('outreach_status','outreach_date','response','claimed',
                         'outreach_approved','outreach_approved_by',
                         'outreach_approved_at','outreach_opted_out')));

select pg_temp.check('exposure', 'EX4 member cannot read the base table either',
  'OK:0',
  pg_temp.run_as('authenticated', 'aaaaaaaa-0000-4000-8000-000000000001',
    $$select 1 from directory_listings$$));

select pg_temp.check('exposure', 'EX5 anon cannot read unapproved event line-ups',
  'OK:0',
  pg_temp.run_as('anon', null, $$select 1 from event_makers$$));

-- Views run with the definer's rights, so a write through one bypasses the base
-- table's RLS. Read-only privileges are the only thing stopping it.
select pg_temp.check('exposure', 'EX6 anon deletes sponsors via the public view',
  'ERR:42501',
  pg_temp.run_as('anon', null, $$delete from public_radio_sponsors$$));

select pg_temp.check('exposure', 'EX7 anon updates sponsors via the public view',
  'ERR:42501',
  pg_temp.run_as('anon', null,
    $$update public_sponsor_rotations set name = 'defaced'$$));

select pg_temp.check('exposure', 'EX8 member deletes sponsors via the public view',
  'ERR:42501',
  pg_temp.run_as('authenticated', 'aaaaaaaa-0000-4000-8000-000000000001',
    $$delete from public_radio_sponsors$$));

select pg_temp.check('exposure', 'EX9 anon writes through the directory view',
  'ERR:42501',
  pg_temp.run_as('anon', null,
    $$insert into public_directory_listings (id, name) values (gen_random_uuid(),'X')$$));

-- ---------------------------------------------------------------------------
-- POSITIVE PATHS — prove the site still works
-- ---------------------------------------------------------------------------
select pg_temp.check('works', 'W1 anon reads approved events', 'OK:0',
  pg_temp.run_as('anon', null, $$select 1 from events where approved = true$$));

select pg_temp.check('works', 'W2 anon submits an application', 'OK:1',
  pg_temp.run_as('anon', null,
    $$insert into applications (name, email) values ('Applicant','a@x.test')$$));

select pg_temp.check('works', 'W3 anon submits feedback', 'OK:1',
  pg_temp.run_as('anon', null,
    $$insert into feedback_book_responses (name) values ('Visitor')$$));

select pg_temp.check('works', 'W4 anon submits an unpublished story', 'OK:1',
  pg_temp.run_as('anon', null,
    $$insert into maker_stories (maker_name, published) values ('Maker', false)$$));

select pg_temp.check('works', 'W5 member updates own display name', 'OK:1',
  pg_temp.run_as('authenticated', 'aaaaaaaa-0000-4000-8000-000000000001',
    $$update profiles set display_name = 'Ann'
      where id = 'aaaaaaaa-0000-4000-8000-000000000001'$$));

select pg_temp.check('works', 'W6 contributor adds radio media', 'OK:1',
  pg_temp.run_as('authenticated', 'cccccccc-0000-4000-8000-000000000003',
    $$insert into radio_media (title, media_type, audio_url)
      values ('New Track','music','https://x.test/n.mp3')$$));

select pg_temp.check('works', 'W7 contributor edits own media', 'OK:1',
  pg_temp.run_as('authenticated', 'cccccccc-0000-4000-8000-000000000003',
    $$update radio_media set title = 'Renamed'
      where id = '55555555-0000-4000-8000-000000000005'$$));

select pg_temp.check('works', 'W8 radio manager edits anyone''s media', 'OK:1',
  pg_temp.run_as('authenticated', 'dddddddd-0000-4000-8000-000000000004',
    $$update radio_media set title = 'Manager Edit'
      where id = '55555555-0000-4000-8000-000000000005'$$));

select pg_temp.check('works', 'W9 admin manages the directory',
  'OK:' || (select count(*) from directory_listings),
  pg_temp.run_as('authenticated', 'eeeeeeee-0000-4000-8000-000000000005',
    $$select 1 from directory_listings$$));

select pg_temp.check('works', 'W10 admin reads the lead pipeline', 'OK:1',
  pg_temp.run_as('authenticated', 'eeeeeeee-0000-4000-8000-000000000005',
    $$select 1 from enriched_leads$$));

select pg_temp.check('works', 'W11 founder reads staff records', 'OK:0',
  pg_temp.run_as('authenticated', 'ffffffff-0000-4000-8000-000000000006',
    $$select 1 from staff$$));

select pg_temp.check('works', 'W12 founder writes system controls', 'OK:5',
  pg_temp.run_as('authenticated', 'ffffffff-0000-4000-8000-000000000006',
    $$update system_controls set value = false$$));

select pg_temp.check('works', 'W13 founder grants a member the admin role', 'OK:1',
  pg_temp.run_as('authenticated', 'ffffffff-0000-4000-8000-000000000006',
    $$update profiles set role = 'admin'
      where id = 'bbbbbbbb-0000-4000-8000-000000000002'$$));

select pg_temp.check('works', 'W14 anon claims an invited listing', 'OK:1',
  pg_temp.run_as('anon', null,
    $$select public.submit_listing_claim(
        '77777777-0000-4000-8000-000000000007',
        'Invited Producer','Dairy','Kent','bio','x.test')$$));

select pg_temp.check('works', 'W15 the same listing cannot be claimed twice',
  'ERR:P0001',
  pg_temp.run_as('anon', null,
    $$select public.submit_listing_claim(
        '77777777-0000-4000-8000-000000000007',
        'Impostor','Dairy','Kent','bio','x.test')$$));

-- ---------------------------------------------------------------------------
-- STRUCTURAL CHECKS
-- ---------------------------------------------------------------------------
select pg_temp.check('structure', 'S1 every public table has RLS enabled', '0',
  (select count(*)::text from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity));

select pg_temp.check('structure', 'S2 no RLS table is left with zero policies', '0',
  (select count(*)::text from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity
     and not exists (select 1 from pg_policy p where p.polrelid = c.oid)));

select pg_temp.check('structure', 'S3 no UPDATE policy is missing WITH CHECK', '0',
  (select count(*)::text from pg_policies
   where schemaname = 'public' and cmd in ('UPDATE','ALL')
     and with_check is null));

select pg_temp.check('structure', 'S4 every SECURITY DEFINER function pins search_path',
  '0',
  (select count(*)::text from pg_proc p
   join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.prosecdef
     and not exists (select 1 from unnest(coalesce(p.proconfig, '{}'))  cfg
                     where cfg like 'search_path=%')));

select pg_temp.check('structure', 'S5 no policy reads raw_user_meta_data', '0',
  (select count(*)::text from pg_policies
   where schemaname = 'public'
     and (coalesce(qual,'') || coalesce(with_check,'')) like '%raw_user_meta_data%'));

-- ---------------------------------------------------------------------------
-- RESULTS
-- ---------------------------------------------------------------------------
select area, test, expected, actual, status from tft_results order by seq;

select status, count(*) from tft_results group by status order by status;

do $$
declare failed integer;
begin
  select count(*) into failed from tft_results where status = 'FAIL';
  if failed > 0 then
    raise warning '% test(s) FAILED', failed;
  else
    raise notice 'All % tests passed', (select count(*) from tft_results);
  end if;
end $$;

rollback;
