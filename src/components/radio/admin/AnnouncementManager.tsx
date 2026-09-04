// Community announcements (spec §14).

import React, { useCallback, useEffect, useState } from 'react';
import { Megaphone, Plus, X } from 'lucide-react';

import {
  EmptyNote, ErrorNote, Panel, PrimaryButton, SecondaryButton,
  SelectField, TextArea, TextField, describeError,
} from './adminUi';
import { StatusPill } from '../StatusPill';
import {
  getAllAnnouncements, saveAnnouncement, setAnnouncementStatus,
} from '../../../services/radio/stationService';
import type { AnnouncementType, RadioAnnouncement, RadioContentStatus } from '../../../services/radio/types';

const TYPES: { value: AnnouncementType; label: string }[] = [
  { value: 'notice', label: 'Local notice' },
  { value: 'charity', label: 'Charity announcement' },
  { value: 'meeting', label: 'Community meeting' },
  { value: 'fundraiser', label: 'Fundraiser' },
  { value: 'public_information', label: 'Public information' },
  { value: 'volunteer', label: 'Volunteer opportunity' },
  { value: 'local_project', label: 'Local project' },
  { value: 'emergency', label: 'Emergency information' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const blank = (): Partial<RadioAnnouncement> => ({
  title: '', content: '', organisationName: '', announcementType: 'notice',
  priority: 'normal', status: 'draft', isActive: true,
});

export const AnnouncementManager: React.FC = () => {
  const [announcements, setAnnouncements] = useState<RadioAnnouncement[]>([]);
  const [draft, setDraft] = useState<Partial<RadioAnnouncement> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setAnnouncements(await getAllAnnouncements()); setError(null); }
    catch (loadError) { setError(describeError(loadError)); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (patch: Partial<RadioAnnouncement>) =>
    setDraft((current) => ({ ...(current ?? {}), ...patch }));

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft?.title || !draft?.content) return;
    setIsSaving(true);
    setError(null);
    try {
      await saveAnnouncement({ ...draft, title: draft.title, content: draft.content } as RadioAnnouncement);
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

  return (
    <Panel
      title="Community announcements"
      icon={Megaphone}
      description="Local notices, charity appeals, meetings and public information. Published announcements appear on the radio noticeboard within their date window."
      action={
        <PrimaryButton onClick={() => setDraft(draft ? null : blank())}>
          {draft ? <><X size={15} aria-hidden="true" /> Cancel</> : <><Plus size={15} aria-hidden="true" /> Add announcement</>}
        </PrimaryButton>
      }
    >
      <ErrorNote message={error} />

      {draft && (
        <form onSubmit={handleSave} className="mb-8 rounded-2xl bg-brand-cream p-6">
          <h3 className="mb-5 font-bold">{draft.id ? 'Edit announcement' : 'New announcement'}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Title" required value={draft.title ?? ''} onChange={(v) => set({ title: v })} />
            <TextField label="Organisation" value={draft.organisationName ?? ''} onChange={(v) => set({ organisationName: v })} />
            <SelectField
              label="Type"
              value={draft.announcementType ?? 'notice'}
              onChange={(v) => set({ announcementType: v as AnnouncementType })}
              options={TYPES}
            />
            <SelectField
              label="Priority"
              value={draft.priority ?? 'normal'}
              onChange={(v) => set({ priority: v as RadioAnnouncement['priority'] })}
              options={PRIORITIES}
            />
            <TextField label="Runs from" type="date" value={draft.startDate ?? ''} onChange={(v) => set({ startDate: v || null })} />
            <TextField label="Runs until" type="date" value={draft.endDate ?? ''} onChange={(v) => set({ endDate: v || null })} />
            <TextField label="Website" value={draft.website ?? ''} onChange={(v) => set({ website: v })} />
            <TextField label="Contact email" type="email" value={draft.contactEmail ?? ''} onChange={(v) => set({ contactEmail: v })} />
            <TextField
              label="Audio version URL"
              hint="Optional recorded announcement for broadcast."
              value={draft.audioUrl ?? ''}
              onChange={(v) => set({ audioUrl: v })}
              className="sm:col-span-2"
            />
            <TextArea label="Announcement" value={draft.content ?? ''} onChange={(v) => set({ content: v })} rows={4} className="sm:col-span-2" />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <PrimaryButton type="submit" busy={isSaving}>Save announcement</PrimaryButton>
            <SecondaryButton onClick={() => setDraft(null)}>Cancel</SecondaryButton>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-brand-ink/50">Loading announcements…</p>
      ) : announcements.length === 0 ? (
        <EmptyNote>
          No announcements yet. These are real community notices — nothing is written for you.
        </EmptyNote>
      ) : (
        <ul className="space-y-3">
          {announcements.map((announcement) => (
            <li key={announcement.id} className="rounded-2xl bg-brand-cream p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold">{announcement.title}</p>
                    <StatusPill status={announcement.status} />
                    {announcement.priority !== 'normal' && (
                      <span className="rounded-full bg-brand-olive/10 px-2.5 py-1 text-[11px] font-bold uppercase text-brand-olive">
                        {announcement.priority}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-brand-ink/55">
                    {announcement.organisationName ?? 'No organisation'} · {announcement.announcementType.replace(/_/g, ' ')}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <SecondaryButton onClick={() => setDraft(announcement)}>Edit</SecondaryButton>
                  {announcement.status === 'published' ? (
                    <SecondaryButton onClick={() => run(() => setAnnouncementStatus(announcement.id, 'draft'))}>
                      Unpublish
                    </SecondaryButton>
                  ) : (
                    <SecondaryButton onClick={() => run(() => setAnnouncementStatus(announcement.id, 'published'))}>
                      Publish
                    </SecondaryButton>
                  )}
                  <SecondaryButton tone="danger" onClick={() => run(() => setAnnouncementStatus(announcement.id, 'expired'))}>
                    Expire
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
