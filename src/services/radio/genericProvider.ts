// Fallback providers for Icecast / Shoutcast / AzuraCast / RadioKing / custom
// hosts (spec §23 — the provider must be swappable).
//
// These read only public status endpoints and normalise the common response
// shapes. As with Live365, unreadable metadata degrades to "no metadata".

import type { StationStreamConfig, StreamStatus, NowPlaying } from './types';
import {
  fetchJson, isSafeUrl, offlineStatus, pickNumber, pickString,
  splitArtistTitle, type StreamProvider,
} from './streamProvider';

/**
 * Icecast exposes /status-json.xsl with a `icestats.source` that is either a
 * single object or an array of mounts. AzuraCast exposes `now_playing.song`.
 * RadioKing exposes a flat track object.
 */
const normaliseNode = (payload: any): Record<string, any> | null => {
  if (!payload || typeof payload !== 'object') return null;

  // AzuraCast
  if (payload.now_playing?.song) return payload.now_playing.song;

  // Icecast
  const source = payload.icestats?.source;
  if (Array.isArray(source)) return source[0] ?? null;
  if (source && typeof source === 'object') return source;

  // Shoutcast v2 statistics
  if (payload.songtitle || payload.servertitle) return payload;

  // RadioKing / flat shapes
  if (payload.title || payload.artist || payload.song) return payload;

  return null;
};

export const parseGenericNowPlaying = (payload: any): NowPlaying | null => {
  const node = normaliseNode(payload);
  if (!node) return null;

  let title = pickString(node, ['title', 'song', 'songtitle', 'track', 'text', 'yp_currently_playing']);
  let artist = pickString(node, ['artist', 'artist_name']);
  const album = pickString(node, ['album', 'album_name']);
  const artworkUrl = pickString(node, ['art', 'artwork', 'artwork_url', 'cover', 'image']);

  if (title && !artist) {
    const split = splitArtistTitle(title);
    if (split.artist) {
      artist = split.artist;
      title = split.title;
    }
  }

  if (!title && !artist) return null;

  return {
    title: title ?? null,
    artist: artist ?? null,
    album: album ?? null,
    artworkUrl: isSafeUrl(artworkUrl) ? artworkUrl : null,
    startedAt: null,
  };
};

export const parseGenericListeners = (payload: any): number | null => {
  if (!payload || typeof payload !== 'object') return null;
  const node = normaliseNode(payload) ?? payload;
  return pickNumber(node, ['listeners', 'currentlisteners', 'unique_listeners', 'listener_count'])
    ?? pickNumber(payload?.listeners ?? {}, ['current', 'total', 'unique']);
};

export class GenericStreamProvider implements StreamProvider {
  constructor(
    readonly id: string,
    readonly label: string,
    private readonly config: StationStreamConfig,
  ) {}

  getStreamUrl(): string | null {
    return isSafeUrl(this.config.streamUrl) ? this.config.streamUrl : null;
  }

  async getStatus(signal?: AbortSignal): Promise<StreamStatus> {
    if (!this.config.isStreamEnabled) {
      return offlineStatus(this.config.offlineMessage ?? null);
    }

    const endpoint = isSafeUrl(this.config.metadataUrl)
      ? this.config.metadataUrl
      : isSafeUrl(this.config.statusUrl) ? this.config.statusUrl : null;

    const payload = endpoint ? await fetchJson(endpoint, signal) : null;
    const hasStream = Boolean(this.getStreamUrl());

    return {
      isOnline: payload ? true : hasStream,
      nowPlaying: parseGenericNowPlaying(payload),
      listenerCount: parseGenericListeners(payload),
      fetchedAt: new Date().toISOString(),
      error: endpoint && !payload
        ? 'The stream status endpoint is not reachable from the browser right now.'
        : null,
    };
  }
}
