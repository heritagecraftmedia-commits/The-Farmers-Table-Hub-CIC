# The Farmers Table Hub CIC — audit and remediation

Branch: `claude/farmers-table-hub-audit-vwzs5i`
Baseline: `148b1f3` ("Add local promotion workflow to Radio Control Centre")

This file records what was found, what was changed, what you have to run by
hand, and what is still open. Read **Section 3 before deploying** — several
fixes are inert until you run the migration and set secrets.

---

## 1. Security findings

### 1.1 "Logged in" was treated as "admin" — CRITICAL, fixed

`supabase-schema.sql` guarded most tables with:

```sql
create policy "authenticated_full_access" on raw_leads for all
  using (auth.role() = 'authenticated');
```

`auth.role() = 'authenticated'` is true for **any** signed-in user. Anyone with
an account could read and write `raw_leads`, `qualified_leads`,
`enriched_leads`, `staff`, `founder_jobs`, `outreach_log`, `system_controls`,
and every other maker's `claimed_vendors` row.

`enriched_leads` and `raw_leads` hold scraped contact data on real businesses
that have not consented. Exposing them to every account holder is the exact
outcome the project's GDPR commitment rules out.

### 1.2 Roles were stored somewhere the user controls — CRITICAL, fixed

Two more admin models existed alongside the first, and **both were writable by
the user being checked**:

```sql
-- 20260317_radio_events.sql, 20260825_radio_v1.sql
(auth.users.raw_user_meta_data->>'role') = 'founder'
```

`raw_user_meta_data` is populated from the client. Any signed-in user could run

```js
await supabase.auth.updateUser({ data: { role: 'founder' } })
```

and become a founder. The same value drove `AuthContext.tsx`, so this handed
out the Command Centre, the founder Dashboard and the radio controls in the UI
**and** write access to every radio table in the database. The
`directory-outreach` edge function used the same check, so a self-promoted user
could also send mail from the founder's Gmail account.

A third model (`profiles.role = 'founder'`, in the `directory_listings`
migration) was sound, but no migration in this repo ever created `profiles`.

**Fix:** one model. `supabase/migrations/20260826_rls_admin_hardening.sql`
creates `profiles`, writable only by an existing admin or the `service_role`
key, and reads it through `SECURITY DEFINER` helpers `public.is_admin()` and
`public.is_radio_staff()` with a pinned `search_path`. Every policy above was
replaced. `AuthContext` and both edge functions now read `profiles`.

`is_radio_staff()` exists so the Founder / Radio Manager / Presenter split in
`src/pages/StudioDashboardV1.md` still works once admin access is narrowed —
a flat `is_admin()` on the radio tables would have contradicted that spec.

### 1.3 Two deliberate deviations from the supplied RLS patch

The patch supplied with this task was applied with two changes. Both are
commented in the migration.

**a. `users_update_own_profile_nonadmin` was dropped, not applied.**

```sql
create policy "users_update_own_profile_nonadmin" on profiles
  for update using (auth.uid() = id);
```

An `UPDATE` policy with no `WITH CHECK` makes Postgres reuse the `USING`
expression as the `WITH CHECK`. So this policy permits a user to update their
own row **to `is_admin = true`** — it reintroduces exactly the escalation the
patch was written to remove. The name says "nonadmin"; nothing enforced it.
`profiles` has no user-editable fields, so users get read-only access to their
own row.

**b. `public_read_published_enriched_leads` was replaced.**

```sql
create policy "public_read_published_enriched_leads" on enriched_leads
  for select using (status = 'published');
```

Nothing in this codebase ever sets `status = 'published'` — the statuses in use
are `draft`, `invited` and `claimed`. The policy would have matched no rows and
silently broken the claim flow in `ClaimListing.tsx`. A blanket `SELECT` would
also let anyone enumerate every scraped lead.

Replaced with `public.get_claimable_listing(uuid)` and
`public.submit_listing_claim(...)`: one row at a time, only once a human has
invited it, only the fields the claimant needs.

### 1.4 The outreach function was a bulk auto-sender — CRITICAL, fixed

