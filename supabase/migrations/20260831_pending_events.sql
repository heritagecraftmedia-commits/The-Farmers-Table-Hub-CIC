-- ============================================================
-- pending_events — What's On discovery staging
-- ============================================================
-- Migration 16. Purely additive. Migrations 1-15 are untouched and the
-- existing `events` table is NOT modified: this adds the staging area in
-- front of it.
--
--   real source -> discover -> normalise -> categorise -> score
--                -> dedupe -> pending_events -> HUMAN REVIEW
--                -> approve -> events (approved = true) -> public What's On
--
-- Nothing in this file writes to `events`. The only path from staging to
-- publication is public.approve_pending_event(), which requires an
-- authenticated admin/founder. The discovery job can only ever INSERT here.
--
-- ------------------------------------------------------------
-- WHY THIS FILE IS WRITTEN DEFENSIVELY
-- ------------------------------------------------------------
-- The live project already carried a partially built `pending_events`
-- table when this was written: created out of band, empty (0 rows), RLS on
-- with a single `admin_only_pending_events` policy, no
-- approve_pending_event() function, and a weaker column set —
-- `start_date`, `source_url`, `category` and `dedupe_key` were all
-- NULLABLE, and it had no `selection_rationale` column at all.
--
-- Nullable evidence columns defeat the point of the staging table: a row
-- with no source URL and no date is exactly the kind of candidate the
-- pipeline exists to refuse. So this migration does not merely
-- `create table if not exists` and walk away. It converges both shapes:
--
--   1. creates the full table on a database that has none;
--   2. adds any missing column to one that already exists;
--   3. tightens the evidence columns to NOT NULL, but ONLY when no
--      existing row would violate the constraint. If any row would, it
--      raises a notice and leaves the column alone rather than failing
--      the deploy. (On the live table this is safe: it is empty.)
--
-- It also keeps the columns the out-of-band table introduced
-- (image_url, admission, booking_required, contact_email, subcategory,
-- raw_payload, promoted_event_id) so that a fresh database and the live
-- one end up with the same schema rather than drifting apart.
-- ============================================================

create table if not exists pending_events (
  id uuid primary key default gen_random_uuid(),

  -- Event detail, as normalised from the source.
  title             text not null,
  description       text,
  start_date        timestamp with time zone,
  end_date          timestamp with time zone,
  venue             text,
  location          text,
  website_url       text,
  organiser         text,
  image_url         text,
  admission         text,
  booking_required  boolean,
  contact_email     text,

  -- Classification. `category` matches the EventCategory union used by
  -- src/pages/WhatsOn.tsx so a promoted row needs no translation.
  category          text,
  subcategory       text,

  -- Provenance. A candidate with no real source URL is discarded by the
  -- pipeline and must never reach this table.
  source_url        text,
  source_platform   text not null default 'Manual',
  raw_payload       jsonb not null default '{}'::jsonb,
  discovered_at     timestamp with time zone not null default now(),

  -- Review state.
  status              text not null default 'pending',
  confidence_score    integer,
  selection_rationale text,
  relevance_rationale text,
  rejection_reason    text,
  reviewed_at         timestamp with time zone,
  reviewed_by         uuid,
  promoted_event_id   uuid,

  -- Deduplication key: the event's own URL, or normalised title + date +
  -- venue. Never the listing URL. Computed by the pipeline.
  dedupe_key        text,

  created_at        timestamp with time zone not null default now(),
  updated_at        timestamp with time zone not null default now()
);

-- Columns missing from a table that already existed.
alter table pending_events add column if not exists description         text;
alter table pending_events add column if not exists start_date          timestamp with time zone;
alter table pending_events add column if not exists end_date            timestamp with time zone;
alter table pending_events add column if not exists venue               text;
alter table pending_events add column if not exists location            text;
alter table pending_events add column if not exists website_url         text;
alter table pending_events add column if not exists organiser           text;
alter table pending_events add column if not exists image_url           text;
alter table pending_events add column if not exists admission           text;
alter table pending_events add column if not exists booking_required    boolean;
alter table pending_events add column if not exists contact_email       text;
alter table pending_events add column if not exists category            text;
alter table pending_events add column if not exists subcategory         text;
alter table pending_events add column if not exists source_url          text;
alter table pending_events add column if not exists source_platform     text not null default 'Manual';
alter table pending_events add column if not exists raw_payload         jsonb not null default '{}'::jsonb;
alter table pending_events add column if not exists discovered_at       timestamp with time zone not null default now();
alter table pending_events add column if not exists status              text not null default 'pending';
alter table pending_events add column if not exists confidence_score    integer;
alter table pending_events add column if not exists selection_rationale text;
alter table pending_events add column if not exists relevance_rationale text;
alter table pending_events add column if not exists rejection_reason    text;
alter table pending_events add column if not exists reviewed_at         timestamp with time zone;
alter table pending_events add column if not exists reviewed_by         uuid;
alter table pending_events add column if not exists promoted_event_id   uuid;
alter table pending_events add column if not exists dedupe_key          text;
alter table pending_events add column if not exists created_at          timestamp with time zone not null default now();
alter table pending_events add column if not exists updated_at          timestamp with time zone not null default now();

