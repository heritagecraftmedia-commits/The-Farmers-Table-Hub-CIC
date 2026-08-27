-- ============================================================================
-- Test identities for the TFT permissions matrix.
--
-- STAGING / LOCAL ONLY. This writes to auth.users. Do not run it against the
-- production TFT project — use a Supabase branch or the local harness in
-- 00_local_supabase_shim.sql.
--
-- Creates six identities covering every tier in the role model, plus a little
-- data owned by each, so ownership can actually be tested rather than assumed.
-- Re-runnable: fixed UUIDs, upserts, no deletes of anything it did not create.
-- ============================================================================

do $$
begin
  if current_setting('tft.allow_test_seed', true) is distinct from 'on' then
    raise exception
      'Refusing to seed test identities. This writes to auth.users and is for '
      'staging/local only. Run:  set tft.allow_test_seed = ''on'';  first.';
  end if;
end $$;

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'user-a@tft.test'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'user-b@tft.test'),
  ('cccccccc-0000-4000-8000-000000000003', 'contributor@tft.test'),
  ('dddddddd-0000-4000-8000-000000000004', 'radiomanager@tft.test'),
  ('eeeeeeee-0000-4000-8000-000000000005', 'admin@tft.test'),
  ('ffffffff-0000-4000-8000-000000000006', 'founder@tft.test')
on conflict (id) do nothing;

-- The on_auth_user_created trigger has written a 'member' profile for each.
-- Assign the roles. This runs with no JWT, so is_service_context() permits it —
-- the same escape hatch the founder bootstrap uses.
insert into profiles (id, role) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'member'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'member'),
  ('cccccccc-0000-4000-8000-000000000003', 'contributor'),
  ('dddddddd-0000-4000-8000-000000000004', 'radio_manager'),
  ('eeeeeeee-0000-4000-8000-000000000005', 'admin'),
  ('ffffffff-0000-4000-8000-000000000006', 'founder')
on conflict (id) do update set role = excluded.role;

-- Owned data, one row per owner, so "A cannot touch B's row" is a real test.
insert into claimed_vendors (id, user_id, vendor_name, approved, published) values
  ('11111111-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001',
   'User A Bakery', false, false),
  ('22222222-0000-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-000000000002',
   'User B Dairy', false, false)
on conflict (id) do nothing;

insert into notes (id, title, content, user_id) values
  ('33333333-0000-4000-8000-000000000003', 'Founder private note', 'confidential',
   'ffffffff-0000-4000-8000-000000000006'),
  ('44444444-0000-4000-8000-000000000004', 'Contributor note', 'run sheet',
   'cccccccc-0000-4000-8000-000000000003')
on conflict (id) do nothing;

insert into radio_media (id, title, artist, media_type, audio_url, is_active, created_by) values
  ('55555555-0000-4000-8000-000000000005', 'Contributor Track', 'C', 'music',
   'https://example.test/c.mp3', true, 'cccccccc-0000-4000-8000-000000000003'),
  ('66666666-0000-4000-8000-000000000006', 'Manager Track', 'M', 'music',
   'https://example.test/m.mp3', true, 'dddddddd-0000-4000-8000-000000000004')
on conflict (id) do nothing;

-- A lead that has been invited, for the claim-flow tests.
insert into enriched_leads (id, vendor_name, status) values
  ('77777777-0000-4000-8000-000000000007', 'Invited Producer', 'invited')
on conflict (id) do nothing;

-- Storage objects owned by two different users, for the Attack 10 test.
do $$
begin
  if to_regnamespace('storage') is not null then
    insert into storage.buckets (id, name, public)
      values ('radio-audio', 'radio-audio', true)
      on conflict (id) do nothing;
    insert into storage.objects (id, bucket_id, name, owner) values
      ('88888888-0000-4000-8000-000000000008', 'radio-audio',
       'cccccccc-0000-4000-8000-000000000003/contributor-clip.mp3',
       'cccccccc-0000-4000-8000-000000000003'),
      ('99999999-0000-4000-8000-000000000009', 'radio-audio',
       'dddddddd-0000-4000-8000-000000000004/manager-clip.mp3',
       'dddddddd-0000-4000-8000-000000000004')
    on conflict (id) do nothing;
  end if;
end $$;
