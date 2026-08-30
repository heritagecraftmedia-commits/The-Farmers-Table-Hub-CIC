import { RawCandidate, NormalisedCandidate } from './types';

/** Collapse whitespace, strip control characters, trim. */
export const cleanText = (value: string | null | undefined): string =>
  (value ?? '')
    .replace(/[\x00-\x1f\x7f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Titles arrive SHOUTING, padded, or wrapped in the listing site's own
 * furniture ("Event: ... | Whats On"). Strip that, keep the event's name.
 */
export const normaliseTitle = (value: string | null | undefined): string => {
  let t = cleanText(value);
  t = t.replace(/\s*[|–—-]\s*(what'?s on|events?|tickets?)\s*$/i, '');
  t = t.replace(/^\s*(event|listing)\s*:\s*/i, '');
  // All-caps titles read as shouting once published; Title Case them.
  if (t.length > 3 && t === t.toUpperCase() && /[A-Z]/.test(t)) {
    t = t.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }
  return t;
};

export const normaliseVenue = (value: string | null | undefined): string | null => {
  const v = cleanText(value).replace(/^(at|venue)\s*:?\s+/i, '');
  return v === '' ? null : v;
};

/** Drop a trailing ", UK"/", United Kingdom" - every listing has it. */
export const normaliseLocation = (value: string | null | undefined): string | null => {
  const v = cleanText(value)
    .replace(/,?\s*(united kingdom|uk|england|gb)\s*$/i, '')
    .replace(/\s*,\s*$/, '');
  return v === '' ? null : v;
};

/**
 * Only absolute http(s) URLs are usable. A relative path, a javascript:
 * URL or a mailto: is rejected rather than guessed at, and tracking query
 * parameters are dropped so the same event does not look like two.
 */
export const normaliseUrl = (value: string | null | undefined): string | null => {
  const raw = cleanText(value);
  if (raw === '') return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  if (url.hostname === '') return null;
  for (const p of [...url.searchParams.keys()]) {
    if (/^(utm_|fbclid|gclid|mc_cid|mc_eid|ref)/i.test(p)) url.searchParams.delete(p);
  }
  url.hash = '';
  return url.toString();
};

/** ISO 8601 only. A date we cannot parse is a reason to discard, not to guess. */
export const normaliseDate = (value: string | null | undefined): string | null => {
  const raw = cleanText(value);
  if (raw === '') return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  // Guard against a parse that silently landed centuries away.
  const year = d.getUTCFullYear();
  if (year < 2000 || year > 2100) return null;
  return d.toISOString();
};

/**
 * Result of normalisation. Written as one shape with optional fields rather
 * than a discriminated union because this project does not enable `strict`,
 * and without strictNullChecks TypeScript will not narrow a union on a
 * boolean discriminant.
 */
export interface NormaliseResult {
  ok: boolean;
  candidate?: NormalisedCandidate;
  reason?: string;
}

/**
 * Turn a raw candidate into a normalised one, or say why it cannot be.
 *
 * `now` is injected rather than read from the clock so "obviously expired"
 * is testable.
 */
export const normaliseCandidate = (
  raw: RawCandidate,
  now: Date = new Date(),
): NormaliseResult => {
  const title = normaliseTitle(raw.title);
  if (title.length < 3) return { ok: false, reason: 'missing or unusably short title' };

  const sourceUrl = normaliseUrl(raw.sourceUrl);
  if (!sourceUrl) return { ok: false, reason: 'missing or unusable source URL' };

  const startDate = normaliseDate(raw.startDate);
  if (!startDate) return { ok: false, reason: 'missing or unparseable start date' };

  const endDate = normaliseDate(raw.endDate);
  // An end before the start is bad data, not a short event.
  if (endDate && endDate < startDate) {
    return { ok: false, reason: 'end date precedes start date' };
  }

  // Expired: the event finished before today. Use the end date when there
  // is one so a multi-day festival stays live on its last day.
  const finish = new Date(endDate ?? startDate);
  const todayStart = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0,
  ));
  if (finish < todayStart) return { ok: false, reason: 'event has already finished' };

  return {
    ok: true,
    candidate: {
      title,
      description: cleanText(raw.description),
      startDate,
      endDate,
      venue: normaliseVenue(raw.venue),
      location: normaliseLocation(raw.location),
      organiser: normaliseVenue(raw.organiser),
      websiteUrl: normaliseUrl(raw.eventUrl),
      sourceUrl,
      sourcePlatform: cleanText(raw.sourcePlatform) || 'unknown',
      discoveredAt: normaliseDate(raw.discoveredAt) ?? now.toISOString(),
    },
  };
};
