// Radio Control Centre (spec §21).
//
// The station's working control room, organised into the sections the station
// actually needs: live status, today, content, people, community, archive and
// system. The existing studio tools (run sheet, checklist, library, recipes,
// month planner) are kept and grouped under Studio rather than rebuilt.

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, CalendarClock, ChevronDown, ExternalLink, HelpCircle, LibraryBig,
  Mic2, Radio, Settings, Users, Wifi,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { RadioStudioDashboard } from '../components/central/RadioStudioDashboard';
import { RadioLibraryManager } from '../components/central/RadioLibraryManager';
import { RadioMonthPlanner } from '../components/central/RadioMonthPlanner';
import { RadioBuildRecipes } from '../components/central/RadioBuildRecipes';
import { RadioOperationalChecklist } from '../components/central/RadioOperationalChecklist';
import { RadioRunSheet } from '../components/central/RadioRunSheet';

import { LiveStatusPanel } from '../components/radio/admin/LiveStatusPanel';
import { ProgrammeManager } from '../components/radio/admin/ProgrammeManager';
import { PresenterManager } from '../components/radio/admin/PresenterManager';
import { ScheduleManager } from '../components/radio/admin/ScheduleManager';
import { EpisodeManager } from '../components/radio/admin/EpisodeManager';
import { ImagingManager } from '../components/radio/admin/ImagingManager';
import { AdvertiserManager } from '../components/radio/admin/AdvertiserManager';
import { SponsorshipManager } from '../components/radio/admin/SponsorshipManager';
import { AnnouncementManager } from '../components/radio/admin/AnnouncementManager';
import { SubmissionQueue } from '../components/radio/admin/SubmissionQueue';
import { EventPromotionManager } from '../components/radio/admin/EventPromotionManager';
import { StationSettingsPanel } from '../components/radio/admin/StationSettingsPanel';

const LIVE365_DASHBOARD_URL = 'https://dashboard.live365.com/';

const STAFF_ROLES = ['founder', 'staff', 'radio_manager'];

const TABS = [
  { id: 'live', label: 'Live status', icon: Activity },
  { id: 'schedule', label: 'Schedule', icon: CalendarClock },
  { id: 'content', label: 'Content', icon: LibraryBig },
  { id: 'people', label: 'People', icon: Users },
  { id: 'community', label: 'Community', icon: Mic2 },
  { id: 'studio', label: 'Studio', icon: Radio },
  { id: 'system', label: 'System', icon: Settings },
] as const;

type TabId = (typeof TABS)[number]['id'];

