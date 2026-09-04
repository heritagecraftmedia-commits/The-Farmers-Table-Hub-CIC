// Persistent docked player (spec §24).
//
// Once a listener has started the stream, this bar keeps "Listen live",
// the current programme and what's playing reachable from anywhere on the
// site without scrolling back to the radio page. It only appears after
// playback has started, so it never covers content uninvited.

import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Loader2, Pause, Play, Radio as RadioIcon, X } from 'lucide-react';

import { useRadioPlayer } from '../../context/RadioPlayerContext';

export const MiniPlayer: React.FC = () => {
  const { isPlaying, isBuffering, nowPlaying, schedule, station, toggle, pause } = useRadioPlayer();
  const [hasStarted, setHasStarted] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (isPlaying) {
      setHasStarted(true);
      setIsDismissed(false);
    }
  }, [isPlaying]);

  // The full player is already on screen on the radio landing page.
  const onRadioHome = location.pathname === '/radio';
  if (!hasStarted || isDismissed || onRadioHome) return null;

  const title = schedule.current?.title ?? station?.name ?? 'Community Radio';
  const subtitle = nowPlaying?.title
    ? `${nowPlaying.title}${nowPlaying.artist ? ` — ${nowPlaying.artist}` : ''}`
    : 'Live';

  return (
    <div
      role="region"
      aria-label="Radio mini player"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-brand-cream/10 bg-brand-ink text-brand-cream shadow-2xl"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-4">
        <button
          type="button"
          onClick={toggle}
          aria-label={isPlaying ? 'Pause the live stream' : 'Resume the live stream'}
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-cream text-brand-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cream"
        >
          {isBuffering
            ? <Loader2 size={20} className="animate-spin" aria-hidden="true" />
            : isPlaying
              ? <Pause size={20} aria-hidden="true" />
              : <Play size={20} aria-hidden="true" />}
        </button>

        <Link to="/radio" className="min-w-0 flex-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cream">
          <p className="truncate text-sm font-bold">{title}</p>
          <p className="truncate text-xs text-brand-cream/60">{subtitle}</p>
        </Link>

        <Link
          to="/radio"
          className="hidden shrink-0 items-center gap-2 rounded-full border border-brand-cream/20 px-4 py-2 text-xs font-bold sm:inline-flex focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cream"
        >
          <RadioIcon size={14} aria-hidden="true" /> Radio
        </Link>

        <button
          type="button"
          onClick={() => { pause(); setIsDismissed(true); }}
          aria-label="Stop listening and close the mini player"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-brand-cream/60 hover:text-brand-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cream"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
