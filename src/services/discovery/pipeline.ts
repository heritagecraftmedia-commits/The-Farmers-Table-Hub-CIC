import {
  SourceAdapter, DiscoveryContext, DiscoveryReport,
  StagedCandidate, DiscardedCandidate, RawCandidate,
} from './types';
import { normaliseCandidate } from './normalise';
import { categoriseCandidate } from './categorise';
import { scoreCandidate, RELEVANCE_THRESHOLD } from './score';
import { buildDedupeKey, findDuplicate, ExistingRecord } from './dedupe';
import { NOT_CONFIGURED_MESSAGE } from './sources/registry';

/**
 * The discovery pipeline.
 *
 *   source -> normalise -> categorise -> score -> dedupe -> staged
 *
 * The output of this function is a list of candidates ready to be INSERTed
 * into pending_events. It writes nothing itself and knows nothing about the
 * database, which is what makes every stage testable without one.
 *
 * Two guarantees hold by construction:
 *
 *   - With no configured source, `staged` is empty. There is no fallback
 *     path that produces events, so nothing invented can be staged.
 *   - Every staged candidate carries a real source URL, a valid date, a
 *     category, a score and a rationale. A candidate missing any of those
 *     is discarded with a stated reason rather than patched up.
 */

export const defaultContext = (): DiscoveryContext => ({
  fetch: globalThis.fetch.bind(globalThis),
  now: () => new Date(),
  log: () => {},
});

export interface RunOptions {
  source: SourceAdapter | null;
  existing: ExistingRecord[];
  ctx?: Partial<DiscoveryContext>;
  /** Candidates scoring below this are discarded as irrelevant. */
  threshold?: number;
}

export const runDiscovery = async ({
  source,
  existing,
  ctx: partialCtx,
  threshold = RELEVANCE_THRESHOLD,
}: RunOptions): Promise<DiscoveryReport> => {
  const ctx: DiscoveryContext = { ...defaultContext(), ...partialCtx };

  if (!source) {
    ctx.log(NOT_CONFIGURED_MESSAGE);
    return {
      sourceId: null, configured: false, fetched: 0,
      staged: [], discarded: [],
      message: NOT_CONFIGURED_MESSAGE,
    };
  }

  if (!source.isConfigured()) {
    const missing = source.missingConfig().join(', ');
    ctx.log(`${NOT_CONFIGURED_MESSAGE}: missing ${missing}`);
    return {
      sourceId: source.id, configured: false, fetched: 0,
      staged: [], discarded: [],
      message: `${NOT_CONFIGURED_MESSAGE} (missing ${missing})`,
    };
  }

  let raw: RawCandidate[] = [];
  try {
    raw = await source.discover(ctx);
  } catch (err) {
    // A source that throws yields nothing. It never yields remembered events.
    const message = err instanceof Error ? err.message : String(err);
    ctx.log(`Source "${source.id}" failed: ${message}`);
    return {
      sourceId: source.id, configured: true, fetched: 0,
      staged: [], discarded: [],
      message: `Source "${source.id}" failed: ${message}. No candidates staged.`,
    };
  }

  const now = ctx.now();
  const staged: StagedCandidate[] = [];
  const discarded: DiscardedCandidate[] = [];

  // Candidates staged in THIS run also count as existing, so two identical
  // entries on one listing page cannot both be staged.
  const seen: ExistingRecord[] = [...existing];

  for (const candidate of raw) {
    const normalised = normaliseCandidate(candidate, now);
    if (!normalised.ok || !normalised.candidate) {
      discarded.push({
        candidate, stage: 'normalise',
        reason: normalised.reason ?? 'failed normalisation',
      });
      continue;
    }
    const c = normalised.candidate;

    const category = categoriseCandidate(c);
    const relevance = scoreCandidate({ candidate: c, category, now });

    if (relevance.score < threshold) {
      discarded.push({
        candidate: c, stage: 'score',
        reason: `Scored ${relevance.score}, below the relevance threshold of ${threshold}. ${relevance.rationale}`,
      });
      continue;
    }

    const verdict = findDuplicate(c, seen);
    if (verdict.duplicate) {
      discarded.push({ candidate: c, stage: 'dedupe', reason: verdict.reason ?? 'duplicate' });
      continue;
    }

    const dedupeKey = buildDedupeKey(c);
    staged.push({
      ...c,
      category: category.category,
      confidenceScore: relevance.score,
      selectionRationale: `${category.rationale} ${relevance.rationale}`,
      dedupeKey,
    });

    seen.push({
      title: c.title,
      startDate: c.startDate,
      venue: c.venue,
      websiteUrl: c.websiteUrl,
      dedupeKey,
      status: 'pending',
      source: 'pending_events',
    });
  }

  ctx.log(`Discovery finished: ${staged.length} staged, ${discarded.length} discarded, from ${raw.length} fetched.`);

  return {
    sourceId: source.id,
    configured: true,
    fetched: raw.length,
    staged,
    discarded,
    message: `${staged.length} candidate(s) staged for review from ${raw.length} fetched; ${discarded.length} discarded.`,
  };
};
