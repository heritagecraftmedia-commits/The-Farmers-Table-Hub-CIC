// The main live radio player (spec §2, §24, §25).
//
// Accessibility: every control is a real button with a visible label or an
// aria-label, the live region announces programme and track changes, the
// volume slider is keyboard operable, and on-air state is conveyed by text
// as well as by the indicator dot.

import React from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle, Calendar, Loader2, Music, Pause, Play, Radio as RadioIcon,
  Users, Volume2, VolumeX,
} from 'lucide-react';

import { useRadioPlayer } from '../../context/RadioPlayerContext';
import type { ScheduleSlot } from '../../services/radio/types';

const timeRange = (slot: ScheduleSlot) => `${slot.startTime}–${slot.endTime}`;

const OnAirIndicator: React.FC<{ isOnline: boolean; isPlaying: boolean }> = ({ isOnline, isPlaying }) => (
  <span className="inline-flex items-center gap-2">
    <span
      aria-hidden="true"
      className={`h-2.5 w-2.5 rounded-full ${
        isOnline ? 'bg-red-500' : 'bg-brand-cream/30'
      } ${isOnline && isPlaying ? 'animate-pulse' : ''}`}
    />
    <span className="text-xs font-bold uppercase tracking-[0.2em]">
      {isOnline ? 'On air' : 'Off air'}
    </span>
  </span>
);

export const RadioPlayer: React.FC<{ variant?: 'hero' | 'compact' }> = ({ variant = 'hero' }) => {
  const {
    station, config, status, nowPlaying, previousTrack, schedule, streamUrl,
    isLoading, isPlaying, isBuffering, playbackError, volume, isMuted,
    toggle, setVolume, toggleMute,
  } = useRadioPlayer();

  const isOnline = Boolean(status?.isOnline);
  const canPlay = Boolean(streamUrl);
  const current = schedule.current;
  const next = schedule.next;

  const offlineMessage =
    config?.offlineMessage ??
    'The live stream is not connected yet. It will appear here as soon as the station is on air.';

  const compact = variant === 'compact';

  return (
    <section
      aria-label="Live radio player"
      className={`bg-brand-ink text-brand-cream shadow-2xl ${
        compact ? 'rounded-[28px] p-6' : 'rounded-[40px] p-8 md:p-12'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <OnAirIndicator isOnline={isOnline} isPlaying={isPlaying} />
        {typeof status?.listenerCount === 'number' && (
          <span className="inline-flex items-center gap-2 text-sm text-brand-cream/60">
            <Users size={15} aria-hidden="true" />
            {status.listenerCount} listening
          </span>
        )}
      </div>

      {/* Programme and track changes are announced to screen readers. */}
      <div aria-live="polite" aria-atomic="true">
        <h2 className={`font-serif mt-6 ${compact ? 'text-3xl' : 'text-4xl md:text-5xl'}`}>
          {current?.title ?? station?.name ?? 'Farmers Table Hub Community Radio'}
        </h2>

        <p className="mt-3 text-brand-cream/70">
          {current ? (
            <>
              {current.programme?.presenter?.name || current.programme?.host ? (
                <span>with {current.programme?.presenter?.name ?? current.programme?.host} · </span>
              ) : null}
              <span>{timeRange(current)}</span>
              {current.isOverride && (
                <span className="ml-2 rounded-full bg-brand-cream/10 px-2 py-0.5 text-xs">
                  Special broadcast
                </span>
              )}
            </>
          ) : isLoading ? (
            'Loading the schedule…'
          ) : (
            'No programme is scheduled for right now.'
          )}
        </p>

        {nowPlaying && (
          <div className="mt-6 flex items-center gap-4 rounded-2xl bg-brand-cream/5 p-4">
            {nowPlaying.artworkUrl ? (
              <img
                src={nowPlaying.artworkUrl}
                alt=""
                className="h-16 w-16 shrink-0 rounded-xl object-cover"
                loading="lazy"
              />
            ) : (
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-brand-cream/10">
                <Music size={22} aria-hidden="true" />
              </span>
            )}
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-cream/50">
                Now playing
              </p>
              <p className="truncate font-bold">{nowPlaying.title ?? 'Unknown track'}</p>
              {nowPlaying.artist && (
                <p className="truncate text-sm text-brand-cream/60">{nowPlaying.artist}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* --- Transport controls --- */}
      <div className="mt-8 flex flex-wrap items-center gap-5">
        <button
          type="button"
          onClick={toggle}
          disabled={!canPlay}
          aria-label={isPlaying ? 'Pause the live stream' : 'Listen live'}
          className="inline-flex min-h-14 items-center gap-3 rounded-full bg-brand-cream px-8 py-4 text-lg font-bold text-brand-ink transition disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cream"
        >
          {isBuffering ? (
            <Loader2 size={24} className="animate-spin" aria-hidden="true" />
          ) : isPlaying ? (
            <Pause size={24} aria-hidden="true" />
          ) : (
            <Play size={24} aria-hidden="true" />
          )}
          {isBuffering ? 'Connecting…' : isPlaying ? 'Pause' : 'Listen live'}
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-cream/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cream"
          >
            {isMuted || volume === 0
              ? <VolumeX size={20} aria-hidden="true" />
              : <Volume2 size={20} aria-hidden="true" />}
          </button>
          <label className="flex items-center gap-2">
            <span className="sr-only">Volume</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={(event) => setVolume(Number(event.target.value))}
              aria-valuetext={`${Math.round((isMuted ? 0 : volume) * 100)} percent`}
              className="h-2 w-32 cursor-pointer accent-brand-cream"
            />
          </label>
        </div>
      </div>

      {!canPlay && !isLoading && (
        <p className="mt-6 flex items-start gap-2 rounded-2xl border border-brand-cream/10 p-4 text-sm text-brand-cream/70">
          <RadioIcon size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          {offlineMessage}
        </p>
      )}

      {playbackError && (
        <p role="alert" className="mt-6 flex items-start gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          {playbackError}
        </p>
      )}

      {/* --- What's next, and what just played --- */}
      <div className="mt-8 grid gap-4 border-t border-brand-cream/10 pt-6 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-cream/50">
            Next on air
          </p>
          {next ? (
            <p className="mt-1">
              <span className="font-bold">{next.title}</span>
              <span className="block text-sm text-brand-cream/60">{timeRange(next)}</span>
            </p>
          ) : (
            <p className="mt-1 text-sm text-brand-cream/50">Nothing scheduled after this.</p>
          )}
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-cream/50">
            Previously played
          </p>
          {previousTrack ? (
            <p className="mt-1">
              <span className="font-bold">{previousTrack.title}</span>
              {previousTrack.artist && (
                <span className="block text-sm text-brand-cream/60">{previousTrack.artist}</span>
              )}
            </p>
          ) : (
            <p className="mt-1 text-sm text-brand-cream/50">Track history appears here once the stream is running.</p>
          )}
        </div>
      </div>

      {!compact && (
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/radio/schedule"
            className="inline-flex items-center gap-2 rounded-full border border-brand-cream/20 px-5 py-3 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cream"
          >
            <Calendar size={16} aria-hidden="true" /> Today&rsquo;s schedule
          </Link>
          <Link
            to="/radio/shows"
            className="inline-flex items-center gap-2 rounded-full border border-brand-cream/20 px-5 py-3 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cream"
          >
            <RadioIcon size={16} aria-hidden="true" /> Our shows
          </Link>
        </div>
      )}
    </section>
  );
};
