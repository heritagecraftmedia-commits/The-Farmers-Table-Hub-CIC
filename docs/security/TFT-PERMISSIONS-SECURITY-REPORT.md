# TFT — permissions, RLS and role-based access: security report

Project: **The Farmers Table Hub CIC** (Supabase `lyitsfxbdpxezcwdeuvd`)
Deliverable: `supabase/migrations/20260828_tft_permissions_rls.sql`

> **Where these files live.** This work was originally built and tested in a
> staging area (`tft-security/`) in a separate repository, because that session
> had read-only access here. It now lives in this repo at its proper paths, and
> the report's references map as follows:
>
> | report says | actual path in this repo |
> |---|---|
> | `migrations/20260828_tft_permissions_rls.sql` | `supabase/migrations/20260828_tft_permissions_rls.sql` |
> | `tests/*.sql` | `supabase/tests/*.sql` |
> | `app-patches/0001-public-directory-view.patch` | already applied to `src/` — see below |
>
> The app patch of deployment step 2 is **already applied in this branch**: it
> touched `src/services/hubService.ts` (adds `getPublicListings()`),
> `src/pages/Directory.tsx` and `src/services/radioService.ts`. There is nothing
> to `git apply` — that step is satisfied by merging this branch.
>
> **Branch dependency.** The migration's first statement requires
> `public.profiles`, which is created by `20260826_rls_admin_hardening.sql`.
> That migration exists only on `claude/farmers-table-hub-audit-vwzs5i`, not on
> `main`. This work must therefore merge after (or together with) the audit
> branch's `20260826` and `20260827`, and the live database must already have
> both applied before `20260828` is run.

> **Deployment status: NOT DEPLOYED.** The TFT Supabase project is not reachable
> from this session — the Supabase connection here exposes only
> `heritage-craft-media` and `heritage-craft-media-shop`. Everything below was
> built and tested against a local PostgreSQL 16 with a Supabase-compatible
> `auth`/`storage` shim, rebuilt from empty. Nothing has been applied to the
> live TFT project. HCM was not touched.

---

## What was inspected

The 21-table schema referred to in the brief lives in
`heritagecraftmedia-commits/The-Farmers-Table-Hub-CIC`, on branch
`claude/farmers-table-hub-audit-vwzs5i`, not in this repository. It was read
there (read-only; nothing was pushed to that repo) and replayed locally:

| migration | contributes |
|---|---|
| `supabase-schema.sql` | 12 base tables |
| `20260317_create_directory_listings*.sql` | `directory_listings` |
| `20260317_seed_directory_listings.sql` | **145** producer rows |
| `20260317_outreach_columns.sql` | outreach tracking columns |
| `20260317_radio_events.sql` | `radio_events` |
| `20260825_radio_v1.sql` / `_v2_alignment.sql` | 6 radio tables |
| `20260826_rls_admin_hardening.sql` | `profiles`, `is_admin()`, `is_radio_staff()` — **21 tables at this point** |
| `20260827_untracked_tables.sql` | 8 further tables — **29 tables** |

Confirmed locally: 29 tables, 145 directory listings, 48 pre-existing policies,
RLS already enabled on every table. The permissions work below starts from that
state, not from scratch — `20260826` had already removed the three broken admin
models, and this migration builds the role model on top of it rather than
replacing it.

---

## Findings

Ordered by severity. Every one was reproduced locally before being fixed.

### F1 — The public directory serves private contact data for 145 real businesses — CRITICAL

`src/pages/Directory.tsx` (the public page) calls `hubService.getListings()`,
which issues `select('*')` against `directory_listings`. The policy
`"Public can view active listings" ... using (status = 'active')` filters
**rows**; RLS does not filter **columns**. So every anonymous visitor receives,
for all 145 seeded UK food businesses:

```
contact_email, phone, outreach_status, outreach_date, response,
claimed, outreach_approved, outreach_approved_by, outreach_opted_out
```

