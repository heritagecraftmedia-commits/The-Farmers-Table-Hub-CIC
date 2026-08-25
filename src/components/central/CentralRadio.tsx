import React, { useEffect, useState } from 'react';
import { Activity, CalendarClock, ListMusic, Radio as RadioIcon, Volume2 } from 'lucide-react';
import { radioService, RadioBroadcast, RadioMedia, RadioPlaylist, RadioShow } from '../../services/radioService';

export const CentralRadio: React.FC = () => {
    const [shows, setShows] = useState<RadioShow[]>([]);
    const [broadcasts, setBroadcasts] = useState<RadioBroadcast[]>([]);
    const [playlists, setPlaylists] = useState<RadioPlaylist[]>([]);
    const [media, setMedia] = useState<RadioMedia[]>([]);
    const [error, setError] = useState<string | null>(null);

    const load = async () => {
        try {
            const [s, b, p, m] = await Promise.all([
                radioService.getShows(),
                radioService.getUpcomingBroadcasts(12),
                radioService.getReadyPlaylists(),
                radioService.getActiveMedia(),
            ]);
            setShows(s);
            setBroadcasts(b);
            setPlaylists(p);
            setMedia(m);
            setError(null);
        } catch (err) {
            console.error('CentralRadio:', err);
            setError('The radio database needs its V1 migration applied in Supabase before the control centre can use live data.');
        }
    };

    useEffect(() => { load(); }, []);

    const live = broadcasts.find(b => b.status === 'live');

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-serif">Farmers Table <span className="italic text-brand-olive">Radio</span></h2>
                    <p className="text-brand-ink/50 mt-1">Real programmes, playlists, adverts and broadcasts — no fictional station data.</p>
                </div>
                <button onClick={load} className="flex items-center gap-2 px-6 py-3 bg-brand-olive text-white rounded-full text-sm font-bold shadow-lg shadow-brand-olive/10">
                    <Activity size={18} /> Refresh radio data
                </button>
            </div>

            {error && <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-5 text-sm">{error}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-brand-ink text-brand-cream p-8 md:p-10 rounded-[40px] shadow-xl">
                    <div className="flex items-center gap-3 mb-8">
                        <div className={`w-2.5 h-2.5 rounded-full ${live ? 'bg-red-500 animate-pulse' : 'bg-brand-cream/30'}`} />
                        <span className="text-xs font-bold uppercase tracking-widest">{live ? 'Live on air' : 'No live broadcast'}</span>
                    </div>
                    <h3 className="text-4xl md:text-5xl font-serif mb-4">{live ? live.title : 'Ready to build the first broadcast'}</h3>
                    <p className="text-brand-cream/60 max-w-2xl">
                        {live ? `Broadcast started ${new Date(live.startsAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}.` : 'Start with real audio: music, jingles, community notices and adverts. Schedule the finished programme when it is ready.'}
                    </p>
                </div>

                <div className="bg-white rounded-[40px] p-8 border border-brand-olive/10 shadow-sm">
                    <div className="flex items-center gap-3 mb-6"><ListMusic className="text-brand-olive" /><h3 className="text-xl font-serif">Ready playlists</h3></div>
                    {playlists.length === 0 ? <p className="text-sm text-brand-ink/50">No real playlists yet. Build the first one from the media library.</p> : <div className="space-y-3">{playlists.map(p => <div key={p.id} className="p-4 rounded-2xl bg-brand-cream"><p className="font-bold">{p.name}</p><p className="text-xs text-brand-ink/50">{Math.round(p.durationSeconds / 60)} minutes</p></div>)}</div>}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-[32px] p-8 border border-brand-olive/5">
                    <div className="flex items-center gap-3 mb-7"><CalendarClock className="text-brand-olive" /><h3 className="text-2xl font-serif">Upcoming broadcasts</h3></div>
                    {broadcasts.length === 0 ? <p className="text-sm text-brand-ink/50">Nothing scheduled yet.</p> : <div className="space-y-3">{broadcasts.map(b => <div key={b.id} className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-brand-cream"><div><p className="font-bold">{b.title}</p><p className="text-xs text-brand-ink/50">{new Date(b.startsAt).toLocaleString('en-GB')}</p></div><span className="text-xs font-bold uppercase text-brand-olive">{b.broadcastType}</span></div>)}</div>}
                </div>

                <div className="bg-white rounded-[32px] p-8 border border-brand-olive/5">
                    <div className="flex items-center gap-3 mb-7"><Volume2 className="text-brand-olive" /><h3 className="text-2xl font-serif">Real media library</h3></div>
                    {media.length === 0 ? <p className="text-sm text-brand-ink/50">No audio has been added yet. This is where your music, jingles, community notices and adverts will appear.</p> : <div className="grid sm:grid-cols-2 gap-3">{media.map(item => <div key={item.id} className="p-4 rounded-2xl bg-brand-cream"><p className="font-bold">{item.title}</p><p className="text-xs text-brand-ink/50">{item.category} · {item.durationSeconds}s</p></div>)}</div>}
                </div>
            </div>

            <div className="bg-brand-olive text-white rounded-[32px] p-8 md:p-10">
                <div className="flex items-center gap-3 mb-4"><RadioIcon /><h3 className="text-2xl font-serif">The first operational target</h3></div>
                <p className="text-white/80 max-w-3xl leading-relaxed">Create one genuine Farmers Table programme from real audio, add a station jingle and a community notice, then add the first real local business promotion. Once that works, repeat it and schedule programmes weeks ahead.</p>
            </div>

            <div className="bg-white rounded-[32px] p-8 border border-brand-olive/5">
                <h3 className="text-2xl font-serif mb-5">Programmes already in the database</h3>
                {shows.length === 0 ? <p className="text-sm text-brand-ink/50">No radio shows have been created yet.</p> : <div className="grid md:grid-cols-2 gap-4">{shows.map(show => <div key={show.id} className="p-5 rounded-2xl bg-brand-cream"><p className="font-bold">{show.title}</p><p className="text-sm text-brand-ink/60">{show.host} · {show.schedule}</p></div>)}</div>}
            </div>
        </div>
    );
};
