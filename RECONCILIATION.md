# Farmers Table Hub CIC — branch reconciliation and migration baseline

Branch: `claude/farmers-table-reconcile-ohnrav`
Base: `main` @ `ff059aa` (PR #4 merged, 2026-08-29)
Reconciled from: `claude/farmers-table-radio-build-a65saw`

This file records every point where the branches disagreed, what was chosen,
and why. Nothing here has been applied to the live Supabase project
(`lyitsfxbdpxezcwdeuvd`) or deployed to Vercel. **Read section 9 before
applying anything** — two items need a decision from Scott first.

---

## 1. Branch survey — what actually needed reconciling

The brief named four branches to check. Measured against `main`:

| Branch | Commits ahead of `main` | Unique SQL | Verdict |
|---|---|---|---|
| `claude/tft-permissions-rls-land` | 0 | none | Already fully merged |
| `claude/farmers-table-hub-audit-vwzs5i` | 0 | none | Already fully merged |
| `claude/farmers-table-events-build-6swk4y` | 1 (`ae9e308`, React type fixes) | none | No migration content |
| `claude/farmers-table-radio-build-a65saw` | many | `20260827_radio_v3_station.sql` | The only real source |

Two branches outside the brief were also checked, because their names suggested
overlapping work:

* `fix/central-events-build` — behind `main`, nothing unique.
* `feat/farmers-table-discovery` — 4 unique commits and a unique migration,
  `20260822_create_discovery_pipeline.sql`. It is a lead-discovery pipeline,
  unrelated to `events` or `radio_shows`. **Left alone** — flagged in section 9.

The whole diff between `main` and the radio branch, in `supabase/migrations/`,
is two files: `20260827_radio_v3_station.sql` (new) and
`20260317_create_directory_listings_table.sql` (modified).

---

## 2. Four premises in the brief that did not match the repo

Recorded because they changed the work.

**2.1 `main` has ten migrations, not three plus a no-op.** `20260825_radio_v1.sql`
and `20260825_radio_v2_alignment.sql` were already merged, byte-identical to the
radio branch. Only V3 was outstanding.

**2.2 `events` and `radio_shows` were already defined.** Not in
`supabase/migrations/`, but in the repo-root `supabase-schema.sql` — identical on
both branches. This is the "base schema" V3's own comments refer to. They were
therefore **ported, not designed**. See section 4.

**2.3 There was no 145-vs-146 seed conflict.** One seed file, byte-identical on
both branches (md5 `de7f065be48e5ce1b8902a4835b6e228`). See section 6.

**2.4 The fictional event was already on `main`.** `20260317_radio_events.sql` is
identical on both branches, so excluding it meant changing `main`'s set, not
declining a merge. See section 7.

---

## 3. Authorisation: one role model, not two

`main`'s model is authoritative, per the brief.

V3 shipped its own helper:

```sql
create or replace function radio_is_staff() ... as $$
  select exists (select 1 from auth.users u
    where u.id = auth.uid()
      and (u.raw_user_meta_data->>'role') in ('founder','radio_manager','staff'));
$$;
```

That is a second source of truth competing with the `profiles`-based
`is_admin()` / `is_radio_staff()` from `20260826` and the six-level model from
`20260828`. Granting someone a role in `profiles` would not have granted it
here, and vice versa.

**Kept:** the name `radio_is_staff()`, so V3's ~20 policies did not need
rewriting. **Changed:** the body, to `select public.is_radio_staff();`.
Verified on the test database — no function in `public` reads
`raw_user_meta_data` any more.

### 3.1 V3's blanket policies were dropped, not applied

V3 section 16(a) replaced six V1 policies with
`for all using (radio_is_staff())`. `20260828` had already replaced the *write*
side of those same six tables with a finer contributor/manager model
(`contributor_add_media`, `radio_manager_manage_sponsors`, …).

Policies are permissive and ORed, so re-adding V3's blanket versions would have
silently promoted every contributor to full staff write access.

**However** — `20260828` drops only its *own* policy names, never V1's, so V1's
original policies were still live. Those are the ones that inline
`select ... from auth.users` in a `FOR ALL` policy, which PostgreSQL also
evaluates on anonymous `SELECT`s, where `anon` has no grant on `auth.users`.
That is the "permission denied for table users" failure on the public radio page.

**Resolution:** keep V3's `DROP` statements (they fix a real, still-live bug),
discard its `CREATE` statements (superseded by `20260828`). Confirmed on the
test database: no policy in `public` references `auth.users`.

### 3.2 A stale policy from `20260828`

`20260828` created `public_read_radio_shows` gated on
`status in ('scheduled','live','archived')`. V3 section 4 redefines `status` to
mean *how* a programme is broadcast, constrained to
`('planned','live','pre-recorded','automated')` — so `'scheduled'` and
`'archived'` became unreachable, and the policy would have published every
`'live'` programme regardless of publication state, ORed with V3's
`content_status` rule. **Dropped explicitly in V3.**

### 3.3 Storage policies

V3 added three blanket `radio_is_staff()` policies across `radio-audio` and
`radio-images`. `20260828` already policies `radio-audio` on a tighter
owner-scoped model (`owner = auth.uid()`, or `is_radio_manager()` to override).
ORed together, V3's would have let any staff member overwrite or delete another
member's audio.

**Resolution:** keep `20260828`'s model; extend it to the new `radio-images`
bucket with the same owner-scoped rules. Public read covers both buckets.

---

## 4. `events` and `radio_shows` — ported, not invented

Both already existed in `supabase-schema.sql`, which is applied by hand in the
SQL editor and was never part of the migration sequence. The definitions were
moved verbatim into `20260318_core_tables_events_radio_shows.sql`.

Cross-checked against the code rather than assumed:

| Table | Code | Columns used |
|---|---|---|
| `events` | `hubService.addEvent` | `title, description, start_date, end_date, location, venue, website_url, craft_type, source, approved` |
| `events` | `stationService.getPromotableEvents` | `id, title, start_date, venue, location, approved` |
| `radio_shows` | `radioService.getShows` | `id, title, host, schedule, status, last_broadcast` |
| `radio_shows` | `stationService` (`PROGRAMME_COLUMNS`) | the V3-added columns |

The base-schema shape covers every column the code reads or writes. No column
was guessed. V3's `alter table ... add column if not exists` supplies the rest.

`event_makers` is included in the same file (it foreign-keys `events`, and is
read by `hubService` and `src/pages/Members.tsx`).

**One deliberate omission.** `supabase-schema.sql` also creates
`authenticated_full_access` on `radio_shows`, which lets any signed-in listener
edit programmes. It is *not* reproduced. `20260828` and V3 supply the real
policies; in the window between, RLS-enabled-with-no-policy denies everything,
which is the safe failure mode. V3 still drops it by name to clean up live
databases that carry it.

---

## 5. `directory_listings` — which shape was kept

The two definitions have **identical column sets**. The radio branch's
`_table.sql` is a verbatim copy of the other file's `CREATE TABLE` plus the same
two policies. Nothing could be lost from either side.

The only real difference is the policy model:

* Radio branch: public `SELECT` of `status = 'active'`, founder full access.
* `main`: admin-only on the table, public reads through the
  `public_directory_listings` view (`20260826` §11, tightened by `20260828`).

**Kept: `main`'s.** The view exists specifically so the public site cannot read
`contact_email`, `phone` and `response` — scraped contact data on real
businesses that have not consented to publication. The radio branch's
`for select using (status = 'active')` exposes the whole row, contact columns
included. That is the leak PR #4 closed.

### 5.1 A related regression in the radio branch

`src/services/radioService.ts` on the radio branch changes
`.from('public_directory_listings')` back to `.from('directory_listings')`.
The branch predates PR #4. **Not carried over** — `main`'s version stands.

---

## 6. Vendor seed — the real discrepancy, and the real count

There are not two datasets. `20260317_seed_directory_listings.sql` is
byte-identical on both branches. The "146" is a stale comment in the file's own
header; the file contains **145** `VALUES` rows, 145 distinct names, no
duplicates.

**The actual problem was elsewhere, and it was a genuine double-insert.**

`20260317_create_directory_listings.sql` (the all-in-one file) *also* carries the
same 145 producers. Both files ran. Their `ON CONFLICT DO NOTHING` did not help:
there is no unique constraint on `name`, so the only arbiter is the primary key,
and each `INSERT` supplies a fresh `gen_random_uuid()`. The conflict never fires.

Measured on a clean build of `main`'s full set:

```
select count(*) from directory_listings;                 ->  290
select count(distinct lower(btrim(name))) from ...;      ->  145
```

Every producer was present exactly twice. This is also why `20260828` could
never build its unique index on `lower(btrim(name))` — it correctly refuses
while duplicates exist, and the duplicates were created two migrations earlier.

**Resolution:** `20260317_seed_directory_listings.sql` is now a no-op, using the
same pattern and reasoning already applied to
`20260317_create_directory_listings_table.sql` on `main` (left in place, not
deleted, so recorded migration histories do not lose a filename).
`20260317_create_directory_listings.sql` is the single seed of record.

After the change, on a clean build:

```
145 rows, 145 distinct names
directory_listings_name_unique UNIQUE, btree (lower(btrim(name)))   <- now builds
```

**Final real vendor record count: 145.** No record was edited, merged or
deleted — the duplicate *insert path* was removed, not the data.

> **Live databases are still carrying 290 rows.** Removing the 145 duplicates
> there is a destructive operation on real data and is **not** included in this
> branch. See section 9.1.

---

## 7. Excluded as invented content

**7.1 The fictional seeded event.** `20260317_radio_events.sql` seeded
"Farnham Artisan Market" with featured artist "The Hop Garden Trio" — neither
supplied by the client. The `INSERT` is removed from that file so new
environments never create it, and `20260830_remove_demo_radio_event.sql` removes
it from environments that already applied it. The match is on four fields, not
title alone, so a real event of the same name is not touched. `date` is
deliberately not matched (the original used `now() + interval '7 days'`, so it
differs per environment). **The `radio_events` table itself is real and is
kept** — `/community-radio` uses it.

Tested both directions: removes exactly 1 row where present, reports
"nothing removed" where absent.

**7.2 `hubService.ts` mock data.** The brief asked to confirm none of it can
reach production. It could — and more of it than expected.

Only `mockListings` was gated (PR #4). `mockEvents`, `mockStaff`,
`mockRadioShows`, `mockJobs`, `mockStories`, `mockPendingListings`,
`mockPlaylist`, `mockSponsors` and `mockAdSchedules` were returned
unconditionally whenever Supabase was unconfigured — **and also on any query
error**, so a transient database fault in production would have rendered
invented content to real visitors.

`mockSponsors` is the worst of it: fabricated businesses with invented contact
names, email addresses, ad scripts and renewal dates
("Surrey Ironworks / James Hill / james@surreyironworks.co.uk"), presented as
paying advertisers.

Two changes, extending PR #4's pattern:

1. All 23 mock return paths now go through `devOnly()`, which yields `[]`
   outside dev — so production shows an empty state, never fiction.
2. The mock *definitions* are wrapped in `import.meta.env.DEV ? [...] : []`.
   `import.meta.env.DEV` is statically replaced with `false` at build time, so
   Rollup drops the literals entirely — the content is not merely unused in the
   production bundle, it is **absent from it**.

Verified by grepping the built bundle: "Willow Weaving", "Surrey Pottery",
"Thomas Ironworks", "Blacksmithing Demonstration", "Sunrise Acoustic" and the
rest are all gone from `dist/`.

`mockSystemSettings` is deliberately **not** gated: it is agent feature-toggles,
not content, and `getSystemSettings` must return an object rather than a list.

**7.3 The real station identity is kept.** V3 seeds only the station's own
record and its (stream-disabled) settings row. Confirmed real, not placeholder.
These are the only two content inserts in V3.

---

## 8. Migration order, and two ordering bugs found by testing

Final order:

| # | File | Purpose |
|---|---|---|
| 1 | `20260315_base_schema_tables.sql` | **new** — base tables from `supabase-schema.sql` |
| 2 | `20260316_extensions_auth_profiles.sql` | **new** — pgcrypto + `profiles` |
| 3 | `20260317_create_directory_listings.sql` | table + the single 145-record seed |
| 4 | `20260317_create_directory_listings_table.sql` | no-op (unchanged from `main`) |
| 5 | `20260317_outreach_columns.sql` | outreach columns |
| 6 | `20260317_radio_events.sql` | `radio_events` — **demo seed removed** |
| 7 | `20260317_seed_directory_listings.sql` | **now a no-op** (section 6) |
| 8 | `20260318_core_tables_events_radio_shows.sql` | **new** — `events`, `radio_shows`, `event_makers` |
| 9 | `20260825_radio_v1.sql` | radio playlists/media/sponsors/ad slots/broadcasts |
| 10 | `20260825_radio_v2_alignment.sql` | column renames |
| 11 | `20260826_rls_admin_hardening.sql` | `profiles`, `is_admin()`, `is_radio_staff()` |
| 12 | `20260827_untracked_tables.sql` | the 8 code-only tables |
| 13 | `20260828_tft_permissions_rls.sql` | six-level roles, audit log, public views |
| 14 | `20260829_radio_v3_station.sql` | **renumbered from 20260827** — station build |
| 15 | `20260830_remove_demo_radio_event.sql` | **new** — demo row cleanup |

V3 was renumbered from `20260827` to `20260829` so it lands *after* the
authorisation work it now depends on. At `20260827` it would have sorted before
both `20260827_untracked_tables.sql` and `20260828`.

Two pre-existing bugs surfaced only because the set was actually applied:

**8.1 A fresh database could not be built at all.**
`20260317_create_directory_listings.sql` creates a policy referencing `profiles`,
which was not created until `20260826` — five migrations later. Applying `main`'s
set in order failed on the *first* file with
`ERROR: relation "profiles" does not exist`. Live databases hid this because
`profiles` was created by hand beforehand. Fixed by file 2.

**8.2 The base schema was never in the migration sequence.** All eleven tables in
`supabase-schema.sql` are referenced by `20260826`/`20260827`/`20260828`, so the
build then failed with `ERROR: relation "raw_leads" does not exist`. Fixed by
file 1. Definitions copied verbatim; nothing redesigned.

### 8.3 Test results

Applied against a throwaway PostgreSQL 16 database using the repo's own
`supabase/tests/00_local_supabase_shim.sql`:

* All 15 migrations apply cleanly from empty, in order.
* `directory_listings`: 145 rows / 145 distinct names; unique index builds.
* 15 foreign keys to `events` / `radio_shows` all resolve.
* RLS enabled on every table in `public`.
* No policy references `auth.users`; no function reads `raw_user_meta_data`.
* Every file added or modified here is re-runnable (verified by re-applying).

`20260317_radio_events.sql`, `20260825_radio_v1.sql`,
`20260825_radio_v2_alignment.sql` and `20260826` are **not** re-runnable — a
pre-existing trait of `main`, not introduced here, and harmless under normal
once-only migration tracking. Noted in section 9.

---

## 9. Open — needs a decision before anything is applied

**9.1 The 145 duplicate rows in live `directory_listings`.** This branch stops
the duplication recurring but does **not** delete anything. Removing them is
destructive and needs approval. Suggested approach, for review — keep the oldest
row per name:

```sql
-- REVIEW BEFORE RUNNING. Take a backup first.
select lower(btrim(name)), count(*) from directory_listings
group by 1 having count(*) > 1;          -- expect 145 names, 2 each

-- delete from directory_listings a using directory_listings b
--  where lower(btrim(a.name)) = lower(btrim(b.name))
--    and a.created_at > b.created_at;
```

Until this is done, `20260828`'s unique index will keep declining to build on
live.

**9.2 Invented content in five component files.** Outside the brief's scope
(it named `hubService.ts`), so **not changed** — but it reaches real users:

| File | Content | Severity |
|---|---|---|
| `src/pages/CommunityRadio.tsx` | `FALLBACK_EVENTS` / `FALLBACK_ARTISTS` / `FALLBACK_CHEFS` — invented bands ("The Hop Garden Trio", "Clara Moss & Band"), venues ("The Wheatsheaf, Farnham"), restaurants ("The Herb & Board", "head chef Sarah Turner") | **Public page.** Renders whenever the table is empty — which it now is |
| `src/components/central/CentralAdvertisers.tsx` | Hardcoded advertisers with packages, renewal dates, "Paid"/"Overdue" status | Fabricated commercial records |
| `src/components/central/CentralFinance.tsx` | Hardcoded invoices ("INV-0839", "£120.00", "Unpaid") | Fabricated financial records |
| `src/components/dashboard/AddTeamMemberModal.tsx` | `placeholder="thalia@farmerstable.org"` | Harmless form hint |
| `src/components/dashboard/RadioScheduleModal.tsx` | `placeholder="Morning Maker Melodies"` | Harmless form hint |

The first three want real content or an explicit empty state. Removing them
leaves visible gaps on live pages, so it is Scott's call, not mine.

**9.3 `feat/farmers-table-discovery`** carries an unmerged
`20260822_create_discovery_pipeline.sql`. Unrelated to this task; not included.

**9.4 Editing applied migrations.** `20260317_radio_events.sql` and
`20260317_seed_directory_listings.sql` were edited in place. If Supabase CLI
migration checksums are in use, this may need `supabase migration repair`.

---

## 10. Site-wide fixes (brief item 8)

**10.1 Navigation left the new page at the old scroll position.** React Router
does not reset scroll on its own and nothing did it. Added
`src/components/ScrollToTop.tsx`, mounted once inside `<Router>` — fixed
site-wide, not per link. `PUSH`/`REPLACE` go to the top; `POP` (back/forward) is
left to the browser's own restoration; `#hash` links are left alone.

**10.2 Accessibility mode pushed content outside the viewport.** Fog Mode set

```css
.fog-mode-active button,
.fog-mode-active a { padding: 1.5rem 2.5rem; font-size: 1.5rem; }
```

5rem of horizontal padding on **every anchor on the site**, including inline
links inside sentences and each item of the nav row, plus headings fixed at
`3rem` regardless of viewport. Rebuilt structurally, not per element: `clamp()`
type scales with the viewport; flex and grid children get `min-width: 0` (their
`auto` default is what refuses to shrink and forces the page wider); nav rows may
wrap and grow taller; enlarged tap targets go to real controls rather than inline
prose links; media and tables are contained.

Measured in Chromium, Fog Mode on, horizontal overflow in px:

| Route | 320 | 375 | 768 | 1024 |
|---|---|---|---|---|
| **before** (`main`) — all routes | 180 | 125 | 674 | 426 |
| **after** — `/`, `/about`, `/directory`, `/whats-on`, `/community-radio`, `/marketplace`, `/join` | 0 | 0 | 0 | 0 |

Scroll fix, same harness: scrolled to 1200, navigated — before: stayed at 1200;
after: 0, with the back button still restoring to 2325.

`npx tsc --noEmit` is clean, and was clean on `main` before the change.