-- `selection_rationale` is the canonical column. An out-of-band table used
-- `relevance_rationale`; carry anything already there across so no reasoning
-- is lost.
update pending_events
   set selection_rationale = relevance_rationale
 where selection_rationale is null and relevance_rationale is not null;

-- Foreign keys, added only if absent (the out-of-band table had none).
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'pending_events_reviewed_by_fkey') then
    alter table pending_events
      add constraint pending_events_reviewed_by_fkey
      foreign key (reviewed_by) references profiles(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'pending_events_promoted_event_fkey') then
    alter table pending_events
      add constraint pending_events_promoted_event_fkey
      foreign key (promoted_event_id) references events(id) on delete set null;
  end if;
end $$;

-- ------------------------------------------------------------
-- Evidence columns must not be nullable
-- ------------------------------------------------------------
-- "No evidence, no candidate" is enforced here as well as in the pipeline,
-- so a row inserted by any other route still cannot skip it. Each column is
-- tightened only when nothing would break; otherwise the offending rows are
-- reported and the column is left alone for a human to resolve.
do $$
declare
  col  text;
  bad  bigint;
  cols text[] := array['start_date','source_url','category','dedupe_key'];
begin
  foreach col in array cols loop
    execute format('select count(*) from pending_events where %I is null', col) into bad;
    if bad > 0 then
      raise notice
        'pending_events.% left NULLABLE: % existing row(s) have no value. '
        'Fill them in, then re-run this migration to tighten the column.',
        col, bad;
    else
      execute format('alter table pending_events alter column %I set not null', col);
    end if;
  end loop;
end $$;

