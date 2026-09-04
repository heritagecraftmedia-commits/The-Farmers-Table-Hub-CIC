# Farmers Table Hub Community Radio — build notes

*Connecting Communities · Celebrating Local Talent · Rooted in Rural Life*

This is the station management and listener-facing platform. It does **not**
try to be a broadcast automation server — Live365 (or whichever host is
configured) runs the actual stream, RadioDJ provides studio automation, and
BUTT sends live outside-broadcast audio.

---

## 1. Getting it running

### The database is already migrated — do not re-apply anything

**There is nothing to apply.** The station schema is live on the Farmers Table
Supabase project. Do not run a radio migration by hand.

This branch's `supabase/` directory is byte-identical to `main` on purpose.

> **Superseded.** This section used to instruct you to apply
> `supabase/migrations/20260827_radio_v3_station.sql`. **Do not.** That file is
> not in this branch and must not be restored. It was replaced by
> `20260829_radio_v3_station.sql` on the reconcile branch, which is what the
> live database actually ran (as `radio_v3_station`, sequenced after
> `tft_permissions_rls`).
>
> The difference is not cosmetic. The 20260827 version defined radio staff
> against `auth.users.raw_user_meta_data->>'role'` — a second role model
> competing with the `profiles`-based one. The 20260829 version deletes that
> and delegates to `public.is_radio_staff()`. Re-applying 20260827 would
> reintroduce a self-escalatable authorisation path.

### Verifying the live schema

Read-only inspection only — never write:

```sql
-- what has actually been applied
select version, name from supabase_migrations.schema_migrations order by version;

-- radio staff is decided in exactly one place
select prosrc from pg_proc where proname = 'is_radio_staff';
```

The older `supabase/tests/*.sql` and `run-radio-tests.sh` harness is **not**
carried in this branch: it seeds `auth.users.raw_user_meta_data` and so tests a
role model that no longer exists. It needs rewriting against `profiles` before
it is trustworthy again.

### Running the application tests

```bash
npm test          # Vitest, single run
npm run test:watch
```

Currently 21 tests covering the schedule engine.

**Why Vitest, and why it was added.** `main` had no test runner at all, so one
had to be chosen rather than assumed. Three options were measured:

| Option | New deps | Result |
|---|---|---|
| `node --experimental-strip-types --test` | **0** | ❌ Fails — ESM requires explicit `.ts` extensions, but this project imports extensionlessly throughout and relies on Vite to resolve. Would mean rewriting import specifiers against project convention. |
| `tsx --test` (what the radio branch used) | 1 (52 transitive) | Works, but is a second toolchain alongside Vite, sharing none of its dependency tree. |
| **Vitest** | **1 (33 transitive here)** | ✅ Chosen. Reuses the existing `vite.config.ts` resolver, so extensionless imports work unchanged; shares Vite's already-installed dependencies; and matches what `claude/farmers-table-reconcile-ohnrav` independently chose, so the two branches converge instead of diverging. |

No existing script was removed. The radio branch's `test:radio` script was not
carried across, so there is one test framework, not two.

### Give someone staff access

Radio management is gated on the user's `role` in the **`profiles`** table.
It is NOT read from `auth.users.raw_user_meta_data` / `user_metadata`: that
value is writable by the user themselves (`supabase.auth.updateUser`), so
granting access on it would let anyone make themselves a radio manager.

Accepted roles, per `public.is_radio_staff()` as defined in
`20260828_tft_permissions_rls.sql`:

`founder`, `admin`, `radio_manager`, `contributor`

`staff` and `presenter` are no longer valid profile roles. That migration
rewrote every such row to `contributor` and its check constraint now permits
only `member`, `contributor`, `radio_manager`, `admin`, `founder`.

```sql
-- Requires the service_role key or an existing admin; profiles is not
-- self-writable, which is the point.
update profiles
set role = 'radio_manager'
where id = (select id from auth.users where email = 'someone@example.com');
```

The client mirrors this list in exactly one place, `src/auth/radioAccess.ts`
(`RADIO_STAFF_ROLES`), which `App.tsx` passes to `<RequireRole>`. If
`is_radio_staff()` changes, change that file in the same commit.

### Connect the stream

Radio Control Centre → **System** → Stream configuration. Set the provider,
the stream URL, and the metadata URL if the host publishes one, then tick
**Stream is connected and live**.

Until that is ticked the site says the station is off air. That is deliberate —
it never implies a broadcast that is not happening.

---

## 2. Where things live

```
src/services/radio/
  types.ts             Domain types, mirroring the V3 schema
  mappers.ts           Supabase row -> domain object
  stationService.ts    All station reads and writes
  scheduleEngine.ts    Turns schedule RULES into concrete days (pure, tested)
  streamProvider.ts    The provider interface everything else talks to
  live365Provider.ts   Live365 adapter
  genericProvider.ts   Icecast / Shoutcast / AzuraCast / RadioKing / custom
  providerRegistry.ts  Picks the adapter from station settings

src/context/RadioPlayerContext.tsx   One <audio> element for the whole app
src/components/radio/                Player, mini player, schedule views, slots
src/components/radio/admin/          Radio Control Centre panels
src/pages/radio/                     Public pages
```

### Public routes

| Route | What it is |
| --- | --- |
| `/radio` | Station home: player, today on air, featured show, noticeboard, local voices |
| `/radio/schedule` | Day and week views |
| `/radio/shows` | Programme directory |
| `/radio/shows/:slug` | Programme detail, presenters, when it's on, past episodes |
| `/radio/presenters` | Presenter directory |
| `/radio/presenters/:slug` | Presenter profile and shows presented |
| `/radio/listen-again` | Episode archive |
| `/radio/get-involved` | Submissions: music, announcements, events, programme ideas, presenting |
| `/radio/search` | Search across the station |
| `/radio/advertise` | Advertising and sponsorship packages |
| `/radio/control` | Radio Control Centre (staff only) |
| `/radio/overview` | The earlier radio page, kept |

