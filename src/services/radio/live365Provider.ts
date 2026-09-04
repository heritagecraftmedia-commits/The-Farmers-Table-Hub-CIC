// Live365 integration (spec §23).
//
// Live365's public station endpoints have changed shape across their API
// versions, and different plans expose different fields. Rather than pin to
// one response shape and break when it moves, the parser below accepts the
// shapes Live365 is known to return and normalises them. Anything it cannot
// read degrades to "no metadata" rather than to an error.
//
// Only PUBLIC endpoints are read here. Live365 account credentials must not
// be given to the browser; keep them in Supabase secrets.

import type { StationStreamConfig, StreamStatus, NowPlaying } from './types';
import {
  fetchJson, isSafeUrl, offlineStatus, pickNumber, pickString,
  splitArtistTitle, type StreamProvider,
} from './streamProvider';

const LIVE365_PUBLIC_STATION_API = 'https://api.live365.com/station/v1';

/** Dig out the object that actually carries the track fields. */
const findTrackNode = (payload: any): Record<string, any> | null => {
  if (!payload || typeof payload !== 'object') return null;
  const candidates = [
    payload,
    payload['current-track'],
    payload.current_track,
    payload.currentTrack,
    payload.now_playing,
    payload.nowPlaying,
    payload.track,
    payload.last_played?.[0],
    Array.isArray(payload.history) ? payload.history[0] : null,
  ];
  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'object') {
      const hasTrackFields =
        'title' in candidate || 'song' in candidate ||
        'artist' in candidate || 'track' in candidate;
      if (hasTrackFields) return candidate;
    }
  }
  return null;
};

export const parseLive365NowPlaying = (payload: any): NowPlaying | null => {
  const node = findTrackNode(payload);
  if (!node) return null;

  let title = pickString(node, ['title', 'song', 'track', 'track_title', 'name']);
  let artist = pickString(node, ['artist', 'artist_name', 'performer', 'albumArtist']);
  const album = pickString(node, ['album', 'album_name', 'release']);
  const artworkUrl = pickString(node, [
    'art', 'artwork', 'artwork_url', 'artworkURL', 'image', 'image_url', 'albumArt', 'cover',
  ]);
  const startedAt = pickString(node, ['start', 'started_at', 'startedAt', 'timestamp', 'played_at']);

  // Some responses give a single combined "Artist - Title" string.
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
    startedAt: startedAt ?? null,
  };
};

export const parseLive365Status = (payload: any): { isOnline: boolean; listeners: number | null } => {
  if (!payload || typeof payload !== 'object') return { isOnline: false, listeners: null };

  const listeners = pickNumber(payload, [
    'listeners', 'listener_count', 'listenerCount', 'current_listeners', 'active_listeners',
  ]);

  const statusText = pickString(payload, ['status', 'state', 'stream_status']);
  const explicitlyOnline = pickString(payload, ['online', 'is_online', 'live']);

  let isOnline: boolean;
  if (typeof payload.online === 'boolean') isOnline = payload.online;
  else if (typeof payload.is_online === 'boolean') isOnline = payload.is_online;
  else if (statusText) isOnline = /online|live|active|streaming|on[_ -]?air/i.test(statusText);
  else if (explicitlyOnline) isOnline = /true|yes|1|online|live/i.test(explicitlyOnline);
  else isOnline = listeners !== null;

  return { isOnline, listeners };
};

export class Live365Provider implements StreamProvider {
  readonly id = 'live365';
  readonly label = 'Live365';

  constructor(private readonly config: StationStreamConfig) {}

  getStreamUrl(): string | null {
    // is_stream_enabled is the station saying "we are actually broadcasting".
    // While it is off there is nothing to play, so the player must not offer
    // playback -- otherwise Listen live looks available and yields silence.
    if (!this.config.isStreamEnabled) return null;
    return isSafeUrl(this.config.streamUrl) ? this.config.streamUrl : null;
  }

  /**
   * Prefer an explicitly configured metadata URL. Fall back to Live365's
   * public station endpoint when only a station id has been supplied.
   */
  private metadataEndpoint(): string | null {
    if (isSafeUrl(this.config.metadataUrl)) return this.config.metadataUrl;
    if (this.config.providerStationId) {
      return `${LIVE365_PUBLIC_STATION_API}/${encodeURIComponent(this.config.providerStationId)}/now-playing`;
    }
    return null;
  }

  private statusEndpoint(): string | null {
    if (isSafeUrl(this.config.statusUrl)) return this.config.statusUrl;
    if (this.config.providerStationId) {
      return `${LIVE365_PUBLIC_STATION_API}/${encodeURIComponent(this.config.providerStationId)}`;
    }
    return null;
  }

  async getStatus(signal?: AbortSignal): Promise<StreamStatus> {
    if (!this.config.isStreamEnabled) {
      return offlineStatus(this.config.offlineMessage ?? null);
    }

    const metadataUrl = this.metadataEndpoint();
    const statusUrl = this.statusEndpoint();

    const [metaPayload, statusPayload] = await Promise.all([
      metadataUrl ? fetchJson(metadataUrl, signal) : Promise.resolve(null),
      statusUrl && statusUrl !== metadataUrl ? fetchJson(statusUrl, signal) : Promise.resolve(null),
    ]);

    const nowPlaying =
      parseLive365NowPlaying(metaPayload) ?? parseLive365NowPlaying(statusPayload);
    const status = parseLive365Status(statusPayload ?? metaPayload);

    // A configured, enabled stream with unreadable metadata is still playable.
    // Treat "we have a stream URL" as online rather than reporting a fault.
    const hasStream = Boolean(this.getStreamUrl());
    const reachedProvider = metaPayload !== null || statusPayload !== null;

    return {
      isOnline: reachedProvider ? status.isOnline : hasStream,
      nowPlaying,
      listenerCount: status.listeners,
      fetchedAt: new Date().toISOString(),
      error: !reachedProvider && (metadataUrl || statusUrl)
        ? 'Live365 metadata is not reachable from the browser right now.'
        : null,
    };
  }
}
