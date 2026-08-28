// Founder Control Centre overview.
//
// Every figure on this screen comes from src/services/radio/stationService.ts,
// which is the only trustworthy data layer available here: it returns an empty
// result when Supabase is unconfigured or the radio migration has not been
// applied, and THROWS on any other error rather than substituting content.
//
// hubService is deliberately NOT used. Its getStaff/getFounderJobs/getEvents
// silently fall back to invented people and tasks both when unconfigured and on
// error, so any count derived from it could be fiction without saying so.
//
// Anything without a trustworthy source is omitted rather than estimated:
//   * income / revenue      — no financial data source exists in this app
//   * staff and task counts — only available via hubService's mock fallback
//   * recent activity       — there is no audit/activity table
//   * Xero / Notion / HubSpot status — no such integration exists here

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertCircle, CalendarClock, CheckCircle2, Handshake, Inbox, Megaphone,
  Mic2, Radio, RefreshCw, Settings, ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import {
  advertPublishBlockers, getAllAdverts, getAllSponsorships, getDaySchedule,
  getMusicAwaitingLicenceCheck, getNowAndNext, getStation, getStreamConfig,
  getSubmissionQueue, isRadioConfigured,
} from '../../services/radio/stationService';
import type {
  NowAndNext, RadioAdvert, RadioLibraryItem, RadioSponsorship, RadioStation,
  RadioSubmission, ScheduleSlot, StationStreamConfig,
} from '../../services/radio/types';

interface OverviewData {
  nowNext: NowAndNext;
  today: ScheduleSlot[];
  adverts: RadioAdvert[];
  sponsorships: RadioSponsorship[];
  submissions: RadioSubmission[];
  unlicensed: RadioLibraryItem[];
  station: RadioStation | null;
  stream: StationStreamConfig | null;
}

const EXPIRY_WARNING_DAYS = 30;
const isoToday = () => new Date().toISOString().slice(0, 10);

const daysUntil = (date: string | null): number | null => {
  if (!date) return null;
  const diff = new Date(`${date}T00:00:00`).getTime() - new Date(`${isoToday()}T00:00:00`).getTime();
  return Math.round(diff / 86_400_000);
};

