// Advertising management (spec §12, §21 CONTENT -> Adverts).
//
// This manages the SAME radio_sponsors rows that RadioAdvertiserStudio
// creates. The Studio remains the intake step (pick a directory listing, draft
// a script); this panel is the management step for the records it produces.
// It is deliberately not a second advertising system, and the Studio is
// embedded below so there is one place to do the whole job.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Megaphone, Plus, X } from 'lucide-react';

import {
  EmptyNote, ErrorNote, Panel, PrimaryButton, SecondaryButton,
  SelectField, TextArea, TextField, describeError,
} from './adminUi';
import { StatusPill } from '../StatusPill';
import { ContentSlotGrid } from '../ContentSlot';
import { RadioAdvertiserStudio } from '../../central/RadioAdvertiserStudio';
import {
  advertPublishBlockers, getAllAdverts, saveAdvert, setAdvertRunState, setAdvertStatus,
} from '../../../services/radio/stationService';
import { ADVERT_PACKAGES } from '../../../services/radio/types';
import type { AdvertPackage, AdvertRunState, RadioAdvert, RadioContentStatus } from '../../../services/radio/types';

const RUN_STATES: { value: AdvertRunState; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'expired', label: 'Expired' },
];

const RUN_STATE_STYLES: Record<AdvertRunState, string> = {
  active: 'bg-emerald-100 text-emerald-900',
  paused: 'bg-amber-100 text-amber-900',
  expired: 'bg-brand-ink/10 text-brand-ink/60',
};

const blank = (): Partial<RadioAdvert> => ({
  businessName: '', contactName: '', contactEmail: '', website: '', category: '',
  package: '30s', adScript: '', audioUrl: '', readsPerShow: 1,
  runState: 'active', contentStatus: 'draft',
});

const inWindow = (advert: RadioAdvert): boolean => {
  const today = new Date().toISOString().slice(0, 10);
  if (advert.startDate && advert.startDate > today) return false;
  if (advert.endDate && advert.endDate < today) return false;
  return true;
};

