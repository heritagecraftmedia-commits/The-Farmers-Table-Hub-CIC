// Run with: npm run test:radio
import { test } from 'node:test';
import assert from 'node:assert/strict';

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
  assert.equal(toMinutes('06:00'), 360);
  assert.equal(toMinutes('06:00:00'), 360);
  assert.equal(toMinutes('23:45'), 1425);
});

test('fromIsoDate parses as a local date, not UTC', () => {
  assert.equal(toIsoDate(fromIsoDate('2026-09-01')), '2026-09-01');
});

test('startOfWeek is Monday-first', () => {
  assert.equal(toIsoDate(startOfWeek(SUN)), '2026-08-31'); // Sunday -> previous Monday
  assert.equal(toIsoDate(startOfWeek(TUE)), '2026-08-31');
});

test('weekday, weekend and weekly patterns fire on the right days', () => {
  const weekdays = rule({ id: 'r', startTime: '06:00', endTime: '07:00', repeatPattern: 'weekdays' });
  assert.equal(ruleAppliesOn(weekdays, TUE), true);
  assert.equal(ruleAppliesOn(weekdays, SAT), false);

  const weekends = rule({ id: 'r', startTime: '06:00', endTime: '07:00', repeatPattern: 'weekends' });
  assert.equal(ruleAppliesOn(weekends, SAT), true);
  assert.equal(ruleAppliesOn(weekends, TUE), false);

  const weekly = rule({ id: 'r', startTime: '06:00', endTime: '07:00', repeatPattern: 'weekly', dayOfWeek: 2 });
  assert.equal(ruleAppliesOn(weekly, TUE), true);  // Tuesday
  assert.equal(ruleAppliesOn(weekly, WED), false);
});

test('one-off rules fire only on their date', () => {
  const once = rule({ id: 'r', startTime: '10:00', endTime: '11:00', repeatPattern: 'once', specificDate: '2026-09-01' });
  assert.equal(ruleAppliesOn(once, TUE), true);
  assert.equal(ruleAppliesOn(once, WED), false);
});

test('monthly rules fire on the nth weekday of the month', () => {
  // 2026-09-01 is the 1st Tuesday; 2026-09-08 is the 2nd.
  const firstTuesday = rule({
    id: 'r', startTime: '19:00', endTime: '20:00',
    repeatPattern: 'monthly', dayOfWeek: 2, weekOfMonth: 1,
  });
  assert.equal(ruleAppliesOn(firstTuesday, TUE), true);
  assert.equal(ruleAppliesOn(firstTuesday, fromIsoDate('2026-09-08')), false);
});

test('fortnightly alternates from its anchor date', () => {
  const fortnightly = rule({
    id: 'r', startTime: '19:00', endTime: '20:00',
    repeatPattern: 'fortnightly', dayOfWeek: 2, startsOn: '2026-09-01',
  });
  assert.equal(ruleAppliesOn(fortnightly, fromIsoDate('2026-09-01')), true);
  assert.equal(ruleAppliesOn(fortnightly, fromIsoDate('2026-09-08')), false);
  assert.equal(ruleAppliesOn(fortnightly, fromIsoDate('2026-09-15')), true);
});

test('validity window is respected', () => {
  const seasonal = rule({
    id: 'r', startTime: '06:00', endTime: '07:00', repeatPattern: 'daily',
    startsOn: '2026-09-02', endsOn: '2026-09-03',
  });
  assert.equal(ruleAppliesOn(seasonal, TUE), false);
  assert.equal(ruleAppliesOn(seasonal, WED), true);
});

test('inactive rules never fire', () => {
  const off = rule({ id: 'r', startTime: '06:00', endTime: '07:00', isActive: false });
  assert.equal(ruleAppliesOn(off, TUE), false);
});

test('a day resolves into ordered slots carrying their programme', () => {
  const rules = [
    rule({ id: 'b', startTime: '08:00', endTime: '10:00', programmeId: 'p2' }),
    rule({ id: 'a', startTime: '06:00', endTime: '08:00', programmeId: 'p1' }),
  ];
  const slots = resolveDay(TUE, rules, [], programmes);
  assert.deepEqual(slots.map((s) => s.title), ['Breakfast', 'Community Hour']);
  assert.equal(slots[0].startTime, '06:00');
  assert.equal(slots[0].programme?.id, 'p1');
});

