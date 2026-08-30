-- ============================================================================
-- pending_events — staging, review, promotion and boundary tests.
--
-- Run AFTER 10_seed_test_identities.sql, on a staging branch or the local
-- harness. Follows the conventions of 20_privilege_escalation_tests.sql:
-- every test runs as a real Postgres role with a real request.jwt.claims, so
-- it takes exactly the path a Supabase client or curl caller would take.
--
-- The whole file runs inside a transaction and rolls back; it changes nothing.
-- ============================================================================

begin;

create temporary table pe_results (
  id serial primary key,
  name text,
  outcome text
) on commit drop;

-- Run `stmt` as `pg_role`, optionally impersonating auth user `sub`.
-- Returns 'OK:<rowcount>' or 'ERR:<sqlstate>'.
create or replace function pg_temp.as_user(pg_role text, sub uuid, stmt text)
returns text language plpgsql as $fn$
declare n int;
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
  return 'ERR:' || SQLSTATE;
end;
$fn$;

create or replace function pg_temp.check(name text, actual text, expected text)
returns void language plpgsql as $fn$
begin
  insert into pe_results(name, outcome)
  values (name, case when actual = expected
                     then 'PASS'
                     else 'FAIL (got ' || actual || ', expected ' || expected || ')' end);
end;
$fn$;

-- Identities from 10_seed_test_identities.sql.
--   admin       eeeeeeee-...05
--   contributor cccccccc-...03
--   member      aaaaaaaa-...01

-- ── 8. Pending-event creation ───────────────────────────────────────────
insert into pending_events (
  id, title, description, start_date, venue, location, website_url,
  category, source_url, source_platform, confidence_score,
  selection_rationale, dedupe_key
) values (
  '11111111-0000-4000-8000-000000000001',
  'Test Pottery Morning', 'A staged candidate used by the test suite.',
  now() + interval '30 days', 'Test Venue', 'Test Town',
  'https://example.org/events/test-pottery',
  'Pottery & Ceramics', 'https://example.org/whats-on', 'example-org',
  73, 'Staged by the test suite.', 'url:https://example.org/events/test-pottery'
);

select pg_temp.check(
  '8. pending event is created with status pending',
  (select status from pending_events where id = '11111111-0000-4000-8000-000000000001'),
  'pending');

select pg_temp.check(
  '8b. discovered_at defaults to now',
  (select (discovered_at is not null)::text from pending_events
    where id = '11111111-0000-4000-8000-000000000001'),
  'true');

-- ── 17. Public approval boundary ────────────────────────────────────────
select pg_temp.check(
  '17. anon cannot read pending_events',
  pg_temp.as_user('anon', null, 'select * from pending_events'),
  'ERR:42501');

select pg_temp.check(
  '17b. anon cannot insert into pending_events',
  pg_temp.as_user('anon', null,
    $$insert into pending_events (title, start_date, category, source_url, source_platform, dedupe_key)
      values ('Anon Injected', now() + interval '5 days', 'Other', 'https://e.org/x', 'x', 'k1')$$),
  'ERR:42501');

select pg_temp.check(
  '17c. a plain member cannot read the review queue',
  pg_temp.as_user('authenticated', 'aaaaaaaa-0000-4000-8000-000000000001',
    'select * from pending_events'),
  'OK:0');

select pg_temp.check(
  '17d. a contributor can read the review queue',
  pg_temp.as_user('authenticated', 'cccccccc-0000-4000-8000-000000000003',
    'select * from pending_events'),
  'OK:1');

select pg_temp.check(
  '17e. a contributor cannot approve',
  pg_temp.as_user('authenticated', 'cccccccc-0000-4000-8000-000000000003',
    $$select approve_pending_event('11111111-0000-4000-8000-000000000001')$$),
  'ERR:42501');

select pg_temp.check(
  '17f. anon cannot execute approve_pending_event',
  pg_temp.as_user('anon', null,
    $$select approve_pending_event('11111111-0000-4000-8000-000000000001')$$),
  'ERR:42501');

-- ── 11. Needs verification keeps it in the queue ────────────────────────
select pg_temp.check(
  '11. admin can mark needs_verification',
  pg_temp.as_user('authenticated', 'eeeeeeee-0000-4000-8000-000000000005',
    $$update pending_events set status = 'needs_verification'
       where id = '11111111-0000-4000-8000-000000000001'$$),
  'OK:1');

select pg_temp.check(
  '11b. it remains available for later review',
  (select status from pending_events where id = '11111111-0000-4000-8000-000000000001'),
  'needs_verification');

-- ── 13. Failure during promotion must not mark the record approved ──────
-- Blank the title directly (bypassing the app) to simulate a candidate that
-- cannot legally be published, then attempt promotion.
update pending_events set title = '   '
 where id = '11111111-0000-4000-8000-000000000001';