-- ------------------------------------------------------------
-- Constraints
-- ------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'pending_events_status_check') then
    alter table pending_events add constraint pending_events_status_check
      check (status in ('pending','needs_verification','approved','rejected'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'pending_events_confidence_range') then
    alter table pending_events add constraint pending_events_confidence_range
      check (confidence_score is null or (confidence_score >= 0 and confidence_score <= 100));
  end if;

  -- A rejection must say why: the reason is what stops the same candidate
  -- being re-staged next Tuesday.
  if not exists (select 1 from pg_constraint where conname = 'pending_events_rejection_reason_required') then
    alter table pending_events add constraint pending_events_rejection_reason_required
      check (status <> 'rejected' or rejection_reason is not null);
  end if;
end $$;

-- ------------------------------------------------------------
-- Indexes
-- ------------------------------------------------------------
-- One row per real event. The pipeline checks this key before inserting;
-- the index is what makes that guarantee hold under a concurrent run.
create unique index if not exists pending_events_dedupe_key_idx
  on pending_events (dedupe_key);

create index if not exists pending_events_status_idx      on pending_events (status);
create index if not exists pending_events_start_date_idx  on pending_events (start_date);
create index if not exists pending_events_discovered_idx  on pending_events (discovered_at desc);
create index if not exists pending_events_category_idx    on pending_events (category);
-- The review queue reads exactly this.
create index if not exists pending_events_review_queue_idx
  on pending_events (status, start_date) where status in ('pending','needs_verification');

drop trigger if exists pending_events_touch_updated_at on pending_events;
create trigger pending_events_touch_updated_at
  before update on pending_events
  for each row execute function public.touch_updated_at();


-- ------------------------------------------------------------
-- RLS — anon has no access at all
-- ------------------------------------------------------------
alter table pending_events enable row level security;

-- Staging holds unverified third-party data and reviewer notes. None of it
-- is public, and nothing here is readable until a human promotes it into
-- `events`. anon is denied at both the grant and the policy layer.
revoke all on pending_events from anon;
revoke all on pending_events from authenticated;
grant select, insert, update, delete on pending_events to authenticated;

-- Replaces the out-of-band `admin_only_pending_events` (ALL / is_admin()).
-- Writes stay admin-only exactly as before; reads widen to content staff so
-- contributors can work the review queue, which is the same boundary the
-- rest of the content tables use (public.is_radio_staff()).
drop policy if exists "admin_only_pending_events" on pending_events;

-- Read: content staff (contributor and above) can review the queue.
drop policy if exists "staff_read_pending_events" on pending_events;
create policy "staff_read_pending_events" on pending_events
  for select using (public.is_radio_staff());

-- Write: admin/founder only. The weekly discovery job runs under the
-- service role, which bypasses RLS, so it does not need a policy here.
drop policy if exists "admin_insert_pending_events" on pending_events;
create policy "admin_insert_pending_events" on pending_events
  for insert with check (public.is_admin());

drop policy if exists "admin_update_pending_events" on pending_events;
create policy "admin_update_pending_events" on pending_events
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_delete_pending_events" on pending_events;
create policy "admin_delete_pending_events" on pending_events
  for delete using (public.is_admin());


-- ------------------------------------------------------------
-- approve_pending_event — the only staging -> events path
-- ------------------------------------------------------------
-- Runs as one transaction. If the insert into `events` raises for any
-- reason, the whole call rolls back: the pending row keeps its previous
-- status and the candidate is not lost. That ordering is the point of
-- doing this in the database rather than as two client calls.
--
-- security definer, deliberately. Promotion has to write the audit log, and
-- record_audit_event() is not executable by `authenticated` - by design, so
-- that ordinary callers cannot forge audit entries. Running as the owner is
-- how the function gets that one privilege without handing it to every
-- signed-in user.
--
-- That bypasses RLS, so the guards below are the access control, not the
-- policies. They are checked before anything is written:
--   1. is_admin() - admin or founder only, and anon has no EXECUTE at all.
--   2. the row must exist and not already be approved.
--   3. the candidate must still satisfy the publication rules, so a row
--      hand-edited in the review UI cannot bypass them on its way out.
-- search_path is pinned to defeat search-path capture.
create or replace function public.approve_pending_event(p_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  c        pending_events%rowtype;
  v_event  uuid;
begin
  if not public.is_admin() then
    raise exception 'approve_pending_event: admin or founder role required'
      using errcode = '42501';
  end if;

  select * into c from pending_events where id = p_id for update;
  if not found then
    raise exception 'approve_pending_event: no pending event %', p_id
      using errcode = 'P0002';
  end if;

  if c.status = 'approved' then
    raise exception 'approve_pending_event: % is already approved', p_id
      using errcode = '23505';
  end if;

  -- Validate before publishing. These mirror the pipeline's own rules, so a
  -- row hand-edited in the review UI cannot bypass them on its way out.
  if c.title is null or btrim(c.title) = '' then
    raise exception 'approve_pending_event: candidate has no title'
      using errcode = '23514';
  end if;
  if c.start_date is null then
    raise exception 'approve_pending_event: candidate has no start date'
      using errcode = '23514';
  end if;
  if c.source_url is null or btrim(c.source_url) = '' then
    raise exception 'approve_pending_event: candidate has no source URL'
      using errcode = '23514';
  end if;

  insert into events (
    title, description, start_date, end_date,
    location, venue, website_url, craft_type, source, approved
  ) values (
    c.title,
    c.description,
    c.start_date,
    c.end_date,
    c.location,
    c.venue,
    coalesce(nullif(btrim(c.website_url), ''), c.source_url),
    coalesce(c.category, 'Other'),
    c.source_platform,
    true
  )
  returning id into v_event;

  update pending_events
     set status            = 'approved',
         reviewed_at       = now(),
         reviewed_by       = auth.uid(),
         promoted_event_id = v_event
   where id = p_id;

  perform public.record_audit_event(
    'approve_pending_event',
    'pending_events',
    p_id::text,
    to_jsonb(c),
    jsonb_build_object('event_id', v_event, 'status', 'approved')
  );

  return v_event;
end;
$$;

revoke all on function public.approve_pending_event(uuid) from public, anon;
grant execute on function public.approve_pending_event(uuid) to authenticated;