`Directory.tsx:229` then hides the email in JSX unless the tier is Supporter or
Featured. That is a rendering decision taken *after* the data reached the
browser — the values are in the network response regardless. This is both the
personal-data exposure the project's GDPR commitment rules out and the
"internal moderation fields exposed through public queries" the brief prohibits.

**Fixed** by moving public reads to `public_directory_listings`, a curated view
carrying nine safe columns, with contact details projected only for paid tiers
and opted-out rows excluded. Direct table access is now admin-only.
**Requires the app patch** — see Deployment.

### F2 — Anonymous callers can delete rows through the public views — CRITICAL

`public_radio_sponsors` (from `20260826`) and `public_sponsor_rotations` (from
`20260827`) are simple enough to be **auto-updatable**, and they run with the
view owner's rights so anon can read them without a policy on the base table.
Those two facts combine: a *write* through the view also runs as the owner and
bypasses the base table's RLS. `grant select ... to anon` does not withdraw the
blanket `INSERT/UPDATE/DELETE` that Supabase's default privileges already
granted on everything in `public`.

Reproduced locally, as `anon`, with no JWT:

```sql
delete from public_radio_sponsors;   -- DELETE 1; the radio_sponsors row was gone
```

**Fixed**: all privileges revoked from `anon`/`authenticated` on all three
public views, then `SELECT` granted back. This bug is in the TFT migrations as
they stand today, independent of anything added here.

### F3 — Founder vs admin existed only in React — HIGH

`CommandCenter.tsx` gates Finance, Records and Safe Mode on founder. A React
component is not a security boundary: an admin calling Supabase directly had
full access to `staff` and `system_controls` regardless. **Fixed**: both tables
are founder-only in the database, and `is_founder()` now exists as a distinct
predicate.

### F4 — Any admin could promote anyone, including themselves — HIGH

`20260826`'s `admin_manage_profiles` was `for all using (is_admin())`, so an
admin could set `role = 'founder'` on their own row. **Fixed**: role
administration is founder-only, enforced twice — by policy, and by a
`before insert or update` trigger that also catches the `service_role` key
(BYPASSRLS exempts a caller from policies, not from triggers).

### F5 — No contributor tier; a presenter could delete the station — HIGH

`is_radio_staff()` lumped presenters in with the founder and every radio policy
was `for all using (is_radio_staff())`. A presenter could delete the entire
media library, every playlist, all broadcasts and every sponsor record.
**Fixed**: `radio_media`, `radio_playlists` and `radio_playlist_items` gained
`created_by` ownership; contributors manage only their own rows. Sponsors, ad
slots, broadcasts, schedules and programmes moved to `radio_manager` and above.

### F6 — The founder's private notepad was shared with all staff — MEDIUM

`notes` had no owner column at all, and `20260827` gave it
`for all using (is_radio_staff())`. Every presenter could read, edit and delete
the founder's notes. **Fixed**: `user_id` added (defaulting to `auth.uid()`, so
`Notes.tsx` needs no change); rows predating the column are visible to the
founder only and were neither deleted nor reassigned.

### F7 — `profiles.role` was unconstrained free text — MEDIUM

No CHECK constraint, so any string was accepted and a typo silently removed
access. `is_admin` and `role` were also two independent sources of truth that
could disagree. **Fixed**: closed role set, and `is_admin` is now derived from
`role` by trigger.

### F8 — No audit log existed — MEDIUM

**Fixed**: `security_audit_log`, append-only, written only by SECURITY DEFINER
triggers. Role grants, listing moderation, outreach approval and system-control
changes are recorded.

### F9 — Internal radio state and unapproved line-ups were public — MEDIUM

`radio_shows` and `event_makers` were both `for select using (true)`, so
unannounced `planned`/`draft` programmes and the maker line-up of unapproved
events were publicly readable. **Fixed**: gated on publication status and on
the parent event being approved.

### F10 — No storage policy has ever existed in source control — MEDIUM

`AUDIT.md` §3.5 flagged `radio-audio` as unaudited. **Fixed**: bucket and object
policies added (section 10 of the migration).

### F11 — The directory seed is not idempotent — MEDIUM

