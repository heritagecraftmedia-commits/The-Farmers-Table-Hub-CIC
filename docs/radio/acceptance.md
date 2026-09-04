# Radio build — acceptance status

Against the final acceptance list in the build specification.

Legend: **Built & verified** = exercised by an automated test or a successful
build. **Built, needs live data** = the code path exists and compiles, but can
only be confirmed once the migration is applied to Supabase and real content
has been entered.

| # | Acceptance item | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Radio homepage works | Built, needs live data | `src/pages/radio/RadioHome.tsx`, route `/radio`; build passes |
| 2 | Live player component works | Built, needs live data | `RadioPlayerContext` + `RadioPlayer`; needs a real stream URL to hear audio |
| 3 | Live365 integration configuration exists | **Built & verified** | `live365Provider.ts`, `radio_station_settings`, System panel |
| 4 | Programme schedule works | **Built & verified** | 21 tests in `npm run test:radio` |
| 5 | Weekly schedule works | **Built & verified** | `resolveWeek` tested; `WeekGrid` renders it |
| 6 | Presenter system works | Built, needs live data | `radio_presenters` + `PresenterManager` + public pages |
| 7 | Episode archive works | Built, needs live data | `radio_episodes` + `EpisodeManager` + `/radio/listen-again` |
| 8 | Jingle library works | Built, needs live data | 13 imaging types in `radio_media`; `ImagingManager` |
| 9 | Advertising system works | **Built & verified** | `AdvertiserManager` + 21 assertions in `03_advertising_flow_test.sh` |
| 10 | Sponsorship system works | **Built & verified** | `SponsorshipManager` + `03_advertising_flow_test.sh` |
| 11 | Community announcements work | Built, needs live data | `radio_announcements` + `AnnouncementManager` + noticeboard |
| 12 | Events integration works | Built, needs live data | `radio_event_promotions` links to existing `events` |
| 13 | Submission system works | **Built & verified** | RLS test proves public insert succeeds and pre-approved insert is rejected |
| 14 | Admin Radio Control Centre works | Built, needs live data | `/radio/control`, seven sections |
| 15 | Supabase relationships correct | **Built & verified** | Migration applies cleanly and is idempotent |
| 16 | RLS enabled and tested | **Built & verified** | `supabase/tests/01_radio_rls_test.sql` |
| 17 | Public cannot access admin functions | **Built & verified** | Anon and signed-in listener both blocked from creating programmes |
| 18 | No secrets exposed | **Built & verified** | No credential fields in schema or client; System panel warns against it |
| 19 | Mobile layout works | Built, needs device check | Responsive throughout; mini player docks on small screens |
| 20 | Accessibility checks pass | Built, needs audit | See below |
| 21 | No fake businesses or fictional content | **Built & verified** | Row counts are zero for every content table after migration |
| 22 | Unfinished areas use labelled slots | **Built & verified** | `ContentSlot` used on every empty state |
| 23 | Existing functionality intact | **Built & verified** | Build passes; lint unchanged at 19 pre-existing errors |

---

## What is not finished

**Nothing from the specification is now outstanding.** Advertising and
sponsorship admin (items 9 and 10) are complete: `AdvertiserManager` and
`SponsorshipManager` in the Radio Control Centre → Content, operating on the
same `radio_sponsors` / `radio_sponsorships` tables the existing
`RadioAdvertiserStudio` already wrote to. The Studio was extended rather than
replaced — it is embedded inside the advertising panel as the intake step, now
covers all eleven package types, and shares one write path.

Known pre-existing items deliberately left alone, and why:

- **`CentralOverview` (`/command` → Overview)** shows invented figures, an
  invented on-air list and invented presenter/guest names. It is now clearly
  labelled as illustrative, but it is NOT wired to real data: the income,
  people and task counts have no data source in this application, and inventing
  one would be guesswork. This needs a decision — wire it up or remove it.
- **`src/data/radioSchedule.ts`** is a structural planning template with
  invented example venue names. It is staff-only, labelled as a template in
  both tools that use it, and follows the current month rather than a frozen
  one. The public schedule is database-backed and authoritative.

---

## Accessibility

Built in, not yet independently audited:

- Every control is a real `<button>` or labelled form control
- Programme and track changes announced via `aria-live="polite"`
- Volume slider is keyboard operable with `aria-valuetext`
- Visible focus rings on every interactive element
- Touch targets at or above 44px (`min-h-11` / `min-h-12` / `min-h-14`)
- Status conveyed by text as well as colour — on-air state, content status
  pills and licensing states all carry words, never colour alone
- Decorative icons marked `aria-hidden`; images have empty `alt` where
  decorative
- Wide content (the week grid) scrolls inside its own container

Worth doing before launch: a screen-reader pass on the player, and a contrast
check on the olive-on-cream palette at small text sizes.

---

## How to verify

```bash
./supabase/tests/run-radio-tests.sh   # migration chain, idempotency, RLS
npm run test:radio                    # 21 schedule engine tests
npm run build                         # production build
npm run lint                          # 19 pre-existing errors, none added
```

The pre-existing lint errors are in `CentralEvents.tsx`, `BecomeAMaker.tsx`,
`MakerStories.tsx`, `WhatsOnAgent.tsx`, `stripeService.ts` and the Deno edge
function. None are in radio code and none were introduced by this build.
