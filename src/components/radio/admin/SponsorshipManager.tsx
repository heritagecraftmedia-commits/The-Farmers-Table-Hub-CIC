// Sponsorship placements (spec §13).
//
// An advertiser (radio_sponsors) can sponsor many different things. This panel
// manages those placements in radio_sponsorships. It reuses the advertisers
// created in the advertising panel rather than holding its own client list.

import React, { useCallback, useEffect, useState } from 'react';
import { Handshake, Plus, Trash2, X } from 'lucide-react';

import {
  EmptyNote, ErrorNote, Panel, PrimaryButton, SecondaryButton,
  SelectField, TextArea, TextField, describeError,
} from './adminUi';
import { StatusPill } from '../StatusPill';
import { ContentSlotGrid } from '../ContentSlot';
import {
  deleteSponsorship, getAllAdverts, getAllProgrammes, getAllSponsorships,
  getPromotableEvents, saveSponsorship, setSponsorshipStatus,
} from '../../../services/radio/stationService';
import { SPONSORSHIP_TYPES } from '../../../services/radio/types';
import type {
  RadioAdvert, RadioContentStatus, RadioProgramme, RadioSponsorship, SponsorshipType,
} from '../../../services/radio/types';

const blank = (): Partial<RadioSponsorship> => ({
  sponsorId: '', sponsorshipType: 'programme', status: 'draft',
  programmeId: null, eventId: null, package: '',
});

