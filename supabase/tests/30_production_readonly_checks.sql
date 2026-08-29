-- ============================================================================
-- TFT — read-only verification, safe to run against the live project.
--
-- Writes nothing, creates nothing, deletes nothing. Run it in the Supabase SQL
-- editor after the migration to confirm the live database matches what was
-- tested. Every query should return the "expected" noted above it.
-- ============================================================================

\echo '--- 1. Tables with RLS disabled (expected: no rows) ---'
select c.relname as unprotected_table
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
order by 1;

\echo '--- 2. RLS enabled but no policy — denies everyone incl. admins (expected: no rows) ---'
select c.relname as table_with_no_policy
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity
  and not exists (select 1 from pg_policy p where p.polrelid = c.oid)
order by 1;

\echo '--- 3. UPDATE/ALL policies with no WITH CHECK (expected: no rows) ---'
-- Postgres reuses USING as WITH CHECK when WITH CHECK is absent, which is how
-- an "update your own row" policy becomes "promote your own row".
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public' and cmd in ('UPDATE','ALL') and with_check is null
order by 1, 2;

\echo '--- 4. SECURITY DEFINER functions with an unpinned search_path (expected: no rows) ---'
select p.proname
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prosecdef
  and not exists (
    select 1 from unnest(coalesce(p.proconfig, '{}')) cfg
    where cfg like 'search_path=%')
order by 1;

\echo '--- 5. Policies still trusting client-writable user metadata (expected: no rows) ---'
select tablename, policyname
from pg_policies
where schemaname = 'public'
  and (coalesce(qual,'') || coalesce(with_check,'')) like '%raw_user_meta_data%'
order by 1, 2;

\echo '--- 6. Policies open to everyone — review each one is deliberate ---'
select tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and (qual = 'true' or with_check = 'true')
order by 1, 2;

\echo '--- 7. Write privileges held by anon (expected: INSERT on applications, feedback_book_responses, maker_stories only) ---'
select table_name, privilege_type
from information_schema.role_table_grants
where grantee = 'anon' and table_schema = 'public'
  and privilege_type in ('INSERT','UPDATE','DELETE','TRUNCATE')
order by 1, 2;

\echo '--- 8. Who holds which role (expected: exactly one founder) ---'
select role, count(*) from profiles group by role order by 1;

\echo '--- 9. Profiles whose legacy is_admin disagrees with role (expected: no rows) ---'
select id, role, is_admin from profiles
where is_admin is distinct from (role in ('admin','founder'));

\echo '--- 10. Storage buckets and their public flag (expected: radio-audio public, nothing else) ---'
select id, name, public from storage.buckets order by 1;

\echo '--- 11. Storage object policies (expected: 4 on objects, 2 on buckets) ---'
select tablename, policyname, cmd from pg_policies
where schemaname = 'storage' order by 1, 2;

\echo '--- 12. Columns the public directory view exposes (expected: no outreach/moderation columns) ---'
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'public_directory_listings'
order by ordinal_position;

\echo '--- 13. Duplicate directory listings (expected: no rows) ---'
select lower(btrim(name)) as name, count(*)
from directory_listings group by 1 having count(*) > 1 order by 2 desc;

\echo '--- 14. Audit log: is it append-only and read-restricted? (expected: 2 SELECT policies, 0 write policies) ---'
select policyname, cmd from pg_policies
where schemaname = 'public' and tablename = 'security_audit_log' order by 1;

select tgname, tgenabled from pg_trigger
where tgrelid = 'public.security_audit_log'::regclass and not tgisinternal;

\echo '--- 15. Most recent audit activity ---'
select occurred_at, actor_role, action, table_name, record_id
from security_audit_log order by occurred_at desc limit 20;
