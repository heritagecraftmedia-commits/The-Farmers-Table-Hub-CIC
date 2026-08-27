// Daily schedule and weekly grid (spec §5, §6).

import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Radio as RadioIcon } from 'lucide-react';

import { ContentSlot } from './ContentSlot';
import { DAY_NAMES_SHORT, toIsoDate } from '../../services/radio/scheduleEngine';
import type { ScheduleSlot } from '../../services/radio/types';

const slotLink = (slot: ScheduleSlot): string | null =>
  slot.programme?.slug ? `/radio/shows/${slot.programme.slug}` : null;

const SlotBody: React.FC<{ slot: ScheduleSlot; showPresenter?: boolean }> = ({ slot, showPresenter = true }) => {
  const presenter = slot.programme?.presenter?.name ?? slot.programme?.host ?? null;
  return (
    <>
      <p className="font-bold leading-snug">{slot.title}</p>
      {showPresenter && presenter && (
        <p className="mt-0.5 text-sm text-brand-ink/55">with {presenter}</p>
      )}
      {slot.isOverride && (
        <p className="mt-1 inline-block rounded-full bg-brand-olive/10 px-2 py-0.5 text-[11px] font-bold text-brand-olive">
          Special broadcast
        </p>
      )}
    </>
  );
};

/** The "06:00 — Breakfast" running order for one day (spec §5). */
export const DaySchedule: React.FC<{
  slots: ScheduleSlot[];
  currentSlotKey?: string | null;
  emptyHint?: string;
}> = ({ slots, currentSlotKey, emptyHint }) => {
  if (slots.length === 0) {
    return (
      <ContentSlot
        kind="programme"
        hint={emptyHint ?? 'No programmes are scheduled for this day yet. Add a schedule rule in the Radio Control Centre and it will appear here.'}
      />
    );
  }

  return (
    <ol className="space-y-3">
      {slots.map((slot) => {
        const href = slotLink(slot);
        const isNow = currentSlotKey === slot.key;
        const inner = (
          <div className="flex items-start gap-4">
            <span
              className={`mt-0.5 shrink-0 font-mono text-sm font-bold tabular-nums ${
                isNow ? 'text-brand-olive' : 'text-brand-ink/45'
              }`}
            >
              {slot.startTime}
            </span>
            <div className="min-w-0">
              <SlotBody slot={slot} />
              {isNow && (
                <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-brand-olive">
                  <RadioIcon size={12} aria-hidden="true" /> On air now
                </p>
              )}
            </div>
          </div>
        );

        return (
          <li key={slot.key}>
            {href ? (
              <Link
                to={href}
                className={`block rounded-2xl p-4 transition hover:bg-brand-olive/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-olive ${
                  isNow ? 'bg-brand-olive/[0.07] ring-1 ring-brand-olive/20' : 'bg-white'
                }`}
              >
                {inner}
              </Link>
            ) : (
              <div className={`rounded-2xl p-4 ${isNow ? 'bg-brand-olive/[0.07] ring-1 ring-brand-olive/20' : 'bg-white'}`}>
                {inner}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
};

/**
 * The weekly grid (spec §6).
 *
 * A true CSS grid would misalign whenever days have different slot counts, so
 * each day is its own column list. On narrow screens the columns stack, which
 * keeps it readable on a phone without a horizontal scroll trap.
 */
export const WeekGrid: React.FC<{
  days: { date: Date; isoDate: string; slots: ScheduleSlot[] }[];
  currentSlotKey?: string | null;
}> = ({ days, currentSlotKey }) => {
  const todayIso = toIsoDate(new Date());

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[64rem] grid-cols-7 gap-3">
        {days.map((day) => {
          const isToday = day.isoDate === todayIso;
          return (
            <section
              key={day.isoDate}
              aria-label={day.date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
              className={`rounded-2xl p-3 ${isToday ? 'bg-brand-olive/[0.07] ring-1 ring-brand-olive/20' : 'bg-brand-cream'}`}
            >
              <header className="mb-3 px-1">
                <p className="text-xs font-bold uppercase tracking-wide text-brand-ink/50">
                  {DAY_NAMES_SHORT[day.date.getDay()]}
                </p>
                <p className={`text-lg font-serif ${isToday ? 'text-brand-olive' : ''}`}>
                  {day.date.getDate()}
                  {isToday && <span className="ml-2 text-[11px] font-sans font-bold uppercase">Today</span>}
                </p>
              </header>

              {day.slots.length === 0 ? (
                <p className="rounded-xl border border-dashed border-brand-olive/25 p-3 text-[11px] font-bold text-brand-olive">
                  PROGRAMME SLOT — READY FOR PROGRAMME
                </p>
              ) : (
                <ol className="space-y-2">
                  {day.slots.map((slot) => {
                    const href = slotLink(slot);
                    const isNow = currentSlotKey === slot.key;
                    const body = (
                      <>
                        <span className="flex items-center gap-1 font-mono text-[11px] font-bold tabular-nums text-brand-ink/45">
                          <Clock size={10} aria-hidden="true" />
                          {slot.startTime}
                        </span>
                        <span className="mt-1 block text-sm font-bold leading-snug">{slot.title}</span>
                        {slot.isOverride && (
                          <span className="mt-1 block text-[10px] font-bold uppercase text-brand-olive">
                            Special
                          </span>
                        )}
                      </>
                    );
                    const classes = `block rounded-xl p-2.5 ${
                      isNow ? 'bg-brand-olive text-white' : 'bg-white'
                    }`;
                    return (
                      <li key={slot.key}>
                        {href ? (
                          <Link
                            to={href}
                            className={`${classes} transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-olive`}
                          >
                            {body}
                          </Link>
                        ) : (
                          <div className={classes}>{body}</div>
                        )}
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
};