const inWindow = (start: string | null, end: string | null): boolean => {
  const today = isoToday();
  if (start && start > today) return false;
  if (end && end < today) return false;
  return true;
};

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-[32px] p-6 md:p-8 border border-brand-olive/5 shadow-sm ${className}`}>
    {children}
  </div>
);

const CardTitle: React.FC<{ icon: React.ElementType; children: React.ReactNode; action?: React.ReactNode }> = ({
  icon: Icon, children, action,
}) => (
  <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
    <h3 className="text-xl font-serif flex items-center gap-2.5">
      <Icon size={19} className="text-brand-olive" aria-hidden="true" /> {children}
    </h3>
    {action}
  </div>
);

const Empty: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="rounded-2xl bg-brand-cream/50 p-4 text-sm text-brand-ink/55">{children}</p>
);

export const CentralOverview: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
  const [data, setData] = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const station = await getStation();
      const [nowNext, today, adverts, sponsorships, submissions, unlicensed, stream] = await Promise.all([
        getNowAndNext(new Date()),
        getDaySchedule(new Date()),
        getAllAdverts(),
        getAllSponsorships(),
        getSubmissionQueue('pending'),
        getMusicAwaitingLicenceCheck(),
        station ? getStreamConfig(station.id) : Promise.resolve(null),
      ]);
      setData({ nowNext, today, adverts, sponsorships, submissions, unlicensed, station, stream });
      setError(null);
    } catch (loadError) {
      // Never fall back to invented content — say the data could not be read.
      console.error('CentralOverview:', loadError);
      setData(null);
      setError('Live data could not be loaded, so nothing is shown rather than showing figures that might be wrong.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const attention = useMemo(() => {
    if (!data) return [];
    const { adverts, sponsorships, submissions, unlicensed } = data;

    const incomplete = adverts.filter((a) => advertPublishBlockers(a).length > 0);
    const draftAdverts = adverts.filter((a) => a.contentStatus === 'draft');
    const expiringSoon = adverts.filter((a) => {
      const left = daysUntil(a.endDate);
      return a.contentStatus === 'published' && a.runState === 'active'
        && left !== null && left >= 0 && left <= EXPIRY_WARNING_DAYS;
    });
    const paused = adverts.filter((a) => a.runState === 'paused');
    const draftSponsorships = sponsorships.filter((s) => !['published', 'live'].includes(s.status));

    return [
      { key: 'submissions', count: submissions.length, label: 'submissions awaiting moderation',
        tab: 'radio', tone: 'high' as const },
      { key: 'draft-adverts', count: draftAdverts.length, label: 'adverts still in draft',
        tab: 'advertisers', tone: 'normal' as const },
      { key: 'incomplete', count: incomplete.length, label: 'adverts missing details needed to publish',
        tab: 'advertisers', tone: 'high' as const },
      { key: 'expiring', count: expiringSoon.length, label: `advert campaigns ending within ${EXPIRY_WARNING_DAYS} days`,
        tab: 'advertisers', tone: 'high' as const },
      { key: 'paused', count: paused.length, label: 'adverts paused',
        tab: 'advertisers', tone: 'normal' as const },
      { key: 'draft-sponsorships', count: draftSponsorships.length, label: 'sponsorships not yet published',
        tab: 'advertisers', tone: 'normal' as const },
      { key: 'licence', count: unlicensed.length, label: 'tracks awaiting a licensing check',
        tab: 'radio', tone: 'normal' as const },
    ].filter((item) => item.count > 0);
  }, [data]);

  const advertStats = useMemo(() => {
    if (!data) return null;
    const { adverts, sponsorships } = data;
    return {
      live: adverts.filter((a) => a.contentStatus === 'published' && a.runState === 'active'
        && inWindow(a.startDate, a.endDate)).length,
      total: adverts.length,
      sponsorshipsLive: sponsorships.filter((s) => ['published', 'live'].includes(s.status)
        && inWindow(s.startDate, s.endDate)).length,
      sponsorshipsTotal: sponsorships.length,
    };
  }, [data]);

  const presentersToday = useMemo(() => {
    if (!data) return [];
    const names = new Map<string, string>();
    for (const slot of data.today) {
      const presenter = slot.programme?.presenter;
      if (presenter) names.set(presenter.id, presenter.name);
      else if (slot.programme?.host) names.set(`host:${slot.programme.host}`, slot.programme.host);
    }
    return [...names.entries()].map(([id, name]) => ({ id, name }));
  }, [data]);

  const go = (tab: string) => { if (onNavigate) onNavigate(tab); };

  if (isLoading) {
    return <div className="py-16 text-center text-brand-ink/50">Loading the control centre…</div>;
  }

  if (error) {
    return (
      <Card>
        <p role="alert" className="flex items-start gap-3 text-brand-ink/75">
          <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} aria-hidden="true" />
          <span>
            <strong className="block">Live data unavailable</strong>
            {error}
          </span>
        </p>
        <button
          type="button"
          onClick={load}
          className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-olive px-5 py-2.5 text-sm font-bold text-white"
        >
          <RefreshCw size={15} aria-hidden="true" /> Try again
        </button>
      </Card>
    );
  }

  const configured = isRadioConfigured();
  const now = data?.nowNext.current ?? null;
  const next = data?.nowNext.next ?? null;

  return (
    <div className="space-y-8">
      {/* ---------- NEEDS ATTENTION ---------- */}
      <Card>
        <CardTitle
          icon={AlertCircle}
          action={
            <button
              type="button"
              onClick={load}
              aria-label="Refresh the control centre"
              className="p-2 rounded-full hover:bg-brand-cream text-brand-ink/40"
            >
              <RefreshCw size={16} aria-hidden="true" />
            </button>
          }
        >
          Needs attention
        </CardTitle>

        {attention.length === 0 ? (
          <p className="flex items-center gap-2.5 rounded-2xl bg-brand-cream/50 p-4 text-sm text-brand-ink/65">
            <CheckCircle2 size={18} className="text-brand-olive shrink-0" aria-hidden="true" />
            Nothing is waiting on you right now.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {attention.map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => go(item.tab)}
                  className="w-full text-left p-4 rounded-2xl bg-brand-cream/40 border border-brand-olive/5 hover:border-brand-olive/25 transition-all flex items-start gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-olive"
                >
                  <span className={`text-2xl font-serif leading-none ${
                    item.tone === 'high' ? 'text-amber-700' : 'text-brand-olive'
                  }`}>
                    {item.count}
                  </span>
                  <span className="text-sm font-bold text-brand-ink/80 pt-1">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ---------- RADIO NOW + TODAY ---------- */}
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardTitle
              icon={Radio}
              action={
                <Link to="/radio/control" className="text-xs font-bold text-brand-olive hover:underline">
                  Radio Control Centre
                </Link>
              }
            >
              Radio now
            </CardTitle>

            {now ? (
              <div className="rounded-2xl bg-brand-ink text-brand-cream p-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-cream/50">On air now</p>
                <p className="text-2xl font-serif mt-1">{now.title}</p>
                <p className="text-sm text-brand-cream/65 mt-1">
                  {now.programme?.presenter?.name ?? now.programme?.host ?? 'Presenter not set'}
                  {' · '}{now.startTime}–{now.endTime}
                </p>
              </div>
            ) : (
              <Empty>No programme currently scheduled.</Empty>
            )}

            <div className="mt-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-ink/40">Next</p>
              {next ? (
                <p className="mt-1">
                  <span className="font-bold">{next.title}</span>
                  <span className="block text-sm text-brand-ink/55">
                    {next.startTime}
                    {next.programme?.presenter?.name ? ` · ${next.programme.presenter.name}` : ''}
                  </span>
                </p>
              ) : (
                <p className="mt-1 text-sm text-brand-ink/55">Nothing scheduled after this.</p>
              )}
            </div>
          </Card>

          <Card>
            <CardTitle icon={CalendarClock}>Today&rsquo;s schedule</CardTitle>
            {(data?.today.length ?? 0) === 0 ? (
              <Empty>
                No programmes are scheduled for today. Slots are set in the Radio Control Centre schedule.
              </Empty>
            ) : (
              <ol className="space-y-5">
                {data!.today.map((slot) => {
                  const isNow = now?.key === slot.key;
                  const isDone = slot.endsAt < new Date();
                  return (
                    <li key={slot.key} className="flex gap-5">
                      <span className="w-14 pt-0.5 text-xs font-bold font-mono text-brand-ink/40 tabular-nums">
                        {slot.startTime}
                      </span>
                      <span className="relative flex flex-col items-center">
                        <span className={`w-3 h-3 rounded-full z-10 ${
                          isNow ? 'bg-brand-olive animate-pulse'
                            : isDone ? 'bg-brand-olive/30'
                            : 'bg-brand-cream border-2 border-brand-olive/20'
                        }`} />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className={`block font-bold ${isDone && !isNow ? 'text-brand-ink/40' : 'text-brand-ink'}`}>
                          {slot.title}
                        </span>
                        <span className="block text-xs text-brand-ink/50 mt-0.5">
                          {slot.programme?.presenter?.name ?? slot.programme?.host ?? 'Presenter not set'}
                          {isNow && <span className="ml-2 font-bold text-brand-olive uppercase">On air</span>}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>
        </div>

        {/* ---------- SIDEBAR ---------- */}
        <div className="space-y-8">
          {/* Advertising & sponsorship */}
          <Card>
            <CardTitle
              icon={Megaphone}
              action={
                <button type="button" onClick={() => go('advertisers')} className="text-xs font-bold text-brand-olive hover:underline">
                  Manage
                </button>
              }
            >
              Advertising
            </CardTitle>
            {advertStats && advertStats.total === 0 && advertStats.sponsorshipsTotal === 0 ? (
              <Empty>No advertisers or sponsorships have been added yet.</Empty>
            ) : (
              <dl className="space-y-3">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-sm text-brand-ink/65">Live advertisers</dt>
                  <dd className="text-2xl font-serif text-brand-olive">{advertStats?.live ?? 0}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-sm text-brand-ink/65">Advertiser records</dt>
                  <dd className="text-lg font-bold text-brand-ink/70">{advertStats?.total ?? 0}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 pt-3 border-t border-brand-olive/5">
                  <dt className="text-sm text-brand-ink/65 flex items-center gap-1.5">
                    <Handshake size={14} className="text-brand-olive/60" aria-hidden="true" /> Live sponsorships
                  </dt>
                  <dd className="text-2xl font-serif text-brand-olive">{advertStats?.sponsorshipsLive ?? 0}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-sm text-brand-ink/65">Sponsorship records</dt>
                  <dd className="text-lg font-bold text-brand-ink/70">{advertStats?.sponsorshipsTotal ?? 0}</dd>
                </div>
              </dl>
            )}
          </Card>

          {/* Presenters on air today */}
          <Card>
            <CardTitle icon={Mic2}>Presenters today</CardTitle>
            {presentersToday.length === 0 ? (
              <Empty>
                No presenters are attached to today&rsquo;s programmes.
              </Empty>
            ) : (
              <ul className="space-y-2">
                {presentersToday.map((presenter) => (
                  <li key={presenter.id} className="flex items-center gap-3 p-3 rounded-xl bg-brand-cream/40">
                    <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0">
                      <Mic2 size={14} className="text-brand-olive" aria-hidden="true" />
                    </span>
                    <span className="text-sm font-bold">{presenter.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* System health — only checks this app can actually perform */}
          <Card>
            <CardTitle icon={ShieldCheck}>System</CardTitle>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center justify-between gap-3">
                <span className="text-brand-ink/65">Database</span>
                <span className={`font-bold ${configured ? 'text-brand-olive' : 'text-amber-700'}`}>
                  {configured ? 'Connected' : 'Not configured'}
                </span>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="text-brand-ink/65">Station record</span>
                <span className={`font-bold ${data?.station ? 'text-brand-olive' : 'text-amber-700'}`}>
                  {data?.station ? 'Found' : 'Not found'}
                </span>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="text-brand-ink/65">Stream</span>
                <span className={`font-bold ${
                  data?.stream?.isStreamEnabled && data?.stream?.streamUrl ? 'text-brand-olive' : 'text-brand-ink/55'
                }`}>
                  {!data?.stream ? 'Not configured'
                    : !data.stream.streamUrl ? 'No stream URL'
                    : data.stream.isStreamEnabled ? 'On air' : 'Off air'}
                </span>
              </li>
            </ul>
            <Link
              to="/radio/control"
              className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-brand-olive hover:underline"
            >
              <Settings size={13} aria-hidden="true" /> Stream configuration
            </Link>
          </Card>

          {/* Moderation shortcut */}
          <Card>
            <CardTitle icon={Inbox}>Moderation</CardTitle>
            <p className="text-3xl font-serif text-brand-olive">{data?.submissions.length ?? 0}</p>
            <p className="text-sm text-brand-ink/60 mt-1">
              {(data?.submissions.length ?? 0) === 1 ? 'submission awaiting review' : 'submissions awaiting review'}
            </p>
            <Link to="/radio/control" className="mt-4 inline-block text-xs font-bold text-brand-olive hover:underline">
              Open the moderation queue
            </Link>
          </Card>
        </div>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-xs text-brand-ink/40 text-center"
      >
        Every figure here is read live from the station database. Sections without a trustworthy data
        source — income, staffing and task counts — are omitted rather than estimated.
      </motion.p>
    </div>
  );
};
