\set ON_ERROR_STOP off
\pset pager off

-- Supabase grants these by default on public tables; replicate locally.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant execute on all functions in schema public to anon, authenticated;

-- Seed test fixtures AS OWNER (bypasses RLS), so we have something to probe.
insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'founder@test', '{"role":"founder"}'),
  ('22222222-2222-2222-2222-222222222222', 'listener@test', '{"role":"customer"}')
on conflict (id) do nothing;

insert into radio_presenters (id, name, slug, status, is_active) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Published Presenter', 'pub-presenter', 'published', true),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Draft Presenter', 'draft-presenter', 'draft', true)
on conflict (id) do nothing;

insert into radio_shows (id, title, content_status) values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'Published Programme', 'published'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'Draft Programme', 'draft')
on conflict (id) do nothing;

insert into radio_episodes (id, programme_id, title, status) values
  ('cccccccc-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', 'Published Episode', 'published'),
  ('cccccccc-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000001', 'Draft Episode', 'draft')
on conflict (id) do nothing;

insert into radio_announcements (id, title, content, status, is_active) values
  ('dddddddd-0000-0000-0000-000000000001', 'Published Notice', 'x', 'published', true),
  ('dddddddd-0000-0000-0000-000000000002', 'Draft Notice', 'x', 'draft', true)
on conflict (id) do nothing;

insert into radio_media (id, title, media_type, audio_url, is_active, content_status, licence_status) values
  ('eeeeeeee-0000-0000-0000-000000000001', 'Cleared Track', 'music', 'u', true, 'published', 'cleared'),
  ('eeeeeeee-0000-0000-0000-000000000002', 'Unchecked Track', 'music', 'u', true, 'published', 'unknown')
on conflict (id) do nothing;

insert into radio_news (id, title, status, is_verified) values
  ('ffffffff-0000-0000-0000-000000000001', 'Verified Item', 'published', true),
  ('ffffffff-0000-0000-0000-000000000002', 'Unverified Item', 'published', false)
on conflict (id) do nothing;

insert into radio_submissions (id, submission_type, submitter_name, submitter_email, title)
values ('99999999-0000-0000-0000-000000000001', 'music', 'A Person', 'a@test', 'A submission')
on conflict (id) do nothing;

\echo ''
\echo '================ ANONYMOUS LISTENER ================'
set role anon;
set request.jwt.claim.role = 'anon';

\echo '-- presenters visible to public (expect ONLY Published Presenter):'
select name from radio_presenters order by name;
\echo '-- episodes visible to public (expect ONLY Published Episode):'
select title from radio_episodes order by title;
\echo '-- announcements visible to public (expect ONLY Published Notice):'
select title from radio_announcements order by title;
\echo '-- media visible to public (expect ONLY Cleared Track):'
select title from radio_media order by title;
\echo '-- news visible to public (expect ONLY Verified Item):'
select title from radio_news order by title;
\echo '-- submissions visible to public (expect ZERO ROWS):'
select count(*) as visible_submissions from radio_submissions;
\echo '-- ad slots visible to public (expect ZERO ROWS):'
select count(*) as visible_ad_slots from radio_ad_slots;

\echo ''
\echo '-- anon INSERT a pending submission (expect SUCCESS):'
insert into radio_submissions (submission_type, submitter_name, submitter_email, title)
values ('music', 'Public Person', 'p@test', 'Public submission');

\echo '-- anon INSERT a PRE-APPROVED submission (expect POLICY VIOLATION):'
insert into radio_submissions (submission_type, submitter_name, submitter_email, title, status)
values ('music', 'Sneaky', 's@test', 'Self-approved', 'approved');

\echo '-- anon CREATE a programme (expect POLICY VIOLATION):'
insert into radio_shows (title) values ('Pirate Programme');

\echo '-- anon PUBLISH a draft presenter (expect 0 rows updated):'
update radio_presenters set status = 'published' where slug = 'draft-presenter';

\echo '-- anon EDIT station settings (expect 0 rows updated):'
update radio_station_settings set stream_url = 'http://attacker.example/stream';

\echo '-- anon DELETE an episode (expect 0 rows deleted):'
delete from radio_episodes where title = 'Published Episode';

reset role;

\echo ''
\echo '================ AUTHENTICATED LISTENER (role=customer) ================'
set role authenticated;
set request.jwt.claim.role = 'authenticated';
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

\echo '-- radio_is_staff() for a plain listener (expect f):'
select radio_is_staff() as is_staff;
\echo '-- listener CREATE a programme (expect POLICY VIOLATION):'
insert into radio_shows (title) values ('Listener Programme');
\echo '-- listener reads draft programmes (expect ZERO):'
select count(*) as draft_visible from radio_shows where content_status = 'draft';

reset role;
reset request.jwt.claim.sub;

\echo ''
\echo '================ FOUNDER / STAFF ================'
set role authenticated;
set request.jwt.claim.role = 'authenticated';
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

\echo '-- radio_is_staff() for founder (expect t):'
select radio_is_staff() as is_staff;
\echo '-- founder sees ALL presenters (expect 2):'
select count(*) as all_presenters from radio_presenters;
\echo '-- founder sees the moderation queue (expect >=1):'
select count(*) as queue_size from radio_submissions;
\echo '-- founder CREATE a programme (expect SUCCESS):'
insert into radio_shows (title, content_status) values ('Founder Programme', 'draft');
\echo '-- founder configures the stream (expect 1 row updated):'
update radio_station_settings set stream_url = 'https://stream.example/live', is_stream_enabled = true;
select stream_url, is_stream_enabled from radio_station_settings;

reset role;
reset request.jwt.claim.sub;
\echo ''
\echo '================ RLS TESTS COMPLETE ================'
