/**
 * End-to-end harness for the What's On discovery pipeline.
 *
 *   source fixture -> HTTP fetch -> robots check -> parse -> normalise
 *   -> categorise -> score -> dedupe -> (SQL) -> pending_events
 *
 * Run with:  npx tsx scripts/e2e-whats-on.ts
 *
 * It serves the fixture over a real local HTTP server, so the adapter does a
 * genuine fetch and a genuine robots.txt request rather than a stubbed one.
 * It prints SQL INSERT statements for every staged candidate on stdout, and
 * a human-readable trace on stderr, so it can be piped straight into psql:
 *
 *   npx tsx scripts/e2e-whats-on.ts | psql -d tft
 *
 * Nothing here publishes. The rows it emits are staged as 'pending'.
 */

import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { runDiscovery } from '../src/services/discovery/pipeline';
import { JsonLdSource } from '../src/services/discovery/sources/jsonLdSource';
import { ExistingRecord } from '../src/services/discovery/dedupe';

const day = (offset: number): string => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offset);
  d.setUTCHours(10, 0, 0, 0);
  return d.toISOString();
};

/**
 * Fixture listing page. Deliberately awkward, to exercise the real rules:
 *   - two DIFFERENT events on ONE page (must both survive)
 *   - a repeat of the first event (must be deduped)
 *   - an event with no date (must be discarded)
 *   - an expired event (must be discarded)
 *   - an off-topic event (must be scored out)
 *   - a general craft fair (must NOT be filed under a single craft)
 */
const FIXTURE_EVENTS = [
  {
    '@type': 'Event',
    name: 'Blacksmithing Taster Morning',
    description: 'Spend a morning at the forge with a local blacksmith. Hammer, anvil and hot metal. All tools provided, no experience needed.',
    startDate: day(21),
    url: 'https://localhost/events/blacksmithing-taster',
    location: { '@type': 'Place', name: 'The Old Forge', address: { addressLocality: 'Farnham', addressRegion: 'Surrey' } },
  },
  {
    '@type': 'Event',
    name: 'Sourdough Baking Workshop',
    description: 'A hands-on artisan bakery workshop covering starters, shaping and baking. Take home a loaf and a starter of your own.',
    startDate: day(28),
    url: 'https://localhost/events/sourdough-baking',
    location: { '@type': 'Place', name: 'The Old Forge', address: { addressLocality: 'Farnham' } },
  },
  {
    // Same event as the first, listed again lower down the page.
    '@type': 'Event',
    name: 'Blacksmithing Taster Morning',
    description: 'Repeat listing of the same forge morning.',
    startDate: day(21),
    url: 'https://localhost/events/blacksmithing-taster',
    location: { '@type': 'Place', name: 'The Old Forge' },
  },
  {
    '@type': 'Event',
    name: 'Village Community Craft Fair',
    description: 'Stalls covering woodwork, pottery, weaving, preserves and cakes. Tea and coffee served all day. Everyone welcome.',
    startDate: day(35),
    url: 'https://localhost/events/community-craft-fair',
    location: { '@type': 'Place', name: 'Village Hall', address: { addressLocality: 'Tilford' } },
  },
  {
    '@type': 'Event',
    name: 'Event With No Date',
    description: 'This listing is missing its start date and must be discarded.',
    url: 'https://localhost/events/no-date',
    location: { '@type': 'Place', name: 'Somewhere' },
  },
  {
    '@type': 'Event',
    name: 'Last Year Harvest Supper',
    description: 'An event that has already happened and must be discarded.',
    startDate: day(-200),
    url: 'https://localhost/events/expired',
    location: { '@type': 'Place', name: 'Village Hall' },
  },
  {
    '@type': 'Event',
    name: 'Crypto Trading Seminar',
    description: 'A webinar about crypto trading strategies and timeshare investment.',
    startDate: day(14),
    url: 'https://localhost/events/crypto',
    location: { '@type': 'Place', name: 'Conference Centre' },
  },
];

const PAGE = `<!doctype html><html><head>
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': FIXTURE_EVENTS })}</script>
</head><body>Listing</body></html>`;

const ROBOTS = 'User-agent: *\nDisallow: /admin\nAllow: /\n';

const sqlLiteral = (v: string | number | null): string => {
  if (v === null) return 'null';
  if (typeof v === 'number') return String(v);
  return `'${v.replace(/'/g, "''")}'`;
};

