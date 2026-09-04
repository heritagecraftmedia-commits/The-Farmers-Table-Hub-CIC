// Radio search (spec §20).
//
// Searches published programmes, presenters, episodes, tracks, announcements
// and promoted events. Only published, publicly readable records are searched —
// RLS enforces that regardless of what is asked for here.

import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarDays, Megaphone, Mic2, Music, Radio as RadioIcon, Search } from 'lucide-react';

import {
  getBroadcastableMusic, getEventsOnAirThisWeek, getPublishedAnnouncements,
  getPublishedEpisodes, getPublishedPresenters, getPublishedProgrammes,
} from '../../services/radio/stationService';

type ResultKind = 'programme' | 'presenter' | 'episode' | 'track' | 'announcement' | 'event';

interface SearchResult {
  id: string;
  kind: ResultKind;
  title: string;
  subtitle: string | null;
  href: string | null;
  haystack: string;
}

const KIND_META: Record<ResultKind, { label: string; icon: React.ElementType }> = {
  programme: { label: 'Programme', icon: RadioIcon },
  presenter: { label: 'Presenter', icon: Mic2 },
  episode: { label: 'Episode', icon: RadioIcon },
  track: { label: 'Track', icon: Music },
  announcement: { label: 'Announcement', icon: Megaphone },
  event: { label: 'Event', icon: CalendarDays },
};

const KIND_FILTERS: { value: ResultKind | 'all'; label: string }[] = [
  { value: 'all', label: 'Everything' },
  { value: 'programme', label: 'Programmes' },
  { value: 'presenter', label: 'Presenters' },
  { value: 'episode', label: 'Episodes' },
  { value: 'track', label: 'Music' },
  { value: 'announcement', label: 'Announcements' },
  { value: 'event', label: 'Events' },
];

const normalise = (value: string) => value.toLowerCase().trim();