Both seed migrations `INSERT` without naming an id, so every row gets a fresh
`gen_random_uuid()`. The only unique constraint is the primary key, so their
`ON CONFLICT DO NOTHING` can never match and never fires. Verified: two passes
produced **290 rows, 145 duplicated business names**, all publicly visible.
This contradicts the "runs cleanly three times" premise for the seed
specifically.

**Handled non-destructively**: the migration adds a unique index on
`lower(btrim(name))` so the existing `ON CONFLICT` clauses start working. If
duplicates are already present the index cannot be built, so it reports them
and **deletes nothing** — merging is a human decision.

### F12 — A listing could be claimed unlimited times — LOW

`submit_listing_claim()` had no uniqueness check and left `status` claimable
afterwards, so anyone holding a listing id could flood `claimed_vendors` and
bury a genuine claim. **Fixed**: one claim per listing, and the claim is
audited.

### F13 — Migration ordering breaks a from-empty rebuild — LOW

`20260317_create_directory_listings.sql` creates a policy referencing
`profiles`, which no migration creates until `20260826`. On a clean database it
fails with `relation "profiles" does not exist`, aborting before its own seed
block. Harmless on the live project (already applied) but it means the
migration set cannot currently rebuild from empty in filename order. Noted, not
changed — it is not a permissions issue and altering it would rewrite applied
history.

---

## A. Permissions matrix

`—` = no access. "own" = rows the caller owns.

| Resource | Public | Member | Contributor | Radio manager | Admin | Founder |
|---|---|---|---|---|---|---|
| `public_directory_listings` (view) | read | read | read | read | read | read |
| `directory_listings` (table) | — | — | — | — | all | all |
| `profiles` | — | read own, update own display name | same | same | read all | all + role grants |
| `claimed_vendors` | — | read/insert/update **own**, cannot self-approve | same | same | all | all |
| `enriched_leads` / `raw_leads` / `qualified_leads` | — (single-row claim fn only) | — | — | — | all | all |
| `outreach_log` | — | — | — | — | all | all |
| `pending_listings` | — | — | — | — | all | all |
| `applications` | insert | insert | insert | insert | all | all |
| `feedback_book_responses` | insert | insert | insert | insert | all | all |
| `events` | read approved | read approved | read approved | read approved | all | all |
| `event_makers` | read (approved events) | same | same | same | all | all |
| `maker_stories` | read published, insert unpublished | same | same | same | all | all |
| `radio_events` | read | read | read | read | all | all |
| `radio_shows` | read scheduled/live/archived | same | read all | all | read | all |
| `radio_media` | read active | read active | read all, manage **own** | all | read active | all |
| `radio_playlists` | read ready | read ready | read all, manage **own** | all | read ready | all |
| `radio_playlist_items` | read (ready playlists) | same | manage items of **own** playlists | all | read | all |
| `radio_broadcasts` | read scheduled/live/completed | same | read all | all | read | all |
| `radio_ad_slots` | read scheduled | read scheduled | read scheduled | all | read scheduled | all |
| `radio_sponsors` | via view (name/package/audio only) | via view | via view | all | via view | all |
| `sponsor_rotations` | via view | via view | via view | all | via view | all |
| `ad_schedules` | — | — | — | all | — | all |
| `playlists` (legacy) | read active | read active | read active | all | read active | all |
| `notes` | — | — | **own** only | **own** only | **own** only | own + unowned legacy |
| `social_posts` | — | — | — | — | all | all |
| `staff` | — | — | — | — | **—** | all |
| `system_controls` | — | — | — | — | **—** | all |
| `founder_jobs` | — | — | — | — | all | all |
| `security_audit_log` | — | — | — | — | read, excluding `role.*` | read all |
| Storage `radio-audio` | read | read | read; write/delete **own** | read; write/delete any | read | read; full |
| Storage buckets | read public | read public | read | read | read | manage |

Two deliberate tightenings to be aware of before deploying: **an `admin` loses
access to `staff` and `system_controls`** (F3), and a **contributor loses the
ability to delete other people's radio content** (F5).

## B. Tables protected by RLS

