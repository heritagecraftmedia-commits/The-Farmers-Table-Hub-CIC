// Live status and today's running order (spec §21 LIVE STATUS / TODAY).

import React, { useCallback, useEffect, useState } from 'react';
import { Activity, RefreshCw } from 'lucide-react';

import { EmptyNote, ErrorNote, Panel, SecondaryButton, describeError } from './adminUi';
import { useRadioPlayer } from '../../../context/RadioPlayerContext';
import { getDaySchedule, getSubmissionQueue } from '../../../services/radio/stationService';
import type { RadioSubmission, ScheduleSlot } from '../../../services/radio/types';

const Stat: React.FC<{ label: string; value: string; tone?: 'default' | 'live' }> = ({
  label, value, tone = 'default',
}) => (
  <div className={`rounded-2xl p-5 ${tone === 'live' ? 'bg-brand-ink text-brand-cream' : 'bg-brand-cream'}`}>
    <p className={`text-[11px] font-bold uppercase tracking-[0.2em] ${
      tone === 'live' ? 'text-brand-cream/50' : 'text-brand-ink/45'
    }`}>
      {label}
    </p>
    <p className="mt-1.5 font-bold">{value}</p>
  </div>
);

export const LiveStatusPanel: React.FC = () => {
  const { station, status, nowPlaying, schedule, refresh } = useRadioPlayer();
  const [today, setToday] = useState<ScheduleSlot[]>([]);
  const [pending, setPending] = useState<RadioSubmission[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [slots, queue] = await Promise.all([
        getDaySchedule(new Date()),
        getSubmissionQueue('pending'),
      ]);
      setToday(slots);
      setPending(queue);
      setError(null);
    } catch (loadError) {
      setError(describeError(loadError));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const now = new Date();
  const finished = today.filter((slot) => slot.endsAt < now).length;

  return (
    <Panel
      title="Live status"
      icon={Activity}
      description={station?.name ?? 'Farmers Table Hub Community Radio'}
      action={
        <SecondaryButton onClick={() => { refresh(); load(); }}>
          <RefreshCw size={14} aria-hidden="true" /> Refresh
        </SecondaryButton>
      }
    >
      <ErrorNote message={error} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Station"
          value={status?.isOnline ? 'On air' : 'Off air'}
          tone={status?.isOnline ? 'live' : 'default'}
        />
        <Stat label="Current programme" value={schedule.current?.title ?? 'Nothing scheduled'} />
        <Stat
          label="Current presenter"
          value={schedule.current?.programme?.presenter?.name ?? schedule.current?.programme?.host ?? 'Not set'}
        />
        <Stat
          label="Current track"
          value={nowPlaying?.title ? `${nowPlaying.title}${nowPlaying.artist ? ` — ${nowPlaying.artist}` : ''}` : 'No track data'}
        />
        <Stat label="Next programme" value={schedule.next?.title ?? 'Nothing scheduled'} />
        <Stat
          label="Listeners"
          value={typeof status?.listenerCount === 'number' ? String(status.listenerCount) : 'Not reported'}
        />
        <Stat label="Today's programmes" value={`${finished} of ${today.length} finished`} />
        <Stat label="Awaiting moderation" value={`${pending.length} submission${pending.length === 1 ? '' : 's'}`} />
      </div>

      <h3 className="mb-4 mt-8 text-sm font-bold uppercase tracking-wide text-brand-ink/50">
        Today&rsquo;s running order
      </h3>
      {today.length === 0 ? (
        <EmptyNote>Nothing is scheduled for today. Add slots in the Schedule panel.</EmptyNote>
      ) : (
        <ol className="space-y-2">
          {today.map((slot) => {
            const isNow = slot.startsAt <= now && now < slot.endsAt;
            const isDone = slot.endsAt < now;
            return (
              <li
                key={slot.key}
                className={`flex flex-wrap items-center gap-3 rounded-2xl p-4 ${
                  isNow ? 'bg-brand-olive text-white' : 'bg-brand-cream'
                }`}
              >
                <span className="font-mono text-sm font-bold tabular-nums">
                  {slot.startTime}–{slot.endTime}
                </span>
                <span className="font-bold">{slot.title}</span>
                {slot.isOverride && (
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${
                    isNow ? 'bg-white/20' : 'bg-brand-olive/10 text-brand-olive'
                  }`}>
                    Special broadcast
                  </span>
                )}
                <span className={`ml-auto text-xs font-bold uppercase ${
                  isNow ? 'text-white/80' : 'text-brand-ink/45'
                }`}>
                  {isNow ? 'On air' : isDone ? 'Finished' : 'Upcoming'}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
};
