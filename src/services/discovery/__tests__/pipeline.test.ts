import { describe, it, expect } from 'vitest';
import {
  normaliseCandidate, normaliseTitle, normaliseUrl, normaliseDate, normaliseLocation,
} from '../normalise';
import { categorise } from '../categorise';
import { scoreCandidate, RELEVANCE_THRESHOLD } from '../score';
import { buildDedupeKey, findDuplicate, titleSimilarity, ExistingRecord } from '../dedupe';
import { parseRobots, isPathAllowed, checkRobots } from '../robots';
import { runDiscovery } from '../pipeline';
import { resolveSource, NOT_CONFIGURED_MESSAGE } from '../sources/registry';
import { JsonLdSource, extractJsonLdBlocks, collectEventNodes } from '../sources/jsonLdSource';
import { NormalisedCandidate, RawCandidate, DiscoveryContext } from '../types';

/**
 * What's On discovery pipeline tests.
 *
 * No test reaches the network. The `fetch` seam on DiscoveryContext is the
 * single injection point, so a fixture page exercises the real adapter,
 * the real robots check and the real pipeline.
 */

const NOW = new Date('2026-09-01T09:00:00.000Z');
const FUTURE = '2026-10-15T10:00:00.000Z';

const raw = (over: Partial<RawCandidate> = {}): RawCandidate => ({
  title: 'Spring Craft Fair',
  description: 'A local handmade craft fair with artisan makers.',
  startDate: FUTURE,
  endDate: null,
  venue: 'The Maltings',
  location: 'Farnham, Surrey',
  organiser: 'Village Hall Committee',
  eventUrl: 'https://example.org/events/spring-craft-fair',
  sourceUrl: 'https://example.org/whats-on',
  sourcePlatform: 'example-org',
  discoveredAt: NOW.toISOString(),
  ...over,
});

const normalised = (over: Partial<NormalisedCandidate> = {}): NormalisedCandidate => {
  const r = normaliseCandidate(raw(), NOW);
  return { ...(r.candidate as NormalisedCandidate), ...over };
};

/** A context whose fetch serves a fixed map of URL -> [status, body]. */
const ctxWith = (routes: Record<string, [number, string]>, log: string[] = []): Partial<DiscoveryContext> => ({
  now: () => NOW,
  log: (m) => log.push(m),
  fetch: (async (input: any) => {
    const url = typeof input === 'string' ? input : input.url;
    const hit = routes[url];
    if (!hit) return { ok: false, status: 404, text: async () => '' } as any;
    const [status, body] = hit;
    return { ok: status >= 200 && status < 300, status, text: async () => body } as any;
  }) as any,
});

const listingPage = (events: unknown[]): string => `
<!doctype html><html><head>
<script type="application/ld+json">${JSON.stringify(events)}</script>
</head><body>listing</body></html>`;

const schemaEvent = (over: Record<string, unknown> = {}) => ({
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: 'Spring Craft Fair',
  description: 'A local handmade craft fair with artisan makers and demonstrations.',
  startDate: FUTURE,
  url: 'https://example.org/events/spring-craft-fair',
  location: { '@type': 'Place', name: 'The Maltings', address: { addressLocality: 'Farnham' } },
  ...over,
});

// ── 1. Normalisation ────────────────────────────────────────────────────
describe('1. normalisation', () => {
  it('cleans titles, venues and locations', () => {
    expect(normaliseTitle('  SPRING   CRAFT FAIR  ')).toBe('Spring Craft Fair');
    expect(normaliseTitle('Event: Pottery Taster | Whats On')).toBe('Pottery Taster');
    expect(normaliseLocation('Farnham, Surrey, United Kingdom')).toBe('Farnham, Surrey');
  });

  it('parses dates and rejects unparseable ones', () => {
    expect(normaliseDate('2026-10-15')).toBe('2026-10-15T00:00:00.000Z');
    expect(normaliseDate('next Tuesday')).toBeNull();
    expect(normaliseDate('')).toBeNull();
  });

  it('normalises a good candidate end to end', () => {
    const r = normaliseCandidate(raw(), NOW);
    expect(r.ok).toBe(true);
    expect(r.candidate?.title).toBe('Spring Craft Fair');
    expect(r.candidate?.venue).toBe('The Maltings');
  });

  it('rejects a missing date and an expired event', () => {
    expect(normaliseCandidate(raw({ startDate: null }), NOW).ok).toBe(false);
    const expired = normaliseCandidate(raw({ startDate: '2020-01-01T00:00:00Z' }), NOW);
    expect(expired.ok).toBe(false);
    expect(expired.reason).toMatch(/already finished/);
  });

  it('keeps a multi-day event live on its final day', () => {
    const r = normaliseCandidate(
      raw({ startDate: '2026-08-30T09:00:00Z', endDate: '2026-09-01T17:00:00Z' }),
      NOW,
    );
    expect(r.ok).toBe(true);
  });
});

