// Presenter directory and presenter detail (spec §8).

import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Globe, Mail, Mic2 } from 'lucide-react';

import { ContentSlot } from '../../components/radio/ContentSlot';
import {
  getPresenterBySlug, getPublishedPresenters, getPublishedProgrammes,
} from '../../services/radio/stationService';
import type { RadioPresenter, RadioProgramme } from '../../services/radio/types';

const ROLE_LABELS: Record<string, string> = {
  presenter: 'Presenter',
  producer: 'Producer',
  guest_presenter: 'Guest presenter',
  community_contributor: 'Community contributor',
  news: 'News and information',
  music_specialist: 'Music specialist',
};

const SocialLinks: React.FC<{ links: Record<string, string> }> = ({ links }) => {
  const entries = Object.entries(links).filter(([, url]) => Boolean(url));
  if (entries.length === 0) return null;
  return (
    <ul className="mt-4 flex flex-wrap gap-2">
      {entries.map(([label, url]) => (
        <li key={label}>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-brand-olive/20 px-4 py-2 text-sm font-bold text-brand-olive focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-olive"
          >
            <Globe size={14} aria-hidden="true" /> <span className="capitalize">{label}</span>
          </a>
        </li>
      ))}
    </ul>
  );
};

export const RadioPresenters: React.FC = () => {
  const [presenters, setPresenters] = useState<RadioPresenter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getPublishedPresenters()
      .then((rows) => { if (!cancelled) setPresenters(rows); })
      .catch((error) => console.error('Presenters:', error))
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
          <h1 className="font-serif text-5xl md:text-6xl">Presenters</h1>
          <p className="mt-4 max-w-3xl text-lg text-brand-ink/70">
            The local voices behind the station.
          </p>
        </header>

        {isLoading ? (
          <p className="text-brand-ink/50">Loading presenters…</p>
        ) : presenters.length === 0 ? (
          <ContentSlot
            kind="presenter"
            hint="Presenter profiles are added in the Radio Control Centre. No presenters are invented for this page — real people only."
          />
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {presenters.map((presenter) => (
              <li key={presenter.id}>
                <Link
                  to={`/radio/presenters/${presenter.slug}`}
                  className="flex h-full flex-col rounded-[28px] border border-brand-olive/5 bg-white p-7 transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-olive"
                >
                  {presenter.photoUrl ? (
                    <img src={presenter.photoUrl} alt="" className="mb-5 h-24 w-24 rounded-full object-cover" loading="lazy" />
                  ) : (
                    <span className="mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-brand-cream">
                      <Mic2 size={28} className="text-brand-olive" aria-hidden="true" />
                    </span>
                  )}
                  <h2 className="font-serif text-2xl">{presenter.name}</h2>
                  <p className="mt-1 text-sm font-bold uppercase tracking-wide text-brand-olive">
                    {ROLE_LABELS[presenter.presenterRole] ?? presenter.presenterRole}
                  </p>
                  {presenter.intro && (
                    <p className="mt-3 line-clamp-3 text-sm text-brand-ink/70">{presenter.intro}</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export const RadioPresenterDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [presenter, setPresenter] = useState<RadioPresenter | null>(null);
  const [programmes, setProgrammes] = useState<RadioProgramme[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setIsLoading(true);

    getPresenterBySlug(slug)
      .then(async (found) => {
        if (cancelled) return;
        setPresenter(found);
        if (!found) return;
        const allProgrammes = await getPublishedProgrammes();
        if (cancelled) return;
        setProgrammes(allProgrammes.filter((programme) =>
          programme.presenterId === found.id ||
          (programme.coPresenters ?? []).some((co) => co.id === found.id),
        ));
      })
      .catch((error) => console.error('Presenter detail:', error))
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [slug]);

  if (isLoading) {
    return <div className="min-h-screen bg-brand-cream p-16 text-brand-ink/50">Loading presenter…</div>;
  }

  if (!presenter) {
    return (
      <div className="min-h-screen bg-brand-cream px-4 py-24">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-serif text-4xl">Presenter not found</h1>
          <Link to="/radio/presenters" className="mt-6 inline-flex items-center gap-2 font-bold text-brand-olive hover:underline">
            <ArrowLeft size={16} aria-hidden="true" /> All presenters
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-cream py-16 md:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Link to="/radio/presenters" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-brand-olive hover:underline">
          <ArrowLeft size={16} aria-hidden="true" /> All presenters
        </Link>

        <header className="rounded-[32px] bg-brand-ink p-8 text-brand-cream md:p-12">
          <div className="flex flex-wrap items-center gap-6">
            {presenter.photoUrl ? (
              <img src={presenter.photoUrl} alt="" className="h-28 w-28 rounded-full object-cover" />
            ) : (
              <span className="flex h-28 w-28 items-center justify-center rounded-full bg-brand-cream/10">
                <Mic2 size={34} aria-hidden="true" />
              </span>
            )}
            <div>
              <h1 className="font-serif text-4xl md:text-5xl">{presenter.name}</h1>
              <p className="mt-2 text-sm font-bold uppercase tracking-[0.2em] text-brand-cream/60">
                {ROLE_LABELS[presenter.presenterRole] ?? presenter.presenterRole}
              </p>
            </div>
          </div>
          {presenter.intro && <p className="mt-6 text-lg text-brand-cream/75">{presenter.intro}</p>}
        </header>

        {presenter.bio && (
          <section className="mt-8 rounded-[32px] border border-brand-olive/5 bg-white p-8">
            <h2 className="font-serif text-2xl">Biography</h2>
            <p className="mt-4 whitespace-pre-line leading-relaxed text-brand-ink/75">{presenter.bio}</p>
            <SocialLinks links={presenter.socialLinks} />
            {presenter.contactEmail && (
              <a
                href={`mailto:${presenter.contactEmail}`}
                className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-brand-olive hover:underline"
              >
                <Mail size={14} aria-hidden="true" /> {presenter.contactEmail}
              </a>
            )}
          </section>
        )}

        <section className="mt-8 rounded-[32px] border border-brand-olive/5 bg-white p-8">
          <h2 className="mb-6 font-serif text-2xl">Shows presented</h2>
          {programmes.length === 0 ? (
            <ContentSlot kind="programme" hint="Programmes assigned to this presenter will be listed here." compact />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {programmes.map((programme) => (
                <li key={programme.id}>
                  <Link
                    to={programme.slug ? `/radio/shows/${programme.slug}` : '#'}
                    className="block rounded-2xl bg-brand-cream p-5 transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-olive"
                  >
                    <p className="font-bold">{programme.title}</p>
                    {programme.category && (
                      <p className="mt-0.5 text-sm text-brand-ink/50">{programme.category}</p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {presenter.availability && (
          <section className="mt-8 rounded-[32px] border border-brand-olive/5 bg-white p-8">
            <h2 className="font-serif text-2xl">Availability</h2>
            <p className="mt-3 text-brand-ink/70">{presenter.availability}</p>
          </section>
        )}
      </div>
    </div>
  );
};
