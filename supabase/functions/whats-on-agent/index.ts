/**
 * Supabase Edge Function: whats-on-agent
 *
 * Server-side home for the weekly "What's On" draft that /whats-on-agent
 * renders.
 *
 * WHY THIS EXISTS
 * ---------------
 * src/pages/WhatsOnAgent.tsx used to call api.anthropic.com directly from the
 * browser, reading import.meta.env.VITE_ANTHROPIC_API_KEY. Every VITE_-prefixed
 * variable is inlined into the JS bundle at build time, and that bundle is
 * served publicly (the GitHub repo is public too). The page also sent
 * "anthropic-dangerous-allow-browser: true", which is the header you only need
 * when you are doing exactly this. Anyone loading the site could read the key
 * out of the bundle and spend the CIC's Anthropic credit.
 *
 * The key now lives only here:
 *   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
 *
 * HUMAN-IN-THE-LOOP
 * -----------------
 * This returns draft text to a human and writes nothing. It must never insert
 * into `events` or publish anywhere. Approving and publishing stays a manual
 * step in the dashboard, as with the rest of the agent pipeline.
 */

import { createClient } from 'npm:@supabase/supabase-js@2';
import Anthropic from 'npm:@anthropic-ai/sdk';

const APP_URL = 'https://the-farmers-table-hub-cic.vercel.app';

const CORS = {
  'Access-Control-Allow-Origin': APP_URL,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  Vary: 'Origin',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

const SYSTEM_PROMPT = `You are an AI agent team working for a UK community radio station and CIC called TFT-Radio (The Farmers Table Hub).

Your goal is to collect, verify, and summarise local live music, arts, and cultural events in and around Farnham, Surrey on a weekly basis.

The output must be clear, calm, non-technical, and suitable for people with cognitive fatigue or memory issues.

You operate as four agents working together:

AGENT 1 – VENUE SCOUT
Find local venues in Farnham and nearby villages (pubs, bars, community halls, arts centres, cafes). Look for live music nights, open mic nights, folk/acoustic sessions, DJ nights.

AGENT 2 – ARTIST & PERFORMER SCOUT
Identify local artists, bands, DJs, and performers connected to Farnham / West Surrey. Focus on regular gigging artists, community musicians, folk, indie, acoustic, jazz, local DJs.

AGENT 3 – EVENT VERIFIER
Cross-check events to ensure they are current or upcoming, dates are clear, and locations are correct. Flag events as: "Weekly regular", "One-off event", or "Monthly night".

AGENT 4 – EDITOR (ACCESSIBILITY & RADIO-FRIENDLY)
Rewrite everything in plain English. No hype language. No emojis. Short sentences. Friendly but calm tone. Suitable for website "What's On" section, radio mentions, and weekly update posts.

IMPORTANT RULES:
- Do NOT invent events. If unsure, clearly say "unconfirmed".
- Focus on local community scale, not major touring acts.
- Prioritise Farnham, then nearby Surrey villages.
- Prefer Thursday to Sunday events.
- Include next 7 to 10 days only.

OUTPUT FORMAT — use exactly this structure:

What's On This Week – Farnham Area

Live Music and Events
[List venues, day, type of event, one-line description]

Local Artists to Look Out For
[List artist name, genre, where playing if known]

Regular Nights
[List venue, weekly/monthly, type of night]

Notes
[Any changes, new venues discovered, events needing confirmation]`;

const userPrompt = () => `You are running the weekly What's On update for TFT-Radio, Farnham, Surrey.

Today's date is: ${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.

Using your knowledge of Farnham, Surrey and the surrounding area (including Alton, Guildford, Godalming, Haslemere, and nearby villages), produce the weekly What's On update now.

If you do not have confirmed real-time data, clearly label items as "check to confirm" rather than inventing details. Focus on venues and nights that are known to run regularly in this area.

Produce the full weekly update in the format specified. Plain English only. No emojis. Short sentences.`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return json({ error: 'Unauthorized' }, 401);

    // Authorise against profiles, never user_metadata (which the client can write).
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { data: profile } = await admin
      .from('profiles')
      .select('is_admin, role')
      .eq('id', user.id)
      .maybeSingle();

    const permitted = profile && (profile.is_admin || ['founder', 'staff'].includes(profile.role));
    if (!permitted) return json({ error: 'Forbidden — staff access required' }, 403);

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return json({ error: 'ANTHROPIC_API_KEY is not set on this project.' }, 500);
    }

    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt() }],
    });

    if (response.stop_reason === 'refusal') {
      return json({ error: 'The model declined this request.' }, 502);
    }

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    // Draft only. Nothing is written to the database and nothing is published.
    return json({ text, truncated: response.stop_reason === 'max_tokens' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('whats-on-agent:', msg);
    // Don't leak upstream error detail (which can echo key/quota info) to the browser.
    return json({ error: 'The What\'s On agent could not run. Check the function logs.' }, 500);
  }
});
