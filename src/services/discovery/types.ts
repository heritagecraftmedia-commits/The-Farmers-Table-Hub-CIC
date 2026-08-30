import { EventCategory } from '../../types';

/**
 * What's On discovery pipeline — shared types.
 *
 *   SOURCE -> fetch -> robots -> parse -> normalise -> categorise
 *          -> score -> dedupe -> pending_events -> human review
 *
 * Every stage narrows the type, so a candidate that has not been through
 * normalisation cannot be handed to the stager by mistake.
 */

/** Exactly as the adapter read it from the source. Nothing is trusted yet. */
export interface RawCandidate {
  title?: string | null;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  venue?: string | null;
  location?: string | null;
  organiser?: string | null;
  /** The event's own page, when the source gives one. */
  eventUrl?: string | null;
  /** The page this was read from. Always present — it is the evidence. */
  sourceUrl: string;
  sourcePlatform: string;
  discoveredAt: string;
}

/** Passed normalisation: dates are real, URLs parse, text is cleaned. */
export interface NormalisedCandidate {
  title: string;
  description: string;
  startDate: string;
  endDate: string | null;
  venue: string | null;
  location: string | null;
  organiser: string | null;
  websiteUrl: string | null;
  sourceUrl: string;
  sourcePlatform: string;
  discoveredAt: string;
}

export interface CategoryDecision {
  category: EventCategory;
  /** Why this category won, in words a reviewer can check against the event. */
  rationale: string;
  /** Per-category evidence weights, for transparency in the review UI. */
  scores: Partial<Record<EventCategory, number>>;
}

export interface ScoreDecision {
  /** 0-100. Relevance to a craft/heritage/local-food audience. */
  score: number;
  rationale: string;
}

/** Ready to stage. */
export interface StagedCandidate extends NormalisedCandidate {
  category: EventCategory;
  confidenceScore: number;
  selectionRationale: string;
  dedupeKey: string;
}

/** A candidate that did not make it, and why. */
export interface DiscardedCandidate {
  candidate: RawCandidate | NormalisedCandidate;
  stage: 'normalise' | 'categorise' | 'score' | 'dedupe';
  reason: string;
}

/**
 * A source of real events.
 *
 * Implementations MUST return only what they actually read from the source.
 * An adapter that cannot reach its source returns an empty array — it never
 * substitutes remembered or generated events. See sources/registry.ts.
 */
export interface SourceAdapter {
  /** Stable id, stored on every candidate as source_platform. */
  readonly id: string;
  readonly label: string;
  /** Base URL, used for the robots.txt lookup. */
  readonly baseUrl: string;
  /** False when the adapter's configuration is absent. */
  isConfigured(): boolean;
  /** Human-readable list of what is missing, for the "not configured" log. */
  missingConfig(): string[];
  discover(ctx: DiscoveryContext): Promise<RawCandidate[]>;
}

/** Injected so the pipeline and its tests share one seam for I/O and time. */
export interface DiscoveryContext {
  fetch: typeof globalThis.fetch;
  now: () => Date;
  log: (message: string, meta?: Record<string, unknown>) => void;
}

export interface DiscoveryReport {
  sourceId: string | null;
  configured: boolean;
  fetched: number;
  staged: StagedCandidate[];
  discarded: DiscardedCandidate[];
  message: string;
}
