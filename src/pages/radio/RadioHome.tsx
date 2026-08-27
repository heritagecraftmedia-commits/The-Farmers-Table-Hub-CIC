// Radio landing page (spec §3).

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, CalendarDays, Headphones, Megaphone, Mic2, Music, Radio as RadioIcon,
  Star, Users,
} from 'lucide-react';

import { RadioPlayer } from '../../components/radio/RadioPlayer';
import { ContentSlot } from '../../components/radio/ContentSlot';
import { DaySchedule } from '../../components/radio/ScheduleViews';
import { useRadioPlayer } from '../../context/RadioPlayerContext';
import {
  getDaySchedule, getEventsOnAirThisWeek, getFeaturedProgramme,
  getPublishedAnnouncements, getPublishedPresenters,
} from '../../services/radio/stationService';
import type {
  PromotedEvent, RadioAnnouncement, RadioPresenter, RadioProgramme, ScheduleSlot,
} from '../../services/radio/types';

const HERO_ACTIONS = [
  { to: '/radio#listen', label: 'Listen live', icon: Headphones },
  { to: '/radio/schedule', label: "Today's schedule", icon: CalendarDays },
  { to: '/radio/shows', label: 'Our shows', icon: RadioIcon },
  { to: '/radio/get-involved', label: 'Get involved', icon: Users },
];

const SectionHeading: React.FC<{
  icon: React.ElementType; title: string; description?: string; action?: React.ReactNode;
}> = ({ icon: Icon, title, description, action }) => (
  <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
    <div>
      <h2 className="flex items-center gap-3 font-serif text-3xl">
        <Icon className="text-brand-olive" aria-hidden="true" /> {title}
      </h2>
      {description && <p className="mt-2 max-w-2xl text-brand-ink/60">{description}</p>}
    </div>
    {action}
  </div>
);

const formatEventDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
    : 'Date to be confirmed';

