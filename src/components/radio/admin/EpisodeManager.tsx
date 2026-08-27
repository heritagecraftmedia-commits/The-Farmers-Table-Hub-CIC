// Episode / archive management (spec §9, §19).

import React, { useCallback, useEffect, useState } from 'react';
import { Library, Plus, Upload, X } from 'lucide-react';

import {
  CheckboxField, EmptyNote, ErrorNote, Panel, PrimaryButton, SecondaryButton,
  SelectField, TextArea, TextField, describeError,
} from './adminUi';
import { StatusPill } from '../StatusPill';
import {
  getAllEpisodes, getAllPresenters, getAllProgrammes, saveEpisode,
  setEpisodeStatus, uploadRadioFile,
} from '../../../services/radio/stationService';
import type { RadioEpisode, RadioPresenter, RadioProgramme } from '../../../services/radio/types';

const CATEGORIES = [
  { value: 'episode', label: 'Episode' },
  { value: 'interview', label: 'Interview' },
  { value: 'community_feature', label: 'Community feature' },
  { value: 'special_broadcast', label: 'Special broadcast' },
];

const blank = (): Partial<RadioEpisode> => ({
  title: '', description: '', broadcastDate: '', durationSeconds: 0,
  audioUrl: '', episodeCategory: 'episode', isDownloadable: false,
  status: 'draft', tags: [],
});

export const EpisodeManager: React.FC = () => {
  const [episodes, setEpisodes] = useState<RadioEpisode[]>([]);
  const [programmes, setProgrammes] = useState<RadioProgramme[]>([]);
  const [presenters, setPresenters] = useState<RadioPresenter[]>([]);
  const [draft, setDraft] = useState<Partial<RadioEpisode> | null>(null);
  const [tagText, setTagText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [loadedEpisodes, loadedProgrammes, loadedPresenters] = await Promise.all([
        getAllEpisodes(), getAllProgrammes(), getAllPresenters(),
      ]);
      setEpisodes(loadedEpisodes);
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

  const startEdit = (episode: Partial<RadioEpisode> | null) => {
    setDraft(episode);
    setTagText((episode?.tags ?? []).join(', '));
  };

  const set = (patch: Partial<RadioEpisode>) =>
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
    if (!draft?.title || !draft?.programmeId) return;
    setIsSaving(true);
    setError(null);
    try {
      await saveEpisode({
        ...draft,
        title: draft.title,
        programmeId: draft.programmeId,
        broadcastDate: draft.broadcastDate || null,
        tags: tagText.split(',').map((tag) => tag.trim()).filter(Boolean),
      } as RadioEpisode);
      startEdit(null);
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

  return (
    <Panel
      title="Episodes and archive"
      icon={Library}
      description="Recordings for Listen Again. Only published episodes are public — staff decide what the archive shows."
      action={
        <PrimaryButton onClick={() => startEdit(draft ? null : blank())}>
          {draft ? <><X size={15} aria-hidden="true" /> Cancel</> : <><Plus size={15} aria-hidden="true" /> Add episode</>}
        </PrimaryButton>
      }
    >
      <ErrorNote message={error} />

      {draft && (
        <form onSubmit={handleSave} className="mb-8 rounded-2xl bg-brand-cream p-6">
          <h3 className="mb-5 font-bold">{draft.id ? 'Edit episode' : 'New episode'}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Programme"
              value={draft.programmeId ?? ''}
              onChange={(v) => set({ programmeId: v })}
              options={[
                { value: '', label: 'Choose a programme…' },
                ...programmes.map((p) => ({ value: p.id, label: p.title })),
              ]}
            />
            <SelectField
              label="Presenter"
              value={draft.presenterId ?? ''}
              onChange={(v) => set({ presenterId: v || null })}
              options={[
                { value: '', label: 'Not set' },
                ...presenters.map((p) => ({ value: p.id, label: p.name })),
              ]}
            />
            <TextField label="Episode title" required value={draft.title ?? ''} onChange={(v) => set({ title: v })} className="sm:col-span-2" />
            <TextField label="Broadcast date" type="date" value={draft.broadcastDate ?? ''} onChange={(v) => set({ broadcastDate: v })} />
            <SelectField
              label="Category"
              value={draft.episodeCategory ?? 'episode'}
              onChange={(v) => set({ episodeCategory: v as RadioEpisode['episodeCategory'] })}
              options={CATEGORIES}
            />
            <TextField
              label="Duration (minutes)"
              type="number"
              value={String(Math.round((draft.durationSeconds ?? 0) / 60))}
              onChange={(v) => set({ durationSeconds: (Number(v) || 0) * 60 })}
            />
            <SelectField
              label="Status"
              value={draft.status ?? 'draft'}
              onChange={(v) => set({ status: v as RadioEpisode['status'] })}
              options={[
                { value: 'draft', label: 'Draft' },
                { value: 'pending', label: 'Pending approval' },
                { value: 'published', label: 'Published' },
                { value: 'archived', label: 'Archived' },
              ]}
            />
            <TextField label="Audio URL" value={draft.audioUrl ?? ''} onChange={(v) => set({ audioUrl: v })} className="sm:col-span-2" />
            <div className="sm:col-span-2">
              <label className="block">
                <span className="text-sm font-bold">…or upload the recording</span>
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
            <TextField label="Tags" hint="Comma separated." value={tagText} onChange={setTagText} className="sm:col-span-2" />
            <TextArea label="Description" value={draft.description ?? ''} onChange={(v) => set({ description: v })} rows={3} className="sm:col-span-2" />
            <TextArea label="Transcript (optional)" value={draft.transcript ?? ''} onChange={(v) => set({ transcript: v })} rows={3} className="sm:col-span-2" />
            <div className="sm:col-span-2">
              <CheckboxField
                label="Allow listeners to download this episode"
                checked={draft.isDownloadable ?? false}
                onChange={(v) => set({ isDownloadable: v })}
              />
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <PrimaryButton type="submit" busy={isSaving} disabled={!draft.programmeId}>Save episode</PrimaryButton>
            <SecondaryButton onClick={() => startEdit(null)}>Cancel</SecondaryButton>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-brand-ink/50">Loading episodes…</p>
      ) : episodes.length === 0 ? (
        <EmptyNote>No episodes recorded yet. Upload a real recording to start the archive.</EmptyNote>
      ) : (
        <ul className="space-y-3">
          {episodes.map((episode) => (
            <li key={episode.id} className="flex flex-wrap items-start justify-between gap-3 rounded-2xl bg-brand-cream p-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold">{episode.title}</p>
                  <StatusPill status={episode.status} />
                  {!episode.audioUrl && (
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold uppercase text-amber-900">
                      No audio
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-brand-ink/55">
                  {episode.programmeTitle ?? 'Unknown programme'}
                  {episode.broadcastDate ? ` · ${episode.broadcastDate}` : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <SecondaryButton onClick={() => startEdit(episode)}>Edit</SecondaryButton>
                {episode.status === 'published' ? (
                  <SecondaryButton onClick={() => run(() => setEpisodeStatus(episode.id, 'draft'))}>Unpublish</SecondaryButton>
                ) : (
                  <SecondaryButton onClick={() => run(() => setEpisodeStatus(episode.id, 'published'))}>Publish</SecondaryButton>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
};
