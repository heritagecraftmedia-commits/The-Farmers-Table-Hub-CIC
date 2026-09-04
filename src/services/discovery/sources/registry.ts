import { SourceAdapter } from '../types';
import { JsonLdSource } from './jsonLdSource';

/**
 * Source configuration.
 *
 * Sources are configured entirely through environment variables so that
 * connecting a real source is a deployment step, not a code change. No
 * source URL is hardcoded, and there is no default source: if the
 * environment does not name one, the system has no source, and the weekly
 * job exits cleanly saying so.
 *
 * Required to enable discovery:
 *
 *   WHATS_ON_SOURCE_URL       Listing page publishing schema.org Event
 *                             JSON-LD. Required. No default.
 *   WHATS_ON_SOURCE_ID        Short slug stored as source_platform on every
 *                             candidate. Optional; defaults to the hostname.
 *   WHATS_ON_SOURCE_LABEL     Human-readable name for the review UI.
 *                             Optional; defaults to the id.
 *
 * The variables must be set on the server (Vercel project environment). They
 * are deliberately NOT prefixed VITE_, so they are never exposed to the
 * browser bundle.
 */

export type EnvLike = Record<string, string | undefined>;

export const SOURCE_ENV_VARS = [
  'WHATS_ON_SOURCE_URL',
  'WHATS_ON_SOURCE_ID',
  'WHATS_ON_SOURCE_LABEL',
] as const;

export const NOT_CONFIGURED_MESSAGE = "What's On discovery source not configured";

/**
 * Build the configured source, or null when the environment does not define
 * one. Returning null - rather than a stub that produces events - is what
 * guarantees the system cannot fall back to invented content.
 */
export const resolveSource = (env: EnvLike): SourceAdapter | null => {
  const listingUrl = (env.WHATS_ON_SOURCE_URL ?? '').trim();
  if (listingUrl === '') return null;

  let host = '';
  try {
    host = new URL(listingUrl).hostname;
  } catch {
    // Left empty; JsonLdSource.missingConfig() reports the invalid URL.
  }

  const id = (env.WHATS_ON_SOURCE_ID ?? '').trim() || host || 'unconfigured';
  const label = (env.WHATS_ON_SOURCE_LABEL ?? '').trim() || id;

  return new JsonLdSource({ id, label, listingUrl });
};

/** What is missing, for the "not configured" log line. */
export const describeMissingConfig = (env: EnvLike): string[] => {
  const source = resolveSource(env);
  if (!source) return ['WHATS_ON_SOURCE_URL'];
  return source.missingConfig();
};