All 30 tables in `public` have RLS enabled and at least one policy — verified
by check 1 and check 2 of `tests/30_production_readonly_checks.sql`, which
return zero rows. Policy inventory:

| Table | Policies |
|---|---|
| `ad_schedules` | `radio_manager_manage_ad_schedules` |
| `applications` | `public_submit_application`, `admin_manage_applications` |
| `claimed_vendors` | `makers_own_listing`, `makers_update_own`, `claimed_vendors_insert_owner`, `admin_only_claimed_vendors` |
| `directory_listings` | `admin_only_directory_listings` (public reads via view) |
| `enriched_leads` | `admin_only_enriched_leads` |
| `event_makers` | `public_read_event_makers` (approved events), `admin_only_event_makers` |
| `events` | `public_events`, `admin_only_events` |
| `feedback_book_responses` | `public_submit_feedback`, `admin_read_feedback` |
| `founder_jobs` | `admin_only_founder_jobs` |
| `maker_stories` | `public_stories`, `public_story_insert`, `admin_only_maker_stories` |
| `notes` | `users_manage_own_notes` |
| `outreach_log` | `admin_only_outreach_log` |
| `pending_listings` | `admin_only_pending_listings` |
| `playlists` | `public_read_active_playlist`, `radio_manager_manage_playlists_legacy` |
| `profiles` | `users_read_own_profile`, `admin_read_profiles`, `users_update_own_display_name`, `founder_manage_profiles` |
| `qualified_leads` | `admin_only_qualified_leads` |
| `radio_ad_slots` | public scheduled read, `radio_manager_manage_ad_slots` |
| `radio_broadcasts` | public scheduled read, `radio_staff_read_broadcasts`, `radio_manager_manage_broadcasts` |
| `radio_events` | public read, `admin_manage_radio_events` |
| `radio_media` | public active read, `radio_staff_read_media`, `contributor_add/edit/delete_own_media`, `radio_manager_manage_media` |
| `radio_playlist_items` | public read (ready), `radio_staff_read_playlist_items`, `contributor_manage_own_playlist_items`, `radio_manager_manage_playlist_items` |
| `radio_playlists` | public ready read, `radio_staff_read_playlists`, `contributor_add/edit/delete_own_playlists`, `radio_manager_manage_playlists` |
| `radio_shows` | `public_read_radio_shows` (published states), `radio_manager_manage_radio_shows` |
| `radio_sponsors` | `radio_manager_manage_sponsors` (public via view) |
| `raw_leads` | `admin_only_raw_leads` |
| `security_audit_log` | `founder_read_audit_log`, `admin_read_operational_audit_log` — **read only, no write policy exists** |
| `social_posts` | `admin_manage_social_posts` |
| `sponsor_rotations` | `radio_manager_manage_sponsor_rotations` (public via view) |
| `staff` | `founder_only_staff` |
| `system_controls` | `founder_only_system_controls` |

Every `UPDATE` and `ALL` policy carries an explicit `WITH CHECK` — verified by
check 3, which returns zero rows. This matters: with `WITH CHECK` absent
Postgres reuses the `USING` expression, which is precisely how an
"update your own row" policy silently becomes "promote your own row".

## C. Storage protection

One bucket is in use.

| Bucket | Public | Read | Upload | Update | Delete |
|---|---|---|---|---|---|
| `radio-audio` | yes, deliberately | anyone | radio staff, `owner = auth.uid()`, own namespace only | owner or radio manager | owner or radio manager |

`radio-audio` stays public-read because every object in it is broadcast audio
served through `getPublicUrl()`, which has no meaning otherwise. That is a
judgement about this bucket's contents, not a default — a bucket holding
anything else must not be public. Writes are still fully policy-governed.

Bucket administration (creating a bucket, flipping one public) is founder-only:
it is the single change most likely to expose everything at once.

The upload path is currently flat (`<uuid>-<filename>`), so ownership is
enforced on `storage.objects.owner`. The folder rule additionally reserves any
`<user-id>/…` prefix to that user, so a future per-user namespace cannot be
written across before anyone remembers to add the rule.

## D. Security functions

