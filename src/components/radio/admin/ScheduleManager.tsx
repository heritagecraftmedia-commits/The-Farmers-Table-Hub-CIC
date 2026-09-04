// Schedule rule management (spec §4, §5, §6).

import React, { useCallback, useEffect, useState } from 'react';
import { CalendarClock, Plus, Trash2, X } from 'lucide-react';

import {
  EmptyNote, ErrorNote, Panel, PrimaryButton, SecondaryButton,
  SelectField, TextArea, TextField, describeError,
} from './adminUi';
import { DAY_NAMES } from '../../../services/radio/scheduleEngine';
import {
  deleteScheduleRule, getAllProgrammes, getAllScheduleRules, saveScheduleRule,
} from '../../../services/radio/stationService';
import type { RadioProgramme, RepeatPattern, ScheduleRule, ScheduleType } from '../../../services/radio/types';

const REPEAT_PATTERNS: { value: RepeatPattern; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'daily', label: 'Every day' },
  { value: 'weekdays', label: 'Weekdays (Mon–Fri)' },
  { value: 'weekends', label: 'Weekends (Sat–Sun)' },
  { value: 'fortnightly', label: 'Fortnightly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'once', label: 'One-off (a single date)' },
];

const SCHEDULE_TYPES: { value: ScheduleType; label: string }[] = [
  { value: 'regular', label: 'Regular schedule' },
  { value: 'special', label: 'Special' },
  { value: 'bank_holiday', label: 'Bank holiday' },
  { value: 'christmas', label: 'Christmas' },
  { value: 'emergency', label: 'Emergency programming' },
];

const DAY_OPTIONS = DAY_NAMES.map((name, index) => ({ value: String(index), label: name }));
const WEEK_OPTIONS = ['1st', '2nd', '3rd', '4th', '5th'].map((label, index) => ({
  value: String(index + 1), label: `${label} of the month`,
}));

const blank = (): Partial<ScheduleRule> => ({
  programmeId: null, scheduleType: 'regular', repeatPattern: 'weekly',
  dayOfWeek: 1, weekOfMonth: null, specificDate: null,
  startTime: '09:00', endTime: '10:00', priority: 0, isActive: true, notes: '',
});

const describe = (rule: ScheduleRule): string => {
  const time = `${rule.startTime.slice(0, 5)}–${rule.endTime.slice(0, 5)}`;
  switch (rule.repeatPattern) {
    case 'daily': return `Every day, ${time}`;
    case 'weekdays': return `Weekdays, ${time}`;
    case 'weekends': return `Weekends, ${time}`;
    case 'weekly': return `${DAY_NAMES[rule.dayOfWeek ?? 0]}s, ${time}`;
    case 'fortnightly': return `Alternate ${DAY_NAMES[rule.dayOfWeek ?? 0]}s, ${time}`;
    case 'monthly': return `${['1st','2nd','3rd','4th','5th'][(rule.weekOfMonth ?? 1) - 1]} ${DAY_NAMES[rule.dayOfWeek ?? 0]}, ${time}`;
    case 'once': return `${rule.specificDate ?? 'One-off'}, ${time}`;
    default: return time;
  }
};

