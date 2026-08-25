import React, { useEffect, useState } from 'react';
import { Music2, Upload, CheckCircle2, Radio, Megaphone, Mic2, Users, Sparkles, Copy } from 'lucide-react';
import { radioService, RadioMedia } from '../../services/radioService';

const CONTENT_GUIDE = [
  { category: 'jingle', icon: Radio, title: 'Station IDs & Jingles', examples: ['Farmers Table Radio — station ID', 'Farnham’s community radio', 'Short show opener', 'Short show closer', 'News / weather sting', 'Coming up next sting'] },
  { category: 'advert', icon: Megaphone, title: 'Local Business Adverts', examples: ['Restaurants & cafés', 'Independent shops', 'Trades & services', 'Accommodation', 'Health & wellbeing', 'Professional services', 'Seasonal offers'] },
  { category: 'community', icon: Users, title: 'Community Announcements', examples: ['Community groups', 'Charities', 'Markets & fairs', 'Volunteering', 'Local notices', 'Public information'] },
  { category: 'interview', icon: Mic2, title: 'Interviews & Conversations', examples: ['Local makers', 'Farmers & growers', 'Shop owners', 'Community leaders', 'Event organisers', 'Resident stories'] },
  { category: 'feature', icon: Sparkles, title: 'Features & Local Life', examples: ['What’s On Farnham', 'Local history', 'Food & producers', 'Heritage crafts', 'Community garden', 'Weekend guide'] },
  { category: 'music', icon: Music2, title: 'Music', examples: ['Current favourites', 'Classic pop & rock', '80s / 90s / 00s', 'Indie & alternative', 'Soul & Motown', 'Folk & acoustic', 'Jazz & easy listening', 'Local / emerging artists'] },
];

export const RadioLibraryManager: React.FC = () => {
  const [items, setItems] = useState<RadioMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [category, setCategory] = useState<RadioMedia['category']>('music');
  const [duration, setDuration] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const load = async () => { setLoading(true); try { setItems(await radioService.getActiveMedia()); } catch (e) { console.error(e); setMessage('The radio library could not be loaded.'); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!title.trim()) return setMessage('Give the audio a name first.');
    if (!file) return setMessage('Choose an audio file first.');
    const seconds = Number(duration);
    if (!Number.isFinite(seconds) || seconds <= 0) return setMessage('Enter the duration in seconds.');
    setSaving(true); setMessage('Uploading audio…');
    try {
      const audioUrl = await radioService.uploadMediaFile(file);
      await radioService.addMedia({ title: title.trim(), artist: artist.trim() || null, category, fileUrl: audioUrl, durationSeconds: seconds });
      setTitle(''); setArtist(''); setDuration(''); setFile(null); setMessage('Added to the real radio library.'); await load();
    } catch (e) { console.error(e); setMessage('Could not add this audio. Check your staff permissions and file type.'); }
    finally { setSaving(false); }
  };

  const copyExample = (text: string) => { navigator.clipboard?.writeText(text); setMessage(`Copied: ${text}`); };

  return <div className="space-y-6">
    <div className="flex items-center gap-3"><div className="w-11 h-11 rounded-2xl bg-brand-olive/10 flex items-center justify-center"><Music2 className="text-brand-olive" /></div><div><h3 className="text-2xl font-serif">Radio Library</h3><p className="text-sm text-brand-ink/50">A simple home for every piece of audio used by Farmers Table Radio. Add real audio — never invented content.</p></div></div>

    <div className="rounded-[28px] bg-brand-cream border border-brand-olive/10 p-6">
      <div className="flex items-start gap-3 mb-5"><Sparkles className="text-brand-olive mt-1" size={20}/><div><h4 className="font-bold text-lg">What should go in the library?</h4><p className="text-sm text-brand-ink/60">You do not need to remember the categories. Use this guide whenever you are adding something new.</p></div></div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {CONTENT_GUIDE.map(({ category: c, icon: Icon, title: t, examples }) => <div key={c} className="bg-white rounded-2xl p-4 border border-brand-olive/10"><div className="flex items-center gap-2 mb-3"><Icon size={18} className="text-brand-olive"/><h5 className="font-bold text-sm">{t}</h5></div><div className="space-y-1">{examples.map(ex => <button key={ex} onClick={() => copyExample(ex)} className="w-full text-left text-xs text-brand-ink/60 hover:text-brand-ink flex items-center gap-2"><Copy size={11}/>{ex}</button>)}</div></div>)}
      </div>
    </div>

    {message && <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm">{message}</div>}
    <div className="bg-white rounded-[28px] border border-brand-olive/10 p-6 space-y-4">
      <h4 className="font-bold">Add audio</h4>
      <p className="text-sm text-brand-ink/50">One item at a time is fine. Finished items stay in the library so you do not have to recreate them.</p>
      <div className="grid md:grid-cols-2 gap-4">
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title — e.g. Farmers Table Jingle 01" className="px-4 py-3 rounded-xl bg-brand-cream outline-none text-sm" />
        <input value={artist} onChange={e => setArtist(e.target.value)} placeholder="Artist / source (optional)" className="px-4 py-3 rounded-xl bg-brand-cream outline-none text-sm" />
        <select value={category} onChange={e => setCategory(e.target.value as RadioMedia['category'])} className="px-4 py-3 rounded-xl bg-brand-cream outline-none text-sm">{['music','jingle','advert','community','interview','feature'].map(c => <option key={c} value={c}>{c}</option>)}</select>
        <input type="number" min="1" value={duration} onChange={e => setDuration(e.target.value)} placeholder="Duration in seconds" className="px-4 py-3 rounded-xl bg-brand-cream outline-none text-sm" />
      </div>
      <label className="border-2 border-dashed border-brand-olive/15 rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:bg-brand-cream/60"><Upload className="text-brand-olive" /><div className="flex-1"><p className="font-bold text-sm">{file ? file.name : 'Choose audio file'}</p><p className="text-xs text-brand-ink/40">MP3, WAV and other browser-supported audio files.</p></div><input type="file" accept="audio/*" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} /></label>
      <button disabled={saving} onClick={add} className="px-5 py-3 rounded-xl bg-brand-olive text-white text-sm font-bold disabled:opacity-50">{saving ? 'Adding…' : 'Add to Library'}</button>
    </div>

    <div className="bg-white rounded-[28px] border border-brand-olive/10 p-6"><h4 className="font-bold mb-4">Current library</h4>{loading ? <p className="text-sm text-brand-ink/50">Loading…</p> : items.length === 0 ? <p className="text-sm text-brand-ink/50">Nothing has been added yet. Start with a few station jingles, then add adverts, community audio and music.</p> : <div className="space-y-2">{items.map(item => <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-brand-cream"><CheckCircle2 size={17} className="text-brand-olive" /><div className="flex-1"><p className="font-bold text-sm">{item.title}</p><p className="text-xs text-brand-ink/50">{item.artist || item.category} · {item.durationSeconds}s</p></div><span className="text-[11px] px-2 py-1 rounded-full bg-white capitalize">{item.category}</span></div>)}</div>}</div>
  </div>;
};