All are `SECURITY DEFINER` for one reason: to read `profiles` without recursing
into the policies on `profiles`. Each pins `search_path` (so a caller cannot
shadow `profiles` from an earlier schema), takes no caller-supplied expression,
uses no dynamic SQL, and only reads. None can write a role, so none is an
escalation path. `EXECUTE` is revoked from `PUBLIC` and granted explicitly.

| Function | Purpose |
|---|---|
| `current_user_id()` | `auth.uid()`, or NULL when unauthenticated |
| `current_app_role()` | authoritative role from `profiles`; never reads user metadata |
| `is_member()` | signed in at all |
| `is_contributor()` / `is_radio_staff()` | contributor and above (name kept for `20260826` compatibility) |
| `is_radio_manager()` | radio manager and above |
| `is_admin()` | admin or founder |
| `is_founder()` | founder only |
| `can_manage_content()` | editorial management (currently admin) |
| `is_service_context()` | true for the SQL editor / service key — the founder-bootstrap escape hatch |
| `enforce_profile_authority()` | trigger: role changes are founder-only, `id` is immutable, `is_admin` is derived, last founder cannot be demoted |
| `handle_new_user()` | signup always writes `role = 'member'` |
| `record_audit_event()` | the only writer into the audit log; **not granted to `anon` or `authenticated`**, so an administrator action cannot be fabricated |
| `audit_log_is_append_only()` | trigger: refuses UPDATE/DELETE, including from `service_role` |
| `audit_system_controls()` / `audit_claimed_vendor_decision()` / `audit_outreach_approval()` | audit triggers |
| `get_claimable_listing(uuid)` | one lead row by id, invited/claimed only — no bulk enumeration |
| `submit_listing_claim(…)` | records a claim; always lands unapproved and unpublished; one per listing |
| `touch_updated_at()` | `search_path` pinned (was unpinned) |

Verified by check 4: no `SECURITY DEFINER` function in `public` has an unpinned
`search_path`. Verified by check 5: no policy anywhere reads
`raw_user_meta_data`.

## E. Privilege-escalation tests

`tests/20_privilege_escalation_tests.sql` — **97 tests, 97 PASS, 0 FAIL**, run
against two independently built databases (one built incrementally, one rebuilt
from empty).

Every test runs as a real Postgres role (`anon` / `authenticated` /
`service_role`) with a real `request.jwt.claims`, i.e. through exactly the path
a caller using the Supabase client or `curl` takes. **The frontend is not in the
loop for any of them** — which is Attack 8, and is the whole point.

| # | Attack | Result |
|---|---|---|
| 1 | Member sets own `role = 'admin'` | **PASS** — denied (`P0001`) |
| 1b–c | Member sets own `is_admin = true` | **PASS** — write accepted, value still `false` (derived) |
| 1d | Member sets own `role = 'founder'` | **PASS** — denied |
| 1e | Admin promotes self to founder | **PASS** — denied |
| 1f | Admin promotes another member to admin | **PASS** — no policy matches; zero rows |
| 2 | User A reads user B's profile | **PASS** — 0 rows |
| 2c | Contributor enumerates all profiles | **PASS** — own row only |
| 3 | A updates B's claimed listing | **PASS** — 0 rows |
| 3c | A self-approves and self-publishes own listing | **PASS** — denied (`42501`) |
| 4 | Contributor deletes the founder's note | **PASS** — 0 rows |
| 4b | Contributor reads the founder's note | **PASS** — 0 rows |
| 4d | Contributor deletes the manager's media | **PASS** — 0 rows |
| 5a–o | Anon reads 15 private tables/views | **PASS** — 0 rows or `42501` for all 15 |
| 6a–f | Anon writes (6 variants, incl. self-published story, forged profile) | **PASS** — `42501` for all 6 |
| 7a–h | Contributor attempts 8 admin/manager operations | **PASS** — denied for all 8 |
| 7f–g | **Admin** attempts founder-only `staff` / `system_controls` | **PASS** — denied |
| 8 | Bypass the frontend and call Supabase directly | **PASS** — every test above is this |
| 9 | A reassigns own listing to B | **PASS** — denied (`42501`) |
| 9b | A inserts a listing owned by B | **PASS** — denied |
| 9c–d | Contributor reassigns / forges `created_by` on media | **PASS** — denied |
| 9e | Member changes own profile `id` | **PASS** — denied (`P0001`) |
| 10a–b | Contributor deletes / overwrites manager's audio | **PASS** — 0 rows |
| 10c | Contributor uploads into manager's namespace | **PASS** — denied |
| 10d | Contributor uploads owned by another user | **PASS** — denied |
| 10e | Non-staff member uploads audio | **PASS** — denied |
| 10g | Member creates a public bucket | **PASS** — denied |
| AU1–4 | Member/admin read, forge, or call `record_audit_event()` | **PASS** — denied |
| AU6 | Admin reads role-grant history | **PASS** — 0 rows (founder-only) |
| AU8–11 | Founder **and `service_role`** edit/delete audit records | **PASS** — denied; append-only trigger holds against the service key |
| EX1–5 | Public directory view: row count, hidden free-tier contact, no moderation columns, base table closed to members | **PASS** |
| EX6–9 | Anon/member write through the three public views | **PASS** — `42501` (F2) |
| S1–S5 | Structural: RLS everywhere, no policy-less table, no `UPDATE` without `WITH CHECK`, no unpinned `SECURITY DEFINER`, no `raw_user_meta_data` | **PASS** |

