-- ============================================================
-- Remove the demo radio_events seed row
-- ============================================================
-- 20260317_radio_events.sql shipped with an invented event to test the
-- /community-radio "This Week" panel:
--
--   title           'Farnham Artisan Market'
--   type            'Market'
--   venue           'Farnham Town Centre'
--   featured_artist 'The Hop Garden Trio'
--
-- No such market or band was supplied by the client. The INSERT has been
-- removed from that file so new environments never create the row; this
-- migration removes it from environments that already applied it.
--
-- DATA SAFETY
--   * The match is on all four fields, not on title alone, so a real
--     event that happens to share a name is not touched.
--   * `date` is deliberately NOT matched: the original INSERT used
--     `now() + interval '7 days'`, so its value differs per environment.
--   * The table itself is real and is left in place.
--   * Guarded on to_regclass so it is a no-op where radio_events does
--     not exist.
--
-- The count is raised as a NOTICE rather than silently applied, so the
-- deletion is visible in the migration output.
-- ============================================================

do $$
declare
  removed integer := 0;
begin
  if to_regclass('public.radio_events') is null then
    raise notice 'radio_events does not exist — nothing to clean up.';
    return;
  end if;

  delete from radio_events
  where title = 'Farnham Artisan Market'
    and type = 'Market'
    and venue = 'Farnham Town Centre'
    and featured_artist = 'The Hop Garden Trio';

  get diagnostics removed = row_count;

  if removed = 0 then
    raise notice 'No demo radio_events row present. Nothing removed.';
  else
    raise notice 'Removed % demo radio_events row(s).', removed;
  end if;
end
$$;
