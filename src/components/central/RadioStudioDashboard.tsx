import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Clock3, ListMusic, Plus, Radio, Search, SkipForward, Trash2, Volume2 } from 'lucide-react';
import { radioService, RadioMedia, RadioPlaylist } from '../../services/radioService';

type QueueItem = RadioMedia & { queueId: string };
const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${Math.round(seconds % 60).toString().padStart(2, '0')}`;

export const RadioStudioDashboard: React.FC = () => {
  const [media, setMedia] = useState<RadioMedia[]>([]);
  const [playlists, setPlaylists] = useState<RadioPlaylist[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [slotMinutes, setSlotMinutes] = useState(60);
  const [playlistName, setPlaylistName] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { const [m, p] = await Promise.all([radioService.getActiveMedia(), radioService.getReadyPlaylists()]); setMedia(m); setPlaylists(p); setStatus(''); }
    catch (e) { console.error(e); setStatus('The live radio library could not be loaded. Check the Supabase connection and staff permissions.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => media.filter(item => {
    const matchesCategory = category === 'all' || item.category === category;
    const q = search.toLowerCase();
    return matchesCategory && (!q || `${item.title} ${item.artist ?? ''}`.toLowerCase().includes(q));
  }), [media, search, category]);
  const used = queue.reduce((sum, item) => sum + item.durationSeconds, 0);
  const remaining = Math.max(slotMinutes * 60 - used, 0);
  const add = (item: RadioMedia, next = false) => { const entry = { ...item, queueId: `${item.id}-${Date.now()}-${Math.random()}` }; setQueue(current => next ? [entry, ...current] : [...current, entry]); };
  const move = (index: number, direction: -1 | 1) => setQueue(current => { const next = [...current], target = index + direction; if (target < 0 || target >= next.length) return current; [next[index], next[target]] = [next[target], next[index]]; return next; });
  const loadPlaylist = async (playlist: RadioPlaylist) => { try { const items = await radioService.getPlaylistItems(playlist.id); setQueue(items.map((item, i) => ({ ...item, queueId: `${item.id}-${i}-${Date.now()}` }))); setPlaylistName(playlist.name); setStatus(`${playlist.name} loaded into today's slot.`); } catch (e) { console.error(e); setStatus('This playlist could not be loaded.'); } };
  const savePlaylist = async (ready: boolean) => {
    if (!queue.length) return setStatus('Add something to the slot first.');
    if (!playlistName.trim()) return setStatus('Give this playlist a name first.');
    try { const playlist = await radioService.createPlaylist(playlistName.trim(), `Prepared in the Farmers Table Studio Dashboard. ${formatTime(used)}.`, ready ? 'ready' : 'draft'); for (let i = 0; i < queue.length; i++) await radioService.addPlaylistItem(playlist.id, queue[i].id, i); await radioService.updatePlaylist(playlist.id, { durationSeconds: used, status: ready ? 'ready' : 'draft' }); setStatus(ready ? `${playlistName.trim()} saved and ready for staff.` : `${playlistName.trim()} saved as a draft.`); await load(); } catch (e) { console.error(e); setStatus('Could not save the playlist. Check your staff permissions.'); }
  };

  return <div className="space-y-8">
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5"><div><div className="flex items-center gap-2 text-brand-olive text-xs font-bold uppercase tracking-widest"><Radio size={15} /> Studio Dashboard</div><h2 className="text-3xl md:text-4xl font-serif mt-2">Build today's radio slot</h2><p className="text-brand-ink/50 mt-2">Prepare the content here. Live365 remains the broadcast and outside-broadcast service.</p></div><div className="flex items-center gap-2 bg-white border border-brand-olive/10 rounded-2xl px-4 py-3"><Clock3 size={17} className="text-brand-olive" /><label className="text-xs font-bold">Slot</label><select value={slotMinutes} onChange={e => setSlotMinutes(Number(e.target.value))} className="bg-transparent font-bold outline-none">{[30, 60, 90, 120].map(n => <option key={n} value={n}>{n} minutes</option>)}</select></div></div>
    {status && <div className="rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 px-5 py-4 text-sm">{status}</div>}
    <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_.85fr] gap-8">
      <section className="bg-white rounded-[32px] border border-brand-olive/5 p-6 md:p-8"><div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6"><div><h3 className="text-2xl font-serif">Library</h3><p className="text-sm text-brand-ink/50">One button adds an item. Add Next puts a request at the front.</p></div><div className="relative"><Search size={16} className="absolute left-3 top-3 text-brand-ink/30" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search music, jingles..." className="pl-9 pr-4 py-2.5 rounded-xl bg-brand-cream outline-none text-sm w-full md:w-64" /></div></div><div className="flex gap-2 overflow-x-auto pb-2 mb-4">{['all', 'music', 'jingle', 'community', 'advert', 'interview', 'feature'].map(c => <button key={c} onClick={() => setCategory(c)} className={`px-4 py-2 rounded-full text-xs font-bold capitalize whitespace-nowrap ${category === c ? 'bg-brand-olive text-white' : 'bg-brand-cream text-brand-ink/60'}`}>{c}</button>)}</div>{loading ? <p className="text-sm text-brand-ink/50">Loading real audio library…</p> : filtered.length === 0 ? <p className="text-sm text-brand-ink/50 py-8">No real audio matches yet. Add music, jingles, community notices or adverts to the library.</p> : <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">{filtered.map(item => <div key={item.id} className="rounded-2xl bg-brand-cream p-4 flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-brand-olive/10 flex items-center justify-center shrink-0"><Volume2 size={17} className="text-brand-olive" /></div><div className="min-w-0 flex-1"><p className="font-bold truncate">{item.title}</p><p className="text-xs text-brand-ink/50 truncate">{item.artist || item.category} · {formatTime(item.durationSeconds)}</p></div><button onClick={() => add(item)} title="Add to slot" className="p-2.5 rounded-xl bg-white text-brand-olive hover:bg-brand-olive hover:text-white transition"><Plus size={18} /></button><button onClick={() => add(item, true)} title="Add next" className="px-3 py-2.5 rounded-xl bg-white text-brand-ink text-xs font-bold hover:bg-brand-olive hover:text-white transition">Add Next</button></div>)}</div>}</section>
      <section className="bg-brand-ink text-brand-cream rounded-[32px] p-6 md:p-8"><div className="flex items-start justify-between gap-4 mb-6"><div><h3 className="text-2xl font-serif">Today's slot</h3><p className="text-sm text-brand-cream/50">Prepared queue</p></div><div className="text-right"><p className="text-2xl font-bold">{formatTime(used)}</p><p className="text-xs text-brand-cream/50">{formatTime(remaining)} remaining</p></div></div><div className="h-2 bg-white/10 rounded-full overflow-hidden mb-6"><div className="h-full bg-brand-cream rounded-full" style={{ width: `${Math.min((used / (slotMinutes * 60)) * 100, 100)}%` }} /></div><div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">{queue.length === 0 ? <div className="border border-dashed border-white/15 rounded-2xl p-8 text-center text-sm text-brand-cream/40">Add something from the library, or load a ready playlist below.</div> : queue.map((item, index) => <div key={item.queueId} className="rounded-2xl bg-white/5 p-3 flex items-center gap-3"><span className="w-6 text-center text-xs text-brand-cream/40">{index + 1}</span><div className="flex-1 min-w-0"><p className="font-bold text-sm truncate">{item.title}</p><p className="text-[11px] text-brand-cream/40">{item.category} · {formatTime(item.durationSeconds)}</p></div><button onClick={() => move(index, -1)} className="p-1.5 hover:bg-white/10 rounded-lg"><ChevronUp size={15} /></button><button onClick={() => move(index, 1)} className="p-1.5 hover:bg-white/10 rounded-lg"><ChevronDown size={15} /></button><button onClick={() => setQueue(q => q.filter(x => x.queueId !== item.queueId))} className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-300"><Trash2 size={15} /></button></div>)}</div><div className="mt-6 space-y-3"><input value={playlistName} onChange={e => setPlaylistName(e.target.value)} placeholder="Playlist name e.g. Farmers Table Morning 01" className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder:text-white/30 outline-none text-sm" /><div className="grid grid-cols-3 gap-3"><button onClick={() => setQueue([])} className="py-3 rounded-xl bg-white/10 text-sm font-bold hover:bg-white/15">Clear</button><button onClick={() => savePlaylist(false)} className="py-3 rounded-xl bg-white/15 text-sm font-bold hover:bg-white/20">Save draft</button><button onClick={() => savePlaylist(true)} className="py-3 rounded-xl bg-brand-cream text-brand-ink text-sm font-bold hover:opacity-90">Save ready</button></div></div></section>
    </div>
    <section className="bg-white rounded-[32px] border border-brand-olive/5 p-6 md:p-8"><div className="flex items-center gap-3 mb-5"><ListMusic className="text-brand-olive" /><div><h3 className="text-2xl font-serif">Ready playlists</h3><p className="text-sm text-brand-ink/50">Load a prepared slot, then change individual items if needed.</p></div></div>{playlists.length === 0 ? <p className="text-sm text-brand-ink/50">No ready playlists yet.</p> : <div className="grid md:grid-cols-3 gap-4">{playlists.map(p => <div key={p.id} className="rounded-2xl bg-brand-cream p-5"><p className="font-bold">{p.name}</p><p className="text-xs text-brand-ink/50 mt-1">{formatTime(p.durationSeconds)}</p><button onClick={() => loadPlaylist(p)} className="mt-4 w-full py-2.5 rounded-xl bg-brand-olive text-white text-xs font-bold flex items-center justify-center gap-2"><SkipForward size={14} /> Load playlist</button></div>)}</div>}</section>
  </div>;
};