15 positive tests (`W1`–`W15`) confirm the site still works: anon reads the
directory and approved events, submits applications, feedback and unpublished
stories; a member updates their own display name; a contributor adds and edits
their own media; a radio manager edits anyone's; an admin manages the directory
and lead pipeline; a founder reads staff, writes system controls and grants a
role; and an invited listing can be claimed once but not twice.

## F. Remaining risks

Honest list of what is not closed or not proven.

1. **Nothing is deployed.** The live TFT project is unreachable from here. Every
   result above is from a local PostgreSQL 16 with a Supabase-compatible shim.
   The shim reproduces `auth.uid()`, `auth.role()`, `auth.jwt()`, the
   `anon`/`authenticated`/`service_role` roles, `storage.objects`/`buckets` and
   Supabase's blanket default privileges — but it is a reproduction. **Re-run
   `tests/30_production_readonly_checks.sql` against the live project after
   deploying.**
2. **F1 is not fixed until the app patch ships.** The migration alone closes the
   database side; if `Directory.tsx` is left on `select('*')` it will fail and
   fall back to mock listings. Deploy the patch first — see Deployment.
3. **The live schema may differ from the migration files.** `20260827` says its
   eight tables "exist only in the live Supabase project, if at all", and
   `create table if not exists` cannot reshape an existing table. Run check 12
   and the column comparison in that migration's footer against live before
   trusting the column lists here.
4. **`radio_events` remains world-readable** (`using (true)`). It has no draft
   or published flag, so there is nothing to gate on; adding one is a schema
   change beyond this brief. Every column in it is public event information.
5. **Anonymous submission endpoints are unthrottled.** `applications`,
   `feedback_book_responses` and `maker_stories` accept anonymous inserts by
   design. RLS constrains their *content* but cannot rate-limit them. Spam
   protection belongs at the edge (Supabase rate limits, hCaptcha).
6. **The public views run with the definer's rights on purpose.** That is what
   lets anon read a sponsor's business name without reading their contact
   details. Supabase's security advisor will flag them as "security definer
   view"; that is expected. The column list is the boundary, and privileges are
   now `SELECT`-only (F2). Anyone editing these views must re-check both.
7. **`service_role` bypasses RLS**, as designed. The triggers do constrain it —
   it cannot promote a role or rewrite audit history — but anyone holding the
   service key can still read everything. Keep it server-side only.
8. **The database owner can undo any of this.** The append-only trigger and the
   profile guard can be dropped by the table owner. That is inherent; it is a
   reason to keep database credentials narrow, not a defect to fix in SQL.
