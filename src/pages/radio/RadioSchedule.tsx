// Daily and weekly schedule (spec §5, §6).

import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, LayoutGrid, List } from 'lucide-react';

import { DaySchedule, WeekGrid } from '../../components/radio/ScheduleViews';
import { useRadioPlayer } from '../../context/RadioPlayerContext';
import { addDays, startOfWeek, toIsoDate } from '../../services/radio/scheduleEngine';
import { getDaySchedule, getWeekSchedule } from '../../services/radio/stationService';
import type { ScheduleSlot } from '../../services/radio/types';

type View = 'day' | 'week';

const longDate = (date: Date) =>
  new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date);

const weekLabel = (start: Date) => {
  const end = addDays(start, 6);
  const sameMonth = start.getMonth() === end.getMonth();
  const startPart = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: sameMonth ? undefined : 'short',
  }).format(start);
  const endPart = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(end);
  return `${startPart} – ${endPart}`;
};

export const RadioSchedule: React.FC = () => {
  const { schedule } = useRadioPlayer();
  const [view, setView] = useState<View>('day');
  const [anchor, setAnchor] = useState(() => new Date());
  const [daySlots, setDaySlots] = useState<ScheduleSlot[]>([]);
  const [weekDays, setWeekDays] = useState<{ date: Date; isoDate: string; slots: ScheduleSlot[] }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentSlotKey = schedule.current?.key ?? null;
  const weekStart = useMemo(() => startOfWeek(anchor), [anchor]);
  const isToday = toIsoDate(anchor) === toIsoDate(new Date());

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    const load = view === 'day'
      ? getDaySchedule(anchor).then((slots) => { if (!cancelled) setDaySlots(slots); })
      : getWeekSchedule(anchor).then((days) => { if (!cancelled) setWeekDays(days); });

    load
      .then(() => { if (!cancelled) setError(null); })
      .catch((err) => {
        console.error('Radio schedule:', err);
        if (!cancelled) setError('The schedule is temporarily unavailable.');
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [view, anchor]);

  const step = (direction: -1 | 1) =>
    setAnchor((current) => addDays(current, view === 'day' ? direction : direction * 7));

  return (
    <div className="min-h-screen bg-brand-cream py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-10">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-brand-olive">
            Farmers Table Hub Community Radio
          </p>
          <h1 className="font-serif text-5xl md:text-6xl">Schedule</h1>
          <p className="mt-4 max-w-3xl text-lg text-brand-ink/70">
            Every programme, generated from the station&rsquo;s own schedule rules. Special broadcasts
            replace the normal schedule while they are on, and the regular programmes return
            automatically afterwards.
          </p>
        </header>

        {/* --- Controls --- */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div
            role="group"
            aria-label="Schedule view"
            className="inline-flex rounded-full border border-brand-olive/15 bg-white p-1"
          >
            {([['day', 'Day', List], ['week', 'Week', LayoutGrid]] as const).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                onClick={() => setView(value)}
                aria-pressed={view === value}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full px-5 py-2 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-olive ${
                  view === value ? 'bg-brand-olive text-white' : 'text-brand-ink/60'
                }`}
              >
                <Icon size={16} aria-hidden="true" /> {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label={view === 'day' ? 'Previous day' : 'Previous week'}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-brand-olive/15 bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-olive"
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <p aria-live="polite" className="min-w-56 text-center font-bold">
              {view === 'day' ? longDate(anchor) : weekLabel(weekStart)}
            </p>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label={view === 'day' ? 'Next day' : 'Next week'}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-brand-olive/15 bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-olive"
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
            {!isToday && (
              <button
                type="button"
                onClick={() => setAnchor(new Date())}
                className="ml-1 inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-ink px-5 py-2 text-sm font-bold text-brand-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink"
              >
                <CalendarDays size={16} aria-hidden="true" /> Today
              </button>
            )}
          </div>
        </div>

        {/* --- Schedule --- */}
        <section className="rounded-[32px] border border-brand-olive/5 bg-white p-6 md:p-8">
          {error ? (
            <p role="alert" className="text-brand-ink/60">{error}</p>
          ) : isLoading ? (
            <p className="text-brand-ink/50">Loading the schedule…</p>
          ) : view === 'day' ? (
            <DaySchedule slots={daySlots} currentSlotKey={currentSlotKey} />
          ) : (
            <WeekGrid days={weekDays} currentSlotKey={currentSlotKey} />
          )}
        </section>
      </div>
    </div>
  );
};