const main = async () => {
  const server = createServer((req, res) => {
    if (req.url === '/robots.txt') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(ROBOTS);
      return;
    }
    if (req.url === '/whats-on') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(PAGE);
      return;
    }
    res.writeHead(404);
    res.end('not found');
  });

  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as AddressInfo).port;
  const listingUrl = `http://127.0.0.1:${port}/whats-on`;

  const trace: string[] = [];
  const source = new JsonLdSource({ id: 'e2e-fixture', label: 'E2E fixture', listingUrl });

  // Simulates a candidate a reviewer rejected in an earlier week.
  const existing: ExistingRecord[] = [{
    title: 'Crypto Trading Seminar',
    startDate: day(14),
    venue: 'Conference Centre',
    websiteUrl: 'https://localhost/events/crypto',
    status: 'rejected',
    source: 'pending_events',
  }];

  const report = await runDiscovery({
    source,
    existing,
    ctx: { log: (m) => trace.push(m) },
  });

  server.close();

  const err = (m: string) => process.stderr.write(`${m}\n`);
  err('─'.repeat(66));
  err('E2E: source fixture -> fetch -> robots -> parse -> normalise ->');
  err('     categorise -> score -> dedupe -> pending_events');
  err('─'.repeat(66));
  for (const t of trace) err(`  · ${t}`);
  err('');
  err(`  Fetched from source : ${report.fetched}`);
  err(`  Staged for review   : ${report.staged.length}`);
  err(`  Discarded           : ${report.discarded.length}`);
  err('');
  for (const s of report.staged) {
    err(`  STAGED  ${s.title}`);
    err(`          category ${s.category}, score ${s.confidenceScore}`);
    err(`          source   ${s.sourceUrl}`);
  }
  for (const d of report.discarded) {
    const title = 'title' in d.candidate ? d.candidate.title : '(untitled)';
    err(`  DROPPED ${title} [${d.stage}] ${d.reason.slice(0, 96)}`);
  }
  err('─'.repeat(66));

  // Assertions on the pipeline half, before anything touches the database.
  const titles = report.staged.map(s => s.title);
  const expect = (label: string, ok: boolean) => {
    err(`  ${ok ? 'PASS' : 'FAIL'}  ${label}`);
    if (!ok) process.exitCode = 1;
  };
  expect('two different events from one page both staged',
    titles.includes('Blacksmithing Taster Morning') && titles.includes('Sourdough Baking Workshop'));
  expect('the repeated listing was deduped',
    titles.filter(t => t === 'Blacksmithing Taster Morning').length === 1);
  expect('the undated event was discarded',
    !titles.includes('Event With No Date'));
  expect('the expired event was discarded',
    !titles.includes('Last Year Harvest Supper'));
  expect('the previously rejected event was not re-staged',
    !titles.includes('Crypto Trading Seminar'));
  expect('the general craft fair was not filed under a single craft',
    report.staged.find(s => s.title === 'Village Community Craft Fair')?.category === 'Community');
  expect('every staged candidate carries a source URL and a rationale',
    report.staged.every(s => /^https?:\/\//.test(s.sourceUrl) && s.selectionRationale.length > 10));
  err('─'.repeat(66));

  // SQL on stdout, ready to pipe into psql.
  const out = (l: string) => process.stdout.write(`${l}\n`);
  out('-- Generated by scripts/e2e-whats-on.ts. Staging only: status defaults to pending.');
  out('begin;');
  for (const s of report.staged) {
    out(`insert into pending_events (
  title, description, start_date, end_date, venue, location, website_url,
  organiser, category, source_url, source_platform, discovered_at,
  confidence_score, selection_rationale, dedupe_key
) values (
  ${sqlLiteral(s.title)}, ${sqlLiteral(s.description)}, ${sqlLiteral(s.startDate)},
  ${sqlLiteral(s.endDate)}, ${sqlLiteral(s.venue)}, ${sqlLiteral(s.location)},
  ${sqlLiteral(s.websiteUrl)}, ${sqlLiteral(s.organiser)}, ${sqlLiteral(s.category)},
  ${sqlLiteral(s.sourceUrl)}, ${sqlLiteral(s.sourcePlatform)}, ${sqlLiteral(s.discoveredAt)},
  ${s.confidenceScore}, ${sqlLiteral(s.selectionRationale)}, ${sqlLiteral(s.dedupeKey)}
) on conflict (dedupe_key) do nothing;`);
  }
  out('commit;');
};

main().catch(err => {
  process.stderr.write(`E2E failed: ${err instanceof Error ? err.stack : String(err)}\n`);
  process.exit(1);
});
