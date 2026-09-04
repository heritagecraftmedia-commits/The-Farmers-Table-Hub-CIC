// Station imaging library and music licensing (spec §10, §11).
//
// One library, two views: station imaging (jingles, IDs, sweepers, intros) and
// music with its licensing state. Uploaded music is NEVER assumed cleared for
// broadcast — it starts as "not checked" and a person has to say otherwise.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AudioLines, Plus, ShieldCheck, Upload, X } from 'lucide-react';

import {
  CheckboxField, EmptyNote, ErrorNote, Panel, PrimaryButton, SecondaryButton,
  SelectField, TextArea, TextField, describeError,
} from './adminUi';
import { ContentSlotGrid } from '../ContentSlot';
import {
  getAllProgrammes, getLibrary, saveLibraryItem, setLibraryItemActive,
  setLicenceStatus, uploadRadioFile,
} from '../../../services/radio/stationService';
import { IMAGING_TYPES, MUSIC_CATEGORIES } from '../../../services/radio/types';
import type { ImagingType, LicenceStatus, RadioLibraryItem, RadioProgramme } from '../../../services/radio/types';

const MEDIA_TYPES = [
  { value: 'music', label: 'Music' },
  { value: 'jingle', label: 'Jingle / station imaging' },
  { value: 'community', label: 'Community audio' },
  { value: 'advert', label: 'Advert' },
  { value: 'interview', label: 'Interview' },
  { value: 'feature', label: 'Feature' },
];

const LICENCE_OPTIONS: { value: LicenceStatus; label: string }[] = [
  { value: 'unknown', label: 'Not checked' },
  { value: 'pending_check', label: 'Licence check in progress' },
  { value: 'cleared', label: 'Cleared for broadcast' },
  { value: 'restricted', label: 'Restricted — conditions apply' },
  { value: 'rejected', label: 'Not usable' },
];

const LICENCE_STYLES: Record<LicenceStatus, string> = {
  unknown: 'bg-amber-100 text-amber-900',
  pending_check: 'bg-sky-100 text-sky-900',
  cleared: 'bg-emerald-100 text-emerald-900',
  restricted: 'bg-orange-100 text-orange-900',
  rejected: 'bg-rose-100 text-rose-900',
};

const blank = (): Partial<RadioLibraryItem> => ({
  title: '', artist: '', album: '', genre: '', mediaType: 'music',
  imagingType: null, audioUrl: '', durationSeconds: 0, isLocalArtist: false,
  licenceStatus: 'unknown', contentStatus: 'draft', isActive: true,
});

type View = 'imaging' | 'music' | 'all';