`supabase/functions/directory-outreach` emailed **every** `directory_listings`
row with `outreach_status = 'not_contacted'` on a single POST. The seed
migration ships 146+ real UK businesses with real addresses, so one call mailed
all of them, with no per-recipient approval anywhere in the path. That
contradicts the project's stated human-in-the-loop principle.

Now two gates must both pass:

1. the caller names the recipients explicitly in `listingIds` — there is no
   send-to-all path; and
2. each named row already has `outreach_approved = true`, set separately by an
   admin and recorded in `outreach_approved_by` / `outreach_approved_at`.

Opted-out, already-contacted and unapproved rows are skipped and reported back
rather than mailed. A run is capped at 25 recipients. Both email bodies now
carry an explicit opt-out line. CORS narrowed from `*` to the app origin.

### 1.5 The Anthropic API key shipped to every visitor — fixed

`WhatsOnAgent.tsx` called `api.anthropic.com` from the browser using
`import.meta.env.VITE_ANTHROPIC_API_KEY`, with
`anthropic-dangerous-allow-browser: true`. Every `VITE_`-prefixed variable is
inlined into the JS bundle at build time; that bundle is public, and so is this
GitHub repo. Anyone loading the site could read the key.

The call now lives in a new `supabase/functions/whats-on-agent`, holding the
key as a Supabase secret and requiring an authenticated founder/staff caller.

> **I could not verify from here whether a key is live in the deployed
> bundle** — the proxy blocks fetching it, and the Vercel tools available do not
> list environment variables. **Check whether `VITE_ANTHROPIC_API_KEY` is set on
> the Vercel project. If it is, rotate that key**, then remove the variable. The
> same applies to `GEMINI_API_KEY`, which `vite.config.ts` also exposes to the
> client as `import.meta.env.VITE_GEMINI_API_KEY`.

### 1.6 Five internal tools were on public routes — fixed

`/radio/library` (station audio upload), `/notes` (a Supabase-backed private
notepad), `/changes`, `/draft` and `/whats-on-agent` were mounted in `App.tsx`
with no guard of any kind. `/changes` even tells the reader it "will not be
displayed to the public" while being publicly reachable. All five now sit
behind `RequireRole`.

### 1.7 Demo login could have shipped to production — fixed

`loginAsRole()` grants a founder session with **no credentials**, and demo mode
triggered on "Supabase env vars absent". A production deploy with missing env
vars would therefore have published a working "Founder Access" button on
`/login`. Demo mode and `VITE_DEV_AUTO_LOGIN` are now restricted to dev builds.

### 1.8 Smaller RLS tightenings

- Makers could approve and publish their own `claimed_vendors` row. `WITH CHECK`
  now pins `approved = false` and `published = false` on maker updates.
- `public_story_insert` used `with check (true)`, so a story submission could
  arrive with `published = true` and skip review. Now `published = false`.
- `radio_sponsors` exposed `contact_name` / `contact_email` to anon via
  "Public can read active sponsors". Replaced with a `public_radio_sponsors`
  view carrying only business name, package and audio.

---

## 2. Correctness bugs

### 2.1 A missing Gemini key blanked the entire site — CRITICAL, fixed

`geminiService.ts` built its client at module scope. `new GoogleGenAI({apiKey: ""})`
throws on construction, and this module is pulled into the single app bundle
via `aiAgentService` → `Dashboard`, so the throw happened during import and
killed the whole React tree.

Verified in Chromium against the dev server: **41 of 41 routes rendered 0
characters** with an uncaught `ApiError: API key must be set when using the
Gemini API`. The homepage included. A key that exists only for the admin-only
discovery agent could take the public community site offline.

The client is now built on first use. A missing key degrades only the AI
features.

**Re-verified after the fix:** all 40 routes render at 375 px and 1440 px, no
blank pages, and **no horizontal overflow at either width** — the mobile layout
is sound. The only remaining console errors are external hosts blocked by the
audit sandbox's proxy (`picsum.photos`, `images.unsplash.com`,
`fonts.googleapis.com`, `api.qrserver.com`); they are not application faults
and load normally on the real deployment.

One thing worth knowing: `src/data/producers.ts` sources its imagery from
`picsum.photos`, a random-placeholder service. Those are placeholder photos
being served to the public site, not real producer images.

### 2.2 React types were never installed

