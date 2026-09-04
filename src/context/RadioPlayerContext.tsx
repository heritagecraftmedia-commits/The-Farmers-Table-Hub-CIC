// Live radio player state (spec §2, §24).
//
// The <audio> element lives here rather than inside a page component, so
// playback survives navigation and the station keeps playing while a listener
// browses the schedule, shows or the directory.

import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';

import { createStreamProvider } from '../services/radio/providerRegistry';
import {
  getNowAndNext, getStation, getStreamConfig, isRadioConfigured,
} from '../services/radio/stationService';
import type {
  NowAndNext, NowPlaying, RadioStation, StationStreamConfig, StreamStatus,
} from '../services/radio/types';

const VOLUME_STORAGE_KEY = 'fth-radio-volume';

interface RadioPlayerContextValue {
  station: RadioStation | null;
  config: StationStreamConfig | null;
  status: StreamStatus | null;
  nowPlaying: NowPlaying | null;
  /** The track before the current one, remembered client-side (spec §3). */
  previousTrack: NowPlaying | null;
  schedule: NowAndNext;
  streamUrl: string | null;
  isConfigured: boolean;
  isLoading: boolean;
  isPlaying: boolean;
  isBuffering: boolean;
  playbackError: string | null;
  volume: number;
  isMuted: boolean;
  toggle: () => void;
  play: () => void;
  pause: () => void;
  setVolume: (value: number) => void;
  toggleMute: () => void;
  refresh: () => void;
}

const RadioPlayerContext = createContext<RadioPlayerContextValue | undefined>(undefined);

const readStoredVolume = (): number => {
  try {
    const raw = window.localStorage.getItem(VOLUME_STORAGE_KEY);
    const parsed = raw === null ? NaN : Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : 0.8;
  } catch {
    // Private browsing and blocked site data both throw here.
    return 0.8;
  }
};

const sameTrack = (a: NowPlaying | null, b: NowPlaying | null): boolean =>
  a?.title === b?.title && a?.artist === b?.artist;

export const RadioPlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [station, setStation] = useState<RadioStation | null>(null);
  const [config, setConfig] = useState<StationStreamConfig | null>(null);
  const [status, setStatus] = useState<StreamStatus | null>(null);
  const [previousTrack, setPreviousTrack] = useState<NowPlaying | null>(null);
  const [schedule, setSchedule] = useState<NowAndNext>({ current: null, next: null });
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [volume, setVolumeState] = useState<number>(readStoredVolume);
  const [isMuted, setIsMuted] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  // The provider is mounted app-wide so playback survives navigation, but the
  // station only needs loading where it is actually used: on a radio page, or
  // once a listener has started the stream and the mini player is following
  // them around the site. Without this gate every page on the site would run
  // station queries and a 60-second schedule poll it never uses.
  const [hasActivated, setHasActivated] = useState(false);
  const location = useLocation();
  const needsStation = location.pathname.startsWith('/radio') || hasActivated;

  const provider = useMemo(() => createStreamProvider(config), [config]);
  const streamUrl = useMemo(() => provider.getStreamUrl(), [provider]);

  // --- Load station identity and streaming configuration once -------------
  useEffect(() => {
    if (!needsStation) return;
    let cancelled = false;
    (async () => {
      try {
        const loadedStation = await getStation();
        if (cancelled) return;
        setStation(loadedStation);
        if (loadedStation) {
          const loadedConfig = await getStreamConfig(loadedStation.id);
          if (!cancelled) setConfig(loadedConfig);
        }
      } catch (error) {
        console.error('Radio station configuration:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshToken, needsStation]);

  // --- Poll provider status / now playing ---------------------------------
  useEffect(() => {
    if (!config) return;
    let cancelled = false;
    const controller = new AbortController();

    const poll = async () => {
      const next = await provider.getStatus(controller.signal);
      if (cancelled) return;
      setStatus((current) => {
        // Remember the outgoing track so the page can show "previously played".
        if (current?.nowPlaying && !sameTrack(current.nowPlaying, next.nowPlaying)) {
          setPreviousTrack(current.nowPlaying);
        }
        return next;
      });
    };

    poll();
    const interval = window.setInterval(poll, Math.max(5, config.metadataPollSeconds) * 1000);
    return () => {
      cancelled = true;
      controller.abort();
      window.clearInterval(interval);
    };
  }, [provider, config]);

  // --- Keep the current/next programme in step with the clock -------------
  useEffect(() => {
    if (!needsStation) return;
    let cancelled = false;
    const load = async () => {
      try {
        const nowAndNext = await getNowAndNext(new Date());
        if (!cancelled) setSchedule(nowAndNext);
      } catch (error) {
        console.error('Radio now/next:', error);
      }
    };
    load();
    const interval = window.setInterval(load, 60_000);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, [refreshToken, needsStation]);

  // --- Audio element wiring ------------------------------------------------
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlaying = () => {
      setIsPlaying(true);
      setIsBuffering(false);
      setPlaybackError(null);
      // Keep the station loaded from now on, so the mini player still shows the
      // current programme after the listener navigates away from /radio.
      setHasActivated(true);
    };
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsBuffering(true);
    const onError = () => {
      setIsPlaying(false);
      setIsBuffering(false);
      setPlaybackError('The live stream could not be played. It may be off air right now.');
    };

    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('error', onError);
    return () => {
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('error', onError);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = isMuted;
  }, [volume, isMuted]);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !streamUrl) return;
    setIsBuffering(true);
    setPlaybackError(null);
    // A live stream should always resume at the live edge, never where it
    // was paused, so the source is reloaded on each play.
    audio.load();
    audio.play().catch(() => {
      setIsBuffering(false);
      setPlaybackError('Playback was blocked by the browser. Press play again to start listening.');
    });
  }, [streamUrl]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsBuffering(false);
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, pause, play]);

  const setVolume = useCallback((value: number) => {
    const clamped = Math.min(1, Math.max(0, value));
    setVolumeState(clamped);
    if (clamped > 0) setIsMuted(false);
    try {
      window.localStorage.setItem(VOLUME_STORAGE_KEY, String(clamped));
    } catch {
      // Remembering the volume is a convenience; failing to store it is fine.
    }
  }, []);

  const toggleMute = useCallback(() => setIsMuted((current) => !current), []);
  const refresh = useCallback(() => setRefreshToken((token) => token + 1), []);

  const value = useMemo<RadioPlayerContextValue>(() => ({
    station,
    config,
    status,
    nowPlaying: status?.nowPlaying ?? null,
    previousTrack,
    schedule,
    streamUrl,
    isConfigured: isRadioConfigured(),
    isLoading,
    isPlaying,
    isBuffering,
    playbackError,
    volume,
    isMuted,
    toggle, play, pause, setVolume, toggleMute, refresh,
  }), [
    station, config, status, previousTrack, schedule, streamUrl, isLoading,
    isPlaying, isBuffering, playbackError, volume, isMuted,
    toggle, play, pause, setVolume, toggleMute, refresh,
  ]);

  return (
    <RadioPlayerContext.Provider value={value}>
      {children}
      {/* One audio element for the whole app, so playback survives navigation. */}
      <audio
        ref={audioRef}
        preload="none"
        src={streamUrl ?? undefined}
        aria-label={station ? `${station.name} live stream` : 'Community radio live stream'}
      />
    </RadioPlayerContext.Provider>
  );
};

export const useRadioPlayer = (): RadioPlayerContextValue => {
  const context = useContext(RadioPlayerContext);
  if (!context) throw new Error('useRadioPlayer must be used within a RadioPlayerProvider');
  return context;
};
