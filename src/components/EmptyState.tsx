import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  /** Lucide icon component, e.g. `Coins`. */
  icon: LucideIcon;
  /** Short, specific heading — "Finance Centre", not "No data". */
  title: string;
  /** One or two sentences explaining what will appear here and when. */
  description: string;
  /** Shows the "Coming Soon" pill. Off for sections that are wired up but
   *  simply have nothing in them yet. */
  comingSoon?: boolean;
  /** Optional footnote, e.g. where the data will come from once connected. */
  note?: string;
  /** Tightens the padding for use inside an existing card. */
  compact?: boolean;
}

/**
 * The single empty/awaiting-content state for the whole application.
 *
 * Several screens used to fill this gap with invented content — fabricated
 * invoices, advertisers, staff, bands and venues — which a visitor or a
 * founder could not tell from real records. Everything that has nothing to
 * show now renders this instead: clearly unfinished, deliberately so, and
 * never fictional.
 *
 * Wording should say what will appear and leave the impression of a project
 * being built, not one that is broken.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon, title, description, comingSoon = false, note, compact = false,
}) => (
  <div
    className={`text-center ${compact ? 'py-10 px-6' : 'py-16 px-8'}`}
    role="status"
  >
    <div className="w-20 h-20 rounded-full bg-brand-olive/10 flex items-center justify-center mx-auto mb-6">
      <Icon size={30} className="text-brand-olive/40" />
    </div>

    {comingSoon && (
      <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-brand-olive bg-brand-olive/10 px-3 py-1.5 rounded-full mb-4">
        Coming Soon
      </span>
    )}

    <h3 className="text-2xl font-serif mb-3">{title}</h3>

    <p className="text-brand-ink/50 max-w-md mx-auto leading-relaxed">
      {description}
    </p>

    {note && (
      <p className="text-xs text-brand-ink/35 max-w-md mx-auto mt-4 leading-relaxed">
        {note}
      </p>
    )}
  </div>
);