select pg_temp.check(
  '13. promotion of an invalid candidate fails',
  pg_temp.as_user('authenticated', 'eeeeeeee-0000-4000-8000-000000000005',
    $$select approve_pending_event('11111111-0000-4000-8000-000000000001')$$),
  'ERR:23514');

select pg_temp.check(
  '13b. the candidate was NOT marked approved',
  (select status from pending_events where id = '11111111-0000-4000-8000-000000000001'),
  'needs_verification');

select pg_temp.check(
  '13c. no event row was created by the failed promotion',
  (select count(*)::text from events where title = '   '),
  '0');

-- Restore a valid title for the promotion tests.
update pending_events set title = 'Test Pottery Morning'
 where id = '11111111-0000-4000-8000-000000000001';

-- ── 9 & 12. Approval promotes to events with approved = true ────────────
select pg_temp.check(
  '9. admin can approve',
  pg_temp.as_user('authenticated', 'eeeeeeee-0000-4000-8000-000000000005',
    $$select approve_pending_event('11111111-0000-4000-8000-000000000001')$$),
  'OK:1');

select pg_temp.check(
  '9b. pending record is now approved',
  (select status from pending_events where id = '11111111-0000-4000-8000-000000000001'),
  'approved');

select pg_temp.check(
  '9c. reviewer and timestamp were recorded',
  (select (reviewed_by is not null and reviewed_at is not null)::text
     from pending_events where id = '11111111-0000-4000-8000-000000000001'),
  'true');

select pg_temp.check(
  '12. the event now exists in events',
  (select count(*)::text from events where title = 'Test Pottery Morning'),
  '1');

select pg_temp.check(
  '12b. the promoted event is approved = true',
  (select approved::text from events where title = 'Test Pottery Morning'),
  'true');

select pg_temp.check(
  '12c. category carried across as craft_type',
  (select craft_type from events where title = 'Test Pottery Morning'),
  'Pottery & Ceramics');

select pg_temp.check(
  '12d. the source link is preserved on the published event',
  (select (website_url is not null)::text from events where title = 'Test Pottery Morning'),
  'true');

select pg_temp.check(
  '9d. approving twice is refused',
  pg_temp.as_user('authenticated', 'eeeeeeee-0000-4000-8000-000000000005',
    $$select approve_pending_event('11111111-0000-4000-8000-000000000001')$$),
  'ERR:23505');

-- ── 10. Rejection keeps the record and stores the reason ────────────────
insert into pending_events (
  id, title, start_date, category, source_url, source_platform, dedupe_key
) values (
  '22222222-0000-4000-8000-000000000002',
  'Test Event To Reject', now() + interval '20 days',
  'Other', 'https://example.org/whats-on', 'example-org', 'tdv:test reject|x|y'
);

select pg_temp.check(
  '10. a rejection without a reason is refused',
  pg_temp.as_user('authenticated', 'eeeeeeee-0000-4000-8000-000000000005',
    $$update pending_events set status = 'rejected'
       where id = '22222222-0000-4000-8000-000000000002'$$),
  'ERR:23514');

select pg_temp.check(
  '10b. a rejection with a reason succeeds',
  pg_temp.as_user('authenticated', 'eeeeeeee-0000-4000-8000-000000000005',
    $$update pending_events
         set status = 'rejected', rejection_reason = 'Not a craft or produce event.'
       where id = '22222222-0000-4000-8000-000000000002'$$),
  'OK:1');

select pg_temp.check(
  '10c. the rejected record is kept, not deleted',
  (select count(*)::text from pending_events
    where id = '22222222-0000-4000-8000-000000000002'),
  '1');

select pg_temp.check(
  '10d. the rejection reason is stored for future dedupe',
  (select rejection_reason from pending_events
    where id = '22222222-0000-4000-8000-000000000002'),
  'Not a craft or produce event.');

select pg_temp.check(
  '10e. rejection did not publish anything',
  (select count(*)::text from events where title = 'Test Event To Reject'),
  '0');

-- ── Dedupe key uniqueness is enforced by the database ───────────────────
select pg_temp.check(
  'dedupe. a duplicate dedupe_key is refused by the unique index',
  pg_temp.as_user('authenticated', 'eeeeeeee-0000-4000-8000-000000000005',
    $$insert into pending_events (title, start_date, category, source_url, source_platform, dedupe_key)
      values ('Duplicate', now() + interval '9 days', 'Other',
              'https://example.org/whats-on', 'example-org',
              'url:https://example.org/events/test-pottery')$$),
  'ERR:23505');

-- ── Report ──────────────────────────────────────────────────────────────
select name, outcome from pe_results order by id;

do $$
declare failures int;
begin
  select count(*) into failures from pe_results where outcome <> 'PASS';
  if failures > 0 then
    raise exception '% pending_events test(s) FAILED', failures;
  end if;
  raise notice 'All % pending_events tests passed.', (select count(*) from pe_results);
end $$;

rollback;
