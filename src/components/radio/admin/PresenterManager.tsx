// Presenter management (spec §8).

import React, { useCallback, useEffect, useState } from 'react';
import { Mic2, Plus, X } from 'lucide-react';

import {
  EmptyNote, ErrorNote, Panel, PrimaryButton, SecondaryButton,
  SelectField, TextArea, TextField, describeError,
} from './adminUi';
import { StatusPill } from '../StatusPill';
import { getAllPresenters, savePresenter, setPresenterStatus } from '../../../services/radio/stationService';
import { RADIO_CONTENT_STATUSES } from '../../../services/radio/types';
import type { PresenterRole, RadioContentStatus, RadioPresenter } from '../../../services/radio/types';

const ROLES: { value: PresenterRole; label: string }[] = [
  { value: 'presenter', label: 'Presenter' },
  { value: 'producer', label: 'Producer' },
  { value: 'guest_presenter', label: 'Guest presenter' },
  { value: 'community_contributor', label: 'Community contributor' },
  { value: 'news', label: 'News / information' },
  { value: 'music_specialist', label: 'Music specialist' },
];

const STATUS_OPTIONS = RADIO_CONTENT_STATUSES.map((status) => ({
  value: status,
  label: status.charAt(0).toUpperCase() + status.slice(1),
}));

const SOCIAL_KEYS = ['website', 'facebook', 'instagram'] as const;

const slugify = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const blank = (): Partial<RadioPresenter> => ({
  name: '', slug: '', photoUrl: '', bio: '', intro: '', presenterRole: 'presenter',
  contactEmail: '', availability: '', status: 'draft', isActive: true, socialLinks: {},
});

export const PresenterManager: React.FC = () => {
  const [presenters, setPresenters] = useState<RadioPresenter[]>([]);
  const [draft, setDraft] = useState<Partial<RadioPresenter> | null>(null);
  const [socials, setSocials] = useState<Record<string, string>>({ website: '', facebook: '', instagram: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setPresenters(await getAllPresenters());
      setError(null);
    } catch (loadError) {
      setError(describeError(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const startEdit = (presenter: Partial<RadioPresenter> | null) => {
    setDraft(presenter);
    setSocials({
      website: presenter?.socialLinks?.website ?? '',
      facebook: presenter?.socialLinks?.facebook ?? '',
      instagram: presenter?.socialLinks?.instagram ?? '',
    });
  };

  const set = (patch: Partial<RadioPresenter>) =>
    setDraft((current) => ({ ...(current ?? {}), ...patch }));

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft?.name) return;
    setIsSaving(true);
    setError(null);
    try {
      const socialLinks: Record<string, string> = {};
      for (const key of SOCIAL_KEYS) {
        const url = (socials[key] ?? '').trim();
        if (url) socialLinks[key] = url;
      }
      await savePresenter({
        ...draft,
        name: draft.name,
        slug: draft.slug || slugify(draft.name),
        socialLinks,
      } as RadioPresenter);
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
      title="Presenters"
      icon={Mic2}
      description="Real people only. A presenter appears publicly once their profile is published and active."
      action={
        <PrimaryButton onClick={() => startEdit(draft ? null : blank())}>
          {draft ? <><X size={15} aria-hidden="true" /> Cancel</> : <><Plus size={15} aria-hidden="true" /> Add presenter</>}
        </PrimaryButton>
      }
    >
      <ErrorNote message={error} />

      {draft && (
        <form onSubmit={handleSave} className="mb-8 rounded-2xl bg-brand-cream p-6">
          <h3 className="mb-5 font-bold">{draft.id ? 'Edit presenter' : 'New presenter'}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Name" required value={draft.name ?? ''} onChange={(v) => set({ name: v })} />
            <TextField
              label="Web address slug"
              hint="Leave blank to generate from the name."
              value={draft.slug ?? ''}
              onChange={(v) => set({ slug: v })}
              placeholder={draft.name ? slugify(draft.name) : 'presenter-name'}
            />
            <SelectField
              label="Role"
              value={draft.presenterRole ?? 'presenter'}
              onChange={(v) => set({ presenterRole: v as PresenterRole })}
              options={ROLES}
            />
            <SelectField
              label="Status"
              value={draft.status ?? 'draft'}
              onChange={(v) => set({ status: v as RadioContentStatus })}
              options={STATUS_OPTIONS}
            />
            <TextField label="Photograph URL" value={draft.photoUrl ?? ''} onChange={(v) => set({ photoUrl: v })} className="sm:col-span-2" />
            <TextField label="Contact email" type="email" value={draft.contactEmail ?? ''} onChange={(v) => set({ contactEmail: v })} />
            <TextField label="Availability" value={draft.availability ?? ''} onChange={(v) => set({ availability: v })} placeholder="e.g. Weekday mornings" />
            <TextArea label="Introduction" hint="One or two lines, shown on cards." value={draft.intro ?? ''} onChange={(v) => set({ intro: v })} rows={2} className="sm:col-span-2" />
            <TextArea label="Biography" value={draft.bio ?? ''} onChange={(v) => set({ bio: v })} rows={4} className="sm:col-span-2" />
            <TextField label="Website" value={socials.website} onChange={(v) => setSocials((s) => ({ ...s, website: v }))} />
            <TextField label="Facebook" value={socials.facebook} onChange={(v) => setSocials((s) => ({ ...s, facebook: v }))} />
            <TextField label="Instagram" value={socials.instagram} onChange={(v) => setSocials((s) => ({ ...s, instagram: v }))} />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <PrimaryButton type="submit" busy={isSaving}>Save presenter</PrimaryButton>
            <SecondaryButton onClick={() => startEdit(null)}>Cancel</SecondaryButton>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-brand-ink/50">Loading presenters…</p>
      ) : presenters.length === 0 ? (
        <EmptyNote>
          No presenters yet. Add the real people presenting on the station — none are invented for you.
        </EmptyNote>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {presenters.map((presenter) => (
            <li key={presenter.id} className="rounded-2xl bg-brand-cream p-5">
              <div className="flex items-start gap-4">
                {presenter.photoUrl ? (
                  <img src={presenter.photoUrl} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white">
                    <Mic2 size={20} className="text-brand-olive" aria-hidden="true" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold">{presenter.name}</p>
                    <StatusPill status={presenter.status} />
                  </div>
                  <p className="mt-0.5 text-sm capitalize text-brand-ink/55">
                    {presenter.presenterRole.replace(/_/g, ' ')}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <SecondaryButton onClick={() => startEdit(presenter)}>Edit</SecondaryButton>
                    {presenter.status === 'published' ? (
                      <SecondaryButton onClick={() => run(() => setPresenterStatus(presenter.id, 'draft'))}>
                        Unpublish
                      </SecondaryButton>
                    ) : (
                      <SecondaryButton onClick={() => run(() => setPresenterStatus(presenter.id, 'published'))}>
                        Publish
                      </SecondaryButton>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
};
