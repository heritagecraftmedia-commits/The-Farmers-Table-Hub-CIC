// Run with: npm test
import { test, expect } from 'vitest';

import {
  addDays, fromIsoDate, resolveDay, resolveNowAndNext, resolveWeek,
  ruleAppliesOn, startOfWeek, toIsoDate, toMinutes,
  type SpecialBroadcastWindow,
} from '../scheduleEngine';
import type { RadioProgramme, ScheduleRule } from '../types';

const programme = (id: string, title: string): RadioProgramme => ({
  id, title, slug: null, description: null, intro: null, host: null,
  presenterId: null, category: null, imageUrl: null, colour: null, icon: null,
  frequency: null, scheduleSummary: null, broadcastMode: 'pre-recorded',
  archiveEnabled: true, isFeatured: false, websiteUrl: null, socialLinks: {},
  contentStatus: 'published',
});

const rule = (over: Partial<ScheduleRule> & Pick<ScheduleRule, 'id' | 'startTime' | 'endTime'>): ScheduleRule => ({
  programmeId: null, scheduleType: 'regular', repeatPattern: 'daily',
  dayOfWeek: null, weekOfMonth: null, specificDate: null,
  startsOn: null, endsOn: null, priority: 0, isActive: true, notes: null,
  ...over,
});

const programmes = new Map<string, RadioProgramme>([
  ['p1', programme('p1', 'Breakfast')],
  ['p2', programme('p2', 'Community Hour')],
  ['p3', programme('p3', 'Farmers Market Outside Broadcast')],
]);

// 2026-09-01 is a Tuesday.
const TUE = fromIsoDate('2026-09-01');
const WED = fromIsoDate('2026-09-02');
const SAT = fromIsoDate('2026-09-05');
const SUN = fromIsoDate('2026-09-06');

test('toMinutes handles HH:MM and HH:MM:SS', () => {
  expect(toMinutes('06:00')).toBe(360);
  expect(toMinutes('06:00:00')).toBe(360);
  expect(toMinutes('23:45')).toBe(1425);
});

test('fromIsoDate parses as a local date, not UTC', () => {
  expect(toIsoDate(fromIsoDate('2026-09-01'))).toBe('2026-09-01');
});

test('startOfWeek is Monday-first', () => {
  expect(toIsoDate(startOfWeek(SUN))).toBe('2026-08-31'); // Sunday -> previous Monday
  expect(toIsoDate(startOfWeek(TUE))).toBe('2026-08-31');
});

test('weekday, weekend and weekly patterns fire on the right days', () => {
  const weekdays = rule({ id: 'r', startTime: '06:00', endTime: '07:00', repeatPattern: 'weekdays' });
  expect(ruleAppliesOn(weekdays, TUE)).toBe(true);
  expect(ruleAppliesOn(weekdays, SAT)).toBe(false);

  const weekends = rule({ id: 'r', startTime: '06:00', endTime: '07:00', repeatPattern: 'weekends' });
  expect(ruleAppliesOn(weekends, SAT)).toBe(true);
  expect(ruleAppliesOn(weekends, TUE)).toBe(false);

  const weekly = rule({ id: 'r', startTime: '06:00', endTime: '07:00', repeatPattern: 'weekly', dayOfWeek: 2 });
  expect(ruleAppliesOn(weekly, TUE)).toBe(true);  // Tuesday
  expect(ruleAppliesOn(weekly, WED)).toBe(false);
});

test('one-off rules fire only on their date', () => {
  const once = rule({ id: 'r', startTime: '10:00', endTime: '11:00', repeatPattern: 'once', specificDate: '2026-09-01' });
  expect(ruleAppliesOn(once, TUE)).toBe(true);
  expect(ruleAppliesOn(once, WED)).toBe(false);
});

test('monthly rules fire on the nth weekday of the month', () => {
  // 2026-09-01 is the 1st Tuesday; 2026-09-08 is the 2nd.
  const firstTuesday = rule({
    id: 'r', startTime: '19:00', endTime: '20:00',
    repeatPattern: 'monthly', dayOfWeek: 2, weekOfMonth: 1,
  });
  expect(ruleAppliesOn(firstTuesday, TUE)).toBe(true);
  expect(ruleAppliesOn(firstTuesday, fromIsoDate('2026-09-08'))).toBe(false);
});

