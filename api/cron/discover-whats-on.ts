import { createClient } from '@supabase/supabase-js';
import { runDiscovery } from '../../src/services/discovery/pipeline';
import { resolveSource, NOT_CONFIGURED_MESSAGE } from '../../src/services/discovery/sources/registry';
import { ExistingRecord } from '../../src/services/discovery/dedupe';

/**
 * Weekly What's On discovery. Vercel Cron, Tuesday morning (see vercel.json).
 *
 * This job STAGES ONLY. It inserts into pending_events and nothing else:
 * it never writes to `events`, never sets approved, and never calls
 * approve_pending_event(). Publication requires a human in the dashboard.
 *
 * If no source is configured it exits 200 with
 *   "What's On discovery source not configured"
 * and stages nothing. There is no fallback source and no AI generation
 * path, so a missing configuration produces an empty run, never invented
 * events.
 */

// Typed structurally so this needs no extra dependency.
interface Req { method?: string; headers: Record<string, string | string[] | undefined>; }
interface Res {
  status(code: number): Res;
  json(body: unknown): void;
}

const header = (req: Req, name: string): string | null => {
  const v = req.headers[name] ?? req.headers[name.toLowerCase()];
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
};

export default async function handler(req: Req, res: Res) {
  const log: string[] = [];
  const say = (m: string, meta?: Record<string, unknown>) => {
    const line = meta ? `${m} ${JSON.stringify(meta)}` : m;
    log.push(line);
    console.log(`[whats-on-discovery] ${line}`);
  };

  // Only Vercel Cron (or someone holding CRON_SECRET) may trigger a run.
  // When CRON_SECRET is unset the endpoint refuses rather than running open.
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    say('CRON_SECRET is not set; refusing to run.');
    return res.status(500).json({ ok: false, error: 'CRON_SECRET is not configured.' });
  }
  if (header(req, 'authorization') !== `Bearer ${secret}`) {
    return res.status(401).json({ ok: false, error: 'Unauthorized.' });
  }

  const source = resolveSource(process.env as Record<string, string | undefined>);

  // No source configured: exit cleanly, log, stage nothing.
  if (!source || !source.isConfigured()) {
    const missing = source ? source.missingConfig() : ['WHATS_ON_SOURCE_URL'];
    say(NOT_CONFIGURED_MESSAGE, { missing });
    return res.status(200).json({
      ok: true,
      configured: false,
      staged: 0,
      message: NOT_CONFIGURED_MESSAGE,
      missingConfiguration: missing,
      log,
    });
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    say('Supabase is not configured for the discovery job.');
    return res.status(500).json({
      ok: false,
      error: 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.',
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  // Everything the pipeline must dedupe against, including previously
  // rejected candidates so they do not reappear each week.
  const existing: ExistingRecord[] = [];

  const { data: pending, error: pErr } = await supabase
    .from('pending_events')
    .select('title, start_date, venue, website_url, dedupe_key, status');
  if (pErr) {
    say(`Could not read pending_events: ${pErr.message}`);
    return res.status(500).json({ ok: false, error: pErr.message, log });
  }
  for (const r of pending ?? []) {
    existing.push({
      title: (r as any).title,
      startDate: (r as any).start_date,
      venue: (r as any).venue,
      websiteUrl: (r as any).website_url,
      dedupeKey: (r as any).dedupe_key,
      status: (r as any).status,
      source: 'pending_events',
    });
  }

  const { data: events, error: eErr } = await supabase
    .from('events')
    .select('title, start_date, venue, website_url');
  if (eErr) {
    say(`Could not read events: ${eErr.message}`);
    return res.status(500).json({ ok: false, error: eErr.message, log });
  }
  for (const r of events ?? []) {
    existing.push({
      title: (r as any).title,
      startDate: (r as any).start_date,
      venue: (r as any).venue,
      websiteUrl: (r as any).website_url,
      status: 'published',
      source: 'events',
    });
  }

  const report = await runDiscovery({
    source,
    existing,
    ctx: { log: say },
  });

  // Stage. Nothing here publishes: status defaults to 'pending'.
  let inserted = 0;
  const failed: string[] = [];
  for (const c of report.staged) {
    const { error } = await supabase.from('pending_events').insert({
      title: c.title,
      description: c.description,
      start_date: c.startDate,
      end_date: c.endDate,
      venue: c.venue,
      location: c.location,
      website_url: c.websiteUrl,
      organiser: c.organiser,
      category: c.category,
      source_url: c.sourceUrl,
      source_platform: c.sourcePlatform,
      discovered_at: c.discoveredAt,
      confidence_score: c.confidenceScore,
      selection_rationale: c.selectionRationale,
      dedupe_key: c.dedupeKey,
    });
    if (error) {
      // 23505 is the dedupe index doing its job on a concurrent/repeat run.
      if ((error as any).code === '23505') say(`Already staged, skipped: ${c.title}`);
      else failed.push(`${c.title}: ${error.message}`);
    } else {
      inserted += 1;
    }
  }

  say(`Staged ${inserted} new candidate(s) for review. Nothing was published.`);

  return res.status(200).json({
    ok: true,
    configured: true,
    source: report.sourceId,
    fetched: report.fetched,
    staged: inserted,
    discarded: report.discarded.length,
    failed,
    message: report.message,
    log,
  });
}
