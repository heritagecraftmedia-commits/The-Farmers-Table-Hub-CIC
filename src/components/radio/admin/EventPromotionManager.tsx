// Events integration (spec §15).
//
// Flags EXISTING Farmers Table Hub events for radio promotion. Event details
// are never copied into the radio tables — only a link and promotion window.

import React, { useCallback, useEffect, useState } from 'react';
import { CalendarCheck, CalendarDays } from 'lucide-react';

import { EmptyNote, ErrorNote, Panel, SecondaryButton, describeError } from './adminUi';
import {
  getEventsOnAirThisWeek, getPromotableEvents, promoteEvent, unpromoteEvent,
} from '../../../services/radio/stationService';
import type { PromotedEvent } from '../../../services/radio/types';

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
    : 'Date to be confirmed';

export const EventPromotionManager: React.FC = () => {
  const [promoted, setPromoted] = useState<PromotedEvent[]>([]);
  const [available, setAvailable] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [onAir, promotable] = await Promise.all([
        getEventsOnAirThisWeek(50), getPromotableEvents(40),
      ]);
      setPromoted(onAir);
      const promotedIds = new Set(onAir.map((event) => event.eventId));
      setAvailable(promotable.filter((event: any) => !promotedIds.has(event.id)));
      setError(null);
    } catch (loadError) {
      setError(describeError(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const run = async (action: () => Promise<unknown>) => {
    setError(null);
    try { await action(); await load(); }
    catch (actionError) { setError(describeError(actionError)); }
  };

  return (
    <Panel
      title="Events on air"
      icon={CalendarCheck}
      description="Flag events from the Farmers Table Hub events directory for radio promotion. The event itself stays in the events system — this only records that the station is promoting it."
    >
      <ErrorNote message={error} />

      {isLoading ? (
        <p className="text-sm text-brand-ink/50">Loading events…</p>
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-brand-ink/50">
              Being promoted ({promoted.length})
            </h3>
            {promoted.length === 0 ? (
              <EmptyNote>No events are flagged for radio promotion yet.</EmptyNote>
            ) : (
              <ul className="space-y-2">
                {promoted.map((event) => (
                  <li key={event.eventId} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-brand-cream p-4">
                    <div className="min-w-0">
                      <p className="font-bold">{event.title}</p>
                      <p className="mt-0.5 text-sm text-brand-ink/55">
                        {formatDate(event.startDate)}{event.venue ? ` · ${event.venue}` : ''}
                      </p>
                    </div>
                    <SecondaryButton tone="danger" onClick={() => run(() => unpromoteEvent(event.eventId))}>
                      Stop promoting
                    </SecondaryButton>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-brand-ink/50">
              <CalendarDays size={14} aria-hidden="true" /> Approved events you could promote ({available.length})
            </h3>
            {available.length === 0 ? (
              <EmptyNote>
                No further approved upcoming events in the events directory.
              </EmptyNote>
            ) : (
              <ul className="space-y-2">
                {available.map((event) => (
                  <li key={event.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-brand-cream p-4">
                    <div className="min-w-0">
                      <p className="font-bold">{event.title}</p>
                      <p className="mt-0.5 text-sm text-brand-ink/55">
                        {formatDate(event.start_date)}{event.venue ? ` · ${event.venue}` : ''}
                      </p>
                    </div>
                    <SecondaryButton onClick={() => run(() => promoteEvent(event.id, { priority: 0 }))}>
                      Promote on air
                    </SecondaryButton>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Panel>
  );
};