test('fortnightly alternates from its anchor date', () => {
  const fortnightly = rule({
    id: 'r', startTime: '19:00', endTime: '20:00',
    repeatPattern: 'fortnightly', dayOfWeek: 2, startsOn: '2026-09-01',
  });
  expect(ruleAppliesOn(fortnightly, fromIsoDate('2026-09-01'))).toBe(true);
  expect(ruleAppliesOn(fortnightly, fromIsoDate('2026-09-08'))).toBe(false);
  expect(ruleAppliesOn(fortnightly, fromIsoDate('2026-09-15'))).toBe(true);
});

test('validity window is respected', () => {
  const seasonal = rule({
    id: 'r', startTime: '06:00', endTime: '07:00', repeatPattern: 'daily',
    startsOn: '2026-09-02', endsOn: '2026-09-03',
  });
  expect(ruleAppliesOn(seasonal, TUE)).toBe(false);
  expect(ruleAppliesOn(seasonal, WED)).toBe(true);
});

test('inactive rules never fire', () => {
  const off = rule({ id: 'r', startTime: '06:00', endTime: '07:00', isActive: false });
  expect(ruleAppliesOn(off, TUE)).toBe(false);
});

test('a day resolves into ordered slots carrying their programme', () => {
  const rules = [
    rule({ id: 'b', startTime: '08:00', endTime: '10:00', programmeId: 'p2' }),
    rule({ id: 'a', startTime: '06:00', endTime: '08:00', programmeId: 'p1' }),
  ];
  const slots = resolveDay(TUE, rules, [], programmes);
  expect(slots.map((s) => s.title)).toEqual(['Breakfast', 'Community Hour']);
  expect(slots[0].startTime).toBe('06:00');
  expect(slots[0].programme?.id).toBe('p1');
});

test('a programme running past midnight gets an end time on the next day', () => {
  const overnight = rule({ id: 'n', startTime: '23:00', endTime: '01:00', programmeId: 'p1' });
  const [slot] = resolveDay(TUE, [overnight], [], programmes);
  expect(slot.crossesMidnight).toBe(true);
  expect(toIsoDate(slot.endsAt)).toBe('2026-09-02');
});

test('a higher priority rule displaces an overlapping regular one', () => {
  const rules = [
    rule({ id: 'regular', startTime: '10:00', endTime: '12:00', programmeId: 'p1' }),
    rule({ id: 'christmas', startTime: '10:00', endTime: '12:00', programmeId: 'p2', scheduleType: 'christmas' }),
  ];
  const slots = resolveDay(TUE, rules, [], programmes);
  expect(slots.length).toBe(1);
  expect(slots[0].title).toBe('Community Hour');
  expect(slots[0].isOverride).toBe(true);
});

test('an ordinary slot that displaced nothing is not flagged as an override', () => {
  const rules = [
    rule({ id: 'a', startTime: '06:00', endTime: '08:00', programmeId: 'p1' }),
    rule({ id: 'b', startTime: '08:00', endTime: '10:00', programmeId: 'p2' }),
  ];
  const slots = resolveDay(TUE, rules, [], programmes);
  expect(slots.length).toBe(2);
  expect(slots.every((s) => s.isOverride === false)).toBe(true);
});

test('emergency programming outranks every other schedule type', () => {
  const rules = [
    rule({ id: 'christmas', startTime: '10:00', endTime: '12:00', programmeId: 'p1', scheduleType: 'christmas' }),
    rule({ id: 'emergency', startTime: '10:00', endTime: '12:00', programmeId: 'p2', scheduleType: 'emergency' }),
  ];
  const slots = resolveDay(TUE, rules, [], programmes);
  expect(slots.length).toBe(1);
  expect(slots[0].scheduleType).toBe('emergency');
});

