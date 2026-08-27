// Listen Again archive (spec §19).

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Headphones } from 'lucide-react';

import { ContentSlot } from '../../components/radio/ContentSlot';
import { getPublishedEpisodes } from '../../services/radio/stationService';
import type { RadioEpisode } from '../../services/radio/types';

const FILTERS = [
  { value: 'all', label: 'Latest episodes' },
  { value: 'interview', label: 'Interviews' },
  { value: 'community_feature', label: 'Community features' },
  { value: 'special_broadcast', label: 'Special broadcasts' },
] as const;

type Filter = (typeof FILTERS)[number]['value'];

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value))
    : 'Date to be confirmed';

export const RadioListenAgain: React.FC = () => {
  const [episodes, setEpisodes] = useState<RadioEpisode[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getPublishedEpisodes(60)
      .then((rows) => { if (!cancelled) setEpisodes(rows); })
      .catch((error) => console.error('Listen again:', error))
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const visible = useMemo(
    () => (filter === 'all' ? episodes : episodes.filter((episode) => episode.episodeCategory === filter)),
    [episodes, filter],
  );

  return (
    <div className="min-h-screen bg-brand-cream py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <header className="mb-10">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-brand-olive">
            Farmers Table Hub Community Radio
          </p>
          <h1 className="font-serif text-5xl md:text-6xl">Listen again</h1>
          <p className="mt-4 max-w-3xl text-lg text-brand-ink/70">
            Recordings the station has chosen to make public.
          </p>
        </header>

        <div role="group" aria-label="Filter recordings" className="mb-8 flex flex-wrap gap-2">
          {FILTERS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              aria-pressed={filter === value}
              className={`min-h-11 rounded-full px-5 py-2.5 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-olive ${
                filter === value ? 'bg-brand-olive text-white' : 'border border-brand-olive/15 bg-white text-brand-ink/70'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="text-brand-ink/50">Loading recordings…</p>
        ) : visible.length === 0 ? (
          <ContentSlot
            kind="episode"
            hint="Episodes appear here once they are uploaded and published in the Radio Control Centre. Staff control which recordings are public."
          />
        ) : (
          <ul className="space-y-5">
            {visible.map((episode) => (
              <li key={episode.id} className="rounded-[28px] border border-brand-olive/5 bg-white p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    {episode.programmeTitle && (
                      <p className="text-[11px] font-bold uppercase tracking-wide text-brand-olive">
                        {episode.programmeTitle}
                      </p>
                    )}
                    <h2 className="mt-1 font-serif text-2xl">{episode.title}</h2>
                    <p className="mt-1 text-sm text-brand-ink/50">{formatDate(episode.broadcastDate)}</p>
                  </div>
                  {episode.isDownloadable && episode.audioUrl && (
                    <a
                      href={episode.audioUrl}
                      download
                      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-brand-olive/20 px-5 py-2.5 text-sm font-bold text-brand-olive focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-olive"
                    >
                      <Download size={15} aria-hidden="true" /> Download
                    </a>
                  )}
                </div>

                {episode.description && (
                  <p className="mt-4 leading-relaxed text-brand-ink/75">{episode.description}</p>
                )}

                {episode.tags.length > 0 && (
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {episode.tags.map((tag) => (
                      <li key={tag} className="rounded-full bg-brand-cream px-3 py-1 text-xs font-bold text-brand-ink/60">
                        {tag}
                      </li>
                    ))}
                  </ul>
                )}

                {episode.audioUrl ? (
                  <audio
                    controls
                    preload="none"
                    src={episode.audioUrl}
                    className="mt-5 w-full"
                    aria-label={`Listen again: ${episode.title}`}
                  />
                ) : (
                  <p className="mt-4 inline-flex items-center gap-2 text-sm text-brand-ink/45">
                    <Headphones size={15} aria-hidden="true" /> Audio has not been uploaded for this episode yet.
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}

        <p className="mt-10 text-sm text-brand-ink/50">
          Looking for a programme rather than an episode?{' '}
          <Link to="/radio/shows" className="font-bold text-brand-olive hover:underline">Browse our shows</Link>.
        </p>
      </div>
    </div>
  );
};
