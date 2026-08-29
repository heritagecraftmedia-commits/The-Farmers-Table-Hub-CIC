-- SUPERSEDED — intentionally left as a no-op.
--
-- This file and 20260317_create_directory_listings.sql both created
-- directory_listings and differed only in their seed rows. Running both was
-- harmless (CREATE TABLE IF NOT EXISTS / ON CONFLICT DO NOTHING) but it left
-- two competing definitions of the same table in the repo, and no way to tell
-- which one a given environment had actually applied.
--
-- 20260317_create_directory_listings.sql is the one to use: it carries the full
-- producer seed. The table's authoritative RLS now lives in
-- 20260826_rls_admin_hardening.sql section 11.
--
-- Left in place rather than deleted so environments that recorded this
-- filename in their migration history do not see it disappear.

select 1;
