import { DiscoveryContext } from './types';

/**
 * robots.txt checking.
 *
 * We are a guest on someone else's site. Before any listing page is fetched
 * the pipeline reads that origin's robots.txt and honours it. If robots.txt
 * disallows the path, the page is not fetched - the run reports zero
 * candidates rather than proceeding anyway.
 *
 * Fetch failures are treated as "allowed", which is the conventional
 * reading: a site with no robots.txt has not restricted anything. A site
 * that answers 5xx is the one ambiguous case, and we treat it as
 * disallowed rather than hammering a struggling server.
 */

export const USER_AGENT = 'FarmersTableHubBot';

export interface RobotsRules {
  allow: string[];
  disallow: string[];
  crawlDelaySeconds: number | null;
}

/**
 * Parse robots.txt, taking the group matching our agent and falling back to
 * the wildcard group. Only directives inside a matching group are applied.
 */
export const parseRobots = (text: string, userAgent = USER_AGENT): RobotsRules => {
  const ua = userAgent.toLowerCase();
  const groups = new Map<string, RobotsRules>();
  let current: string[] = [];
  let expectingAgents = true;

  const ensure = (agent: string): RobotsRules => {
    if (!groups.has(agent)) groups.set(agent, { allow: [], disallow: [], crawlDelaySeconds: null });
    return groups.get(agent)!;
  };

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (line === '') continue;
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const field = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();

    if (field === 'user-agent') {
      // A new agent line after rules starts a new group.
      if (!expectingAgents) current = [];
      current.push(value.toLowerCase());
      ensure(value.toLowerCase());
      expectingAgents = true;
      continue;
    }

    if (current.length === 0) continue;
    expectingAgents = false;

    for (const agent of current) {
      const rules = ensure(agent);
      if (field === 'disallow') rules.disallow.push(value);
      else if (field === 'allow') rules.allow.push(value);
      else if (field === 'crawl-delay') {
        const n = Number(value);
        if (!Number.isNaN(n)) rules.crawlDelaySeconds = n;
      }
    }
  }

  return groups.get(ua) ?? groups.get('*') ?? { allow: [], disallow: [], crawlDelaySeconds: null };
};

/** Longest matching rule wins; Allow beats Disallow at equal length. */
export const isPathAllowed = (path: string, rules: RobotsRules): boolean => {
  const match = (pattern: string): number => {
    if (pattern === '') return -1;
    // Support the * wildcard and the $ end-anchor that most sites use.
    const escaped = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*');
    const anchored = escaped.endsWith('\\$') ? `^${escaped.slice(0, -2)}$` : `^${escaped}`;
    return new RegExp(anchored).test(path) ? pattern.length : -1;
  };

  let bestAllow = -1;
  let bestDisallow = -1;
  for (const p of rules.allow) bestAllow = Math.max(bestAllow, match(p));
  for (const p of rules.disallow) bestDisallow = Math.max(bestDisallow, match(p));

  if (bestDisallow === -1) return true;
  return bestAllow >= bestDisallow;
};

export interface RobotsVerdict {
  allowed: boolean;
  reason: string;
  crawlDelaySeconds: number | null;
}

export const checkRobots = async (
  targetUrl: string,
  ctx: DiscoveryContext,
  userAgent = USER_AGENT,
): Promise<RobotsVerdict> => {
  let url: URL;
  try {
    url = new URL(targetUrl);
  } catch {
    return { allowed: false, reason: `"${targetUrl}" is not a valid URL.`, crawlDelaySeconds: null };
  }

  const robotsUrl = `${url.origin}/robots.txt`;
  try {
    const res = await ctx.fetch(robotsUrl, { headers: { 'User-Agent': userAgent } });

    if (res.status === 404 || res.status === 410) {
      return { allowed: true, reason: 'No robots.txt published; nothing is restricted.', crawlDelaySeconds: null };
    }
    if (res.status >= 500) {
      return {
        allowed: false,
        reason: `robots.txt returned ${res.status}. Treating as disallowed rather than adding load to a failing server.`,
        crawlDelaySeconds: null,
      };
    }
    if (!res.ok) {
      return { allowed: true, reason: `robots.txt returned ${res.status}; treating as unrestricted.`, crawlDelaySeconds: null };
    }

    const rules = parseRobots(await res.text(), userAgent);
    const allowed = isPathAllowed(url.pathname, rules);
    return {
      allowed,
      reason: allowed
        ? `robots.txt permits ${url.pathname} for ${userAgent}.`
        : `robots.txt disallows ${url.pathname} for ${userAgent}. Not fetched.`,
      crawlDelaySeconds: rules.crawlDelaySeconds,
    };
  } catch (err) {
    return {
      allowed: false,
      reason: `Could not retrieve robots.txt (${err instanceof Error ? err.message : String(err)}). Not fetching.`,
      crawlDelaySeconds: null,
    };
  }
};
