import React, { useMemo, useState } from 'react';
import { Check, ClipboardList, Clock3, Mic2, Radio, ShieldAlert, Wifi } from 'lucide-react';
import { buildMonthSchedule, ScheduleEntry } from '../../data/radioSchedule';

const key = (id: string) => `fth-run-${id}`;

const stepsFor = (entry: ScheduleEntry) => {
  if (entry.outsideBroadcast) return [
    'Venue/event confirmed',
    'Laptop / phone charged and headphones packed',
    'Microphone checked',
    'Internet/mobile signal checked',
    'BUTT connection tested before going live',
    'Opening line ready',
    'Photos / short video / notes captured',
    'Stop BUTT at the end and confirm automation has returned',
  ];
  if (entry.kind === 'partner') return [
    'Confirm authorised source/feed is available',
    'Check scheduled start and end time',
    'Check previous item finishes cleanly',
    'Confirm next FTH/local slot is ready',
  ];
  return [
    'Playlist/feature audio ready',
    'Jingles and station IDs in the correct positions',
    'Approved local advertising/events ready if scheduled',
    'Check total running time',
    'Save the slot as READY',
  ];
};

export const RadioRunSheet: React.FC = () => {
  const schedule = useMemo(() => buildMonthSchedule(2026, 9), []);
  const [date, setDate] = useState('2026-09-01');
  const [selectedId, setSelectedId] = useState(schedule[0]?.id || '');
  const [done, setDone] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('fth-radio-run-sheet') || '{}'); } catch { return {}; }
  });
  const dayEntries = schedule.filter(x => x.date === date);
  const selected = dayEntries.find(x => x.id === selectedId) || dayEntries[0];
  const steps = selected ? stepsFor(selected) : [];
  const setStep = (index: number) => setDone(current => {
    const next = { ...current, [key(`${selected.id}-${index}`)]: !current[key(`${selected.id}-${index}`)] };
    localStorage.setItem('fth-radio-run-sheet', JSON.stringify(next));
    return next;
  });
  const completed = steps.filter((_, i) => done[key(`${selected?.id}-${i}`)]).length;

  return <section className="rounded-[28px] bg-white border border-brand-olive/10 p-6 md:p-8 space-y-6">
    <div className="flex items-start gap-3"><ClipboardList className="text-brand-olive mt-1" /><div><h2 className="text-2xl font-serif">Live run sheet</h2><p className="text-sm text-brand-ink/55 mt-1">This is the checklist you work through for a real broadcast slot. It is deliberately separate from the public programme schedule.</p></div></div>
    <div className="grid lg:grid-cols-[240px_1fr] gap-5">
      <div className="rounded-2xl bg-brand-cream p-4"><label className="text-xs font-bold uppercase tracking-widest text-brand-ink/45">Broadcast date</label><select value={date} onChange={e => { setDate(e.target.value); setSelectedId(''); }} className="mt-2 w-full rounded-xl border-0 bg-white p-3 font-bold">{Array.from(new Set(schedule.map(x => x.date))).map(d => <option key={d} value={d}>{new Date(`${d}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</option>)}</select><div className="mt-5 space-y-1 max-h-[440px] overflow-y-auto">{dayEntries.map(item => <button key={item.id} onClick={() => setSelectedId(item.id)} className={`w-full text-left rounded-xl p-3 ${selected?.id === item.id ? 'bg-brand-olive text-white' : 'bg-white'}`}><div className="text-xs opacity-60">{item.start}–{item.end}</div><div className="font-bold text-sm mt-0.5">{item.title}</div></button>)}</div></div>
      {selected && <div className="space-y-5">
        <div className="rounded-2xl bg-brand-ink text-brand-cream p-5"><div className="flex flex-wrap gap-2 items-center text-xs font-bold uppercase tracking-widest"><Clock3 size={14} /> {selected.start}–{selected.end} <span className="opacity-40">•</span> {selected.kind}{selected.outsideBroadcast && <><span className="opacity-40">•</span><span>OUTSIDE BROADCAST</span></>}</div><h3 className="text-2xl font-serif mt-2">{selected.title}</h3><p className="text-sm text-brand-cream/60 mt-1">{selected.description}</p></div>
        <div className="grid md:grid-cols-3 gap-3"><div className="rounded-2xl bg-brand-cream p-4"><Radio size={18} className="text-brand-olive" /><div className="font-bold mt-2">Automation</div><div className="text-xs text-brand-ink/55 mt-1">RadioDJ / Live365 ready</div></div><div className="rounded-2xl bg-brand-cream p-4"><Wifi size={18} className="text-brand-olive" /><div className="font-bold mt-2">Connection</div><div className="text-xs text-brand-ink/55 mt-1">Confirm listener stream</div></div><div className="rounded-2xl bg-brand-cream p-4"><Mic2 size={18} className="text-brand-olive" /><div className="font-bold mt-2">Live mic</div><div className="text-xs text-brand-ink/55 mt-1">{selected.outsideBroadcast ? 'BUTT / field mic' : 'Studio only if required'}</div></div></div>
        <div><div className="flex justify-between items-end mb-3"><div><h4 className="font-bold">Before you call this slot READY</h4><p className="text-xs text-brand-ink/45 mt-1">{completed} of {steps.length} checks complete</p></div></div><div className="space-y-2">{steps.map((step, i) => <button key={step} onClick={() => setStep(i)} className="w-full text-left rounded-2xl border border-brand-olive/10 bg-brand-cream/50 hover:bg-brand-cream p-4 flex items-center gap-3"><span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${done[key(`${selected.id}-${i}`)] ? 'bg-brand-olive text-white' : 'bg-white border border-brand-olive/20'}`}>{done[key(`${selected.id}-${i}`)] && <Check size={16} />}</span><span className="text-sm font-medium">{step}</span></button>)}</div></div>
        {selected.outsideBroadcast && <div className="rounded-2xl bg-orange-50 border border-orange-200 p-4 flex gap-3"><ShieldAlert className="text-orange-600 shrink-0" /><div><strong className="text-orange-950">If the live connection fails</strong><p className="text-sm text-orange-900/70 mt-1">Do not chase settings while under pressure. Switch to Record-Only, capture the material, and make a note for Mike. The recording can be turned into a programme feature afterwards.</p></div></div>}
      </div>}
    </div>
  </section>;
};
