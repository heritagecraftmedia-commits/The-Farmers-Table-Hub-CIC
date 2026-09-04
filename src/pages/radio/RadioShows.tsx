// Programme directory and programme detail (spec §6, §7, §9).

import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, Download, ExternalLink, Mic2, Play, Radio as RadioIcon } from 'lucide-react';

import { ContentSlot } from '../../components/radio/ContentSlot';
import {
  getEpisodesForProgramme, getProgrammeBySlug, getPublishedProgrammes, getScheduleRules,
} from '../../services/radio/stationService';
import { DAY_NAMES } from '../../services/radio/scheduleEngine';
import type { RadioEpisode, RadioPresenter, RadioProgramme, ScheduleRule } from '../../services/radio/types';

const BROADCAST_MODE_LABELS: Record<string, string> = {
  live: 'Live',
  'pre-recorded': 'Pre-recorded',
  automated: 'Automated',
  planned: 'In planning',
};

const formatDuration = (seconds: number): string => {
  if (!seconds) return '';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${String(minutes % 60).padStart(2, '0')}m`;
};

/** Turn schedule rules back into a readable "Tuesdays, 18:00–19:00". */
const describeRule = (rule: ScheduleRule): string => {
  const time = `${rule.startTime.slice(0, 5)}–${rule.endTime.slice(0, 5)}`;
  switch (rule.repeatPattern) {
    case 'daily': return `Every day, ${time}`;
    case 'weekdays': return `Weekdays, ${time}`;
    case 'weekends': return `Weekends, ${time}`;
    case 'weekly': return `${DAY_NAMES[rule.dayOfWeek ?? 0]}s, ${time}`;
    case 'fortnightly': return `Alternate ${DAY_NAMES[rule.dayOfWeek ?? 0]}s, ${time}`;
    case 'monthly': return `${['1st', '2nd', '3rd', '4th', '5th'][(rule.weekOfMonth ?? 1) - 1]} ${DAY_NAMES[rule.dayOfWeek ?? 0]} of the month, ${time}`;
    case 'once': return `${rule.specificDate ?? 'One-off'}, ${time}`;
    default: return time;
  }
};

// ------------------------------------------------------------------
// Programme list
// ------------------------------------------------------------------

export const RadioShows: React.FC = () => {
  const [programmes, setProgrammes] = useState<RadioProgramme[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getPublishedProgrammes()
      .then((rows) => { if (!cancelled) setProgrammes(rows); })
      .catch((error) => console.error('Radio shows:', error))
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-brand-cream py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-10">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-brand-olive">
            Farmers Table Hub Community Radio
          </p>
          <h1 className="font-serif text-5xl md:text-6xl">Our shows</h1>
          <p className="mt-4 max-w-3xl text-lg text-brand-ink/70">
            Every programme published by the station.
          </p>
        </header>

        {isLoading ? (
          <p className="text-brand-ink/50">Loading programmes…</p>
        ) : programmes.length === 0 ? (
          <ContentSlot
            kind="programme"
            hint="No programmes have been published yet. Create one in the Radio Control Centre, set its status to Published, and it will appear here."
          />
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {programmes.map((programme) => (
              <li key={programme.id}>
                <Link
                  to={programme.slug ? `/radio/shows/${programme.slug}` : '#'}
                  className="flex h-full flex-col overflow-hidden rounded-[28px] border border-brand-olive/5 bg-white transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-olive"
                >
                  {programme.imageUrl ? (
                    <img src={programme.imageUrl} alt="" className="h-40 w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-40 items-center justify-center bg-brand-olive/5">
                      <RadioIcon size={36} className="text-brand-olive/40" aria-hidden="true" />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-6">
                    {programme.category && (
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-brand-olive">
                        {programme.category}
                      </p>
                    )}
                    <h2 className="font-serif text-2xl">{programme.title}</h2>
                    {(programme.presenter?.name || programme.host) && (
                      <p className="mt-1 text-sm text-brand-ink/55">
                        with {programme.presenter?.name ?? programme.host}
                      </p>
                    )}
                    {programme.description && (
                      <p className="mt-3 line-clamp-3 text-sm text-brand-ink/70">{programme.description}</p>
                    )}
                    <p className="mt-auto pt-4 text-xs font-bold uppercase tracking-wide text-brand-ink/40">
                      {BROADCAST_MODE_LABELS[programme.broadcastMode] ?? programme.broadcastMode}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// Programme detail
// ------------------------------------------------------------------

export const RadioProgrammeDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [programme, setProgramme] = useState<RadioProgramme | null>(null);
  const [episodes, setEpisodes] = useState<RadioEpisode[]>([]);
  const [rules, setRules] = useState<ScheduleRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setIsLoading(true);

    getProgrammeBySlug(slug)
      .then(async (found) => {
        if (cancelled) return;
        setProgramme(found);
        if (!found) return;
        const [programmeEpisodes, allRules] = await Promise.all([
          getEpisodesForProgramme(found.id),
          getScheduleRules(),
        ]);
        if (cancelled) return;
        setEpisodes(programmeEpisodes);
        setRules(allRules.filter((rule) => rule.programmeId === found.id));
      })
      .catch((error) => console.error('Programme detail:', error))
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [slug]);

  if (isLoading) {
    return <div className="min-h-screen bg-brand-cream p-16 text-brand-ink/50">Loading programme…</div>;
  }

  if (!programme) {
    return (
      <div className="min-h-screen bg-brand-cream px-4 py-24">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-serif text-4xl">Programme not found</h1>
          <p className="mt-3 text-brand-ink/60">
            This programme may not be published yet.
          </p>
          <Link to="/radio/shows" className="mt-6 inline-flex items-center gap-2 font-bold text-brand-olive hover:underline">
            <ArrowLeft size={16} aria-hidden="true" /> All shows
          </Link>
        </div>
      </div>
    );
  }

  // The same person can legitimately be both the named presenter and a
  // co-presenter link, so de-duplicate by id: listing them twice would render
  // duplicate React keys and show the same person twice.
  const presenters = [programme.presenter, ...(programme.coPresenters ?? [])]
    .filter((person): person is RadioPresenter => Boolean(person))
    .filter((person, index, all) => all.findIndex((other) => other.id === person.id) === index);

  return (
    <div className="min-h-screen bg-brand-cream py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Link to="/radio/shows" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-brand-olive hover:underline">
          <ArrowLeft size={16} aria-hidden="true" /> All shows
        </Link>

        <header className="overflow-hidden rounded-[32px] bg-brand-ink text-brand-cream">
          {programme.imageUrl && (
            <img src={programme.imageUrl} alt="" className="h-56 w-full object-cover md:h-72" />
          )}
          <div className="p-8 md:p-12">
            {programme.category && (
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-brand-cream/50">
                {programme.category}
              </p>
            )}
            <h1 className="font-serif text-4xl md:text-5xl">{programme.title}</h1>
            {programme.intro && <p className="mt-4 text-lg text-brand-cream/75">{programme.intro}</p>}

            <dl className="mt-8 grid gap-4 border-t border-brand-cream/10 pt-6 sm:grid-cols-3">
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-cream/50">Broadcast</dt>
                <dd className="mt-1">{BROADCAST_MODE_LABELS[programme.broadcastMode] ?? programme.broadcastMode}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-cream/50">Next on air</dt>
                <dd className="mt-1">
                  {rules.length > 0 ? describeRule(rules[0]) : programme.scheduleSummary || 'To be scheduled'}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-cream/50">Episodes</dt>
                <dd className="mt-1">{episodes.length || 'None published yet'}</dd>
              </div>
            </dl>

            {programme.websiteUrl && (
              <a
                href={programme.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-cream px-5 py-3 text-sm font-bold text-brand-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cream"
              >
                Programme website <ExternalLink size={14} aria-hidden="true" />
              </a>
            )}
          </div>
        </header>

        {programme.description && (
          <section className="mt-8 rounded-[32px] border border-brand-olive/5 bg-white p-8">
            <h2 className="font-serif text-2xl">About this programme</h2>
            <p className="mt-4 leading-relaxed whitespace-pre-line text-brand-ink/75">{programme.description}</p>
          </section>
        )}

        {/* --- Presenters --- */}
        <section className="mt-8 rounded-[32px] border border-brand-olive/5 bg-white p-8">
          <h2 className="mb-6 font-serif text-2xl">Presented by</h2>
          {presenters.length === 0 ? (
            <ContentSlot kind="presenter" hint="Assign a presenter to this programme in the Radio Control Centre." compact />
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2">
              {presenters.map((presenter) => (
                <li key={presenter.id}>
                  <Link
                    to={`/radio/presenters/${presenter.slug}`}
                    className="flex items-center gap-4 rounded-2xl bg-brand-cream p-4 transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-olive"
                  >
                    {presenter.photoUrl ? (
                      <img src={presenter.photoUrl} alt="" className="h-14 w-14 rounded-full object-cover" loading="lazy" />
                    ) : (
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white">
                        <Mic2 size={20} className="text-brand-olive" aria-hidden="true" />
                      </span>
                    )}
                    <div>
                      <p className="font-bold">{presenter.name}</p>
                      <p className="text-sm capitalize text-brand-ink/50">
                        {presenter.presenterRole.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* --- Schedule --- */}
        {rules.length > 0 && (
          <section className="mt-8 rounded-[32px] border border-brand-olive/5 bg-white p-8">
            <h2 className="mb-5 font-serif text-2xl">When it&rsquo;s on</h2>
            <ul className="space-y-2">
              {rules.map((rule) => (
                <li key={rule.id} className="flex items-center gap-3 rounded-2xl bg-brand-cream p-4">
                  <Clock size={18} className="text-brand-olive" aria-hidden="true" />
                  <span className="font-bold">{describeRule(rule)}</span>
                  {rule.scheduleType !== 'regular' && (
                    <span className="ml-auto rounded-full bg-brand-olive/10 px-3 py-1 text-[11px] font-bold uppercase text-brand-olive">
                      {rule.scheduleType.replace(/_/g, ' ')}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* --- Previous episodes --- */}
        <section className="mt-8 rounded-[32px] border border-brand-olive/5 bg-white p-8">
          <h2 className="mb-6 font-serif text-2xl">Previous episodes</h2>
          {episodes.length === 0 ? (
            <ContentSlot
              kind="episode"
              hint="Published episodes for this programme will be listed here for listen again."
              compact
            />
          ) : (
            <ul className="space-y-4">
              {episodes.map((episode) => (
                <li key={episode.id} className="rounded-2xl bg-brand-cream p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold">{episode.title}</p>
                      <p className="mt-0.5 text-sm text-brand-ink/50">
                        {episode.broadcastDate
                          ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(episode.broadcastDate))
                          : 'Broadcast date to be confirmed'}
                        {episode.durationSeconds ? ` · ${formatDuration(episode.durationSeconds)}` : ''}
                      </p>
                    </div>
                    {episode.isDownloadable && episode.audioUrl && (
                      <a
                        href={episode.audioUrl}
                        download
                        className="inline-flex items-center gap-2 rounded-full border border-brand-olive/20 px-4 py-2 text-sm font-bold text-brand-olive focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-olive"
                      >
                        <Download size={14} aria-hidden="true" /> Download
                      </a>
                    )}
                  </div>
                  {episode.description && (
                    <p className="mt-3 text-sm leading-relaxed text-brand-ink/70">{episode.description}</p>
                  )}
                  {episode.audioUrl ? (
                    <audio
                      controls
                      preload="none"
                      src={episode.audioUrl}
                      className="mt-4 w-full"
                      aria-label={`Listen again: ${episode.title}`}
                    />
                  ) : (
                    <p className="mt-3 inline-flex items-center gap-2 text-sm text-brand-ink/45">
                      <Play size={14} aria-hidden="true" /> Audio has not been uploaded for this episode yet.
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};