export const ImagingManager: React.FC = () => {
  const [items, setItems] = useState<RadioLibraryItem[]>([]);
  const [programmes, setProgrammes] = useState<RadioProgramme[]>([]);
  const [view, setView] = useState<View>('imaging');
  const [draft, setDraft] = useState<Partial<RadioLibraryItem> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [library, loadedProgrammes] = await Promise.all([getLibrary(), getAllProgrammes()]);
      setItems(library);
      setProgrammes(loadedProgrammes);
      setError(null);
    } catch (loadError) {
      setError(describeError(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => {
    if (view === 'imaging') return items.filter((item) => item.mediaType === 'jingle' || item.imagingType);
    if (view === 'music') return items.filter((item) => item.mediaType === 'music');
    return items;
  }, [items, view]);

  const set = (patch: Partial<RadioLibraryItem>) =>
    setDraft((current) => ({ ...(current ?? {}), ...patch }));

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);
    try {
      set({ audioUrl: await uploadRadioFile(file, 'radio-audio') });
    } catch (uploadError) {
      setError(describeError(uploadError));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft?.title) return;
    setIsSaving(true);
    setError(null);
    try {
      await saveLibraryItem({ ...draft, title: draft.title } as RadioLibraryItem);
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
    try { await action(); await load(); }
    catch (actionError) { setError(describeError(actionError)); }
  };

  const uncheckedMusic = items.filter(
    (item) => item.mediaType === 'music' && ['unknown', 'pending_check'].includes(item.licenceStatus),
  ).length;

  return (
    <Panel
      title="Station imaging and music"
      icon={AudioLines}
      description="Jingles, station IDs, sweepers, intros and the music library. Nothing is treated as cleared for broadcast until someone marks it so."
      action={
        <PrimaryButton onClick={() => setDraft(draft ? null : blank())}>
          {draft ? <><X size={15} aria-hidden="true" /> Cancel</> : <><Plus size={15} aria-hidden="true" /> Add audio</>}
        </PrimaryButton>
      }
    >
      <ErrorNote message={error} />

      {uncheckedMusic > 0 && (
        <p className="mb-6 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <ShieldCheck size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
          {uncheckedMusic} {uncheckedMusic === 1 ? 'track has' : 'tracks have'} not had a licensing
          check. Nothing without a cleared licence is treated as broadcastable or shown publicly.
        </p>
      )}

      <div role="group" aria-label="Library view" className="mb-6 flex flex-wrap gap-2">
        {([['imaging', 'Station imaging'], ['music', 'Music'], ['all', 'Everything']] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setView(value)}
            aria-pressed={view === value}
            className={`min-h-11 rounded-full px-4 py-2 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-olive ${
              view === value ? 'bg-brand-olive text-white' : 'border border-brand-olive/15 bg-white text-brand-ink/70'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {draft && (
        <form onSubmit={handleSave} className="mb-8 rounded-2xl bg-brand-cream p-6">
          <h3 className="mb-5 font-bold">{draft.id ? 'Edit audio' : 'New audio'}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Title" required value={draft.title ?? ''} onChange={(v) => set({ title: v })} />
            <SelectField
              label="Type"
              value={draft.mediaType ?? 'music'}
              onChange={(v) => set({ mediaType: v as RadioLibraryItem['mediaType'] })}
              options={MEDIA_TYPES}
            />
            {(draft.mediaType === 'jingle' || draft.imagingType) && (
              <SelectField
                label="Imaging type"
                value={draft.imagingType ?? ''}
                onChange={(v) => set({ imagingType: (v || null) as ImagingType | null })}
                options={[{ value: '', label: 'Not set' }, ...IMAGING_TYPES]}
              />
            )}
            {draft.mediaType === 'music' && (
              <>
                <TextField label="Artist" value={draft.artist ?? ''} onChange={(v) => set({ artist: v })} />
                <TextField label="Album" value={draft.album ?? ''} onChange={(v) => set({ album: v })} />
                <SelectField
                  label="Genre"
                  value={draft.genre ?? ''}
                  onChange={(v) => set({ genre: v })}
                  options={[
                    { value: '', label: 'Not set' },
                    ...MUSIC_CATEGORIES.map((category) => ({ value: category, label: category })),
                  ]}
                />
                <TextField
                  label="Year"
                  type="number"
                  value={String(draft.releaseYear ?? '')}
                  onChange={(v) => set({ releaseYear: Number(v) || null })}
                />
              </>
            )}
            <SelectField
              label="Assign to programme"
              value={draft.programmeId ?? ''}
              onChange={(v) => set({ programmeId: v || null })}
              options={[
                { value: '', label: 'Not assigned' },
                ...programmes.map((p) => ({ value: p.id, label: p.title })),
              ]}
            />
            <TextField
              label="Duration (seconds)"
              type="number"
              value={String(draft.durationSeconds ?? 0)}
              onChange={(v) => set({ durationSeconds: Number(v) || 0 })}
            />
            <SelectField
              label="Licensing"
              hint="Never assume uploaded music is cleared."
              value={draft.licenceStatus ?? 'unknown'}
              onChange={(v) => set({ licenceStatus: v as LicenceStatus })}
              options={LICENCE_OPTIONS}
            />
            <SelectField
              label="Status"
              value={draft.contentStatus ?? 'draft'}
              onChange={(v) => set({ contentStatus: v as RadioLibraryItem['contentStatus'] })}
              options={[
                { value: 'draft', label: 'Draft' },
                { value: 'approved', label: 'Approved' },
                { value: 'published', label: 'Published' },
                { value: 'archived', label: 'Archived' },
              ]}
            />
            <TextField label="Audio URL" value={draft.audioUrl ?? ''} onChange={(v) => set({ audioUrl: v })} className="sm:col-span-2" />
            <div className="sm:col-span-2">
              <label className="block">
                <span className="text-sm font-bold">…or upload the file</span>
                <input
                  type="file"
                  accept="audio/*"
                  disabled={isUploading}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) handleUpload(file);
                  }}
                  className="mt-1 block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-brand-olive file:px-4 file:py-2 file:font-bold file:text-white"
                />
              </label>
              {isUploading && (
                <p className="mt-2 inline-flex items-center gap-2 text-sm text-brand-ink/55">
                  <Upload size={14} aria-hidden="true" /> Uploading…
                </p>
              )}
            </div>
            <TextArea label="Licensing notes" value={draft.licenceNotes ?? ''} onChange={(v) => set({ licenceNotes: v })} rows={2} className="sm:col-span-2" />
            {draft.mediaType === 'music' && (
              <div className="sm:col-span-2">
                <CheckboxField
                  label="Local artist"
                  checked={draft.isLocalArtist ?? false}
                  onChange={(v) => set({ isLocalArtist: v })}
                />
              </div>
            )}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <PrimaryButton type="submit" busy={isSaving}>Save audio</PrimaryButton>
            <SecondaryButton onClick={() => setDraft(null)}>Cancel</SecondaryButton>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-brand-ink/50">Loading the library…</p>
      ) : visible.length === 0 ? (
        view === 'imaging' ? (
          <div>
            <EmptyNote>
              No station imaging yet. These slots show what the station still needs — add the real
              Farmers Table jingles and idents to fill them.
            </EmptyNote>
            <div className="mt-5">
              <ContentSlotGrid count={3} kind="jingle" />
            </div>
          </div>
        ) : (
          <EmptyNote>Nothing in this part of the library yet.</EmptyNote>
        )
      ) : (
        <ul className="space-y-3">
          {visible.map((item) => (
            <li key={item.id} className="rounded-2xl bg-brand-cream p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold">{item.title}</p>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${LICENCE_STYLES[item.licenceStatus]}`}>
                      {LICENCE_OPTIONS.find((option) => option.value === item.licenceStatus)?.label}
                    </span>
                    {item.isLocalArtist && (
                      <span className="rounded-full bg-brand-olive/10 px-2.5 py-1 text-[11px] font-bold uppercase text-brand-olive">
                        Local artist
                      </span>
                    )}
                    {!item.isActive && (
                      <span className="rounded-full bg-brand-ink/10 px-2.5 py-1 text-[11px] font-bold uppercase text-brand-ink/60">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-brand-ink/55">
                    {[
                      item.artist,
                      item.imagingType
                        ? IMAGING_TYPES.find((type) => type.value === item.imagingType)?.label
                        : item.mediaType,
                      item.genre,
                    ].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <SecondaryButton onClick={() => setDraft(item)}>Edit</SecondaryButton>
                  {item.licenceStatus !== 'cleared' && (
                    <SecondaryButton onClick={() => run(() => setLicenceStatus(item.id, 'cleared'))}>
                      <ShieldCheck size={14} aria-hidden="true" /> Mark cleared
                    </SecondaryButton>
                  )}
                  <SecondaryButton
                    tone={item.isActive ? 'danger' : 'default'}
                    onClick={() => run(() => setLibraryItemActive(item.id, !item.isActive))}
                  >
                    {item.isActive ? 'Deactivate' : 'Activate'}
                  </SecondaryButton>
                </div>
              </div>
              {item.audioUrl && (
                <audio controls preload="none" src={item.audioUrl} className="mt-4 w-full" aria-label={`Preview: ${item.title}`} />
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
};
