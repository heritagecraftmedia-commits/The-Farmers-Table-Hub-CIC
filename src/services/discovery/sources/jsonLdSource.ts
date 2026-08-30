import { RawCandidate, SourceAdapter, DiscoveryContext } from '../types';
import { checkRobots, USER_AGENT } from '../robots';

/**
 * Structured-data source adapter (schema.org Event as JSON-LD).
 *
 * This is the first adapter deliberately: JSON-LD is published by the site
 * itself for exactly this purpose, so reading it is neither scraping nor
 * guessing. Dates, venues and URLs come from the publisher as data rather
 * than being parsed out of prose.
 *
 * The adapter fetches ONE listing page per run, after a robots.txt check.
 * It does not crawl, follow links, or paginate. To add a second source,
 * implement SourceAdapter and register it - nothing in the pipeline below
 * normalise() needs to change.
 *
 * It NEVER returns an event it did not read from the source. Any failure
 * path returns an empty array.
 */

interface JsonLdSourceConfig {
  id: string;
  label: string;
  listingUrl: string;
}

/** schema.org allows a place as a string or a nested Place object. */
const readPlace = (location: unknown): { venue: string | null; address: string | null } => {
  if (typeof location === 'string') return { venue: location, address: null };
  if (!location || typeof location !== 'object') return { venue: null, address: null };

  const loc = location as Record<string, unknown>;
  const venue = typeof loc.name === 'string' ? loc.name : null;

  const addr = loc.address;
  if (typeof addr === 'string') return { venue, address: addr };
  if (addr && typeof addr === 'object') {
    const a = addr as Record<string, unknown>;
    const parts = ['streetAddress', 'addressLocality', 'addressRegion', 'postalCode']
      .map(k => (typeof a[k] === 'string' ? (a[k] as string) : null))
      .filter((p): p is string => p !== null && p.trim() !== '');
    return { venue, address: parts.length > 0 ? parts.join(', ') : null };
  }
  return { venue, address: null };
};

const readOrganiser = (organizer: unknown): string | null => {
  if (typeof organizer === 'string') return organizer;
  if (organizer && typeof organizer === 'object') {
    const o = organizer as Record<string, unknown>;
    if (typeof o.name === 'string') return o.name;
  }
  return null;
};

const isEventNode = (node: unknown): node is Record<string, unknown> => {
  if (!node || typeof node !== 'object') return false;
  const type = (node as Record<string, unknown>)['@type'];
  const types = Array.isArray(type) ? type : [type];
  return types.some(t => typeof t === 'string' && /event$/i.test(t));
};

/** Walk @graph / arrays / nested values and collect every Event node. */
export const collectEventNodes = (root: unknown, found: Record<string, unknown>[] = []): Record<string, unknown>[] => {
  if (Array.isArray(root)) {
    for (const item of root) collectEventNodes(item, found);
    return found;
  }
  if (!root || typeof root !== 'object') return found;

  if (isEventNode(root)) found.push(root as Record<string, unknown>);

  const obj = root as Record<string, unknown>;
  for (const key of ['@graph', 'itemListElement', 'item', 'subEvent', 'events']) {
    if (key in obj) collectEventNodes(obj[key], found);
  }
  return found;
};

/** Pull every JSON-LD block out of an HTML document. */
export const extractJsonLdBlocks = (html: string): unknown[] => {
  const blocks: unknown[] = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const body = m[1].trim();
    if (body === '') continue;
    try {
      blocks.push(JSON.parse(body));
    } catch {
      // A malformed block is skipped. It is not worth failing the run over,
      // and we must not invent a replacement for it.
    }
  }
  return blocks;
};

/**
 * Map schema.org Event nodes onto RawCandidates.
 *
 * Note that every candidate carries the SAME sourceUrl - the listing page -
 * and its own distinct `eventUrl`. That is the correct shape: one page,
 * many events. Deduplication never uses sourceUrl as identity.
 */
export const nodesToCandidates = (
  nodes: Record<string, unknown>[],
  listingUrl: string,
  sourcePlatform: string,
  discoveredAt: string,
): RawCandidate[] =>
  nodes.map(node => {
    const { venue, address } = readPlace(node.location);
    const str = (v: unknown): string | null => (typeof v === 'string' ? v : null);
    return {
      title: str(node.name),
      description: str(node.description),
      startDate: str(node.startDate),
      endDate: str(node.endDate),
      venue,
      location: address,
      organiser: readOrganiser(node.organizer),
      eventUrl: str(node.url),
      sourceUrl: listingUrl,
      sourcePlatform,
      discoveredAt,
    };
  });

export class JsonLdSource implements SourceAdapter {
  readonly id: string;
  readonly label: string;
  private readonly listingUrl: string;

  constructor(config: JsonLdSourceConfig) {
    this.id = config.id;
    this.label = config.label;
    this.listingUrl = config.listingUrl;
  }

  get baseUrl(): string {
    try {
      return new URL(this.listingUrl).origin;
    } catch {
      return '';
    }
  }

  isConfigured(): boolean {
    return this.missingConfig().length === 0;
  }

  missingConfig(): string[] {
    const missing: string[] = [];
    if (!this.listingUrl || this.listingUrl.trim() === '') {
      missing.push('WHATS_ON_SOURCE_URL');
    } else {
      try {
        const u = new URL(this.listingUrl);
        if (u.protocol !== 'https:' && u.protocol !== 'http:') missing.push('WHATS_ON_SOURCE_URL (must be http/https)');
      } catch {
        missing.push('WHATS_ON_SOURCE_URL (not a valid URL)');
      }
    }
    return missing;
  }

  async discover(ctx: DiscoveryContext): Promise<RawCandidate[]> {
    if (!this.isConfigured()) {
      ctx.log('Source is not configured; nothing fetched.', { missing: this.missingConfig() });
      return [];
    }

    const robots = await checkRobots(this.listingUrl, ctx);
    ctx.log(`robots.txt: ${robots.reason}`);
    if (!robots.allowed) return [];

    let html: string;
    try {
      const res = await ctx.fetch(this.listingUrl, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' },
      });
      if (!res.ok) {
        ctx.log(`Source returned HTTP ${res.status}; no candidates from this run.`);
        return [];
      }
      html = await res.text();
    } catch (err) {
      // A network failure yields nothing. It must never yield remembered events.
      ctx.log(`Source fetch failed: ${err instanceof Error ? err.message : String(err)}. No candidates.`);
      return [];
    }

    const nodes = extractJsonLdBlocks(html).flatMap(b => collectEventNodes(b));
    ctx.log(`Found ${nodes.length} schema.org Event node(s) in the listing page.`);
    return nodesToCandidates(nodes, this.listingUrl, this.id, ctx.now().toISOString());
  }
}
