import React, { useEffect, useState } from 'react';
import {
  Calendar, MapPin, ExternalLink, Check, X, HelpCircle, Pencil,
  AlertTriangle, Info, RefreshCw,
} from 'lucide-react';
import {
  pendingEventsService, PendingEvent, PendingStatus,
} from '../../services/pendingEventsService';
import { EventCategory } from '../../types';

/**
 * What's On discovery review queue.
 *
 * The assistant recommends; a human decides. Every candidate shows its
 * evidence - source link, confidence score and the rationale behind its
 * category and score - so the reviewer can check the machine's reasoning
 * rather than trust it. Nothing on this screen publishes automatically.
 */

const CATEGORIES: EventCategory[] = [
  'Wood & Furniture', 'Textiles & Clothing', 'Pottery & Ceramics',
  'Metal & Tools', 'Heritage & Skills', 'Workshops & Talks',
  'Food & Produce', 'Community', 'Other',
];

const formatDate = (iso: string | null): string => {
  if (!iso) return 'No date';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Invalid date';
  return d.toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
};

const scoreTone = (score: number | null): string => {
  if (score === null) return 'bg-brand-cream text-brand-ink/60';
  if (score >= 70) return 'bg-green-100 text-green-800';
  if (score >= 50) return 'bg-amber-100 text-amber-800';
  return 'bg-red-100 text-red-800';
};