---

## 3. How the schedule works

The database stores **rules**, not a fixed timetable:

- `daily`, `weekdays`, `weekends`, `weekly`, `fortnightly`, `monthly`, `once`
- validity windows (`starts_on` / `ends_on`) for seasonal programming
- schedule types: `regular`, `special`, `bank_holiday`, `christmas`, `emergency`
- a numeric `priority` to break ties

`scheduleEngine.ts` resolves those into the slots a given date actually has.
Ranking is: **emergency > christmas > bank holiday > special > regular**, then
priority. A higher-ranked slot displaces anything it overlaps.

Special broadcasts (`radio_broadcasts` with `overrides_schedule = true`)
outrank everything. Because each day is recomputed from the rules, **the normal
schedule resumes by itself** once the broadcast window has passed — nothing has
to be put back by hand.

A broadcast marked as *not* overriding the schedule is ranked below the regular
schedule, so it only fills gaps.

An `end_time` at or before the `start_time` means the programme runs past
midnight, and it is still reported as the current programme after 00:00.

Covered by `npm test`.

---

## 4. Changing streaming provider

Everything talks to the `StreamProvider` interface, so switching hosts is a
configuration change, not a rebuild.

To add a host: implement `StreamProvider` (see `genericProvider.ts`), add a
case to `providerRegistry.ts`, and add the value to the `provider` check
constraint on `radio_station_settings`.

Metadata shapes differ between hosts and across API versions, so the parsers
accept the known shapes and fall back to "no metadata" rather than failing the
player.

---

## 5. Security

Authorisation is enforced by PostgreSQL Row Level Security, not by the UI, so
bypassing the interface does not bypass the rules.

**The public can read** published programmes, published schedules, published
presenters, published episodes, published announcements, promoted events for
approved events, and media that is both published *and* licence-cleared.

**Only `founder` / `admin` / `radio_manager` / `contributor` can** create or edit programmes,
schedules, presenters, episodes, station content, adverts, sponsorship,
announcements and stream configuration. Presenters may edit their own profile
and their own episodes.

**Anyone may insert a submission** — and nothing else. Submissions cannot be
read by the public and cannot arrive pre-approved: the policy rejects any
insert that is not a clean `pending` row.

### Credentials

`radio_station_settings` is **public-safe fields only**, because the player
needs them in the browser. Live365 passwords and API keys must be stored as
Supabase project secrets and used only from server-side Edge Functions. Never
put one in this table, in `VITE_`-prefixed environment variables, or in any
field on the Stream configuration panel.

### Two defects fixed by this migration

- The V1 staff policies inlined `select ... from auth.users` and were declared
  `FOR ALL`, so PostgreSQL evaluated them on **anonymous** SELECTs too. Anon has
  no grant on `auth.users`, so public reads of `radio_media` and
  `radio_ad_slots` failed with *permission denied for table users*. All of them
  now call a `SECURITY DEFINER` `radio_is_staff()` helper.
- `radio_shows` was covered only by the base schema's
  `authenticated_full_access` policy (`auth.role() = 'authenticated'`), which
  let **any signed-in listener** create and edit programmes. Programme
  management is now staff-only.

---

## 6. Content rules

### No invented content

No presenters, businesses, advertisers, sponsors, musicians, events or
announcements are seeded anywhere. The only seeded row is the station's own
identity.

Where real content does not exist yet the site shows a labelled placement slot
(`ContentSlot`) — *ADVERTISEMENT SLOT — READY FOR LOCAL BUSINESS*,
*PROGRAMME SLOT — READY FOR PROGRAMME*, and so on — never a plausible-looking
fake.

### Music is never assumed cleared

`radio_media.licence_status` defaults to `unknown`. Only `cleared` items are
treated as broadcastable or shown publicly. Uploading a track through the
public submission form does not clear it; someone has to check and mark it.

### Local information must be verified

`radio_news.is_verified` defaults to false and public reads require it to be
true. Nothing is published without a human checking it against a named source.

---

## 7. Schema map

Extended rather than duplicated:

| Existing table | What was added |
| --- | --- |
| `radio_shows` | The full programme record — this **is** the programmes table |
| `radio_media` | One content library: music, imaging, adverts, features |
| `radio_sponsors` | Advertising client record, widened packages and campaign dates |
| `radio_broadcasts` | Override semantics for special broadcasts |
| `radio_playlists` | Link to a programme, completing the automation chain |

New tables: `radio_stations`, `radio_station_settings`, `radio_presenters`,
`radio_programme_presenters`, `radio_schedule`, `radio_episodes`,
`radio_imaging_assignments`, `radio_sponsorships`, `radio_announcements`,
`radio_event_promotions`, `radio_news`, `radio_submissions`.

Views, so the spec's naming exists without a second copy of the data:
`radio_programmes`, `radio_tracks`, `radio_jingles`, `radio_adverts`,
`radio_special_broadcasts`.

Announcements, event promotions and sponsorships **link to** the existing
`events` and `directory_listings` rows rather than copying them.

### Automation chain

`Programme → Schedule → Playlist → items (jingle / advert / announcement /
track)` is representable end to end, ready for automation to consume later.

---

## 8. Built for later

The architecture already supports, without redesign: multiple channels and
specialist channels (`radio_stations.channel_type`), podcasts, interviews,
outside broadcasts, downloadable media, and per-programme sponsorship packages.

Deliberately **not** built yet: listener requests and dedications, presenter
messaging, call-ins, analytics and listener statistics, syndication. These need
tables of their own but no change to what exists.
