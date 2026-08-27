// Schedule resolution (spec §4, §5, §6, §18).
//
// The database stores RULES, not a fixed timetable: recurring patterns, dated
// one-offs, seasonal variants and special broadcasts that temporarily displace
// the normal schedule. This module turns those rules into the concrete slots a
// given calendar day actually has, and puts the normal schedule back
// automatically once a special broadcast has finished.
//
// Everything here is a pure function of its inputs so it can be tested without
// a database or a browser.

import type {
  NowAndNext, RadioProgramme, ScheduleRule, ScheduleSlot, ScheduleType,
} from './types';

/** A special broadcast that can displace the regular schedule. */
export interface SpecialBroadcastWindow {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  programmeId: string | null;
  overridesSchedule: boolean;
  priority: number;
  broadcastType: string;
  notes?: string | null;
}

const MINUTES_PER_DAY = 24 * 60;

/** 'HH:MM' or 'HH:MM:SS' -> minutes since midnight. */
export const toMinutes = (time: string): number => {
  const [h = '0', m = '0'] = time.split(':');
  const hours = Number(h);
  const minutes = Number(m);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0;
  return hours * 60 + minutes;
};

export const toIsoDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/** Parse YYYY-MM-DD as a LOCAL date. `new Date('2026-01-01')` would be UTC. */
export const fromIsoDate = (iso: string): Date => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
};

export const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

/** Monday-first week start, matching how UK schedules are printed. */
export const startOfWeek = (date: Date): Date => {
  const day = date.getDay();            // 0 = Sunday
  const offset = day === 0 ? -6 : 1 - day;
  return addDays(date, offset);
};

const atMinutes = (date: Date, minutes: number): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setMinutes(minutes);
  return result;
};

/** Which occurrence of this weekday is it within the month? 1st Tuesday etc. */
const weekOfMonthFor = (date: Date): number => Math.floor((date.getDate() - 1) / 7) + 1;

const withinWindow = (rule: ScheduleRule, isoDate: string): boolean => {
  if (rule.startsOn && isoDate < rule.startsOn) return false;
  if (rule.endsOn && isoDate > rule.endsOn) return false;
  return true;
};

const wholeDaysBetween = (from: Date, to: Date): number => {
  const a = new Date(from); a.setHours(12, 0, 0, 0);
  const b = new Date(to);   b.setHours(12, 0, 0, 0);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
};

/** Does a recurring rule fire on this calendar date? */
export const ruleAppliesOn = (rule: ScheduleRule, date: Date): boolean => {
  if (!rule.isActive) return false;

  const isoDate = toIsoDate(date);
  if (!withinWindow(rule, isoDate)) return false;

  const dayOfWeek = date.getDay();

  switch (rule.repeatPattern) {
    case 'once':
      return rule.specificDate === isoDate;
    case 'daily':
      return true;
    case 'weekdays':
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case 'weekends':
      return dayOfWeek === 0 || dayOfWeek === 6;
    case 'weekly':
      return rule.dayOfWeek === dayOfWeek;
    case 'fortnightly': {
      if (rule.dayOfWeek !== dayOfWeek) return false;
      // Anchored on startsOn so the alternating weeks are stable.
      if (!rule.startsOn) return true;
      const weeks = Math.floor(wholeDaysBetween(fromIsoDate(rule.startsOn), date) / 7);
      return weeks >= 0 && weeks % 2 === 0;
    }
    case 'monthly':
      return rule.dayOfWeek === dayOfWeek && rule.weekOfMonth === weekOfMonthFor(date);
    default:
      return false;
  }
};

/** Emergency programming beats Christmas beats bank holiday beats special. */
const SCHEDULE_TYPE_RANK: Record<ScheduleType, number> = {
  regular: 0,
  special: 10,
  bank_holiday: 20,
  christmas: 30,
  emergency: 40,
};

interface Candidate {
  slot: ScheduleSlot;
  rank: number;
}

const overlaps = (a: ScheduleSlot, b: ScheduleSlot): boolean =>
  a.startsAt < b.endsAt && b.startsAt < a.endsAt;

const buildSlotFromRule = (
  rule: ScheduleRule,
  date: Date,
  programmes: Map<string, RadioProgramme>,
): ScheduleSlot => {
  const startMinutes = toMinutes(rule.startTime);
  const rawEndMinutes = toMinutes(rule.endTime);
  // An end at or before the start means the programme runs past midnight.
  const crossesMidnight = rawEndMinutes <= startMinutes;
  const endMinutes = crossesMidnight ? rawEndMinutes + MINUTES_PER_DAY : rawEndMinutes;

  const programme = rule.programmeId ? programmes.get(rule.programmeId) ?? null : null;

  return {
    key: `rule:${rule.id}:${toIsoDate(date)}`,
    date: toIsoDate(date),
    startTime: rule.startTime.slice(0, 5),
    endTime: rule.endTime.slice(0, 5),
    startsAt: atMinutes(date, startMinutes),
    endsAt: atMinutes(date, endMinutes),
    programmeId: rule.programmeId,
    programme,
    title: programme?.title ?? 'Programme slot',
    scheduleType: rule.scheduleType,
    source: 'schedule',
    isOverride: false,
    crossesMidnight,
    notes: rule.notes,
  };
};

