// Moderation queue for community submissions (spec §16).

import React, { useCallback, useEffect, useState } from 'react';
import { Inbox, ThumbsDown, ThumbsUp } from 'lucide-react';

import { EmptyNote, ErrorNote, Panel, SecondaryButton, describeError } from './adminUi';
import { StatusPill } from '../StatusPill';
import { getSubmissionQueue, moderateSubmission } from '../../../services/radio/stationService';
import type { RadioSubmission } from '../../../services/radio/types';

const TYPE_LABELS: Record<string, string> = {
  music: 'Music',
  announcement: 'Announcement',
  event: 'Event',
  programme_idea: 'Programme idea',
  presenter: 'Presenter application',
};

const FILTERS = [
  { value: 'pending', label: 'Awaiting review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: '', label: 'Everything' },
] as const;

export const SubmissionQueue: React.FC = () => {
  const [submissions, setSubmissions] = useState<RadioSubmission[]>([]);
  const [filter, setFilter] = useState<string>('pending');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setSubmissions(await getSubmissionQueue(filter ? (filter as any) : undefined));
      setError(null);
    } catch (loadError) {
      setError(describeError(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const moderate = async (id: string, status: 'approved' | 'rejected') => {
    setError(null);
    try {
      await moderateSubmission(id, status, notes[id]);
      await load();
    } catch (moderateError) {
      setError(describeError(moderateError));
    }
  };

  return (
    <Panel
      title="Submissions"
      icon={Inbox}
      description="Everything the public sends the station. Nothing here has been broadcast or published — approving a submission marks it ready for a person to act on."
    >
      <ErrorNote message={error} />

      <div role="group" aria-label="Filter submissions" className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map(({ value, label }) => (
          <button
            key={label}
            type="button"
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            className={`min-h-11 rounded-full px-4 py-2 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-olive ${
              filter === value ? 'bg-brand-olive text-white' : 'border border-brand-olive/15 bg-white text-brand-ink/70'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-brand-ink/50">Loading submissions…</p>
      ) : submissions.length === 0 ? (
        <EmptyNote>Nothing in this part of the queue.</EmptyNote>
      ) : (
        <ul className="space-y-4">
          {submissions.map((submission) => (
            <li key={submission.id} className="rounded-2xl bg-brand-cream p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold uppercase text-brand-olive">
                      {TYPE_LABELS[submission.submissionType] ?? submission.submissionType}
                    </span>
                    <p className="font-bold">{submission.title}</p>
                    <StatusPill status={submission.status} />
                  </div>
                  <p className="mt-1 text-sm text-brand-ink/55">
                    {submission.submitterName} · {submission.submitterEmail}
                    {submission.organisation ? ` · ${submission.organisation}` : ''}
                  </p>
                </div>
                <p className="text-xs text-brand-ink/45">
                  {new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(submission.createdAt))}
                </p>
              </div>

              {submission.description && (
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-brand-ink/75">
                  {submission.description}
                </p>
              )}
              {submission.localConnection && (
                <p className="mt-2 text-sm text-brand-ink/60">
                  <span className="font-bold">Local connection:</span> {submission.localConnection}
                </p>
              )}
              {submission.website && (
                <a href={submission.website} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-bold text-brand-olive hover:underline">
                  {submission.website}
                </a>
              )}
              {submission.fileUrl && (
                <div className="mt-3">
                  <p className="mb-1 text-xs font-bold uppercase tracking-wide text-brand-ink/50">
                    Submitted audio — not cleared for broadcast until checked
                  </p>
                  <audio controls preload="none" src={submission.fileUrl} className="w-full" />
                </div>
              )}
              {submission.moderationNotes && (
                <p className="mt-3 rounded-xl bg-white p-3 text-sm text-brand-ink/70">
                  <span className="font-bold">Notes:</span> {submission.moderationNotes}
                </p>
              )}

              {submission.status === 'pending' && (
                <div className="mt-4 flex flex-wrap items-end gap-3">
                  <label className="min-w-56 flex-1">
                    <span className="text-xs font-bold">Moderation notes (optional)</span>
                    <input
                      type="text"
                      value={notes[submission.id] ?? ''}
                      onChange={(event) => setNotes((current) => ({ ...current, [submission.id]: event.target.value }))}
                      className="mt-1 w-full rounded-xl border border-brand-olive/20 bg-white px-3 py-2.5 text-sm focus:border-brand-olive focus:outline focus:outline-2 focus:outline-brand-olive"
                    />
                  </label>
                  <SecondaryButton onClick={() => moderate(submission.id, 'approved')}>
                    <ThumbsUp size={14} aria-hidden="true" /> Approve
                  </SecondaryButton>
                  <SecondaryButton tone="danger" onClick={() => moderate(submission.id, 'rejected')}>
                    <ThumbsDown size={14} aria-hidden="true" /> Reject
                  </SecondaryButton>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
};
