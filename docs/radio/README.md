# Farmers Table Hub Community Radio — build notes

*Connecting Communities · Celebrating Local Talent · Rooted in Rural Life*

This is the station management and listener-facing platform. It does **not**
try to be a broadcast automation server — Live365 (or whichever host is
configured) runs the actual stream, RadioDJ provides studio automation, and
BUTT sends live outside-broadcast audio.

---

## 1. Getting it running

### Apply the database migration

The station schema is `supabase/migrations/20260827_radio_v3_station.sql`. It
extends the existing radio V1/V2 schema and is safe to re-run.

Order, if starting from an empty project:

1. `supabase-schema.sql`
2. `supabase/migrations/20260317_radio_events.sql`
3. `supabase/migrations/20260825_radio_v1.sql`
4. `supabase/migrations/20260825_radio_v2_alignment.sql`
5. `supabase/migrations/20260827_radio_v3_station.sql`

Paste into Supabase Dashboard → SQL Editor → Run, or apply with the Supabase
CLI.

### Prove it before applying it

```bash
./supabase/tests/run-radio-tests.sh
```

Applies the whole chain to a throwaway local PostgreSQL, checks the migration
is idempotent, and exercises Row Level Security as an anonymous visitor, a
signed-in listener and a founder. Every line marked `expect` in the output
must match.

### Give someone staff access

Radio management is gated on the user's `role` in Supabase auth metadata.
Accepted roles: `founder`, `staff`, `radio_manager`.

```sql
update auth.users
set raw_user_meta_data = raw_user_meta_data || '{"role":"radio_manager"}'::jsonb
where email = 'someone@example.com';
```

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

Covered by `npm run test:radio`.

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

**Only `founder` / `staff` / `radio_manager` can** create or edit programmes,
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
