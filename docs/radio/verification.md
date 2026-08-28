# Radio verification pass

Run against a **real** PostgREST over the real schema — not the placeholder
Supabase URL used during the build — so the actual data flow was exercised.

## Implementation trace

Every route reaches PostgreSQL through `stationService.ts`; authorisation is
enforced by RLS, never by the UI.

### Public

| Route | Page component | Tables / views read | Auth | Public read gate |
| --- | --- | --- | --- | --- |
| `/radio` | `radio/RadioHome` | `radio_stations`, `radio_station_settings`, `radio_shows`, `radio_schedule`, `radio_broadcasts`, `radio_presenters`, `radio_announcements`, `radio_event_promotions` + `events` | none | published / active / in-window |
| `/radio/schedule` | `radio/RadioSchedule` | `radio_schedule`, `radio_broadcasts`, `radio_shows` | none | rule active **and** programme published |
| `/radio/shows` | `radio/RadioShows` | `radio_shows` (+ presenter, co-presenter embeds) | none | `content_status = 'published'` |
| `/radio/shows/:slug` | `RadioProgrammeDetail` | `radio_shows`, `radio_episodes`, `radio_schedule` | none | published only |
| `/radio/presenters` | `radio/RadioPresenters` | `radio_presenters` | none | `status='published' and is_active` |
| `/radio/presenters/:slug` | `RadioPresenterDetail` | `radio_presenters`, `radio_shows` | none | published only |
| `/radio/listen-again` | `radio/RadioListenAgain` | `radio_episodes` | none | `status='published'` |
| `/radio/get-involved` | `radio/RadioGetInvolved` | `radio_submissions` (INSERT only), storage | none | insert-only; no read |
| `/radio/search` | `radio/RadioSearch` | the published sets above | none | published only |
| `/radio/advertise` | `radio/RadioAdvertise` | `radio_shows` | none | published only |

### Admin — `/radio/control`, gated on role ∈ {founder, staff, radio_manager}

| Panel | Tables written | RLS |
| --- | --- | --- |
| Live status | reads schedule + queue | staff |
| Programme manager | `radio_shows` | `radio_shows_staff_manage` |
| Presenter manager | `radio_presenters` | `radio_presenters_staff_manage` |
| Schedule manager | `radio_schedule` | `radio_schedule_staff_manage` |
| Episode manager | `radio_episodes`, storage | staff, or the presenter's own episodes |
| Imaging / music | `radio_media`, storage | `radio_media_staff_manage` |
| Announcements | `radio_announcements` | staff |
| Submissions | `radio_submissions` | staff (public may insert only) |
| Event promotion | `radio_event_promotions` | staff |
| Stream config | `radio_station_settings` | staff |

**Error handling** is uniform: a missing table (42P01) is treated as "migration
not applied here yet" and yields an empty state; other errors surface a message
and are logged. `describeError()` translates RLS refusals and missing-migration
errors into plain English for staff.

## What was verified, and how

| Area | Method | Result |
| --- | --- | --- |
| Column references | 335 select/insert/update references checked against `information_schema` | all valid |
| Mapper fields | every `row.x` compared to what the query selects | 1 mismatch found and fixed |
| FK embed names | checked against `pg_constraint`, then run through PostgREST | valid, unambiguous |
| Permission matrix | 29 assertions as anon / listener / stranger / founder, UI bypassed | all blocked or allowed correctly |
| Data flow | admin create → DB → public page, via the real UI and the real API | verified for programmes, presenters, schedule, submissions |
| Stream sourcing | 4 states: configured, disabled, absent, unsafe URL | 1 defect found and fixed |
| Failure states | database taken offline mid-test | all 7 public routes render safely, no fabricated content |
| Browser | 12 routes, keyboard, focus, labels, mobile | no radio console errors |
| Build | typecheck, unit tests, production build, migration + RLS suite | clean |

## Known issues NOT fixed (pre-existing, outside radio scope)

1. **`Navbar.tsx` has no `aria-label` on 4 icon-only controls** (fog toggle,
   theme, menu). They are reachable by keyboard but announce nothing to a
   screen reader. Affects every page on the site, not just radio.
2. **`/favicon.ico` returns 404** on every page.
3. **`src/data/radioSchedule.ts` is hard-coded to September 2026**, so the run
   sheet and month planner only offer dates in that month.
4. **19 pre-existing typecheck errors** in `CentralEvents.tsx`,
   `BecomeAMaker.tsx`, `MakerStories.tsx`, `WhatsOnAgent.tsx`,
   `stripeService.ts` and the Deno edge function.

## Still not built

The **advertising and sponsorship admin panels**. Schema, RLS and the public
page exist; there is no Control Centre form for entering advertisers, so those
records must be created directly in Supabase. Unchanged from the original
build; see `acceptance.md`.

The **co-presenter write path**: the read path now works, but nothing in the
Control Centre assigns a co-presenter, so `radio_programme_presenters` rows
have to be created directly in the database.

---

## Gap-closing pass

### Advertising and sponsorship

`RadioAdvertiserStudio` was traced first and found to be the authoritative
*intake* tool: it is the only component that ever wrote to `radio_sponsors`.
It was create-only, offered 4 of the 11 package types, set no status or dates,
and never touched `radio_sponsorships`. Spec §21 places "Adverts" and
"Sponsorship" under the Radio Control Centre → CONTENT, so placement followed
the specification rather than a judgement call.

The Studio was **extended, not replaced**: it now uses the shared package list,
saves through the same `saveAdvert` path as the manager, saves as a draft
rather than something publishable, and is embedded inside the advertising panel
as its first step. There is one advertising system.

No schema change was required — `radio_sponsors` and `radio_sponsorships`
already carried every field and both already had RLS.

Two axes are kept separate and both gate public visibility:
`status` (active/paused/expired, the commercial arrangement) and
`content_status` (draft…published). An advert is public only when published
AND active AND inside its date window, which the RLS policy enforces.

### Fabricated content removed

`CentralAdvertisers` listed five invented businesses — Surrey Ironworks,
Local Veg Co., The Potters Studio, Rural Candle Co., Farnham Brewery — with
invented payment statuses and renewal dates under a false "HubSpot Synced"
badge and a non-functional billing-report button. It now reads the real
`radio_sponsors` records and shows an honest empty state.

`CentralOverview` was found to fabricate income, counts, an on-air list and
presenter/guest names. It is labelled as illustrative but deliberately not
wired to invented data sources — see acceptance.md.

### Defects found during this pass

1. Creating an advertiser did not refresh the Sponsorship panel's sponsor list,
   so a newly added business could not be selected without a page reload.
2. The admin form controls wrapped their control inside the `<label>`, so a
   select announced as "Sponsor Choose an advertiser…". Controls are now
   associated by id, with the hint exposed via `aria-describedby`.

### Test results

| Suite | Assertions | Result |
| --- | --- | --- |
| `run-radio-tests.sh` (migration + RLS) | 7 steps + full RLS matrix | pass |
| `02_api_flow_test.sh` | 29 | pass |
| `03_advertising_flow_test.sh` | 21 | pass |
| `04_copresenter_flow_test.sh` | 11 | pass |
| `npm run test:radio` | 21 | pass |
| Browser: public routes, a11y, keyboard, favicon | 30 | pass |
| Browser: admin CRUD, mobile | 20 | pass |
| Browser: failure states, DB offline | 27 | pass |