export const RadioHome: React.FC = () => {
  const { station, schedule } = useRadioPlayer();

  const [today, setToday] = useState<ScheduleSlot[]>([]);
  const [featured, setFeatured] = useState<RadioProgramme | null>(null);
  const [announcements, setAnnouncements] = useState<RadioAnnouncement[]>([]);
  const [events, setEvents] = useState<PromotedEvent[]>([]);
  const [presenters, setPresenters] = useState<RadioPresenter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getDaySchedule(new Date()),
      getFeaturedProgramme(),
      getPublishedAnnouncements(6),
      getEventsOnAirThisWeek(6),
      getPublishedPresenters(),
    ])
      .then(([slots, featuredProgramme, notices, promotedEvents, people]) => {
        if (cancelled) return;
        setToday(slots);
        setFeatured(featuredProgramme);
        setAnnouncements(notices);
        setEvents(promotedEvents);
        setPresenters(people);
      })
      .catch((error) => console.error('Radio home:', error))
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const tagline = station?.tagline
    ?? 'Connecting Communities · Celebrating Local Talent · Rooted in Rural Life';

  return (
    <div className="min-h-screen bg-brand-cream py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* ---------- HERO ---------- */}
        <header className="mb-12">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-brand-olive">
            Farmers Table Hub CIC
          </p>
          <h1 className="mb-5 font-serif text-5xl md:text-7xl">
            {station?.name ?? 'Farmers Table Hub Community Radio'}
          </h1>
          <p className="max-w-3xl text-xl text-brand-ink/70">{tagline}</p>

          <nav aria-label="Radio sections" className="mt-8 flex flex-wrap gap-3">
            {HERO_ACTIONS.map(({ to, label, icon: Icon }) => (
              <Link
                key={label}
                to={to}
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-brand-ink px-6 py-3 font-bold text-brand-cream transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink"
              >
                <Icon size={18} aria-hidden="true" /> {label}
              </Link>
            ))}
          </nav>
        </header>

        {/* ---------- NOW PLAYING ---------- */}
        <div id="listen" className="scroll-mt-24">
          <RadioPlayer />
        </div>

        {/* ---------- TODAY ON AIR ---------- */}
        <section className="mt-12 rounded-[32px] border border-brand-olive/5 bg-white p-8 md:p-10">
          <SectionHeading
            icon={CalendarDays}
            title="Today on air"
            description="The full running order for today, straight from the station schedule."
            action={
              <Link to="/radio/schedule" className="inline-flex items-center gap-2 font-bold text-brand-olive hover:underline">
                Full schedule <ArrowRight size={16} aria-hidden="true" />
              </Link>
            }
          />
          {isLoading
            ? <p className="text-brand-ink/50">Loading today&rsquo;s schedule…</p>
            : <DaySchedule slots={today} currentSlotKey={schedule.current?.key ?? null} />}
        </section>

        {/* ---------- FEATURED SHOW ---------- */}
        <section className="mt-12">
          <SectionHeading
            icon={Star}
            title="Featured show"
            description="Chosen by the station team."
          />
          {featured ? (
            <article className="grid gap-8 overflow-hidden rounded-[32px] bg-brand-olive text-white md:grid-cols-[2fr_3fr]">
              {featured.imageUrl ? (
                <img src={featured.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className="flex min-h-48 items-center justify-center bg-white/5">
                  <RadioIcon size={48} className="text-white/30" aria-hidden="true" />
                </div>
              )}
              <div className="p-8 md:p-10">
                <h3 className="font-serif text-3xl">{featured.title}</h3>
                {(featured.presenter?.name || featured.host) && (
                  <p className="mt-2 text-white/70">
                    with {featured.presenter?.name ?? featured.host}
                  </p>
                )}
                {featured.description && (
                  <p className="mt-4 leading-relaxed text-white/80">{featured.description}</p>
                )}
                {featured.slug && (
                  <Link
                    to={`/radio/shows/${featured.slug}`}
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-bold text-brand-olive focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    About this programme <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                )}
              </div>
            </article>
          ) : (
            <ContentSlot
              kind="programme"
              hint="No programme has been featured yet. Mark a published programme as featured in the Radio Control Centre and it will appear here."
            />
          )}
        </section>

        {/* ---------- COMMUNITY NOTICEBOARD ---------- */}
        <section className="mt-12 rounded-[32px] border border-brand-olive/5 bg-white p-8 md:p-10">
          <SectionHeading
            icon={Megaphone}
            title="Community noticeboard"
            description="Local notices and events flagged for the radio, pulled from the Farmers Table Hub events system."
          />

          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-brand-ink/50">
                Announcements
              </h3>
              {announcements.length === 0 ? (
                <ContentSlot
                  kind="announcement"
                  hint="Community announcements published in the Radio Control Centre appear here."
                  compact
                />
              ) : (
                <ul className="space-y-3">
                  {announcements.map((announcement) => (
                    <li key={announcement.id} className="rounded-2xl bg-brand-cream p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold">{announcement.title}</p>
                        {(announcement.priority === 'urgent' || announcement.priority === 'high') && (
                          <span className="rounded-full bg-brand-olive px-2 py-0.5 text-[11px] font-bold uppercase text-white">
                            {announcement.priority}
                          </span>
                        )}
                      </div>
                      {announcement.organisationName && (
                        <p className="mt-0.5 text-sm text-brand-ink/50">{announcement.organisationName}</p>
                      )}
                      <p className="mt-2 text-sm leading-relaxed text-brand-ink/70">{announcement.content}</p>
                      {announcement.website && (
                        <a
                          href={announcement.website}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-block text-sm font-bold text-brand-olive hover:underline"
                        >
                          More information
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-brand-ink/50">
                On air this week
              </h3>
              {events.length === 0 ? (
                <ContentSlot
                  kind="event"
                  hint="Events flagged for radio promotion in the control centre appear here. They link to the existing events directory rather than being re-entered."
                  compact
                />
              ) : (
                <ul className="space-y-3">
                  {events.map((event) => (
                    <li key={event.eventId} className="rounded-2xl bg-brand-cream p-5">
                      <p className="font-bold">{event.title}</p>
                      <p className="mt-0.5 text-sm text-brand-ink/50">
                        {formatEventDate(event.startDate)}
                        {event.venue ? ` · ${event.venue}` : ''}
                      </p>
                      {event.description && (
                        <p className="mt-2 line-clamp-3 text-sm text-brand-ink/70">{event.description}</p>
                      )}
                      {event.websiteUrl && (
                        <a
                          href={event.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-block text-sm font-bold text-brand-olive hover:underline"
                        >
                          Event details
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <Link to="/whats-on" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-brand-olive hover:underline">
                All local events <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* ---------- LOCAL VOICES ---------- */}
        <section className="mt-12">
          <SectionHeading
            icon={Mic2}
            title="Local voices"
            description="The presenters, community organisations, musicians, producers, farmers, makers and volunteers behind the station."
            action={
              <Link to="/radio/presenters" className="inline-flex items-center gap-2 font-bold text-brand-olive hover:underline">
                All presenters <ArrowRight size={16} aria-hidden="true" />
              </Link>
            }
          />
          {presenters.length === 0 ? (
            <ContentSlot
              kind="presenter"
              hint="Presenter profiles published in the Radio Control Centre appear here. No presenters are invented for this page."
            />
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {presenters.slice(0, 8).map((presenter) => (
                <li key={presenter.id}>
                  <Link
                    to={`/radio/presenters/${presenter.slug}`}
                    className="block rounded-[28px] border border-brand-olive/5 bg-white p-6 transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-olive"
                  >
                    {presenter.photoUrl ? (
                      <img src={presenter.photoUrl} alt="" className="mb-4 h-20 w-20 rounded-full object-cover" loading="lazy" />
                    ) : (
                      <span className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-brand-cream">
                        <Mic2 size={24} className="text-brand-olive" aria-hidden="true" />
                      </span>
                    )}
                    <p className="font-bold">{presenter.name}</p>
                    {presenter.intro && (
                      <p className="mt-1 line-clamp-2 text-sm text-brand-ink/60">{presenter.intro}</p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ---------- GET INVOLVED ---------- */}
        <section className="mt-12 rounded-[32px] bg-brand-ink p-8 text-brand-cream md:p-12">
          <h2 className="flex items-center gap-3 font-serif text-3xl">
            <Music className="text-brand-cream/60" aria-hidden="true" /> Get involved
          </h2>
          <p className="mt-3 max-w-3xl text-brand-cream/70">
            The station is built by the community it serves. Every one of these goes to a real person
            for review — nothing is published automatically.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Become a presenter', to: '/radio/get-involved?type=presenter' },
              { label: 'Submit music', to: '/radio/get-involved?type=music' },
              { label: 'Submit an announcement', to: '/radio/get-involved?type=announcement' },
              { label: 'Submit an event', to: '/radio/get-involved?type=event' },
              { label: 'Propose a programme', to: '/radio/get-involved?type=programme_idea' },
              { label: 'Sponsor a programme', to: '/radio/advertise' },
              { label: 'Advertise with us', to: '/radio/advertise' },
              { label: 'Volunteer', to: '/volunteer' },
            ].map(({ label, to }) => (
              <Link
                key={label}
                to={to}
                className="inline-flex min-h-14 items-center justify-between gap-2 rounded-2xl border border-brand-cream/15 px-5 py-4 text-sm font-bold transition hover:bg-brand-cream/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cream"
              >
                {label} <ArrowRight size={16} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