export const RadioSearch: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [kind, setKind] = useState<ResultKind | 'all'>('all');
  const [index, setIndex] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getPublishedProgrammes(),
      getPublishedPresenters(),
      getPublishedEpisodes(200),
      getBroadcastableMusic(),
      getPublishedAnnouncements(100),
      getEventsOnAirThisWeek(50),
    ])
      .then(([programmes, presenters, episodes, tracks, announcements, events]) => {
        if (cancelled) return;
        const built: SearchResult[] = [
          ...programmes.map((programme): SearchResult => ({
            id: `programme-${programme.id}`,
            kind: 'programme',
            title: programme.title,
            subtitle: programme.presenter?.name ?? programme.host ?? programme.category,
            href: programme.slug ? `/radio/shows/${programme.slug}` : null,
            haystack: normalise([programme.title, programme.description, programme.category, programme.host].filter(Boolean).join(' ')),
          })),
          ...presenters.map((presenter): SearchResult => ({
            id: `presenter-${presenter.id}`,
            kind: 'presenter',
            title: presenter.name,
            subtitle: presenter.presenterRole.replace(/_/g, ' '),
            href: `/radio/presenters/${presenter.slug}`,
            haystack: normalise([presenter.name, presenter.bio, presenter.intro].filter(Boolean).join(' ')),
          })),
          ...episodes.map((episode): SearchResult => ({
            id: `episode-${episode.id}`,
            kind: 'episode',
            title: episode.title,
            subtitle: episode.programmeTitle ?? null,
            href: '/radio/listen-again',
            haystack: normalise([episode.title, episode.description, episode.programmeTitle, ...episode.tags].filter(Boolean).join(' ')),
          })),
          ...tracks.map((track): SearchResult => ({
            id: `track-${track.id}`,
            kind: 'track',
            title: track.title,
            subtitle: [track.artist, track.genre].filter(Boolean).join(' · ') || null,
            href: null,
            haystack: normalise([track.title, track.artist, track.album, track.genre].filter(Boolean).join(' ')),
          })),
          ...announcements.map((announcement): SearchResult => ({
            id: `announcement-${announcement.id}`,
            kind: 'announcement',
            title: announcement.title,
            subtitle: announcement.organisationName,
            href: '/radio',
            haystack: normalise([announcement.title, announcement.content, announcement.organisationName].filter(Boolean).join(' ')),
          })),
          ...events.map((event): SearchResult => ({
            id: `event-${event.eventId}`,
            kind: 'event',
            title: event.title,
            subtitle: [event.venue, event.location].filter(Boolean).join(' · ') || null,
            href: '/whats-on',
            haystack: normalise([event.title, event.description, event.venue, event.location].filter(Boolean).join(' ')),
          })),
        ];
        setIndex(built);
      })
      .catch((error) => console.error('Radio search:', error))
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const results = useMemo(() => {
    const terms = normalise(query).split(/\s+/).filter(Boolean);
    if (terms.length === 0) return [];
    return index.filter((entry) => {
      if (kind !== 'all' && entry.kind !== kind) return false;
      return terms.every((term) => entry.haystack.includes(term));
    });
  }, [index, query, kind]);

  const grouped = useMemo(() => {
    const map = new Map<ResultKind, SearchResult[]>();
    for (const result of results) {
      const list = map.get(result.kind) ?? [];
      list.push(result);
      map.set(result.kind, list);
    }
    return map;
  }, [results]);

  return (
    <div className="min-h-screen bg-brand-cream py-16 md:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-brand-olive">
            Farmers Table Hub Community Radio
          </p>
          <h1 className="font-serif text-5xl md:text-6xl">Search the station</h1>
        </header>

        <form
          role="search"
          onSubmit={(event) => { event.preventDefault(); setSearchParams(query ? { q: query } : {}, { replace: true }); }}
          className="mb-6"
        >
          <label htmlFor="radio-search" className="text-sm font-bold">
            Search programmes, presenters, episodes, music, announcements and events
          </label>
          <div className="mt-2 flex gap-3">
            <input
              id="radio-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search…"
              className="min-h-14 flex-1 rounded-2xl border border-brand-olive/20 bg-white px-5 py-3 text-lg focus:border-brand-olive focus:outline focus:outline-2 focus:outline-brand-olive"
            />
            <button
              type="submit"
              className="inline-flex min-h-14 items-center gap-2 rounded-2xl bg-brand-ink px-7 font-bold text-brand-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink"
            >
              <Search size={18} aria-hidden="true" /> Search
            </button>
          </div>
        </form>

        <div role="group" aria-label="Filter results by type" className="mb-8 flex flex-wrap gap-2">
          {KIND_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setKind(value)}
              aria-pressed={kind === value}
              className={`min-h-11 rounded-full px-4 py-2 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-olive ${
                kind === value ? 'bg-brand-olive text-white' : 'border border-brand-olive/15 bg-white text-brand-ink/70'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div aria-live="polite">
          {isLoading ? (
            <p className="text-brand-ink/50">Loading the station index…</p>
          ) : query.trim() === '' ? (
            <p className="text-brand-ink/55">Type something above to search the station.</p>
          ) : results.length === 0 ? (
            <p className="rounded-2xl bg-white p-6 text-brand-ink/60">
              Nothing matched &ldquo;{query}&rdquo;. Only published station content is searchable.
            </p>
          ) : (
            <>
              <p className="mb-5 text-sm text-brand-ink/55">
                {results.length} {results.length === 1 ? 'result' : 'results'} for &ldquo;{query}&rdquo;
              </p>
              <div className="space-y-8">
                {[...grouped.entries()].map(([resultKind, items]) => {
                  const { label, icon: Icon } = KIND_META[resultKind];
                  return (
                    <section key={resultKind}>
                      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-brand-ink/50">
                        <Icon size={15} aria-hidden="true" /> {label} ({items.length})
                      </h2>
                      <ul className="space-y-2">
                        {items.map((item) => {
                          const body = (
                            <>
                              <p className="font-bold">{item.title}</p>
                              {item.subtitle && (
                                <p className="mt-0.5 text-sm capitalize text-brand-ink/55">{item.subtitle}</p>
                              )}
                            </>
                          );
                          return (
                            <li key={item.id}>
                              {item.href ? (
                                <Link
                                  to={item.href}
                                  className="block rounded-2xl bg-white p-5 transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-olive"
                                >
                                  {body}
                                </Link>
                              ) : (
                                <div className="rounded-2xl bg-white p-5">{body}</div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