// ── 4. URL validation ───────────────────────────────────────────────────
describe('4. URL validation', () => {
  it('accepts http(s) and rejects everything else', () => {
    expect(normaliseUrl('https://example.org/e')).toBe('https://example.org/e');
    expect(normaliseUrl('/events/relative')).toBeNull();
    expect(normaliseUrl('javascript:alert(1)')).toBeNull();
    expect(normaliseUrl('mailto:someone@example.org')).toBeNull();
    expect(normaliseUrl('not a url')).toBeNull();
  });

  it('strips tracking parameters so one event is not seen as two', () => {
    expect(normaliseUrl('https://example.org/e?utm_source=fb&id=7'))
      .toBe('https://example.org/e?id=7');
  });
});

// ── 2. Categorisation ───────────────────────────────────────────────────
describe('2. categorisation', () => {
  it('classifies a single-craft event by its title', () => {
    const d = categorise({ title: 'Blacksmithing Taster Day', description: 'Forge work at the anvil.' });
    expect(d.category).toBe('Metal & Tools');
    expect(d.rationale).toMatch(/blacksmith/i);
  });

  it('does NOT let one keyword dominate a general community craft fair', () => {
    // The brief's example: "woodwork" appears, but this is a community fair.
    const d = categorise({
      title: 'Village Community Craft Fair',
      description: 'Stalls covering woodwork, pottery, weaving, jams and cakes. All welcome.',
    });
    expect(d.category).toBe('Community');
    expect(d.category).not.toBe('Wood & Furniture');
    expect(d.rationale).toMatch(/general|different crafts/i);
  });

  it('still honours a craft named in the title of a fair', () => {
    const d = categorise({
      title: 'Pottery Craft Fair',
      description: 'Ceramics and stoneware from local potters.',
    });
    expect(d.category).toBe('Pottery & Ceramics');
  });

  it('falls back to Other and says so', () => {
    const d = categorise({ title: 'Annual General Meeting', description: 'Agenda and minutes.' });
    expect(d.category).toBe('Other');
    expect(d.rationale).toMatch(/No category keywords/i);
  });

  it('always returns a rationale a reviewer can check', () => {
    for (const t of ['Weaving Workshop', 'Cheese Festival', 'Something Unclear']) {
      expect(categorise({ title: t }).rationale.length).toBeGreaterThan(10);
    }
  });
});

// ── 3. Relevance scoring ────────────────────────────────────────────────
describe('3. relevance scoring', () => {
  it('scores a rich, on-topic event above the threshold', () => {
    const c = normalised();
    const s = scoreCandidate({ candidate: c, category: categorise(c), now: NOW });
    expect(s.score).toBeGreaterThanOrEqual(RELEVANCE_THRESHOLD);
    expect(s.rationale).toMatch(/Final score/);
  });

  it('pushes an off-topic event below the threshold', () => {
    const c = normalised({
      title: 'Crypto Trading Seminar',
      description: 'A webinar about crypto trading strategies.',
      venue: null, location: null, websiteUrl: null,
    });
    const s = scoreCandidate({ candidate: c, category: categorise(c), now: NOW });
    expect(s.score).toBeLessThan(RELEVANCE_THRESHOLD);
  });

  it('stays within 0-100', () => {
    const c = normalised({ title: 'Crypto Casino Vape Night', description: 'crypto casino vape' });
    const s = scoreCandidate({ candidate: c, category: categorise(c), now: NOW });
    expect(s.score).toBeGreaterThanOrEqual(0);
    expect(s.score).toBeLessThanOrEqual(100);
  });
});

// ── 5 & 6. Deduplication ────────────────────────────────────────────────
describe('5. deduplication', () => {
  it('never uses the listing URL as identity', () => {
    const a = normalised({ title: 'Pottery Morning', websiteUrl: null });
    expect(buildDedupeKey(a)).not.toContain('whats-on');
  });

  it('matches on the event URL (layer 1)', () => {
    const c = normalised();
    const existing: ExistingRecord[] = [{
      title: 'Totally Different Name', startDate: FUTURE, venue: 'Elsewhere',
      websiteUrl: c.websiteUrl, source: 'pending_events', status: 'pending',
    }];
    const v = findDuplicate(c, existing);
    expect(v.duplicate).toBe(true);
    expect(v.layer).toBe(1);
  });

  it('matches on title + date + venue (layer 2)', () => {
    const c = normalised({ websiteUrl: null });
    const existing: ExistingRecord[] = [{
      title: c.title, startDate: c.startDate, venue: c.venue,
      dedupeKey: buildDedupeKey(c), source: 'pending_events', status: 'pending',
    }];
    expect(findDuplicate(c, existing).layer).toBe(2);
  });

  it('catches a near-duplicate title on the same day and venue (layer 3)', () => {
    expect(titleSimilarity('Spring Craft Fair', 'Spring Craft Fair 2026')).toBeGreaterThanOrEqual(0.8);
    const c = normalised({ websiteUrl: null });
    const existing: ExistingRecord[] = [{
      title: 'Spring Craft Fair 2026', startDate: c.startDate, venue: c.venue,
      source: 'events', status: 'published',
    }];
    expect(findDuplicate(c, existing).layer).toBe(3);
  });

  it('treats a different event at the same venue on the same day as distinct', () => {
    const c = normalised({ title: 'Evening Blacksmithing Demo', websiteUrl: null });
    const existing: ExistingRecord[] = [{
      title: 'Morning Pottery Workshop', startDate: c.startDate, venue: c.venue,
      source: 'pending_events', status: 'pending',
    }];
    expect(findDuplicate(c, existing).duplicate).toBe(false);
  });
});

