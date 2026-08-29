import React, { useMemo, useState } from 'react';
import { Send, ShieldCheck, Ban, AlertCircle, CheckCircle2, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { hubService } from '../../services/hubService';
import { DirectoryListing } from '../../types';

const MAX_BATCH = 25;

type Listing = DirectoryListing;

interface Props {
  listings: DirectoryListing[];
  onRefresh: () => Promise<void> | void;
}

interface RunResult {
  sent: number;
  skipped: number;
  skippedReasons?: Record<string, string>;
  errors: string[];
  message?: string;
  error?: string;
}

/**
 * Human-in-the-loop approval for directory outreach.
 *
 * The previous UI was a single "Run Outreach" button that invoked
 * directory-outreach with no body. The function then emailed every listing
 * with outreach_status = 'not_contacted' — 146+ real businesses from the seed
 * migration — with no per-recipient review.
 *
 * The function now requires an explicit list of ids AND outreach_approved on
 * each row (see supabase/functions/directory-outreach/index.ts). This is where
 * a human does that approving: one business at a time, deliberately, with the
 * approval recorded against their account.
 */
export const OutreachApproval: React.FC<Props> = ({ listings, onRefresh }) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState('');

  const contactable = useMemo(
    () => listings.filter(l => l.email && !l.outreachOptedOut && l.outreachStatus === 'not_contacted'),
    [listings],
  );
  const approved = useMemo(() => contactable.filter(l => l.outreachApproved), [contactable]);
  const awaiting = useMemo(() => contactable.filter(l => !l.outreachApproved), [contactable]);
  const contacted = useMemo(() => listings.filter(l => l.outreachStatus === 'contacted'), [listings]);
  const optedOut = useMemo(() => listings.filter(l => l.outreachOptedOut), [listings]);

  const toggleApproval = async (listing: Listing) => {
    setBusyId(listing.id); setError('');
    const { error: err } = await hubService.setOutreachApproval(listing.id, !listing.outreachApproved);
    setBusyId(null);
    if (err) { setError(`Could not update approval: ${err}`); return; }
    if (listing.outreachApproved) {
      setSelected(prev => { const next = new Set(prev); next.delete(listing.id); return next; });
    }
    await onRefresh();
  };

  const optOut = async (listing: Listing) => {
    setBusyId(listing.id); setError('');
    const { error: err } = await hubService.setOutreachOptOut(listing.id, true);
    setBusyId(null);
    if (err) { setError(`Could not record opt-out: ${err}`); return; }
    setSelected(prev => { const next = new Set(prev); next.delete(listing.id); return next; });
    await onRefresh();
  };

  const toggleSelected = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < MAX_BATCH) next.add(id);
      return next;
    });
  };

  const selectAllApproved = () => setSelected(new Set(approved.slice(0, MAX_BATCH).map(l => l.id)));

  const send = async () => {
    const listingIds = [...selected];
    if (listingIds.length === 0) return;

    const names = approved.filter(l => selected.has(l.id)).map(l => l.vendorName);
    const preview = names.slice(0, 5).join(', ') + (names.length > 5 ? ` and ${names.length - 5} more` : '');
    if (!window.confirm(`Send the directory invitation email to ${listingIds.length} business${listingIds.length === 1 ? '' : 'es'}?\n\n${preview}\n\nThis cannot be undone.`)) return;

    setRunning(true); setResult(null); setError('');
    try {
      const { data, error: fnError } = await supabase.functions.invoke('directory-outreach', {
        body: { listingIds },
      });
      if (fnError) throw fnError;
      setResult(data as RunResult);
      setSelected(new Set());
    } catch (err) {
      setResult({ sent: 0, skipped: 0, errors: [err instanceof Error ? err.message : String(err)] });
    } finally {
      setRunning(false);
      await onRefresh();
    }
  };

  const row = (listing: Listing) => (
    <li key={listing.id} className="flex items-center gap-3 py-3 border-b border-brand-olive/5 last:border-0">
      {listing.outreachApproved && (
        <input
          type="checkbox"
          aria-label={`Select ${listing.vendorName} to send`}
          checked={selected.has(listing.id)}
          onChange={() => toggleSelected(listing.id)}
          className="w-4 h-4 accent-brand-olive shrink-0"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="font-bold text-sm truncate">{listing.vendorName}</p>
        <p className="text-xs text-brand-ink/50 truncate">
          {listing.email}{listing.location ? ` · ${listing.location}` : ''}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button" onClick={() => toggleApproval(listing)} disabled={busyId === listing.id}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all disabled:opacity-40 ${
            listing.outreachApproved
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-brand-cream text-brand-ink/60 hover:bg-brand-olive/10'
          }`}
        >
          {listing.outreachApproved ? 'Approved' : 'Approve'}
        </button>
        <button
          type="button" onClick={() => optOut(listing)} disabled={busyId === listing.id}
          title="Mark as opted out — never contact"
          className="p-1.5 rounded-full text-brand-ink/30 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-40"
        >
          <Ban size={14} />
        </button>
      </div>
    </li>
  );

  return (
    <div className="bg-white rounded-[32px] border border-brand-olive/5 shadow-sm p-6 space-y-5">
      <div>
        <h3 className="font-serif text-xl mb-1">Directory Outreach</h3>
        <p className="text-xs text-brand-ink/50">
          Approve each business individually, then choose who to email. Nothing is
          ever sent without both steps.
        </p>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-brand-ink/50">
        <span><span className="font-bold text-amber-600">{awaiting.length}</span> awaiting approval</span>
        <span><span className="font-bold text-brand-olive">{approved.length}</span> approved, not yet sent</span>
        <span><span className="font-bold text-green-600">{contacted.length}</span> contacted</span>
        <span><span className="font-bold text-red-500">{optedOut.length}</span> opted out</span>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-red-600 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {approved.length > 0 && (
        <div className="rounded-2xl bg-brand-olive/5 border border-brand-olive/10 p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm font-bold flex items-center gap-2">
              <ShieldCheck size={16} className="text-brand-olive" />
              {selected.size} of {approved.length} approved selected
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button" onClick={selectAllApproved}
                className="px-3 py-1.5 rounded-full text-xs font-bold bg-white border border-brand-olive/10 hover:bg-brand-olive/5"
              >
                Select all {approved.length > MAX_BATCH ? `(first ${MAX_BATCH})` : ''}
              </button>
              <button
                type="button" onClick={send} disabled={running || selected.size === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-olive text-white rounded-full text-sm font-bold hover:bg-brand-olive/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {running
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending…</>
                  : <><Send size={14} /> Send to {selected.size}</>}
              </button>
            </div>
          </div>
          <p className="text-[11px] text-brand-ink/40">
            A single run sends to at most {MAX_BATCH} businesses.
          </p>
        </div>
      )}

      {result && (
        <div className={`rounded-2xl p-4 text-sm ${result.error || result.errors?.length ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
          {result.error ? (
            <p className="text-amber-800">{result.error}</p>
          ) : (
            <>
              <p className="font-bold mb-1 flex items-center gap-2">
                <CheckCircle2 size={15} />
                {result.sent} email{result.sent === 1 ? '' : 's'} sent
                {result.skipped > 0 && ` · ${result.skipped} skipped`}
              </p>
              {result.message && <p className="text-brand-ink/60">{result.message}</p>}
              {result.skippedReasons && Object.keys(result.skippedReasons).length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {Object.entries(result.skippedReasons).map(([id, reason]) => (
                    <li key={id} className="text-xs text-brand-ink/50">
                      {listings.find(l => l.id === id)?.vendorName ?? id}: {reason}
                    </li>
                  ))}
                </ul>
              )}
              {result.errors?.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {result.errors.map((e, i) => <li key={i} className="text-red-600 text-xs">{e}</li>)}
                </ul>
              )}
            </>
          )}
        </div>
      )}

      {approved.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-ink/40 mb-1">Approved</p>
          <ul>{approved.map(row)}</ul>
        </div>
      )}

      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-ink/40 mb-1">Awaiting approval</p>
        {awaiting.length === 0 ? (
          <div className="py-8 text-center text-brand-ink/40">
            <Mail size={24} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">Nothing waiting. Every contactable listing has been reviewed.</p>
          </div>
        ) : (
          <ul>{awaiting.slice(0, 50).map(row)}</ul>
        )}
        {awaiting.length > 50 && (
          <p className="text-xs text-brand-ink/40 pt-3">
            Showing the first 50 of {awaiting.length}.
          </p>
        )}
      </div>
    </div>
  );
};