9. **F11's duplicate merge is a human decision.** If the live project already
   holds duplicated listings, the migration reports them and stops rather than
   deleting anything, and the unique index is not created until they are merged.
10. **Not re-audited here:** the edge functions, the `VITE_ANTHROPIC_API_KEY` /
    `GEMINI_API_KEY` rotation, and the demo-login restriction. Those are
    `AUDIT.md` §1.4–1.7 and §3, and are still outstanding there.
11. **Untested against real Supabase Auth.** The signup trigger path
    (`on_auth_user_created`) was exercised against the shim's `auth.users`, not
    GoTrue. Confirm a real signup produces `role = 'member'`.

## G. Deployment instructions

Exact order. Steps 1 and 2 are not optional.

1. **Back up.** Supabase Dashboard → Database → Backups. Take one before
   anything else.

2. **Deploy the application patch first.**
   `app-patches/0001-public-directory-view.patch` applies to the TFT repo
   (`git apply` from its root). It adds `hubService.getPublicListings()`, points
   `Directory.tsx` and `radioService.getPublicDirectory()` at
   `public_directory_listings`, and leaves `getListings()` for admin screens.
   It works against the current database as well as the new one, so it is safe
   to ship ahead. Doing it the other way round takes the public directory down
   to mock data between the two deploys.

3. **Apply the migration.** Supabase Dashboard → SQL Editor → paste
   `migrations/20260828_tft_permissions_rls.sql` → Run. It is one transaction
   and idempotent; re-running it is safe. Read the NOTICEs: one reports
   duplicated directory listings (F11), one reports insufficient privilege on
   the storage schema if section 10 could not apply.

4. **Confirm the founder.** `is_admin()` now derives from `role`. Check:
   ```sql
   select id, role, is_admin from profiles order by role;
   ```
   There must be exactly one `founder`. If not:
   ```sql
   update profiles set role = 'founder' where id = 'FOUNDER-UUID-HERE';
   ```
   (Run in the SQL editor, where `is_service_context()` permits it. From an
   ordinary session this is refused — that is F4 working.)

5. **Assign the other roles**, e.g.
   ```sql
   update profiles set role = 'radio_manager' where id = '…';
   update profiles set role = 'contributor'   where id = '…';
   update profiles set role = 'admin'         where id = '…';
   ```
   Remember: an `admin` can no longer reach `staff` or `system_controls` (F3).

6. **Run the read-only verification.**
   `tests/30_production_readonly_checks.sql` in the SQL editor. Checks 1–5, 9
   and 13 must return **no rows**; check 7 must list only `INSERT` on
   `applications`, `feedback_book_responses` and `maker_stories`.

7. **Confirm the public directory** loads on the live site and that a logged-out
   browser's network response for the directory contains **no** `contact_email`
   for free-tier listings and **no** `outreach_*` fields at all.

8. **Optional — full attack matrix on a staging branch.** Supabase → Branches →
   create a branch, then run `tests/10_seed_test_identities.sql` (needs
   `set tft.allow_test_seed = 'on';` first) and
   `tests/20_privilege_escalation_tests.sql`. **Do not run these two against
   production** — they write to `auth.users`.

Rollback: the migration is additive except for the policy replacements listed
in Findings. To revert, re-run `20260826_rls_admin_hardening.sql` and
`20260827_untracked_tables.sql`, which recreate the policies this one replaced.
Note that reverting reopens F1–F6.

---

## Verdict

**NOT READY — not deployed.** The TFT Supabase project `lyitsfxbdpxezcwdeuvd`
is not reachable from this session, so nothing has been applied and no result
here comes from the live database.

The migration itself is complete and I would call it production-grade: 97/97
tests pass against two independently built PostgreSQL 16 databases, it is
idempotent across three consecutive runs, it deletes no data, and it closes
thirteen findings including two critical ones. Two things stand between it and
"secure and ready":

1. it has to actually be run against the live project, and
2. **F1 is only half-fixed by the migration** — the app patch in step 2 must
   ship, or the public directory keeps sending 145 businesses' contact details
   to every anonymous visitor.

Run steps 1–7, and the answer becomes SECURE AND READY.