export const SponsorshipManager: React.FC = () => {
  const [sponsorships, setSponsorships] = useState<RadioSponsorship[]>([]);
  const [adverts, setAdverts] = useState<RadioAdvert[]>([]);
  const [programmes, setProgrammes] = useState<RadioProgramme[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [draft, setDraft] = useState<Partial<RadioSponsorship> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [placements, clients, shows, upcoming] = await Promise.all([
        getAllSponsorships(), getAllAdverts(), getAllProgrammes(), getPromotableEvents(40),
      ]);
      setSponsorships(placements);
      setAdverts(clients);
      setProgrammes(shows);
      setEvents(upcoming);
      setError(null);
    } catch (loadError) {
      setError(describeError(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (patch: Partial<RadioSponsorship>) =>
    setDraft((current) => ({ ...(current ?? {}), ...patch }));

  /**
   * Refresh before opening the form: an advertiser added in the Advertising
   * panel above would otherwise be missing from the sponsor list until the
   * whole page was reloaded.
   */
  const openForm = async () => {
    if (draft) { setDraft(null); return; }
    await load();
    setDraft(blank());
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft?.sponsorId) {
      setError('Choose which advertiser is sponsoring before saving.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await saveSponsorship({ ...draft, sponsorId: draft.sponsorId } as RadioSponsorship);
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

  const type = draft?.sponsorshipType ?? 'programme';

  return (
    <Panel
      title="Sponsorship"
      icon={Handshake}
      description="Who is sponsoring what. A placement is only publicly visible once it is published and inside its dates."
      action={
        <PrimaryButton
          onClick={openForm}
          disabled={adverts.length === 0 && !draft}
        >
          {draft ? <><X size={15} aria-hidden="true" /> Cancel</> : <><Plus size={15} aria-hidden="true" /> Add sponsorship</>}
        </PrimaryButton>
      }
    >
      <ErrorNote message={error} />

      {adverts.length === 0 && !isLoading && (
        <p className="mb-6 rounded-2xl bg-brand-cream p-4 text-sm text-brand-ink/65">
          Add an advertiser in the Advertising panel first — sponsorships attach to a real business
          rather than being typed in again here.
        </p>
      )}

      {draft && (
        <form onSubmit={handleSave} className="mb-8 rounded-2xl bg-brand-cream p-6">
          <h3 className="mb-5 font-bold">{draft.id ? 'Edit sponsorship' : 'New sponsorship'}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Sponsor"
              value={draft.sponsorId ?? ''}
              onChange={(v) => set({ sponsorId: v })}
              options={[
                { value: '', label: 'Choose an advertiser…' },
                ...adverts.map((a) => ({ value: a.id, label: a.businessName })),
              ]}
            />
            <SelectField
              label="Sponsoring what"
              value={type}
              onChange={(v) => set({ sponsorshipType: v as SponsorshipType, programmeId: null, eventId: null })}
              options={SPONSORSHIP_TYPES}
            />
            {['programme', 'segment'].includes(type) && (
              <SelectField
                label="Programme"
                value={draft.programmeId ?? ''}
                onChange={(v) => set({ programmeId: v || null })}
                options={[
                  { value: '', label: 'Not set' },
                  ...programmes.map((p) => ({ value: p.id, label: p.title })),
                ]}
              />
            )}
            {type === 'event' && (
              <SelectField
                label="Event"
                value={draft.eventId ?? ''}
                onChange={(v) => set({ eventId: v || null })}
                options={[
                  { value: '', label: 'Not set' },
                  ...events.map((e: any) => ({ value: e.id, label: e.title })),
                ]}
              />
            )}
            <TextField label="Package description" value={draft.package ?? ''} onChange={(v) => set({ package: v })} />
            <TextField label="Starts" type="date" value={draft.startDate ?? ''} onChange={(v) => set({ startDate: v || null })} />
            <TextField label="Ends" type="date" value={draft.endDate ?? ''} onChange={(v) => set({ endDate: v || null })} />
            <SelectField
              label="Status"
              hint="Only Published or Live is visible publicly."
              value={draft.status ?? 'draft'}
              onChange={(v) => set({ status: v as RadioContentStatus })}
              options={[
                { value: 'draft', label: 'Draft' },
                { value: 'approved', label: 'Approved' },
                { value: 'published', label: 'Published' },
                { value: 'live', label: 'Live' },
                { value: 'expired', label: 'Expired' },
                { value: 'archived', label: 'Archived' },
              ]}
            />
            <TextField label="Sponsorship audio URL" value={draft.audioUrl ?? ''} onChange={(v) => set({ audioUrl: v })} className="sm:col-span-2" />
            <TextField label="Sponsorship artwork URL" value={draft.artworkUrl ?? ''} onChange={(v) => set({ artworkUrl: v })} className="sm:col-span-2" />
            <TextArea label="Notes" value={draft.notes ?? ''} onChange={(v) => set({ notes: v })} rows={2} className="sm:col-span-2" />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <PrimaryButton type="submit" busy={isSaving} disabled={!draft.sponsorId}>Save sponsorship</PrimaryButton>
            <SecondaryButton onClick={() => setDraft(null)}>Cancel</SecondaryButton>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-brand-ink/50">Loading sponsorships…</p>
      ) : sponsorships.length === 0 ? (
        <div>
          <EmptyNote>
            No sponsorships yet. These are real community partners — none are created for you.
          </EmptyNote>
          <div className="mt-5">
            <ContentSlotGrid count={2} kind="sponsorship" className="grid gap-4 sm:grid-cols-2" />
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {sponsorships.map((sponsorship) => (
            <li key={sponsorship.id} className="flex flex-wrap items-start justify-between gap-3 rounded-2xl bg-brand-cream p-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold">{sponsorship.sponsorName ?? 'Unknown sponsor'}</p>
                  <StatusPill status={sponsorship.status} />
                </div>
                <p className="mt-1 text-sm text-brand-ink/55">
                  {SPONSORSHIP_TYPES.find((t) => t.value === sponsorship.sponsorshipType)?.label}
                  {sponsorship.programmeTitle ? ` · ${sponsorship.programmeTitle}` : ''}
                  {sponsorship.startDate || sponsorship.endDate
                    ? ` · ${sponsorship.startDate ?? '…'} to ${sponsorship.endDate ?? '…'}`
                    : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <SecondaryButton onClick={() => setDraft(sponsorship)}>Edit</SecondaryButton>
                {['published', 'live'].includes(sponsorship.status) ? (
                  <SecondaryButton onClick={() => run(() => setSponsorshipStatus(sponsorship.id, 'draft'))}>
                    Unpublish
                  </SecondaryButton>
                ) : (
                  <SecondaryButton onClick={() => run(() => setSponsorshipStatus(sponsorship.id, 'published'))}>
                    Publish
                  </SecondaryButton>
                )}
                <SecondaryButton tone="danger" onClick={() => run(() => deleteSponsorship(sponsorship.id))}>
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