export const WhatsOnReview: React.FC<{ onPublished?: () => void }> = ({ onPublished }) => {
  const [items, setItems] = useState<PendingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<PendingEvent>>({});
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [filter, setFilter] = useState<PendingStatus[]>(['pending', 'needs_verification']);

  const load = async () => {
    setLoading(true);
    setItems(await pendingEventsService.list(filter));
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter.join(',')]);

  const approve = async (item: PendingEvent) => {
    setBusyId(item.id);
    const result = await pendingEventsService.approve(item.id);
    setBusyId(null);
    if (result.ok) {
      setNotice({ tone: 'ok', text: `"${item.title}" published to What's On.` });
      onPublished?.();
      load();
    } else {
      // The candidate is untouched when promotion fails - it stays reviewable.
      setNotice({
        tone: 'error',
        text: `Could not publish "${item.title}": ${result.error}. The candidate has been left in the queue.`,
      });
    }
  };

  const reject = async (item: PendingEvent) => {
    if (rejectReason.trim() === '') {
      setNotice({ tone: 'error', text: 'A rejection reason is required.' });
      return;
    }
    setBusyId(item.id);
    const ok = await pendingEventsService.reject(item.id, rejectReason);
    setBusyId(null);
    setRejecting(null);
    setRejectReason('');
    setNotice(ok
      ? { tone: 'ok', text: `"${item.title}" rejected. It will not be suggested again.` }
      : { tone: 'error', text: `Could not reject "${item.title}".` });
    if (ok) load();
  };

  const needsVerification = async (item: PendingEvent) => {
    setBusyId(item.id);
    const ok = await pendingEventsService.markNeedsVerification(item.id);
    setBusyId(null);
    setNotice(ok
      ? { tone: 'ok', text: `"${item.title}" kept for later verification.` }
      : { tone: 'error', text: `Could not update "${item.title}".` });
    if (ok) load();
  };

  const saveEdit = async (item: PendingEvent) => {
    setBusyId(item.id);
    const ok = await pendingEventsService.update(item.id, {
      title: draft.title,
      description: draft.description,
      startDate: draft.startDate,
      venue: draft.venue,
      location: draft.location,
      websiteUrl: draft.websiteUrl,
      category: draft.category as EventCategory,
    });
    setBusyId(null);
    setEditing(null);
    setNotice(ok
      ? { tone: 'ok', text: 'Corrections saved.' }
      : { tone: 'error', text: 'Could not save corrections.' });
    if (ok) load();
  };

  const startEdit = (item: PendingEvent) => {
    setEditing(item.id);
    setDraft({
      title: item.title, description: item.description, startDate: item.startDate,
      venue: item.venue, location: item.location, websiteUrl: item.websiteUrl,
      category: item.category,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-brand-ink">What's On Discovery Queue</h2>
          <p className="text-sm text-brand-ink/60">
            Candidates found by the weekly discovery run. Nothing here is public until you approve it.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {([
            ['Awaiting review', ['pending', 'needs_verification']],
            ['Rejected', ['rejected']],
            ['Published', ['approved']],
          ] as [string, PendingStatus[]][]).map(([label, statuses]) => (
            <button
              key={label}
              onClick={() => setFilter(statuses)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                filter.join(',') === statuses.join(',')
                  ? 'bg-brand-olive text-white'
                  : 'bg-white text-brand-ink/60 border border-brand-olive/10 hover:bg-brand-cream'
              }`}
            >
              {label}
            </button>
          ))}
          <button
            onClick={load}
            className="p-2 rounded-full bg-white border border-brand-olive/10 hover:bg-brand-cream"
            aria-label="Refresh the queue"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {notice && (
        <div className={`flex items-start gap-2 p-3 rounded-xl text-sm ${
          notice.tone === 'ok' ? 'bg-green-50 text-green-900' : 'bg-red-50 text-red-900'
        }`}>
          {notice.tone === 'ok' ? <Check size={16} className="mt-0.5" /> : <AlertTriangle size={16} className="mt-0.5" />}
          <span className="flex-1">{notice.text}</span>
          <button onClick={() => setNotice(null)} aria-label="Dismiss"><X size={14} /></button>
        </div>
      )}

      {loading && <p className="text-sm text-brand-ink/50">Loading the queue...</p>}

      {!loading && items.length === 0 && (
        <div className="p-8 text-center bg-white rounded-2xl border border-brand-olive/10">
          <Calendar size={28} className="mx-auto mb-3 text-brand-ink/20" />
          <p className="font-bold text-brand-ink">Nothing in this queue</p>
          <p className="text-sm text-brand-ink/50 mt-1">
            The weekly discovery run stages candidates here every Tuesday. If a source has
            not been configured yet, the run exits without staging anything.
          </p>
        </div>
      )}

      {items.map(item => (
        <article key={item.id} className="bg-white rounded-2xl border border-brand-olive/10 p-5 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {editing === item.id ? (
                <input
                  className="w-full font-black text-lg border-b border-brand-olive/30 focus:outline-none"
                  value={draft.title ?? ''}
                  onChange={e => setDraft({ ...draft, title: e.target.value })}
                />
              ) : (
                <h3 className="font-black text-lg text-brand-ink">{item.title}</h3>
              )}
              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-brand-ink/60">
                <span className="flex items-center gap-1">
                  <Calendar size={13} /> {formatDate(item.startDate)}
                </span>
                {(item.venue || item.location) && (
                  <span className="flex items-center gap-1">
                    <MapPin size={13} /> {[item.venue, item.location].filter(Boolean).join(', ')}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${scoreTone(item.confidenceScore)}`}>
                {item.confidenceScore === null ? 'No score' : `${item.confidenceScore}/100`}
              </span>
              {editing === item.id ? (
                <select
                  className="px-2 py-1 rounded-full text-xs font-bold bg-brand-cream border border-brand-olive/20"
                  value={draft.category ?? item.category}
                  onChange={e => setDraft({ ...draft, category: e.target.value as EventCategory })}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-brand-cream text-brand-olive">
                  {item.category}
                </span>
              )}
            </div>
          </div>

          {editing === item.id ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <input className="p-2 rounded-lg border border-brand-olive/20 text-sm" placeholder="Venue"
                value={draft.venue ?? ''} onChange={e => setDraft({ ...draft, venue: e.target.value })} />
              <input className="p-2 rounded-lg border border-brand-olive/20 text-sm" placeholder="Location"
                value={draft.location ?? ''} onChange={e => setDraft({ ...draft, location: e.target.value })} />
              <input className="p-2 rounded-lg border border-brand-olive/20 text-sm sm:col-span-2" placeholder="Event URL"
                value={draft.websiteUrl ?? ''} onChange={e => setDraft({ ...draft, websiteUrl: e.target.value })} />
              <textarea className="p-2 rounded-lg border border-brand-olive/20 text-sm sm:col-span-2" rows={3}
                placeholder="Description"
                value={draft.description ?? ''} onChange={e => setDraft({ ...draft, description: e.target.value })} />
            </div>
          ) : (
            item.description && <p className="text-sm text-brand-ink/70">{item.description}</p>
          )}

          {/* Evidence. This is what makes the decision the reviewer's. */}
          <div className="bg-brand-cream/50 rounded-xl p-3 space-y-2 text-xs">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-brand-ink/60">
              <span><strong>Source:</strong> {item.sourcePlatform}</span>
              <span><strong>Found:</strong> {formatDate(item.discoveredAt)}</span>
              {item.organiser && <span><strong>Organiser:</strong> {item.organiser}</span>}
            </div>
            <div className="flex flex-wrap gap-3">
              <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer"
                 className="inline-flex items-center gap-1 font-bold text-brand-olive hover:underline">
                <ExternalLink size={12} /> Listing it came from
              </a>
              {item.websiteUrl && (
                <a href={item.websiteUrl} target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-1 font-bold text-brand-olive hover:underline">
                  <ExternalLink size={12} /> Event page
                </a>
              )}
            </div>
            {item.selectionRationale && (
              <p className="flex gap-1.5 text-brand-ink/60">
                <Info size={12} className="mt-0.5 shrink-0" />
                <span><strong>Why it was selected:</strong> {item.selectionRationale}</span>
              </p>
            )}
            {item.rejectionReason && (
              <p className="text-red-700"><strong>Rejected because:</strong> {item.rejectionReason}</p>
            )}
          </div>

          {rejecting === item.id && (
            <div className="flex flex-wrap gap-2">
              <input
                autoFocus
                className="flex-1 min-w-[12rem] p-2 rounded-lg border border-red-200 text-sm"
                placeholder="Why is this being rejected? (required)"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
              />
              <button onClick={() => reject(item)} disabled={busyId === item.id}
                className="px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-bold disabled:opacity-50">
                Confirm rejection
              </button>
              <button onClick={() => { setRejecting(null); setRejectReason(''); }}
                className="px-3 py-2 rounded-lg bg-white border border-brand-olive/20 text-xs font-bold">
                Cancel
              </button>
            </div>
          )}

          {item.status !== 'approved' && rejecting !== item.id && (
            <div className="flex flex-wrap gap-2 pt-1">
              {editing === item.id ? (
                <>
                  <button onClick={() => saveEdit(item)} disabled={busyId === item.id}
                    className="px-3 py-2 rounded-lg bg-brand-olive text-white text-xs font-bold disabled:opacity-50">
                    Save corrections
                  </button>
                  <button onClick={() => setEditing(null)}
                    className="px-3 py-2 rounded-lg bg-white border border-brand-olive/20 text-xs font-bold">
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => approve(item)} disabled={busyId === item.id}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 text-white text-xs font-bold disabled:opacity-50">
                    <Check size={13} /> Approve and publish
                  </button>
                  <button onClick={() => setRejecting(item.id)} disabled={busyId === item.id}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-red-200 text-red-700 text-xs font-bold disabled:opacity-50">
                    <X size={13} /> Reject
                  </button>
                  <button onClick={() => needsVerification(item)} disabled={busyId === item.id}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-amber-200 text-amber-800 text-xs font-bold disabled:opacity-50">
                    <HelpCircle size={13} /> Needs verification
                  </button>
                  <button onClick={() => startEdit(item)} disabled={busyId === item.id}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-brand-olive/20 text-xs font-bold disabled:opacity-50">
                    <Pencil size={13} /> Edit
                  </button>
                </>
              )}
            </div>
          )}
        </article>
      ))}
    </div>
  );
};
