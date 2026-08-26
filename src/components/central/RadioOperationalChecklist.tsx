import React, { useMemo, useState } from 'react';
import { CheckCircle2, Circle, ClipboardList } from 'lucide-react';
import { RADIO_OPERATIONAL_CHECKLIST } from '../../data/radioOperationalChecklist';

const KEY = 'farmers-table-radio-operational-checklist-v1';
const load = (): Record<string, boolean> => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };

export const RadioOperationalChecklist: React.FC = () => {
  const [done, setDone] = useState<Record<string, boolean>>(load);
  const [phase, setPhase] = useState<'all' | typeof RADIO_OPERATIONAL_CHECKLIST[number]['phase']>('all');
  const visible = useMemo(() => RADIO_OPERATIONAL_CHECKLIST.filter(item => phase === 'all' || item.phase === phase), [phase]);
  const completed = RADIO_OPERATIONAL_CHECKLIST.filter(item => done[item.id]).length;
  const toggle = (id: string) => setDone(current => { const next = { ...current, [id]: !current[id] }; localStorage.setItem(KEY, JSON.stringify(next)); return next; });
  return <section className="rounded-[28px] bg-white border border-brand-olive/10 p-6 md:p-8">
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
      <div className="flex items-start gap-3"><ClipboardList className="text-brand-olive mt-1" /><div><div className="text-xs uppercase tracking-widest font-bold text-brand-olive">Working checklist</div><h2 className="text-2xl md:text-3xl font-serif mt-1">Build it, test it, write down the headaches</h2><p className="text-sm text-brand-ink/55 mt-2 max-w-3xl">This is deliberately simple. Tick a job when you have actually tested it. Anything that still feels confusing becomes a question for Mike.</p></div></div>
      <div className="rounded-2xl bg-brand-cream px-4 py-3 text-sm"><strong>{completed}/{RADIO_OPERATIONAL_CHECKLIST.length}</strong><span className="text-brand-ink/50"> completed</span></div>
    </div>
    <div className="flex gap-2 overflow-x-auto mt-6 pb-1">{(['all','station','automation','live','outside-broadcast','recovery','mike'] as const).map(value => <button key={value} onClick={() => setPhase(value)} className={`px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap ${phase === value ? 'bg-brand-olive text-white' : 'bg-brand-cream text-brand-ink/60'}`}>{value === 'all' ? 'Everything' : value.replace('-', ' ')}</button>)}</div>
    <div className="grid md:grid-cols-2 gap-3 mt-5">{visible.map(item => <button key={item.id} onClick={() => toggle(item.id)} className={`text-left rounded-2xl p-4 border flex gap-3 items-start transition ${done[item.id] ? 'bg-brand-cream border-brand-olive/20' : 'bg-white border-brand-olive/10 hover:border-brand-olive/25'}`}>{done[item.id] ? <CheckCircle2 className="text-brand-olive shrink-0" /> : <Circle className="text-brand-ink/20 shrink-0" />}<span><strong className={done[item.id] ? 'line-through opacity-60' : ''}>{item.title}</strong><span className="block text-sm text-brand-ink/55 mt-1">{item.action}</span></span></button>)}</div>
  </section>;
};
