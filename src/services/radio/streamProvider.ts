// Streaming provider abstraction (spec §2, §23).
//
// The rest of the radio system talks to StreamProvider and never to Live365
// directly, so the station can move to another host without the player,
// the pages or the control centre being rebuilt.
//
// SECURITY: a provider implementation runs in the browser. It may only ever
// read PUBLIC endpoints. No API key, password or private URL may be passed
// through StationStreamConfig — those live in Supabase secrets and are used
// server-side only.

import type { NowPlaying, StationStreamConfig, StreamStatus } from './types';

export interface StreamProvider {
  readonly id: string;
  readonly label: string;
  /** The URL an <audio> element should play, or null when not configured. */
  getStreamUrl(): string | null;
  /** Read station status and now-playing metadata. Never throws. */
  getStatus(signal?: AbortSignal): Promise<StreamStatus>;
}

export const emptyNowPlaying = (): NowPlaying => ({
  title: null, artist: null, album: null, artworkUrl: null, startedAt: null,
});

export const offlineStatus = (error: string | null = null): StreamStatus => ({
  isOnline: false,
  nowPlaying: null,
  listenerCount: null,
  fetchedAt: new Date().toISOString(),
  error,
});

/** Pull the first non-empty string from a set of candidate keys. */
export const pickString = (source: Record<string, any>, keys: string[]): string | null => {
  for (const key of keys) {
    const value = source?.[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
};

export const pickNumber = (source: Record<string, any>, keys: string[]): number | null => {
  for (const key of keys) {
    const value = source?.[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  return null;
};

/**
 * Many stream hosts report now-playing as one "Artist - Title" string.
 * Split on the first hyphen surrounded by whitespace only, so hyphenated
 * track names such as "Wind-Up Bird" survive intact.
 */
export const splitArtistTitle = (combined: string): { artist: string | null; title: string } => {
  const match = combined.match(/^(.+?)\s+[-–—]\s+(.+)$/);
  if (!match) return { artist: null, title: combined.trim() };
  return { artist: match[1].trim(), title: match[2].trim() };
};

/** Guard against a misconfigured settings row pointing the player at plain HTTP. */
export const isSafeUrl = (url: string | null | undefined): url is string => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
};

export async function fetchJson(
  url: string,
  signal?: AbortSignal,
  timeoutMs = 8000,
): Promise<any | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    // A metadata endpoint being unreachable must never break the player.
    return null;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

/**
 * Used when no stream is configured yet. Reports "offline" honestly rather
 * than pretending the station is on air.
 */
export class NullStreamProvider implements StreamProvider {
  readonly id = 'none';
  readonly label = 'Not configured';
  constructor(private readonly config: StationStreamConfig) {}
  getStreamUrl(): string | null { return null; }
  async getStatus(): Promise<StreamStatus> {
    return offlineStatus(this.config.offlineMessage ?? null);
  }
}