// ── 6. Two events on one source page ────────────────────────────────────
describe('6. two events on the same source page', () => {
  it('stages both rather than collapsing them', async () => {
    const page = listingPage([
      schemaEvent({ name: 'Pottery Workshop', url: 'https://example.org/events/pottery' }),
      schemaEvent({ name: 'Blacksmithing Taster', url: 'https://example.org/events/blacksmith' }),
    ]);
    const report = await runDiscovery({
      source: new JsonLdSource({ id: 'example-org', label: 'Example', listingUrl: 'https://example.org/whats-on' }),
      existing: [],
      ctx: ctxWith({
        'https://example.org/robots.txt': [200, 'User-agent: *\nDisallow: /admin\n'],
        'https://example.org/whats-on': [200, page],
      }),
    });
    expect(report.staged).toHaveLength(2);
    expect(new Set(report.staged.map(s => s.dedupeKey)).size).toBe(2);
    // Same listing page, two events - the source URL is shared, identity is not.
    expect(new Set(report.staged.map(s => s.sourceUrl)).size).toBe(1);
  });
});

// ── 7. Rejected-event suppression ───────────────────────────────────────
describe('7. rejected-event suppression', () => {
  it('does not re-stage an event that was previously rejected', async () => {
    const page = listingPage([schemaEvent()]);
    const rejected: ExistingRecord[] = [{
      title: 'Spring Craft Fair', startDate: FUTURE, venue: 'The Maltings',
      websiteUrl: 'https://example.org/events/spring-craft-fair',
      source: 'pending_events', status: 'rejected',
    }];
    const report = await runDiscovery({
      source: new JsonLdSource({ id: 'example-org', label: 'Example', listingUrl: 'https://example.org/whats-on' }),
      existing: rejected,
      ctx: ctxWith({
        'https://example.org/robots.txt': [404, ''],
        'https://example.org/whats-on': [200, page],
      }),
    });
    expect(report.staged).toHaveLength(0);
    expect(report.discarded[0].reason).toMatch(/rejected/i);
  });
});

// ── 16. Robots handling ─────────────────────────────────────────────────
describe('16. robots.txt handling', () => {
  it('parses groups and applies longest-match', () => {
    const rules = parseRobots('User-agent: *\nDisallow: /private\nAllow: /private/public\n');
    expect(isPathAllowed('/whats-on', rules)).toBe(true);
    expect(isPathAllowed('/private/thing', rules)).toBe(false);
    expect(isPathAllowed('/private/public/x', rules)).toBe(true);
  });

  it('prefers our own user-agent group over the wildcard', () => {
    const txt = 'User-agent: *\nDisallow: /\n\nUser-agent: FarmersTableHubBot\nDisallow:\n';
    expect(isPathAllowed('/whats-on', parseRobots(txt))).toBe(true);
  });

  it('treats a missing robots.txt as unrestricted', async () => {
    const v = await checkRobots('https://example.org/whats-on', {
      ...ctxWith({ 'https://example.org/robots.txt': [404, ''] }),
    } as DiscoveryContext);
    expect(v.allowed).toBe(true);
  });

  it('does not fetch when robots.txt disallows the path', async () => {
    const log: string[] = [];
    const report = await runDiscovery({
      source: new JsonLdSource({ id: 'example-org', label: 'Example', listingUrl: 'https://example.org/whats-on' }),
      existing: [],
      ctx: ctxWith({
        'https://example.org/robots.txt': [200, 'User-agent: *\nDisallow: /whats-on\n'],
        'https://example.org/whats-on': [200, listingPage([schemaEvent()])],
      }, log),
    });
    expect(report.staged).toHaveLength(0);
    expect(log.join(' ')).toMatch(/disallows/i);
  });

  it('treats a 5xx robots.txt as disallowed', async () => {
    const v = await checkRobots('https://example.org/x', {
      ...ctxWith({ 'https://example.org/robots.txt': [503, ''] }),
    } as DiscoveryContext);
    expect(v.allowed).toBe(false);
  });
});