export const ScheduleManager: React.FC = () => {
  const [rules, setRules] = useState<ScheduleRule[]>([]);
  const [programmes, setProgrammes] = useState<RadioProgramme[]>([]);
  const [draft, setDraft] = useState<Partial<ScheduleRule> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [loadedRules, loadedProgrammes] = await Promise.all([
        getAllScheduleRules(), getAllProgrammes(),
      ]);
      setRules(loadedRules);
      setProgrammes(loadedProgrammes);
      setError(null);
    } catch (loadError) {
      setError(describeError(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (patch: Partial<ScheduleRule>) =>
    setDraft((current) => ({ ...(current ?? {}), ...patch }));

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft?.startTime || !draft?.endTime) return;
    setIsSaving(true);
    setError(null);
    try {
      // The database constraint requires the fields that match the pattern,
      // so clear the ones this pattern does not use.
      const pattern = draft.repeatPattern ?? 'weekly';
      const needsDay = ['weekly', 'fortnightly', 'monthly'].includes(pattern);
      await saveScheduleRule({
        ...draft,
        startTime: draft.startTime,
        endTime: draft.endTime,
        dayOfWeek: needsDay ? draft.dayOfWeek ?? 1 : null,
        weekOfMonth: pattern === 'monthly' ? draft.weekOfMonth ?? 1 : null,
        specificDate: pattern === 'once' ? draft.specificDate ?? null : null,
      } as ScheduleRule);
      setDraft(null);
      await load();
    } catch (saveError) {
      setError(describeError(saveError));
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async (id: string) => {
    setError(null);
    try { await deleteScheduleRule(id); await load(); }
    catch (deleteError) { setError(describeError(deleteError)); }
  };

  const pattern = draft?.repeatPattern ?? 'weekly';
  const programmeName = (id: string | null) =>
    programmes.find((programme) => programme.id === id)?.title ?? 'Unassigned slot';

  return (
    <Panel
      title="Schedule"
      icon={CalendarClock}
      description="Rules, not a fixed timetable. Higher priority rules and special schedule types replace overlapping regular programmes, and the regular schedule resumes automatically afterwards."
      action={
        <PrimaryButton onClick={() => setDraft(draft ? null : blank())}>
          {draft ? <><X size={15} aria-hidden="true" /> Cancel</> : <><Plus size={15} aria-hidden="true" /> Add slot</>}
        </PrimaryButton>
      }
    >
      <ErrorNote message={error} />

      {draft && (
        <form onSubmit={handleSave} className="mb-8 rounded-2xl bg-brand-cream p-6">
          <h3 className="mb-5 font-bold">{draft.id ? 'Edit schedule slot' : 'New schedule slot'}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Programme"
              value={draft.programmeId ?? ''}
              onChange={(v) => set({ programmeId: v || null })}
              options={[
                { value: '', label: 'Unassigned slot' },
                ...programmes.map((p) => ({ value: p.id, label: p.title })),
              ]}
            />
            <SelectField
              label="Schedule type"
              hint="Emergency beats Christmas beats bank holiday beats special."
              value={draft.scheduleType ?? 'regular'}
              onChange={(v) => set({ scheduleType: v as ScheduleType })}
              options={SCHEDULE_TYPES}
            />
            <SelectField
              label="Repeats"
              value={pattern}
              onChange={(v) => set({ repeatPattern: v as RepeatPattern })}
              options={REPEAT_PATTERNS}
            />
            {['weekly', 'fortnightly', 'monthly'].includes(pattern) && (
              <SelectField
                label="Day"
                value={String(draft.dayOfWeek ?? 1)}
                onChange={(v) => set({ dayOfWeek: Number(v) })}
                options={DAY_OPTIONS}
              />
            )}
            {pattern === 'monthly' && (
              <SelectField
                label="Which week"
                value={String(draft.weekOfMonth ?? 1)}
                onChange={(v) => set({ weekOfMonth: Number(v) })}
                options={WEEK_OPTIONS}
              />
            )}
            {pattern === 'once' && (
              <TextField
                label="Date"
                type="date"
                value={draft.specificDate ?? ''}
                onChange={(v) => set({ specificDate: v })}
              />
            )}
            <TextField label="Start time" type="time" value={draft.startTime ?? '09:00'} onChange={(v) => set({ startTime: v })} />
            <TextField
              label="End time"
              hint="An end time at or before the start means the programme runs past midnight."
              type="time"
              value={draft.endTime ?? '10:00'}
              onChange={(v) => set({ endTime: v })}
            />
            <TextField label="Runs from (optional)" type="date" value={draft.startsOn ?? ''} onChange={(v) => set({ startsOn: v || null })} />
            <TextField label="Runs until (optional)" type="date" value={draft.endsOn ?? ''} onChange={(v) => set({ endsOn: v || null })} />
            <TextField
              label="Priority"
              hint="Higher wins when two rules overlap."
              type="number"
              value={String(draft.priority ?? 0)}
              onChange={(v) => set({ priority: Number(v) || 0 })}
            />
            <TextArea label="Notes" value={draft.notes ?? ''} onChange={(v) => set({ notes: v })} rows={2} className="sm:col-span-2" />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <PrimaryButton type="submit" busy={isSaving}>Save slot</PrimaryButton>
            <SecondaryButton onClick={() => setDraft(null)}>Cancel</SecondaryButton>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-brand-ink/50">Loading the schedule…</p>
      ) : rules.length === 0 ? (
        <EmptyNote>
          The schedule is empty. Add slots here and they will build the public day and week views.
        </EmptyNote>
      ) : (
        <ul className="space-y-2">
          {rules.map((rule) => (
            <li key={rule.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-brand-cream p-4">
              <div className="min-w-0">
                <p className="font-bold">{programmeName(rule.programmeId)}</p>
                <p className="mt-0.5 text-sm text-brand-ink/55">
                  {describe(rule)}
                  {rule.scheduleType !== 'regular' && ` · ${rule.scheduleType.replace(/_/g, ' ')}`}
                  {rule.priority !== 0 && ` · priority ${rule.priority}`}
                  {!rule.isActive && ' · inactive'}
                </p>
              </div>
              <div className="flex gap-2">
                <SecondaryButton onClick={() => setDraft(rule)}>Edit</SecondaryButton>
                <SecondaryButton tone="danger" onClick={() => remove(rule.id)}>
                  <Trash2 size={14} aria-hidden="true" /> Remove
                </SecondaryButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
};
