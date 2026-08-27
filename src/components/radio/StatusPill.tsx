import React from 'react';
import type { RadioContentStatus } from '../../services/radio/types';

// Status is never conveyed by colour alone — every pill carries its label
// as text as well (spec §25).
const STATUS_STYLES: Record<RadioContentStatus, string> = {
  draft: 'bg-brand-ink/10 text-brand-ink/70',
  pending: 'bg-amber-100 text-amber-900',
  approved: 'bg-sky-100 text-sky-900',
  scheduled: 'bg-indigo-100 text-indigo-900',
  live: 'bg-red-100 text-red-900',
  published: 'bg-emerald-100 text-emerald-900',
  archived: 'bg-brand-ink/10 text-brand-ink/60',
  expired: 'bg-brand-ink/10 text-brand-ink/50',
  rejected: 'bg-rose-100 text-rose-900',
};

const STATUS_LABELS: Record<RadioContentStatus, string> = {
  draft: 'Draft',
  pending: 'Pending approval',
  approved: 'Approved',
  scheduled: 'Scheduled',
  live: 'Live',
  published: 'Published',
  archived: 'Archived',
  expired: 'Expired',
  rejected: 'Rejected',
};

export const StatusPill: React.FC<{ status: RadioContentStatus; className?: string }> = ({
  status, className = '',
}) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${STATUS_STYLES[status]} ${className}`}>
    {STATUS_LABELS[status]}
  </span>
);