export const RadioControl: React.FC = () => {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<TabId>('live');
  const [showExplain, setShowExplain] = useState(false);

  if (loading) return <div className="min-h-screen p-8">Loading…</div>;

  if (!user || !STAFF_ROLES.includes(user.role ?? '')) {
    return (
      <div className="mx-auto min-h-screen max-w-3xl p-8">
        <h1 className="font-serif text-3xl">Radio Control Centre</h1>
        <p className="mt-3">Staff access is required.</p>
        <Link className="mt-4 inline-block underline" to="/login">Go to staff login</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-7xl space-y-8 p-4 md:p-8">
      <header className="flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-olive">
            <Radio size={15} aria-hidden="true" /> Farmers Table Hub Community Radio
          </p>
          <h1 className="mt-2 font-serif text-3xl md:text-4xl">Radio Control Centre</h1>
          <p className="mt-2 max-w-3xl text-brand-ink/60">
            Prepare the programme here. Live365 handles the station stream and AutoDJ, RadioDJ
            provides studio automation, and BUTT sends live outside-broadcast audio.
          </p>
        </div>
        <a
          href={LIVE365_DASHBOARD_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-brand-ink px-5 py-3 font-bold text-brand-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink"
        >
          Open Live365 <ExternalLink size={16} aria-hidden="true" />
        </a>
      </header>

      {/* --- Section tabs --- */}
      <nav aria-label="Control centre sections" className="flex flex-wrap gap-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            aria-current={tab === id ? 'page' : undefined}
            className={`inline-flex min-h-12 items-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-olive ${
              tab === id ? 'bg-brand-olive text-white' : 'border border-brand-olive/15 bg-white text-brand-ink/70'
            }`}
          >
            <Icon size={16} aria-hidden="true" /> {label}
          </button>
        ))}
      </nav>

      {tab === 'live' && (
        <div className="space-y-8">
          <LiveStatusPanel />
          <RadioOperationalChecklist />
          <RadioRunSheet />
        </div>
      )}

      {tab === 'schedule' && (
        <div className="space-y-8">
          <ScheduleManager />
          <RadioMonthPlanner />
        </div>
      )}

      {tab === 'content' && (
        <div className="space-y-8">
          <ProgrammeManager />
          <EpisodeManager />
          <ImagingManager />
          <AdvertiserManager />
          <SponsorshipManager />
        </div>
      )}

      {tab === 'people' && <PresenterManager />}

      {tab === 'community' && (
        <div className="space-y-8">
          <SubmissionQueue />
          <AnnouncementManager />
          <EventPromotionManager />
        </div>
      )}

      {tab === 'studio' && (
        <div className="space-y-8">
          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-brand-olive/10 bg-white p-5">
              <p className="flex items-center gap-2 font-bold">
                <Radio size={18} className="text-brand-olive" aria-hidden="true" /> 1. Prepare here
              </p>
              <p className="mt-2 text-sm text-brand-ink/60">
                Choose music, jingles, adverts and community audio. Put them in the order you want
                and schedule the month.
              </p>
            </div>
            <div className="rounded-2xl border border-brand-olive/10 bg-white p-5">
              <p className="flex items-center gap-2 font-bold">
                <Wifi size={18} className="text-brand-olive" aria-hidden="true" /> 2. Live365
              </p>
              <p className="mt-2 text-sm text-brand-ink/60">
                Use Live365 for the station stream, AutoDJ and station-level controls.
              </p>
            </div>
            <div className="rounded-2xl border border-brand-olive/10 bg-white p-5">
              <p className="flex items-center gap-2 font-bold">
                <Mic2 size={18} className="text-brand-olive" aria-hidden="true" /> 3. BUTT
              </p>
              <p className="mt-2 text-sm text-brand-ink/60">
                For outside broadcasts, start the prepared BUTT connection and send live audio to
                Live365.
              </p>
            </div>
          </section>

          <section className="overflow-hidden rounded-[28px] border border-brand-olive/10 bg-brand-cream">
            <button
              type="button"
              onClick={() => setShowExplain((value) => !value)}
              aria-expanded={showExplain}
              className="flex w-full items-center justify-between px-6 py-5 text-left"
            >
              <span className="flex items-center gap-3">
                <HelpCircle className="text-brand-olive" aria-hidden="true" />
                <span>
                  <strong>What do I do next?</strong>
                  <span className="block text-sm font-normal text-brand-ink/50">
                    A simple reminder for anyone using the station.
                  </span>
                </span>
              </span>
              <ChevronDown className={`transition-transform ${showExplain ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
            {showExplain && (
              <div className="grid gap-4 px-6 pb-6 text-sm md:grid-cols-4">
                <div className="rounded-2xl bg-white p-4">
                  <strong>1. Add audio</strong>
                  <p className="mt-1 text-brand-ink/60">Put finished music, jingles, adverts and community audio into the library.</p>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <strong>2. Build the slot</strong>
                  <p className="mt-1 text-brand-ink/60">Choose a programme recipe or pick items from the library. Check the mix.</p>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <strong>3. Save ready</strong>
                  <p className="mt-1 text-brand-ink/60">Give the slot a clear name and choose Save ready when it is finished.</p>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <strong>4. Broadcast</strong>
                  <p className="mt-1 text-brand-ink/60">For unattended hours use RadioDJ/Live365 automation. For an outside broadcast use BUTT.</p>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-[28px] border border-brand-olive/10 bg-white p-6 md:p-8">
            <div className="mb-5 flex items-start gap-3">
              <LibraryBig className="mt-1 text-brand-olive" aria-hidden="true" />
              <div>
                <h2 className="font-serif text-2xl">Build the audio library</h2>
                <p className="mt-1 max-w-3xl text-sm text-brand-ink/55">
                  Add real music, station jingles, community notices, interviews, features and
                  approved local advertising. Nothing is invented for broadcast.
                </p>
              </div>
            </div>
            <RadioLibraryManager />
          </section>

          <RadioBuildRecipes />
          <RadioStudioDashboard />
        </div>
      )}

      {tab === 'system' && (
        <div className="space-y-8">
          <StationSettingsPanel />
          <section className="grid gap-6 md:grid-cols-2">
            <div className="rounded-[28px] border border-brand-olive/10 bg-white p-6">
              <h2 className="font-serif text-xl">BUTT live encoder</h2>
              <p className="mt-2 text-sm text-brand-ink/60">
                BUTT runs on the broadcaster&rsquo;s computer and sends live audio to Live365. The
                website deliberately does not pretend it can remotely press BUTT&rsquo;s buttons.
              </p>
              <div className="mt-5 rounded-2xl bg-brand-cream p-4">
                <p className="font-bold">When you are live</p>
                <p className="mt-1 text-sm text-brand-ink/60">
                  Start BUTT, check the connection, then present. Stop BUTT when the live session is
                  finished.
                </p>
              </div>
            </div>
            <div className="rounded-[28px] border border-brand-olive/10 bg-white p-6">
              <h2 className="font-serif text-xl">Where credentials live</h2>
              <p className="mt-2 text-sm text-brand-ink/60">
                Live365 account passwords and API keys are never stored in the website database or
                sent to the browser. Keep them as Supabase project secrets, used only by server-side
                Edge Functions.
              </p>
            </div>
          </section>
        </div>
      )}

      <div className="flex flex-wrap gap-3 border-t border-brand-olive/10 pt-6">
        <Link className="rounded-xl border border-brand-olive/10 bg-white px-4 py-3 font-bold" to="/radio">Public radio page</Link>
        <Link className="rounded-xl border border-brand-olive/10 bg-white px-4 py-3 font-bold" to="/radio/schedule">Public schedule</Link>
        <Link className="rounded-xl border border-brand-olive/10 bg-white px-4 py-3 font-bold" to="/dashboard">Main dashboard</Link>
      </div>
    </div>
  );
};
