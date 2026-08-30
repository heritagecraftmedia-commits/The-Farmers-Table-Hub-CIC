/**
 * Supabase Edge Function: whats-on-agent
 *
 * REVIEWER ASSISTANT. It does not discover events.
 *
 * WHAT CHANGED AND WHY
 * --------------------
 * This function used to run a four-agent "venue scout / artist scout"
 * prompt that asked the model to produce a weekly What's On listing
 * "using your knowledge of Farnham, Surrey and the surrounding area".
 * That is model recall, not discovery: the venues, artists and nights it
 * returned were recalled or generated, not read from any source, and the
 * output was formatted to look like a verified listing. Labelling some of
 * it "check to confirm" did not make it evidence.
 *
 * Real discovery now happens in the pipeline:
 *
 *   source -> normalise -> categorise -> score -> dedupe -> pending_events
 *
 * (see src/services/discovery/ and api/cron/discover-whats-on.ts). Every
 * candidate there comes from a configured source and carries a real source
 * URL. If no source is configured, nothing is staged.
 *
 * This function's remaining job is to help the human reviewing that queue:
 * given a candidate that ALREADY EXISTS, it suggests a category, comments
 * on relevance, and drafts a short plain-English summary. It is given the
 * candidate's own text and may use nothing else.
 *
 * HARD BOUNDARIES
 *   - It never writes to any table. It has no service-role write path.
 *   - It never writes to `events` and cannot publish.
 *   - It is not asked to find, recall or infer events, venues or artists.
 *   - It returns a recommendation. A human approves in the dashboard.
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

/**
 * Roles permitted to use reviewer assistance.
 *
 * The live role model is: founder, admin, radio_manager, contributor,
 * member (see 20260828_tft_permissions_rls.sql). The obsolete 'staff' role
 * this function used to check is not in that model, so the check was both
 * wrong and misleading and had to be replaced.
 *
 * This mirrors public.is_radio_staff() - contributor and above - which is
 * the same boundary the pending_events read policy uses. Approval itself is
 * stricter (admin/founder only) and is enforced in the database by
 * approve_pending_event(), not here.
 */
const REVIEW_ROLES = ['founder', 'admin', 'radio_manager', 'contributor'];

const SYSTEM_PROMPT = `You assist a human reviewer at The Farmers Table Hub CIC, a UK community organisation, who is deciding whether a discovered event should be published on the public "What's On" board.

You will be given ONE event candidate that was already discovered from a real source. Your job is to comment on it. It is not your job to find events.

ABSOLUTE RULES
- Use ONLY the candidate text supplied in the user message. You have no other information about this event, this venue, or this area.
- Never add a fact that is not in the supplied text. No venues, dates, times, prices, organisers, performers, addresses or descriptions of your own.
- If a field is missing, say it is missing. Do not fill it in and do not guess.
- Never state or imply that you have verified anything. You cannot.
- You are advising, not deciding. The reviewer publishes, not you.

CATEGORIES (choose exactly one):
Wood & Furniture, Textiles & Clothing, Pottery & Ceramics, Metal & Tools, Heritage & Skills, Workshops & Talks, Food & Produce, Community, Other

Judge the category on what the event actually IS. Do not let a single keyword decide it: an event that mentions woodwork among several crafts is a general Community craft event, not a Wood & Furniture one.

Write in plain English. Short sentences. No hype, no emojis. The reviewer may have cognitive fatigue, so be calm and clear.

OUTPUT FORMAT - use exactly this structure:

Suggested category
[one category from the list, then one sentence on why, citing words from the candidate text]

Relevance
[Is this a good fit for a local craft, heritage and produce board? One short paragraph. Cite only the supplied text.]

Missing information
[Bullet list of fields the reviewer should check or fill in before publishing. Write "Nothing obvious missing." if so.]

Suggested summary
[A two-sentence plain-English description built ONLY from the supplied text, for the reviewer to edit. If there is too little text to summarise, write "Not enough detail supplied to summarise."]`;

interface Candidate {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  venue?: string;
  location?: string;
  organiser?: string;
  sourceUrl?: string;
  sourcePlatform?: string;
  category?: string;
  confidenceScore?: number;
}

const field = (label: string, value: unknown): string =>
  `${label}: ${value === null || value === undefined || value === '' ? '(not supplied)' : String(value)}`;

const userPrompt = (c: Candidate) => `Here is the event candidate to comment on. This is the complete set of information available. Do not add anything to it.

${field('Title', c.title)}
${field('Description', c.description)}
${field('Start date', c.startDate)}
${field('End date', c.endDate)}
${field('Venue', c.venue)}
${field('Location', c.location)}
${field('Organiser', c.organiser)}
${field('Source platform', c.sourcePlatform)}
${field('Source URL', c.sourceUrl)}
${field('Category assigned by the pipeline', c.category)}
${field('Relevance score assigned by the pipeline', c.confidenceScore)}

Comment on this candidate in the required format.`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

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

    const permitted = profile && (profile.is_admin || REVIEW_ROLES.includes(profile.role));
    if (!permitted) {
      return json({ error: 'Forbidden - contributor access or above is required' }, 403);
    }

    // A candidate is required. With nothing to comment on there is no task:
    // this function must not be usable as a "generate me some events" endpoint.
    let candidate: Candidate | null = null;
    try {
      const body = await req.json();
      candidate = body?.candidate ?? null;
    } catch {
      candidate = null;
    }

    if (!candidate || typeof candidate !== 'object') {
      return json({
        error: 'A candidate event is required. This endpoint comments on an existing '
          + 'discovered candidate; it does not generate events.',
      }, 400);
    }
    if (!candidate.title || String(candidate.title).trim() === '') {
      return json({ error: 'The candidate must have a title.' }, 400);
    }
    if (!candidate.sourceUrl || String(candidate.sourceUrl).trim() === '') {
      return json({
        error: 'The candidate must carry its source URL. A candidate with no '
          + 'evidence is not reviewable.',
      }, 400);
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return json({ error: 'ANTHROPIC_API_KEY is not set on this project.' }, 500);
    }

    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt(candidate) }],
    });

    if (response.stop_reason === 'refusal') {
      return json({ error: 'The model declined this request.' }, 502);
    }

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    // Advice only. Nothing is written to the database and nothing is published.
    return json({
      text,
      advisoryOnly: true,
      truncated: response.stop_reason === 'max_tokens',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('whats-on-agent:', msg);
    // Don't leak upstream error detail (which can echo key/quota info) to the browser.
    return json({ error: 'The What\'s On agent could not run. Check the function logs.' }, 500);
  }
});