const buildSlotFromSpecial = (
  special: SpecialBroadcastWindow,
  programmes: Map<string, RadioProgramme>,
): ScheduleSlot | null => {
  const startsAt = new Date(special.startsAt);
  if (Number.isNaN(startsAt.getTime())) return null;

  // A special broadcast with no end time is treated as one hour long so it
  // still appears on the grid instead of swallowing the rest of the day.
  const endsAt = special.endsAt ? new Date(special.endsAt) : new Date(startsAt.getTime() + 3_600_000);
  if (Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) return null;

  const programme = special.programmeId ? programmes.get(special.programmeId) ?? null : null;
  const pad = (n: number) => String(n).padStart(2, '0');

  return {
    key: `special:${special.id}`,
    date: toIsoDate(startsAt),
    startTime: `${pad(startsAt.getHours())}:${pad(startsAt.getMinutes())}`,
    endTime: `${pad(endsAt.getHours())}:${pad(endsAt.getMinutes())}`,
    startsAt,
    endsAt,
    programmeId: special.programmeId,
    programme,
    title: special.title,
    scheduleType: 'special',
    source: 'special-broadcast',
    isOverride: special.overridesSchedule,
    crossesMidnight: toIsoDate(startsAt) !== toIsoDate(endsAt),
    notes: special.notes ?? null,
  };
};

/**
 * Resolve one calendar day into its actual running order.
 *
 * Highest-ranked slots are placed first; anything left that overlaps an
 * already-placed slot is displaced. Because this is recomputed per day from
 * the rules, the normal schedule resumes by itself the moment a special
 * broadcast's window has passed (spec §18).
 */
export const resolveDay = (
  date: Date,
  rules: ScheduleRule[],
  specials: SpecialBroadcastWindow[],
  programmes: Map<string, RadioProgramme>,
): ScheduleSlot[] => {
  const isoDate = toIsoDate(date);
  const candidates: Candidate[] = [];

  for (const rule of rules) {
    if (!ruleAppliesOn(rule, date)) continue;
    const slot = buildSlotFromRule(rule, date, programmes);
    candidates.push({
      slot,
      rank: SCHEDULE_TYPE_RANK[rule.scheduleType] * 1000 + rule.priority,
    });
  }

  for (const special of specials) {
    const slot = buildSlotFromSpecial(special, programmes);
    if (!slot) continue;
    // Keep it if any part of the broadcast lands on this day.
    const dayStart = atMinutes(date, 0);
    const dayEnd = atMinutes(date, MINUTES_PER_DAY);
    if (!(slot.startsAt < dayEnd && dayStart < slot.endsAt)) continue;
    candidates.push({
      slot,
      // An overriding broadcast outranks everything and displaces the regular
      // schedule. A non-overriding one is ranked BELOW the regular schedule so
      // it only ever fills a gap rather than pushing a programme off air.
      rank: special.overridesSchedule
        ? 100_000 + special.priority
        : -100_000 + special.priority,
    });
  }

  candidates.sort((a, b) => (b.rank - a.rank) || (a.slot.startsAt.getTime() - b.slot.startsAt.getTime()));

  const placed: ScheduleSlot[] = [];
  for (const candidate of candidates) {
    const displaces = placed.some((existing) => overlaps(existing, candidate.slot));
    if (displaces) continue;
    placed.push(candidate.slot);
  }

  // Flag the winners that actually pushed something else out.
  const displacedSomething = new Set<string>();
  for (const candidate of candidates) {
    for (const winner of placed) {
      if (winner.key !== candidate.slot.key && overlaps(winner, candidate.slot)) {
        displacedSomething.add(winner.key);
      }
    }
  }

  return placed
    .map((slot) => ({
      ...slot,
      isOverride: slot.isOverride || displacedSomething.has(slot.key),
      date: isoDate,
    }))
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
};

/** Seven resolved days starting from `weekStart`. */
export const resolveWeek = (
  weekStart: Date,
  rules: ScheduleRule[],
  specials: SpecialBroadcastWindow[],
  programmes: Map<string, RadioProgramme>,
): { date: Date; isoDate: string; slots: ScheduleSlot[] }[] =>
  Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index);
    return { date, isoDate: toIsoDate(date), slots: resolveDay(date, rules, specials, programmes) };
  });

/**
 * What is on air right now, and what follows.
 *
 * Yesterday and tomorrow are resolved too, so a programme that runs across
 * midnight is still reported as the current programme at 00:30.
 */
export const resolveNowAndNext = (
  at: Date,
  rules: ScheduleRule[],
  specials: SpecialBroadcastWindow[],
  programmes: Map<string, RadioProgramme>,
): NowAndNext => {
  const slots = [-1, 0, 1]
    .flatMap((offset) => resolveDay(addDays(at, offset), rules, specials, programmes))
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

  const current = slots.find((slot) => slot.startsAt <= at && at < slot.endsAt) ?? null;
  const next = slots.find((slot) => slot.startsAt > at) ?? null;

  return { current, next };
};

/** Collapse a day into the compact "06:00 — Breakfast" list of spec §5. */
export const formatSlotLabel = (slot: ScheduleSlot): string =>
  `${slot.startTime} — ${slot.title}`;

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