test('a special broadcast overrides the schedule, and the schedule resumes after it', () => {
  const rules = [
    rule({ id: 'morning', startTime: '09:00', endTime: '10:00', programmeId: 'p1' }),
    rule({ id: 'midday', startTime: '10:00', endTime: '12:00', programmeId: 'p2' }),
    rule({ id: 'afternoon', startTime: '12:00', endTime: '14:00', programmeId: 'p1' }),
  ];
  const specials: SpecialBroadcastWindow[] = [{
    id: 'ob1',
    title: 'Farmers Market Outside Broadcast',
    startsAt: new Date(2026, 8, 1, 10, 0).toISOString(),
    endsAt: new Date(2026, 8, 1, 12, 0).toISOString(),
    programmeId: 'p3',
    overridesSchedule: true,
    priority: 0,
    broadcastType: 'market',
  }];

  const slots = resolveDay(TUE, rules, specials, programmes);
  expect(slots.map((s) => s.title)).toEqual(['Breakfast', 'Farmers Market Outside Broadcast', 'Breakfast']);
  expect(slots[1].source).toBe('special-broadcast');

  // The next day is untouched: the normal schedule is back automatically.
  const nextDay = resolveDay(WED, rules, specials, programmes);
  expect(nextDay.map((s) => s.title)).toEqual(['Breakfast', 'Community Hour', 'Breakfast']);
});

test('a non-overriding special broadcast does not displace a regular programme', () => {
  const rules = [rule({ id: 'midday', startTime: '10:00', endTime: '12:00', programmeId: 'p2' })];
  const specials: SpecialBroadcastWindow[] = [{
    id: 'ob2', title: 'Optional extra', programmeId: null,
    startsAt: new Date(2026, 8, 1, 10, 0).toISOString(),
    endsAt: new Date(2026, 8, 1, 12, 0).toISOString(),
    overridesSchedule: false, priority: 0, broadcastType: 'special',
  }];
  const slots = resolveDay(TUE, rules, specials, programmes);
  expect(slots.length).toBe(1);
  expect(slots[0].title).toBe('Community Hour');
});

test('now and next finds the current programme and the one after it', () => {
  const rules = [
    rule({ id: 'a', startTime: '06:00', endTime: '08:00', programmeId: 'p1' }),
    rule({ id: 'b', startTime: '08:00', endTime: '10:00', programmeId: 'p2' }),
  ];
  const { current, next } = resolveNowAndNext(new Date(2026, 8, 1, 7, 30), rules, [], programmes);
  expect(current?.title).toBe('Breakfast');
  expect(next?.title).toBe('Community Hour');
});

test('now and next reports an overnight programme as current after midnight', () => {
  const rules = [rule({ id: 'n', startTime: '23:00', endTime: '01:00', programmeId: 'p1' })];
  const { current } = resolveNowAndNext(new Date(2026, 8, 2, 0, 30), rules, [], programmes);
  expect(current?.title).toBe('Breakfast');
  expect(current?.date).toBe('2026-09-01');
});

test('now and next returns nulls rather than throwing on an empty schedule', () => {
  const { current, next } = resolveNowAndNext(new Date(2026, 8, 1, 7, 30), [], [], programmes);
  expect(current).toBe(null);
  expect(next).toBe(null);
});

test('a week resolves to seven days starting on the given day', () => {
  const rules = [rule({ id: 'a', startTime: '06:00', endTime: '08:00', programmeId: 'p1', repeatPattern: 'weekdays' })];
  const week = resolveWeek(startOfWeek(TUE), rules, [], programmes);
  expect(week.length).toBe(7);
  expect(week[0].isoDate).toBe('2026-08-31');           // Monday
  expect(week[0].slots.length).toBe(1);                 // weekday -> on
  expect(week[5].slots.length).toBe(0);                 // Saturday -> off
  expect(week[6].slots.length).toBe(0);                 // Sunday -> off
});

test('addDays does not mutate its input', () => {
  const original = fromIsoDate('2026-09-01');
  addDays(original, 5);
  expect(toIsoDate(original)).toBe('2026-09-01');
});
