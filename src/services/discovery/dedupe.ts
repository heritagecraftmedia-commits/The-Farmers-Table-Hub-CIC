import { NormalisedCandidate } from './types';

/**
 * Layered deduplication.
 *
 * The rule that shapes this file: a source URL is a LISTING page, and one
 * listing page legitimately contains many different events. So the source
 * URL is never part of the identity of an event. Two events scraped from
 * the same page are two events.
 *
 * Identity is established in three layers, cheapest and most reliable first:
 *
 *   1. The event's own URL, when the source gives one. Two candidates with
 *      the same event page are the same event.
 *   2. Normalised title + start day + normalised venue. This is the
 *      dedupe_key stored on the row and enforced by a unique index.
 *   3. Fuzzy match: same day, same venue, and titles that are near-identical
 *      once punctuation and filler words are stripped. Catches "Spring Craft
 *      Fair" vs "Spring Craft Fair 2026".
 *
 * Candidates are checked against pending_events, events, AND previously
 * rejected pending_events - a rejected event must not quietly reappear on
 * next Tuesday's queue.
 */

const FILLER = new Set([
  'the', 'a', 'an', 'at', 'in', 'on', 'of', 'and', '&', 'for', 'with',
  'event', 'events',
]);

/** Lowercase, strip punctuation and filler, drop a trailing year. */
export const normaliseForCompare = (title: string): string =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b(19|20)\d{2}\b/g, ' ')
    .split(/\s+/)
    .filter(w => w !== '' && !FILLER.has(w))
    .join(' ')
    .trim();

/** Calendar day in UTC - two listings of one event rarely agree on the time. */
export const dayOf = (iso: string): string => iso.slice(0, 10);

const normaliseVenueForCompare = (venue: string | null): string =>
  (venue ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Layer 2 identity, stored on the row. Built from the event's own URL when
 * there is one, otherwise from title + day + venue. Never from the source
 * listing URL.
 */
export const buildDedupeKey = (c: NormalisedCandidate): string => {
  if (c.websiteUrl) return `url:${c.websiteUrl.toLowerCase()}`;
  const title = normaliseForCompare(c.title);
  const venue = normaliseVenueForCompare(c.venue);
  return `tdv:${title}|${dayOf(c.startDate)}|${venue}`;
};

/** Jaccard overlap of the two title token sets. */
export const titleSimilarity = (a: string, b: string): number => {
  const ta = new Set(normaliseForCompare(a).split(' ').filter(Boolean));
  const tb = new Set(normaliseForCompare(b).split(' ').filter(Boolean));
  if (ta.size === 0 || tb.size === 0) return 0;
  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared++;
  return shared / (ta.size + tb.size - shared);
};

export const FUZZY_THRESHOLD = 0.8;

/** The shape the pipeline needs from anything it checks against. */
export interface ExistingRecord {
  title: string;
  startDate: string;
  venue: string | null;
  websiteUrl?: string | null;
  dedupeKey?: string | null;
  /** 'rejected' records still block re-staging. */
  status?: string | null;
  source: 'pending_events' | 'events';
}

/** One shape with optional fields - see the note on NormaliseResult. */
export interface DedupeVerdict {
  duplicate: boolean;
  reason?: string;
  layer?: 1 | 2 | 3;
  against?: ExistingRecord;
}

export const findDuplicate = (
  candidate: NormalisedCandidate,
  existing: ExistingRecord[],
): DedupeVerdict => {
  const key = buildDedupeKey(candidate);
  const day = dayOf(candidate.startDate);
  const venue = normaliseVenueForCompare(candidate.venue);

  for (const e of existing) {
    // Layer 1 - the event's own URL.
    if (candidate.websiteUrl && e.websiteUrl &&
        candidate.websiteUrl.toLowerCase() === e.websiteUrl.toLowerCase()) {
      return {
        duplicate: true, layer: 1, against: e,
        reason: `Same event URL as an existing ${describe(e)}.`,
      };
    }

    // Layer 2 - the stored key.
    if (e.dedupeKey && e.dedupeKey === key) {
      return {
        duplicate: true, layer: 2, against: e,
        reason: `Identical title, date and venue to an existing ${describe(e)}.`,
      };
    }
  }

  // Layer 3 - fuzzy, and only within the same day and venue. Restricting it
  // this way is what stops two genuinely different events from one listing
  // page being collapsed into one.
  for (const e of existing) {
    if (dayOf(e.startDate) !== day) continue;
    if (normaliseVenueForCompare(e.venue) !== venue) continue;
    const sim = titleSimilarity(candidate.title, e.title);
    if (sim >= FUZZY_THRESHOLD) {
      return {
        duplicate: true, layer: 3, against: e,
        reason:
          `Title is ${Math.round(sim * 100)}% similar to "${e.title}" on the same day at the same venue ` +
          `(existing ${describe(e)}).`,
      };
    }
  }

  return { duplicate: false };
};

const describe = (e: ExistingRecord): string =>
  e.source === 'events'
    ? 'published event'
    : e.status === 'rejected'
      ? 'rejected candidate (it will not be re-staged)'
      : `staged candidate (${e.status ?? 'pending'})`;
