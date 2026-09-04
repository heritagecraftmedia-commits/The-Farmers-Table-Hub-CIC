// Streaming provider configuration (spec §21 SYSTEM, §23, §27).
//
// Only public-safe values are edited here. Provider API credentials must live
// in Supabase secrets — this panel never asks for one.

import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, RefreshCw, Settings, ShieldAlert, Wifi } from 'lucide-react';

import {
  CheckboxField, ErrorNote, Panel, PrimaryButton, SecondaryButton,
  SelectField, TextArea, TextField, describeError,
} from './adminUi';
import { useRadioPlayer } from '../../../context/RadioPlayerContext';
import { getStation, getStreamConfig, updateStreamConfig } from '../../../services/radio/stationService';
import type { StationStreamConfig, StreamProviderId } from '../../../services/radio/types';

const PROVIDERS: { value: StreamProviderId; label: string }[] = [
  { value: 'live365', label: 'Live365' },
  { value: 'icecast', label: 'Icecast' },
  { value: 'shoutcast', label: 'Shoutcast' },
  { value: 'azuracast', label: 'AzuraCast' },
  { value: 'radioking', label: 'RadioKing' },
  { value: 'custom', label: 'Custom stream' },
];

export const StationSettingsPanel: React.FC = () => {
  const { status, refresh } = useRadioPlayer();
  const [stationId, setStationId] = useState<string | null>(null);
  const [draft, setDraft] = useState<StationStreamConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const station = await getStation();
      if (!station) {
        setError('The radio V3 migration has not been applied to this Supabase project yet.');
        return;
      }
      setStationId(station.id);
      setDraft(await getStreamConfig(station.id));
      setError(null);
    } catch (loadError) {
      setError(describeError(loadError));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (patch: Partial<StationStreamConfig>) =>
    setDraft((current) => (current ? { ...current, ...patch } : current));

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stationId || !draft) return;
    setIsSaving(true);
    setError(null);
    try {
      await updateStreamConfig(stationId, draft);
      setSaved(true);
      refresh();
      window.setTimeout(() => setSaved(false), 4000);
    } catch (saveError) {
      setError(describeError(saveError));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Panel
      title="Stream configuration"
      icon={Settings}
      description="How the website connects to the station's stream. Changing the provider here swaps the integration without any code changes."
      action={
        <SecondaryButton onClick={() => { load(); refresh(); }}>
          <RefreshCw size={14} aria-hidden="true" /> Refresh
        </SecondaryButton>
      }
    >
      <ErrorNote message={error} />

      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl bg-brand-cream p-5">
        <span className="inline-flex items-center gap-2 font-bold">
          <Wifi size={18} className="text-brand-olive" aria-hidden="true" />
          Stream status
        </span>
        <span className={`rounded-full px-3 py-1 text-sm font-bold ${
          status?.isOnline ? 'bg-emerald-100 text-emerald-900' : 'bg-brand-ink/10 text-brand-ink/70'
        }`}>
          {status?.isOnline ? 'Online' : 'Offline'}
        </span>
        {typeof status?.listenerCount === 'number' && (
          <span className="text-sm text-brand-ink/60">{status.listenerCount} listening</span>
        )}
        {status?.nowPlaying?.title && (
          <span className="text-sm text-brand-ink/60">
            Now playing: {status.nowPlaying.title}
            {status.nowPlaying.artist ? ` — ${status.nowPlaying.artist}` : ''}
          </span>
        )}
        {status?.error && <span className="text-sm text-amber-800">{status.error}</span>}
      </div>

      <p className="mb-6 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <ShieldAlert size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
        Only public values belong here — everything on this form is readable by anyone visiting the
        site, because the player needs it. Never paste a Live365 password or API key into these
        fields. Store credentials as Supabase secrets instead.
      </p>

      {draft ? (
        <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Streaming provider"
            value={draft.provider}
            onChange={(v) => set({ provider: v as StreamProviderId })}
            options={PROVIDERS}
          />
          <TextField
            label="Provider station ID"
            hint="Used to build the default metadata endpoint if one is not given below."
            value={draft.providerStationId ?? ''}
            onChange={(v) => set({ providerStationId: v || null })}
          />
          <TextField
            label="Stream URL"
            hint="The audio URL the player connects to."
            value={draft.streamUrl ?? ''}
            onChange={(v) => set({ streamUrl: v || null })}
            className="sm:col-span-2"
          />
          <TextField label="Metadata / now-playing URL" value={draft.metadataUrl ?? ''} onChange={(v) => set({ metadataUrl: v || null })} />
          <TextField label="Status URL" value={draft.statusUrl ?? ''} onChange={(v) => set({ statusUrl: v || null })} />
          <TextField label="Player page URL" value={draft.playerUrl ?? ''} onChange={(v) => set({ playerUrl: v || null })} />
          <TextField label="Fallback artwork URL" value={draft.fallbackArtworkUrl ?? ''} onChange={(v) => set({ fallbackArtworkUrl: v || null })} />
          <TextField
            label="Metadata refresh (seconds)"
            type="number"
            hint="Between 5 and 300."
            value={String(draft.metadataPollSeconds)}
            onChange={(v) => set({ metadataPollSeconds: Math.min(300, Math.max(5, Number(v) || 20)) })}
          />
          <TextField label="Station timezone" value={draft.stationTimezone} onChange={(v) => set({ stationTimezone: v })} />
          <TextArea
            label="Off-air message"
            hint="Shown to listeners when the stream is not connected."
            value={draft.offlineMessage ?? ''}
            onChange={(v) => set({ offlineMessage: v || null })}
            rows={2}
            className="sm:col-span-2"
          />
          <div className="sm:col-span-2">
            <CheckboxField
              label="Stream is connected and live"
              hint="Leave this off until the stream really is running. The site says 'off air' rather than pretending to broadcast."
              checked={draft.isStreamEnabled}
              onChange={(v) => set({ isStreamEnabled: v })}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
            <PrimaryButton type="submit" busy={isSaving}>Save configuration</PrimaryButton>
            {saved && (
              <span role="status" className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700">
                <CheckCircle2 size={16} aria-hidden="true" /> Saved
              </span>
            )}
          </div>
        </form>
      ) : (
        !error && <p className="text-sm text-brand-ink/50">Loading configuration…</p>
      )}
    </Panel>
  );
};