export const AdvertiserManager: React.FC = () => {
  const [adverts, setAdverts] = useState<RadioAdvert[]>([]);
  const [draft, setDraft] = useState<Partial<RadioAdvert> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStudio, setShowStudio] = useState(false);

  const load = useCallback(async () => {
    try { setAdverts(await getAllAdverts()); setError(null); }
    catch (loadError) { setError(describeError(loadError)); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (patch: Partial<RadioAdvert>) =>
    setDraft((current) => ({ ...(current ?? {}), ...patch }));

  const blockers = useMemo(() => (draft ? advertPublishBlockers(draft) : []), [draft]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft?.businessName?.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      await saveAdvert({ ...draft, businessName: draft.businessName.trim() } as RadioAdvert);
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

  const publish = async (advert: RadioAdvert) => {
    const problems = advertPublishBlockers(advert);
    if (problems.length > 0) {
      setError(`“${advert.businessName}” cannot be published yet — it still needs ${problems.join(', ')}.`);
      return;
    }
    await run(() => setAdvertStatus(advert.id, 'published'));
  };

  return (
    <Panel
      title="Advertising"
      icon={Megaphone}
      description="Real local businesses only. An advert reaches the public page only when it is published, active and inside its date window."
      action={
        <PrimaryButton onClick={() => setDraft(draft ? null : blank())}>
          {draft ? <><X size={15} aria-hidden="true" /> Cancel</> : <><Plus size={15} aria-hidden="true" /> Add advertiser</>}
        </PrimaryButton>
      }
    >
      <ErrorNote message={error} />

      {draft && (
        <form onSubmit={handleSave} className="mb-8 rounded-2xl bg-brand-cream p-6">
          <h3 className="mb-5 font-bold">{draft.id ? 'Edit advertiser' : 'New advertiser'}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Business name" required value={draft.businessName ?? ''} onChange={(v) => set({ businessName: v })} />
            <TextField label="Category" value={draft.category ?? ''} onChange={(v) => set({ category: v })} placeholder="e.g. Food, Retail, Trades" />
            <TextField label="Contact name" value={draft.contactName ?? ''} onChange={(v) => set({ contactName: v })} />
            <TextField label="Contact email" type="email" value={draft.contactEmail ?? ''} onChange={(v) => set({ contactEmail: v })} />
            <TextField label="Website" value={draft.website ?? ''} onChange={(v) => set({ website: v })} className="sm:col-span-2" />
            <SelectField
              label="Package"
              value={draft.package ?? '30s'}
              onChange={(v) => set({ package: v as AdvertPackage })}
              options={ADVERT_PACKAGES.map((p) => ({ value: p.value, label: p.label }))}
              hint={ADVERT_PACKAGES.find((p) => p.value === (draft.package ?? '30s'))?.hint}
            />
            <TextField
              label="Reads per show"
              type="number"
              value={String(draft.readsPerShow ?? 1)}
              onChange={(v) => set({ readsPerShow: Math.max(1, Number(v) || 1) })}
            />
            <TextField label="Campaign starts" type="date" value={draft.startDate ?? ''} onChange={(v) => set({ startDate: v || null })} />
            <TextField label="Campaign ends" type="date" value={draft.endDate ?? ''} onChange={(v) => set({ endDate: v || null })} />
            <TextField label="Renewal date" type="date" value={draft.renewalDate ?? ''} onChange={(v) => set({ renewalDate: v || null })} />
            <SelectField
              label="Run state"
              hint="The commercial arrangement, separate from publication."
              value={draft.runState ?? 'active'}
              onChange={(v) => set({ runState: v as AdvertRunState })}
              options={RUN_STATES}
            />
            <SelectField
              label="Status"
              hint="Only Published is ever visible publicly."
              value={draft.contentStatus ?? 'draft'}
              onChange={(v) => set({ contentStatus: v as RadioContentStatus })}
              options={[
                { value: 'draft', label: 'Draft' },
                { value: 'pending', label: 'Pending approval' },
                { value: 'approved', label: 'Approved' },
                { value: 'published', label: 'Published' },
                { value: 'archived', label: 'Archived' },
                { value: 'expired', label: 'Expired' },
              ]}
            />
            <TextField label="Audio advert URL" value={draft.audioUrl ?? ''} onChange={(v) => set({ audioUrl: v })} className="sm:col-span-2" />
            <TextField label="Artwork URL" value={draft.artworkUrl ?? ''} onChange={(v) => set({ artworkUrl: v })} className="sm:col-span-2" />
            <TextArea label="Advert script" value={draft.adScript ?? ''} onChange={(v) => set({ adScript: v })} rows={4} className="sm:col-span-2" />
            <TextArea label="Campaign details" value={draft.campaignDetails ?? ''} onChange={(v) => set({ campaignDetails: v })} rows={2} className="sm:col-span-2" />
            <TextArea label="Notes" value={draft.notes ?? ''} onChange={(v) => set({ notes: v })} rows={2} className="sm:col-span-2" />
          </div>

          {draft.contentStatus === 'published' && blockers.length > 0 && (
            <p className="mt-5 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <AlertTriangle size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
              This cannot be published yet — it still needs {blockers.join(', ')}. Save it as a draft
              and finish it when the real details arrive.
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <PrimaryButton
              type="submit"
              busy={isSaving}
              disabled={draft.contentStatus === 'published' && blockers.length > 0}
            >
              Save advertiser
            </PrimaryButton>
            <SecondaryButton onClick={() => set({ contentStatus: 'draft' })}>Mark as draft</SecondaryButton>
            <SecondaryButton onClick={() => setDraft(null)}>Cancel</SecondaryButton>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-brand-ink/50">Loading advertisers…</p>
      ) : adverts.length === 0 ? (
        <div>
          <EmptyNote>
            No advertisers yet. These are real local businesses — none are created for you. The slots
            below show what the public advertising page is holding open.
          </EmptyNote>
          <div className="mt-5">
            <ContentSlotGrid count={3} kind="advertisement" />
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {adverts.map((advert) => {
            const problems = advertPublishBlockers(advert);
            const live = advert.contentStatus === 'published' && advert.runState === 'active' && inWindow(advert);
            return (
              <li key={advert.id} className="rounded-2xl bg-brand-cream p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold">{advert.businessName}</p>
                      <StatusPill status={advert.contentStatus} />
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${RUN_STATE_STYLES[advert.runState]}`}>
                        {advert.runState}
                      </span>
                      {live && (
                        <span className="rounded-full bg-brand-olive px-2.5 py-1 text-[11px] font-bold uppercase text-white">
                          Publicly visible
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-brand-ink/55">
                      {ADVERT_PACKAGES.find((p) => p.value === advert.package)?.label ?? advert.package}
                      {advert.category ? ` · ${advert.category}` : ''}
                      {advert.startDate || advert.endDate
                        ? ` · ${advert.startDate ?? '…'} to ${advert.endDate ?? '…'}`
                        : ''}
                    </p>
                    {problems.length > 0 && (
                      <p className="mt-1.5 text-sm text-amber-800">
                        Incomplete — still needs {problems.join(', ')}.
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <SecondaryButton onClick={() => setDraft(advert)}>Edit</SecondaryButton>
                    {advert.contentStatus === 'published' ? (
                      <SecondaryButton onClick={() => run(() => setAdvertStatus(advert.id, 'draft'))}>
                        Unpublish
                      </SecondaryButton>
                    ) : (
                      <SecondaryButton onClick={() => publish(advert)}>Publish</SecondaryButton>
                    )}
                    {advert.runState === 'active' ? (
                      <SecondaryButton onClick={() => run(() => setAdvertRunState(advert.id, 'paused'))}>
                        Pause
                      </SecondaryButton>
                    ) : (
                      <SecondaryButton onClick={() => run(() => setAdvertRunState(advert.id, 'active'))}>
                        Resume
                      </SecondaryButton>
                    )}
                    <SecondaryButton tone="danger" onClick={() => run(() => setAdvertStatus(advert.id, 'archived'))}>
                      Archive
                    </SecondaryButton>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* The existing intake tool, kept as the first step of the same workflow. */}
      <div className="mt-8 border-t border-brand-olive/10 pt-6">
        <button
          type="button"
          onClick={() => setShowStudio((value) => !value)}
          aria-expanded={showStudio}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-brand-olive/20 bg-white px-5 py-2.5 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-olive"
        >
          {showStudio ? 'Hide' : 'Open'} the Local Promotion Studio
        </button>
        <p className="mt-2 text-sm text-brand-ink/55">
          Drafts an advert from an approved directory listing and saves it here as a new advertiser.
        </p>
        {showStudio && (
          <div className="mt-6">
            <RadioAdvertiserStudio onSaved={load} />
          </div>
        )}
      </div>
    </Panel>
  );
};