// ── 14 & 15. Safety: no source, no invention ────────────────────────────
describe('14. no-source-configured safety', () => {
  it('resolves no source when the environment is empty', () => {
    expect(resolveSource({})).toBeNull();
    expect(resolveSource({ WHATS_ON_SOURCE_URL: '  ' })).toBeNull();
  });

  it('exits cleanly with the configured message and stages nothing', async () => {
    const log: string[] = [];
    const report = await runDiscovery({ source: null, existing: [], ctx: ctxWith({}, log) });
    expect(report.configured).toBe(false);
    expect(report.staged).toHaveLength(0);
    expect(report.message).toBe(NOT_CONFIGURED_MESSAGE);
    expect(log).toContain(NOT_CONFIGURED_MESSAGE);
  });

  it('builds a source once the URL is supplied', () => {
    const s = resolveSource({ WHATS_ON_SOURCE_URL: 'https://example.org/whats-on' });
    expect(s?.isConfigured()).toBe(true);
    expect(s?.id).toBe('example.org');
  });
});

describe('15. no invented events on any failure path', () => {
  it('stages nothing when the source is unreachable', async () => {
    const report = await runDiscovery({
      source: new JsonLdSource({ id: 'x', label: 'x', listingUrl: 'https://example.org/whats-on' }),
      existing: [],
      ctx: {
        ...ctxWith({ 'https://example.org/robots.txt': [404, ''] }),
        fetch: (async (input: any) => {
          const url = typeof input === 'string' ? input : input.url;
          if (url.endsWith('robots.txt')) return { ok: false, status: 404, text: async () => '' } as any;
          throw new Error('network unreachable');
        }) as any,
      },
    });
    expect(report.staged).toHaveLength(0);
    expect(report.fetched).toBe(0);
  });

  it('stages nothing when the page contains no structured event data', async () => {
    const report = await runDiscovery({
      source: new JsonLdSource({ id: 'x', label: 'x', listingUrl: 'https://example.org/whats-on' }),
      existing: [],
      ctx: ctxWith({
        'https://example.org/robots.txt': [404, ''],
        'https://example.org/whats-on': [200, '<html><body><p>No structured data here.</p></body></html>'],
      }),
    });
    expect(report.fetched).toBe(0);
    expect(report.staged).toHaveLength(0);
  });

  it('discards a candidate with no usable source URL', () => {
    expect(normaliseCandidate(raw({ sourceUrl: '' }), NOW).ok).toBe(false);
    expect(normaliseCandidate(raw({ sourceUrl: 'not-a-url' }), NOW).ok).toBe(false);
  });

  it('every staged candidate carries the full evidence set', async () => {
    const report = await runDiscovery({
      source: new JsonLdSource({ id: 'example-org', label: 'Example', listingUrl: 'https://example.org/whats-on' }),
      existing: [],
      ctx: ctxWith({
        'https://example.org/robots.txt': [404, ''],
        'https://example.org/whats-on': [200, listingPage([schemaEvent()])],
      }),
    });
    expect(report.staged).toHaveLength(1);
    for (const s of report.staged) {
      expect(s.sourceUrl).toMatch(/^https?:\/\//);
      expect(s.sourcePlatform).not.toBe('');
      expect(Number.isNaN(Date.parse(s.startDate))).toBe(false);
      expect(s.category).toBeTruthy();
      expect(typeof s.confidenceScore).toBe('number');
      expect(s.selectionRationale.length).toBeGreaterThan(10);
      expect(s.discoveredAt).toBeTruthy();
      expect(s.dedupeKey).toBeTruthy();
    }
  });
});

// ── JSON-LD parsing ─────────────────────────────────────────────────────
describe('JSON-LD extraction', () => {
  it('reads events from @graph and skips malformed blocks', () => {
    const html = `
      <script type="application/ld+json">{ not json }</script>
      <script type="application/ld+json">${JSON.stringify({ '@graph': [schemaEvent()] })}</script>`;
    const nodes = extractJsonLdBlocks(html).flatMap(b => collectEventNodes(b));
    expect(nodes).toHaveLength(1);
  });

  it('reads nested Place and address objects', async () => {
    const report = await runDiscovery({
      source: new JsonLdSource({ id: 'x', label: 'x', listingUrl: 'https://example.org/whats-on' }),
      existing: [],
      ctx: ctxWith({
        'https://example.org/robots.txt': [404, ''],
        'https://example.org/whats-on': [200, listingPage([schemaEvent()])],
      }),
    });
    expect(report.staged[0].venue).toBe('The Maltings');
    expect(report.staged[0].location).toBe('Farnham');
  });
});
