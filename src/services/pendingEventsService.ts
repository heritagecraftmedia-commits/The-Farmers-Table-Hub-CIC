import { supabase } from '../lib/supabase';
import { EventCategory } from '../types';
import { ExistingRecord } from './discovery/dedupe';

/**
 * pending_events - the review queue between discovery and publication.
 *
 * Nothing here publishes on its own. Promotion runs through the database
 * function approve_pending_event(), which inserts into `events` and marks
 * the candidate approved in ONE transaction: if the insert fails, the
 * candidate keeps its previous status and is not lost.
 */

const isConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return url && url !== 'https://placeholder.supabase.co' && url.includes('supabase.co');
};

export type PendingStatus = 'pending' | 'needs_verification' | 'approved' | 'rejected';

export interface PendingEvent {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string | null;
  venue: string | null;
  location: string | null;
  websiteUrl: string | null;
  organiser: string | null;
  category: EventCategory;
  sourceUrl: string;
  sourcePlatform: string;
  discoveredAt: string;
  status: PendingStatus;
  confidenceScore: number | null;
  selectionRationale: string | null;
  rejectionReason: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  dedupeKey: string;
  createdAt: string;
  updatedAt: string;
}

const fromRow = (r: any): PendingEvent => ({
  id: r.id,
  title: r.title,
  description: r.description ?? '',
  startDate: r.start_date,
  endDate: r.end_date,
  venue: r.venue,
  location: r.location,
  websiteUrl: r.website_url,
  organiser: r.organiser,
  category: r.category,
  sourceUrl: r.source_url,
  sourcePlatform: r.source_platform,
  discoveredAt: r.discovered_at,
  status: r.status,
  confidenceScore: r.confidence_score === null ? null : Number(r.confidence_score),
  selectionRationale: r.selection_rationale,
  rejectionReason: r.rejection_reason,
  reviewedAt: r.reviewed_at,
  reviewedBy: r.reviewed_by,
  dedupeKey: r.dedupe_key,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

/** Fields a reviewer may correct before approving. */
export interface PendingEventEdit {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string | null;
  venue?: string | null;
  location?: string | null;
  websiteUrl?: string | null;
  organiser?: string | null;
  category?: EventCategory;
}

/**
 * Flat shape rather than a discriminated union: this project does not enable
 * `strict`, and without strictNullChecks TypeScript will not narrow a union
 * on a boolean discriminant at the call site.
 */
export interface ApproveResult {
  ok: boolean;
  eventId?: string;
  error?: string;
}

export const pendingEventsService = {
  /** The review queue. Defaults to everything awaiting a decision. */
  list: async (statuses: PendingStatus[] = ['pending', 'needs_verification']): Promise<PendingEvent[]> => {
    if (!isConfigured()) return [];
    const { data, error } = await supabase
      .from('pending_events')
      .select('*')
      .in('status', statuses)
      .order('confidence_score', { ascending: false })
      .order('start_date', { ascending: true });
    if (error) { console.error('pendingEvents.list:', error); return []; }
    return (data ?? []).map(fromRow);
  },

  counts: async (): Promise<Record<PendingStatus, number>> => {
    const empty: Record<PendingStatus, number> = {
      pending: 0, needs_verification: 0, approved: 0, rejected: 0,
    };
    if (!isConfigured()) return empty;
    const { data, error } = await supabase.from('pending_events').select('status');
    if (error) { console.error('pendingEvents.counts:', error); return empty; }
    for (const row of data ?? []) {
      const s = (row as any).status as PendingStatus;
      if (s in empty) empty[s] += 1;
    }
    return empty;
  },

  /**
   * Everything the pipeline must dedupe against: staged candidates,
   * published events, and previously rejected candidates - so a rejected
   * event does not reappear on next week's queue.
   */
  existingForDedupe: async (): Promise<ExistingRecord[]> => {
    if (!isConfigured()) return [];
    const records: ExistingRecord[] = [];

    const { data: pending, error: pErr } = await supabase
      .from('pending_events')
      .select('title, start_date, venue, website_url, dedupe_key, status');
    if (pErr) console.error('pendingEvents.existingForDedupe(pending):', pErr);
    for (const r of pending ?? []) {
      records.push({
        title: (r as any).title,
        startDate: (r as any).start_date,
        venue: (r as any).venue,
        websiteUrl: (r as any).website_url,
        dedupeKey: (r as any).dedupe_key,
        status: (r as any).status,
        source: 'pending_events',
      });
    }

    const { data: events, error: eErr } = await supabase
      .from('events')
      .select('title, start_date, venue, website_url');
    if (eErr) console.error('pendingEvents.existingForDedupe(events):', eErr);
    for (const r of events ?? []) {
      records.push({
        title: (r as any).title,
        startDate: (r as any).start_date,
        venue: (r as any).venue,
        websiteUrl: (r as any).website_url,
        dedupeKey: null,
        status: 'published',
        source: 'events',
      });
    }

    return records;
  },

  update: async (id: string, edit: PendingEventEdit): Promise<boolean> => {
    if (!isConfigured()) return false;
    const patch: Record<string, unknown> = {};
    if (edit.title !== undefined) patch.title = edit.title;
    if (edit.description !== undefined) patch.description = edit.description;
    if (edit.startDate !== undefined) patch.start_date = edit.startDate;
    if (edit.endDate !== undefined) patch.end_date = edit.endDate;
    if (edit.venue !== undefined) patch.venue = edit.venue;
    if (edit.location !== undefined) patch.location = edit.location;
    if (edit.websiteUrl !== undefined) patch.website_url = edit.websiteUrl;
    if (edit.organiser !== undefined) patch.organiser = edit.organiser;
    if (edit.category !== undefined) patch.category = edit.category;
    if (Object.keys(patch).length === 0) return true;

    const { error } = await supabase.from('pending_events').update(patch).eq('id', id);
    if (error) { console.error('pendingEvents.update:', error); return false; }
    return true;
  },

  /**
   * Promote to `events` with approved = true.
   *
   * Delegates to the SQL function so the insert and the status change share
   * a transaction. Returns the new event id, or null with the failure left
   * intact - the candidate stays reviewable.
   */
  approve: async (id: string): Promise<ApproveResult> => {
    if (!isConfigured()) return { ok: false, error: 'Supabase is not configured.' };
    const { data, error } = await supabase.rpc('approve_pending_event', { p_id: id });
    if (error) {
      console.error('pendingEvents.approve:', error);
      return { ok: false, error: error.message };
    }
    return { ok: true, eventId: data as string };
  },

  /** Keep the record, mark it rejected, store why. */
  reject: async (id: string, reason: string): Promise<boolean> => {
    if (!isConfigured()) return false;
    const trimmed = reason.trim();
    if (trimmed === '') {
      console.error('pendingEvents.reject: a rejection reason is required.');
      return false;
    }
    const { data: session } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('pending_events')
      .update({
        status: 'rejected',
        rejection_reason: trimmed,
        reviewed_at: new Date().toISOString(),
        reviewed_by: session?.user?.id ?? null,
      })
      .eq('id', id);
    if (error) { console.error('pendingEvents.reject:', error); return false; }
    return true;
  },

  /** Park it for later. It stays in the queue. */
  markNeedsVerification: async (id: string): Promise<boolean> => {
    if (!isConfigured()) return false;
    const { data: session } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('pending_events')
      .update({
        status: 'needs_verification',
        reviewed_at: new Date().toISOString(),
        reviewed_by: session?.user?.id ?? null,
      })
      .eq('id', id);
    if (error) { console.error('pendingEvents.markNeedsVerification:', error); return false; }
    return true;
  },
};

/** Named export matching the brief's `approvePendingEvent()`. */
export const approvePendingEvent = pendingEventsService.approve;