test('a programme running past midnight gets an end time on the next day', () => {
  const overnight = rule({ id: 'n', startTime: '23:00', endTime: '01:00', programmeId: 'p1' });
  const [slot] = resolveDay(TUE, [overnight], [], programmes);
  assert.equal(slot.crossesMidnight, true);
  assert.equal(toIsoDate(slot.endsAt), '2026-09-02');
});

test('a higher priority rule displaces an overlapping regular one', () => {
  const rules = [
    rule({ id: 'regular', startTime: '10:00', endTime: '12:00', programmeId: 'p1' }),
    rule({ id: 'christmas', startTime: '10:00', endTime: '12:00', programmeId: 'p2', scheduleType: 'christmas' }),
  ];
  const slots = resolveDay(TUE, rules, [], programmes);
  assert.equal(slots.length, 1);
  assert.equal(slots[0].title, 'Community Hour');
  assert.equal(slots[0].isOverride, true);
});

test('emergency programming outranks every other schedule type', () => {
  const rules = [
    rule({ id: 'christmas', startTime: '10:00', endTime: '12:00', programmeId: 'p1', scheduleType: 'christmas' }),
    rule({ id: 'emergency', startTime: '10:00', endTime: '12:00', programmeId: 'p2', scheduleType: 'emergency' }),
  ];
  const slots = resolveDay(TUE, rules, [], programmes);
  assert.equal(slots.length, 1);
  assert.equal(slots[0].scheduleType, 'emergency');
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
  assert.deepEqual(
    slots.map((s) => s.title),
    ['Breakfast', 'Farmers Market Outside Broadcast', 'Breakfast'],
  );
  assert.equal(slots[1].source, 'special-broadcast');

  // The next day is untouched: the normal schedule is back automatically.
  const nextDay = resolveDay(WED, rules, specials, programmes);
  assert.deepEqual(nextDay.map((s) => s.title), ['Breakfast', 'Community Hour', 'Breakfast']);
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
  assert.equal(slots.length, 1);
  assert.equal(slots[0].title, 'Community Hour');
});

test('now and next finds the current programme and the one after it', () => {
  const rules = [
    rule({ id: 'a', startTime: '06:00', endTime: '08:00', programmeId: 'p1' }),
    rule({ id: 'b', startTime: '08:00', endTime: '10:00', programmeId: 'p2' }),
  ];
  const { current, next } = resolveNowAndNext(new Date(2026, 8, 1, 7, 30), rules, [], programmes);
  assert.equal(current?.title, 'Breakfast');
  assert.equal(next?.title, 'Community Hour');
});

test('now and next reports an overnight programme as current after midnight', () => {
  const rules = [rule({ id: 'n', startTime: '23:00', endTime: '01:00', programmeId: 'p1' })];
  const { current } = resolveNowAndNext(new Date(2026, 8, 2, 0, 30), rules, [], programmes);
  assert.equal(current?.title, 'Breakfast');
  assert.equal(current?.date, '2026-09-01');
});

test('now and next returns nulls rather than throwing on an empty schedule', () => {
  const { current, next } = resolveNowAndNext(new Date(2026, 8, 1, 7, 30), [], [], programmes);
  assert.equal(current, null);
  assert.equal(next, null);
});

test('a week resolves to seven days starting on the given day', () => {
  const rules = [rule({ id: 'a', startTime: '06:00', endTime: '08:00', programmeId: 'p1', repeatPattern: 'weekdays' })];
  const week = resolveWeek(startOfWeek(TUE), rules, [], programmes);
  assert.equal(week.length, 7);
  assert.equal(week[0].isoDate, '2026-08-31');           // Monday
  assert.equal(week[0].slots.length, 1);                 // weekday -> on
  assert.equal(week[5].slots.length, 0);                 // Saturday -> off
  assert.equal(week[6].slots.length, 0);                 // Sunday -> off
});

test('addDays does not mutate its input', () => {
  const original = fromIsoDate('2026-09-01');
  addDays(original, 5);
  assert.equal(toIsoDate(original), '2026-09-01');
});
