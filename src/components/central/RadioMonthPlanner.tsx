import React, { useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, ChevronDown, ChevronRight, CircleAlert, ClipboardCheck, FileAudio, MapPin, Radio, RefreshCw, Smartphone, Wifi, TriangleAlert } from 'lucide-react';
import { buildMonthSchedule, getMonthLabel, PLACEHOLDERS, ScheduleEntry } from '../../data/radioSchedule';

const STORAGE_KEY = 'farmers-table-radio-month-notes-v1';
const loadNotes = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Record<string, boolean>; } catch { return {}; }
};

const kindClass: Record<ScheduleEntry['kind'], string> = {
  fth: 'bg-brand-cream text-brand-ink',
  partner: 'bg-slate-100 text-slate-700',
  music: 'bg-amber-50 text-amber-900',
  rural: 'bg-emerald-50 text-emerald-900',
  venue: 'bg-violet-50 text-violet-900',
  placeholder: 'bg-orange-50 text-orange-900',
};

const TESTS = [
  { id: 'radio-dj', title: 'RadioDJ studio automation', text: 'Music, playlists, jingles, adverts, programme clocks and scheduled playback.', icon: Radio },
  { id: 'live365', title: 'Live365 connection', text: 'Confirm the station stream is receiving the studio output and the public player hears it.', icon: Wifi },
  { id: 'butt', title: 'BUTT outside broadcast', text: 'Connect a laptop and microphone, go live, then stop and return to automation.', icon: Smartphone },
  { id: 'fallback', title: 'AutoDJ fallback', text: 'Deliberately stop the live encoder and confirm the station keeps going.', icon: RefreshCw },
  { id: 'metadata', title: 'Now playing / metadata', text: 'Confirm artist and title information reaches the listener-facing player.', icon: FileAudio },
  { id: 'recovery', title: 'Brain-fog recovery', text: 'Use the simple emergency route rather than trying to remember technical settings.', icon: ClipboardCheck },
];

