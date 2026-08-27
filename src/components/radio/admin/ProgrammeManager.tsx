// Programme management (spec §7).

import React, { useCallback, useEffect, useState } from 'react';
import { Copy, Plus, Radio as RadioIcon, Star, X } from 'lucide-react';

import {
  CheckboxField, EmptyNote, ErrorNote, Panel, PrimaryButton, SecondaryButton,
  SelectField, TextArea, TextField, describeError,
} from './adminUi';
import { StatusPill } from '../StatusPill';
import {
  duplicateProgramme, getAllPresenters, getAllProgrammes, saveProgramme,
  setFeaturedProgramme, setProgrammeStatus,
} from '../../../services/radio/stationService';
import { RADIO_CONTENT_STATUSES } from '../../../services/radio/types';
import type { RadioContentStatus, RadioPresenter, RadioProgramme } from '../../../services/radio/types';

const BROADCAST_MODES = [
  { value: 'planned', label: 'In planning' },
  { value: 'live', label: 'Live' },
  { value: 'pre-recorded', label: 'Pre-recorded' },
  { value: 'automated', label: 'Automated' },
];

const FREQUENCIES = [
  { value: '', label: 'Not set' },
  { value: 'one-off', label: 'One-off' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'weekends', label: 'Weekends' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'fortnightly', label: 'Fortnightly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'special', label: 'Special' },
];

const STATUS_OPTIONS = RADIO_CONTENT_STATUSES.map((status) => ({
  value: status,
  label: status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' '),
}));

const slugify = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const blank = (): Partial<RadioProgramme> => ({
  title: '', slug: '', description: '', intro: '', host: '', presenterId: null,
  category: '', imageUrl: '', frequency: null, broadcastMode: 'planned',
  archiveEnabled: true, isFeatured: false, websiteUrl: '', contentStatus: 'draft',
});