`@types/react` and `@types/react-dom` were absent. Every `React.FC` in the
project was silently `any`, so `npm run lint` could not see real errors — and
most of the 22 errors it did report were noise from type-checking the Deno edge
functions with the browser config.

With real types installed and `supabase/functions` excluded from the app's
program, **typecheck is clean (0 errors)** and these real bugs surfaced:

| File | Bug | Effect |
|---|---|---|
| `MakerStories.tsx` | `.filter` called on the Promise from the async `getMakerStories()` | Public Maker Stories page was permanently empty |
| `BecomeAMaker.tsx` | `useState` used with no import | `/become-a-maker` threw on render — page completely broken |
| `AddEventModal.tsx` | never set `craftType` | Every dashboard-created event was uncategorised; `WhatsOn.tsx` filters on that field |
| `CentralOverview.tsx` | took no props while `CommandCenter` passed `onNavigate` | Add Person / Log Stock / Add Task buttons did nothing |
| `Dashboard.tsx` | compared `RadioShow.status` to `'recorded'`, not in the union | Pre-recorded shows never got their badge |
| `stripeService.ts` | imported `loadStripe` from an uninstalled package | Build survived only because the symbol was unused |

### 2.3 The password reset flow was unreachable — fixed

`ResetPassword.tsx` worked, but **nothing in the app ever called
`resetPasswordForEmail`**, so no recovery link could ever be produced. Login now
has a "Forgot password?" action. `ResetPassword` also checks for a recovery
session first — opening the URL directly used to show a working-looking form
that failed on submit with a raw API error.

### 2.4 Anonymous claims were silently discarded — fixed

`ClaimListing.tsx` inserted into `claimed_vendors` without `user_id` and without
checking the result. Claimants arrive from an emailed link and are normally not
signed in, so `claimed_vendors_insert_owner` (`to authenticated`, `auth.uid() =
user_id`) rejected the insert — and the page still showed a success screen. Now
routed through `submit_listing_claim()`, with the error surfaced.

### 2.5 Stripe was misconfigured

`stripeService` read `VITE_STRIPE_PUBLIC_KEY`; `.env.example` defines
`VITE_STRIPE_PUBLISHABLE_KEY`. `isConfigured()` was therefore always false, and
an unconfigured checkout sent supporters to `https://buy.stripe.com/undefined`
— a 404 on Stripe's own domain, indistinguishable from a failed payment. Fixed
and surfaced as a message on the Subscriptions page.

---

## 3. What you must do by hand

Nothing in Section 1 takes effect until these are done.

**1. Run the migration** (Supabase Dashboard → SQL Editor):
`supabase/migrations/20260826_rls_admin_hardening.sql`. It is idempotent.

**2. Make yourself admin.** Nobody is an admin until you do. Take your UUID from
Authentication → Users:

```sql
update profiles set is_admin = true, role = 'founder'
where id = 'FOUNDER-UUID-HERE';
```

Radio staff, when they exist:

```sql
update profiles set role = 'radio_manager' where id = 'STAFF-UUID-HERE';
```