export const RadioMonthPlanner: React.FC = () => {
  const today = useMemo(() => new Date(), []);
  // Follow the current month rather than freezing on a fixed one; the
  // template is a shape to plan against, not a dated schedule.
  const schedule = useMemo(() => buildMonthSchedule(today.getFullYear(), today.getMonth() + 1), [today]);
  const [selectedDate, setSelectedDate] = useState('2026-09-01');
  const [notes, setNotes] = useState<Record<string, boolean>>(loadNotes);
  const [showGuide, setShowGuide] = useState(false);
  const [filter, setFilter] = useState<'all' | 'fth' | 'venue' | 'partner'>('all');

  const days = useMemo(() => Array.from(new Set(schedule.map(item => item.date))), [schedule]);
  const selected = schedule.filter(item => item.date === selectedDate).filter(item => filter === 'all' || item.kind === filter);
  const venueCount = schedule.filter(item => item.outsideBroadcast).length;
  const partnerCount = schedule.filter(item => item.kind === 'partner').length;
  const completed = Object.values(notes).filter(Boolean).length;
  const toggle = (id: string) => {
    setNotes(current => {
      const next = { ...current, [id]: !current[id] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  return <section className="space-y-6">
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
      <TriangleAlert className="text-amber-600 shrink-0" size={20} />
      <div>
        <strong className="text-amber-950">Planning template — not the live schedule</strong>
        <p className="text-sm text-amber-900/75 mt-1">
          This is a worked example of a full day&rsquo;s clock, for thinking about shape and coverage.
          Nothing here is a confirmed booking. The station&rsquo;s real schedule lives in the Radio
          Control Centre schedule and is what the public site shows.
        </p>
      </div>
    </div>

    <div className="rounded-[28px] bg-brand-ink text-brand-cream p-6 md:p-8">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-brand-cream/60 text-xs font-bold uppercase tracking-widest"><CalendarDays size={15} /> Full month test schedule</div>
          <h2 className="text-3xl md:text-4xl font-serif mt-2">{getMonthLabel(2026, 9)}</h2>
          <p className="mt-2 max-w-3xl text-brand-cream/65">A real Farmers Table Radio month built from the master broadcast clock. Venue, business and event items remain clearly marked until real material is supplied.</p>
        </div>
        <div className="grid grid-cols-3 gap-2 min-w-[300px]">
          <div className="rounded-2xl bg-white/10 p-4"><div className="text-2xl font-bold">{days.length}</div><div className="text-[11px] text-brand-cream/50">broadcast days</div></div>
          <div className="rounded-2xl bg-white/10 p-4"><div className="text-2xl font-bold">{venueCount}</div><div className="text-[11px] text-brand-cream/50">OB slots</div></div>
          <div className="rounded-2xl bg-white/10 p-4"><div className="text-2xl font-bold">{partnerCount}</div><div className="text-[11px] text-brand-cream/50">partner slots/day</div></div>
        </div>
      </div>
    </div>

    <div className="grid xl:grid-cols-[280px_1fr] gap-6">
      <aside className="bg-white rounded-[28px] border border-brand-olive/10 p-5">
        <h3 className="font-bold">Choose a day</h3>
        <p className="text-xs text-brand-ink/50 mt-1">Click a date to see its complete broadcast clock.</p>
        <div className="mt-4 grid grid-cols-4 xl:grid-cols-2 gap-2 max-h-[620px] overflow-y-auto pr-1">
          {days.map((date, index) => {
            const active = date === selectedDate;
            const hasVenue = schedule.some(item => item.date === date && item.outsideBroadcast);
            return <button key={date} onClick={() => setSelectedDate(date)} className={`rounded-xl px-3 py-2.5 text-left border ${active ? 'bg-brand-olive text-white border-brand-olive' : 'bg-brand-cream border-transparent hover:border-brand-olive/20'}`}>
              <div className="text-[11px] opacity-60">Day {index + 1}</div>
              <div className="font-bold text-sm">{new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
              {hasVenue && <div className={`mt-1 text-[10px] font-bold ${active ? 'text-white/70' : 'text-violet-700'}`}>OUTSIDE BROADCAST</div>}
            </button>;
          })}
        </div>
      </aside>

      <div className="space-y-5">
        <div className="bg-white rounded-[28px] border border-brand-olive/10 p-5 md:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div><h3 className="text-2xl font-serif">{new Date(`${selectedDate}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h3><p className="text-sm text-brand-ink/50 mt-1">Every slot from 05:20 through the overnight handover.</p></div>
            <div className="flex gap-2 overflow-x-auto">
              {(['all', 'fth', 'venue', 'partner'] as const).map(value => <button key={value} onClick={() => setFilter(value)} className={`px-3 py-2 rounded-full text-xs font-bold capitalize whitespace-nowrap ${filter === value ? 'bg-brand-olive text-white' : 'bg-brand-cream text-brand-ink/60'}`}>{value === 'all' ? 'Everything' : value === 'fth' ? 'FTH original' : value === 'venue' ? 'Live venue' : 'Partner feed'}</button>)}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {selected.map((entry) => <div key={entry.id} className="bg-white rounded-2xl border border-brand-olive/10 p-4 md:p-5 flex gap-4 items-start">
            <div className="w-20 shrink-0"><div className="font-bold text-sm">{entry.start}</div><div className="text-[11px] text-brand-ink/40">to {entry.end}</div></div>
            <div className="w-1 self-stretch rounded-full bg-brand-olive/20" />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 items-center"><span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${kindClass[entry.kind]}`}>{entry.kind === 'partner' ? 'Partner feed' : entry.kind}</span>{entry.outsideBroadcast && <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-violet-100 text-violet-800 flex items-center gap-1"><MapPin size={11} /> Outside broadcast</span>}{entry.placeholder && <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-orange-100 text-orange-800">Placement holder</span>}</div>
              <h4 className="font-bold mt-2">{entry.title}</h4>
              <p className="text-sm text-brand-ink/55 mt-1">{entry.description}</p>
              {entry.assetHint && <p className="text-[11px] font-mono text-brand-ink/35 mt-2">Asset: {entry.assetHint}</p>}
            </div>
            {entry.placeholder && <CircleAlert size={18} className="text-orange-500 shrink-0" />}
          </div>)}
        </div>

        <div className="rounded-[28px] bg-orange-50 border border-orange-200 p-5 md:p-6">
          <div className="flex items-start gap-3"><CircleAlert className="text-orange-600 mt-0.5" /><div><h3 className="font-bold text-orange-950">Placement holders — not fake content</h3><p className="text-sm text-orange-900/70 mt-1">These are deliberately empty positions for the real local businesses, adverts, events, jingles and venue confirmations that will be supplied later.</p><div className="grid md:grid-cols-2 gap-2 mt-4 text-xs font-medium text-orange-950"><div>{PLACEHOLDERS.advert}</div><div>{PLACEHOLDERS.jingle}</div><div>{PLACEHOLDERS.event}</div><div>{PLACEHOLDERS.venue}</div></div></div></div>
        </div>
      </div>
    </div>

    <section className="bg-white rounded-[28px] border border-brand-olive/10 p-6 md:p-8">
      <button onClick={() => setShowGuide(value => !value)} className="w-full flex items-center justify-between text-left"><span><span className="text-xs uppercase tracking-widest font-bold text-brand-olive">Mike's call preparation</span><span className="block text-2xl font-serif mt-1">Test the station, then bring the headaches to Mike</span></span>{showGuide ? <ChevronDown /> : <ChevronRight />}</button>
      {showGuide && <div className="mt-6 space-y-3">{TESTS.map(test => { const Icon = test.icon; return <div key={test.id} className="rounded-2xl bg-brand-cream p-4 flex gap-4 items-start"><button onClick={() => toggle(test.id)} className="mt-0.5 shrink-0" aria-label={`Mark ${test.title} complete`}>{notes[test.id] ? <CheckCircle2 className="text-brand-olive" /> : <div className="w-6 h-6 rounded-full border-2 border-brand-olive/25" />}</button><Icon size={20} className="text-brand-olive mt-0.5 shrink-0" /><div><h4 className="font-bold">{test.title}</h4><p className="text-sm text-brand-ink/55 mt-1">{test.text}</p></div></div>; })}<div className="rounded-2xl bg-brand-ink text-brand-cream p-5 mt-4"><p className="text-xs uppercase tracking-widest text-brand-cream/50 font-bold">Progress</p><p className="text-lg font-bold mt-1">{completed} of {TESTS.length} tests marked complete</p><p className="text-sm text-brand-cream/55 mt-1">Use this as your short list for the video call. Anything not complete becomes a question for Mike.</p></div></div>}
    </section>

    <section className="bg-brand-cream rounded-[28px] border border-brand-olive/10 p-6">
      <h3 className="text-xl font-serif">Brain-fog rule</h3>
      <p className="mt-2 text-brand-ink/65">If you are unsure whether an outside visit should be live, choose Record-Only. If a live connection becomes unreliable, stop forcing it and record the material instead. The field guide says the recording can become a later feature.</p>
    </section>
  </section>;
};