export const ProgrammeManager: React.FC = () => {
  const [programmes, setProgrammes] = useState<RadioProgramme[]>([]);
  const [presenters, setPresenters] = useState<RadioPresenter[]>([]);
  const [draft, setDraft] = useState<Partial<RadioProgramme> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [loadedProgrammes, loadedPresenters] = await Promise.all([
        getAllProgrammes(), getAllPresenters(),
      ]);
      setProgrammes(loadedProgrammes);
      setPresenters(loadedPresenters);
      setError(null);
    } catch (loadError) {
      setError(describeError(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (patch: Partial<RadioProgramme>) =>
    setDraft((current) => ({ ...(current ?? {}), ...patch }));

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft?.title) return;
    setIsSaving(true);
    setError(null);
    try {
      await saveProgramme({
        ...draft,
        title: draft.title,
        slug: draft.slug || slugify(draft.title),
      } as RadioProgramme);
      setDraft(null);
      await load();
    } catch (saveError) {
      setError(describeError(saveError));
    } finally {
      setIsSaving(false);
    }
  };

  const run = async (action: () => Promise<unknown>) => {
    setError(null);
    try {
      await action();
      await load();
    } catch (actionError) {
      setError(describeError(actionError));
    }
  };

  return (
    <Panel
      title="Programmes"
      icon={RadioIcon}
      description="Every programme the station runs. Only published programmes appear on the public site."
      action={
        <PrimaryButton onClick={() => setDraft(draft ? null : blank())}>
          {draft ? <><X size={15} aria-hidden="true" /> Cancel</> : <><Plus size={15} aria-hidden="true" /> Add programme</>}
        </PrimaryButton>
      }
    >
      <ErrorNote message={error} />

      {draft && (
        <form onSubmit={handleSave} className="mb-8 rounded-2xl bg-brand-cream p-6">
          <h3 className="mb-5 font-bold">{draft.id ? 'Edit programme' : 'New programme'}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Programme name" required value={draft.title ?? ''} onChange={(v) => set({ title: v })} />
            <TextField
              label="Web address slug"
              hint="Leave blank to generate from the name."
              value={draft.slug ?? ''}
              onChange={(v) => set({ slug: v })}
              placeholder={draft.title ? slugify(draft.title) : 'programme-name'}
            />
            <TextField label="Category" value={draft.category ?? ''} onChange={(v) => set({ category: v })} placeholder="e.g. Community, Music, Rural" />
            <SelectField
              label="Presenter"
              value={draft.presenterId ?? ''}
              onChange={(v) => set({ presenterId: v || null })}
              options={[{ value: '', label: 'Not assigned' }, ...presenters.map((p) => ({ value: p.id, label: p.name }))]}
            />
            <TextField label="Presenter name (if not in the directory)" value={draft.host ?? ''} onChange={(v) => set({ host: v })} />
            <SelectField
              label="How it is broadcast"
              value={draft.broadcastMode ?? 'planned'}
              onChange={(v) => set({ broadcastMode: v as RadioProgramme['broadcastMode'] })}
              options={BROADCAST_MODES}
            />
            <SelectField
              label="Frequency"
              value={draft.frequency ?? ''}
              onChange={(v) => set({ frequency: (v || null) as RadioProgramme['frequency'] })}
              options={FREQUENCIES}
            />
            <SelectField
              label="Status"
              hint="Published makes it visible on the public site."
              value={draft.contentStatus ?? 'draft'}
              onChange={(v) => set({ contentStatus: v as RadioContentStatus })}
              options={STATUS_OPTIONS}
            />
            <TextField label="Image URL" value={draft.imageUrl ?? ''} onChange={(v) => set({ imageUrl: v })} className="sm:col-span-2" />
            <TextField label="Website or social link" value={draft.websiteUrl ?? ''} onChange={(v) => set({ websiteUrl: v })} className="sm:col-span-2" />
            <TextArea label="Short introduction" value={draft.intro ?? ''} onChange={(v) => set({ intro: v })} rows={2} className="sm:col-span-2" />
            <TextArea label="Description" value={draft.description ?? ''} onChange={(v) => set({ description: v })} rows={4} className="sm:col-span-2" />
            <div className="sm:col-span-2">
              <CheckboxField
                label="Keep an archive of episodes"
                checked={draft.archiveEnabled ?? true}
                onChange={(v) => set({ archiveEnabled: v })}
              />
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <PrimaryButton type="submit" busy={isSaving}>Save programme</PrimaryButton>
            <SecondaryButton onClick={() => setDraft(null)}>Cancel</SecondaryButton>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-brand-ink/50">Loading programmes…</p>
      ) : programmes.length === 0 ? (
        <EmptyNote>
          No programmes yet. Add the first real Farmers Table programme — nothing is created for you.
        </EmptyNote>
      ) : (
        <ul className="space-y-3">
          {programmes.map((programme) => (
            <li key={programme.id} className="rounded-2xl bg-brand-cream p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold">{programme.title}</p>
                    {programme.isFeatured && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-olive px-2.5 py-1 text-[11px] font-bold uppercase text-white">
                        <Star size={11} aria-hidden="true" /> Featured
                      </span>
                    )}
                    <StatusPill status={programme.contentStatus} />
                  </div>
                  <p className="mt-1 text-sm text-brand-ink/55">
                    {programme.presenter?.name ?? programme.host ?? 'No presenter assigned'}
                    {programme.category ? ` · ${programme.category}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <SecondaryButton onClick={() => setDraft(programme)}>Edit</SecondaryButton>
                  <SecondaryButton onClick={() => run(() => duplicateProgramme(programme.id))}>
                    <Copy size={14} aria-hidden="true" /> Duplicate
                  </SecondaryButton>
                  {!programme.isFeatured && programme.contentStatus === 'published' && (
                    <SecondaryButton onClick={() => run(() => setFeaturedProgramme(programme.id))}>
                      <Star size={14} aria-hidden="true" /> Feature
                    </SecondaryButton>
                  )}
                  {programme.contentStatus === 'published' ? (
                    <SecondaryButton onClick={() => run(() => setProgrammeStatus(programme.id, 'draft'))}>
                      Unpublish
                    </SecondaryButton>
                  ) : (
                    <SecondaryButton onClick={() => run(() => setProgrammeStatus(programme.id, 'published'))}>
                      Publish
                    </SecondaryButton>
                  )}
                  <SecondaryButton tone="danger" onClick={() => run(() => setProgrammeStatus(programme.id, 'archived'))}>
                    Archive
                  </SecondaryButton>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
};