**3. Set the Anthropic secret and remove the client-side one:**

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase functions deploy whats-on-agent
supabase functions deploy directory-outreach
```

Then delete `VITE_ANTHROPIC_API_KEY` from Vercel, **and rotate that key** — it
may have been public in the bundle.

**4. Verify RLS as a second, non-admin test user.** Each of these must return
zero rows, not data:

```sql
select * from raw_leads;
select * from qualified_leads;
select * from enriched_leads;
select * from staff;
select * from founder_jobs;
select * from system_controls;
select * from outreach_log;
select * from claimed_vendors;   -- only their own row, if any
```

And this must fail rather than promote them:

```sql
update profiles set is_admin = true where id = auth.uid();
```

**5. Check the `radio-audio` storage bucket policies.** `radioService.uploadMediaFile`
writes to it. Storage policies are not in this repo and were not audited.

---

## 4. Still open — needs a decision from you

These were left alone deliberately. They are product decisions, or they touch
founder-facing admin tools where guessing would be worse than asking.

1. **There is no signup anywhere in the app.** No `signUp` call exists. Makers
   can claim a listing without an account (that path works), but nobody can
   create one. Members / MembersArea assume accounts exist. Who is supposed to
   be able to sign up, and how — open signup, invite-only, or founder-created?

2. **`CentralOverview` shows fabricated numbers.** "12 Active People", "£3.4k
   Monthly Income", "9 Advertisers", today's schedule, and the Xero / Notion /
   HubSpot / Live365 status chips in the Command Centre header are all
   hardcoded literals. A founder dashboard presenting invented figures as real
   is a bad failure mode. Should these read from `hubService`, or be labelled
   as sample data until wired?

3. **Commerce is UI-only.** `Marketplace.tsx` has a hardcoded "0 listings", an
   always-on empty state, no data source, and three buttons with no handlers.
   `MakersShop.tsx` renders static data from `src/data/makerListings.ts` with no
   purchase path. `Subscriptions.tsx` is the only page with real checkout, via
   Stripe Payment Links. `ChangesDraft.tsx` is an internal scratchpad whose text
   claims changes "are saved in your current session" — they are `useState` and
   are lost on refresh.

4. **Tables used in code with no migration in this repo**: `notes`,
   `applications`, `feedback_book_responses`, `pending_listings`, `playlists`,
   `sponsor_rotations`, `ad_schedules`, `social_posts`. They exist only in the
   live database, if at all. **Their RLS was not audited and is not covered by
   the migration** — I could not see their definitions. Worth exporting the live
   schema into `supabase/migrations/` so the repo matches reality.

5. **`system_controls` is decorative.** The Dashboard's agent toggles and
   maintenance-mode switch call `hubService.getSystemSettings()` /
   `updateSystemSettings()`, which read and write an in-memory mock object. They
   never touch the `system_controls` table, and nothing reads those toggles to
   decide whether an agent runs. Flipping them changes nothing.

6. **`CommandCenter` grants `staff` the same access as `founder`** — Finance,
   Records, People, Safe Mode included. `StudioDashboardV1.md` describes a
   narrower staff role. Intentional?

7. **Duplicate migrations.** `20260317_create_directory_listings.sql` and
   `20260317_create_directory_listings_table.sql` both create the same table and
   differ only in seed rows. One should go.

8. **Bundle size.** One 1.3 MB chunk (332 KB gzipped), no code splitting. Fine
   for now; worth route-level `lazy()` if mobile load time matters.

---

## 5. Deliberately not changed

- **`Home.tsx`** — untouched, per the "locked website framework" note on its
  commit. It threw no errors and needed no fix.
- **`StudioDashboardV1.md`** — treated as the source of truth for radio roles.
  `is_radio_staff()` was written to preserve its Founder / Radio Manager /
  Presenter split rather than flatten it to admin-only.
- **The Vite + React stack** — unchanged. No Next.js migration.
- **Nothing was added that auto-sends or auto-publishes.** The changes here move
  in the opposite direction.

---

## 6. Punch list

| # | Item | Status |
|---|---|---|
| 1 | Apply RLS fix | Done, adapted — see 1.1–1.3. **Verification is yours to run** (Section 3.4); I have no database access. |
| 2 | Read `StudioDashboardV1.md` first | Done. Drove the `is_radio_staff()` design. No contradiction introduced. |
| 3 | Verify auth flow end to end | Login works. **Reset was unreachable and is now fixed.** **Signup does not exist** — see 4.1. |
| 4 | Audit commerce pages | Done — see 4.3. Subscriptions has real checkout; the rest are shells. |
| 5 | Confirm human-in-the-loop | `WhatsOnAgent` was already compliant (draft text only, no writes). **`directory-outreach` was not** — see 1.4. Discovery/enrichment write `status='draft'` and never publish. |
| 6 | Confirm Vercel matches latest commits | **Confirmed current.** Production deployment `dpl_CimGc6or…` is READY at commit `148b1f3`, which is `main` HEAD. No stale build. |
| 7 | Build, type errors, console errors, mobile | Build passes. Typecheck 0 errors (was unusable — see 2.2). **Whole site was blank** — see 2.1. After the fix: 80 page loads (40 routes x 2 viewports), no blank pages, no horizontal overflow, no app-level console errors. |
| 8 | Don't break `Home.tsx` | Untouched. |
