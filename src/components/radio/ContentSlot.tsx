// Placement slots (spec §29).
//
// Where real content does not exist yet, the station shows a clearly labelled
// slot instead of an invented business, presenter, sponsor or announcement.
// Nothing here should ever be mistaken for real production content.

import React from 'react';
import { PlusCircle } from 'lucide-react';

export type ContentSlotKind =
  | 'advertisement' | 'sponsorship' | 'programme' | 'jingle'
  | 'presenter' | 'announcement' | 'music' | 'episode' | 'event' | 'generic';

const SLOT_LABELS: Record<ContentSlotKind, string> = {
  advertisement: 'ADVERTISEMENT SLOT — READY FOR LOCAL BUSINESS',
  sponsorship: 'SPONSORSHIP SLOT — READY FOR COMMUNITY PARTNER',
  programme: 'PROGRAMME SLOT — READY FOR PROGRAMME',
  jingle: 'JINGLE SLOT — READY FOR STATION IDENT',
  presenter: 'PRESENTER SLOT — READY FOR REAL PRESENTER',
  announcement: 'ANNOUNCEMENT SLOT — READY FOR COMMUNITY NOTICE',
  music: 'MUSIC SLOT — READY FOR LOCAL ARTIST',
  episode: 'EPISODE SLOT — READY FOR RECORDING',
  event: 'EVENT SLOT — READY FOR LOCAL EVENT',
  generic: 'CONTENT SLOT — READY FOR REAL CONTENT',
};

interface ContentSlotProps {
  kind?: ContentSlotKind;
  /** Explains to staff what belongs in this slot. */
  hint?: string;
  action?: React.ReactNode;
  compact?: boolean;
  className?: string;
}

export const ContentSlot: React.FC<ContentSlotProps> = ({
  kind = 'generic', hint, action, compact = false, className = '',
}) => (
  <div
    className={`rounded-2xl border-2 border-dashed border-brand-olive/25 bg-brand-olive/[0.04] ${
      compact ? 'p-4' : 'p-6'
    } ${className}`}
  >
    <p className={`flex items-start gap-2 font-bold tracking-wide text-brand-olive ${
      compact ? 'text-[11px]' : 'text-xs'
    }`}>
      <PlusCircle size={compact ? 14 : 16} className="mt-px shrink-0" aria-hidden="true" />
      <span>{SLOT_LABELS[kind]}</span>
    </p>
    {hint && <p className="mt-2 text-sm text-brand-ink/55">{hint}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

/** Repeats a slot so an empty grid still shows its intended shape. */
export const ContentSlotGrid: React.FC<{
  count?: number;
  kind?: ContentSlotKind;
  hint?: string;
  className?: string;
}> = ({ count = 3, kind = 'generic', hint, className = 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3' }) => (
  <div className={className}>
    {Array.from({ length: count }, (_, index) => (
      <ContentSlot key={index} kind={kind} hint={index === 0 ? hint : undefined} compact />
    ))}
  </div>
);
