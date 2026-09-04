# Radio content model — dual V1/V3 split (decision deferred)

**Status: KNOWN, DELIBERATELY NOT RESOLVED IN THIS INTEGRATION.**

The database carries two radio content models at once. Both are live, both have
RLS, and neither is broken. This note records the split so the decision is made
deliberately later rather than discovered by accident.

## V1 — the original model

Tables/views: `radio_playlists`, `radio_playlist_items`, `radio_media`,
`radio_broadcasts`, `radio_shows`, `radio_sponsors`, and the derived views
`radio_tracks`, `radio_jingles`, `radio_adverts`, `radio_programmes`,
`radio_special_broadcasts`, `public_sponsor_rotations`.

Consumed by: `src/services/radioService.ts`, `src/services/hubService.ts`, and
`src/pages/Radio.tsx` (reachable at `/radio/overview`).

## V3 — the station model

Tables: `radio_stations`, `radio_station_settings`, `radio_presenters`,
`radio_programme_presenters`, `radio_schedule`, `radio_episodes`,
`radio_imaging_assignments`, `radio_sponsorships`, `radio_announcements`,
`radio_event_promotions`, `radio_news`, `radio_submissions`.

Consumed by: `src/services/radio/stationService.ts` and everything under
`src/pages/radio/` and `src/components/radio/`, i.e. the public station and the
Radio Control Centre.

## Where they overlap

Imaging/jingles and adverts exist in both shapes: V1 as `radio_media` rows
surfaced through the `radio_jingles` / `radio_adverts` views, V3 as
`radio_imaging_assignments` plus `radio_sponsors` / `radio_sponsorships` driven
by `ImagingManager` and `AdvertiserManager`. Sponsors are the sharpest overlap —
`radio_sponsors` is written by the V3 advertising path but also read by the V1
`public_sponsor_rotations` view.

## Why nothing was changed here

This integration was scoped to bringing the radio *application* onto the current
codebase. Collapsing the two models means migrating data and dropping objects,
which is a production database change and a separate, reviewed piece of work.

## What must NOT be done casually

* Do not drop either model's tables or views — both have live readers.
* Do not migrate `radio_media` into `radio_imaging_assignments` (or the reverse)
  without first confirming no reader is left behind.
* Do not seed either model with invented content to make a screen look populated.

## The decision to make later

Either retire V1 (migrate its readers to `stationService`, then drop the V1
views), or keep V1 strictly for the legacy `/radio/overview` page and freeze it.
Pick one and write it down; the present state is neither.
