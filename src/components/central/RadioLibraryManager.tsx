import React, { useEffect, useState } from 'react';
import { Music2, Upload, CheckCircle2 } from 'lucide-react';
import { radioService, RadioMedia } from '../../services/radioService';

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
      setTitle(''); setArtist(''); setDuration(''); setFile(null); setMessage('Added to the real radio library.');
      await load();
    } catch (e) { console.error(e); setMessage('Could not add this audio. Check your staff permissions and file type.'); }
    finally { setSaving(false); }
  };

  return <div className="space-y-6">
    <div className="flex items-center gap-3"><div className="w-11 h-11 rounded-2xl bg-brand-olive/10 flex items-center justify-center"><Music2 className="text-brand-olive" /></div><div><h3 className="text-2xl font-serif">Radio Library</h3><p className="text-sm text-brand-ink/50">Add real music, jingles, adverts and community audio. Nothing is invented.</p></div></div>
    {message && <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm">{message}</div>}
    <div className="bg-white rounded-[28px] border border-brand-olive/10 p-6 space-y-4">
      <h4 className="font-bold">Add audio</h4>
      <div className="grid md:grid-cols-2 gap-4">
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title — e.g. Farmers Table Jingle 01" className="px-4 py-3 rounded-xl bg-brand-cream outline-none text-sm" />
        <input value={artist} onChange={e => setArtist(e.target.value)} placeholder="Artist / source (optional)" className="px-4 py-3 rounded-xl bg-brand-cream outline-none text-sm" />
        <select value={category} onChange={e => setCategory(e.target.value as RadioMedia['category'])} className="px-4 py-3 rounded-xl bg-brand-cream outline-none text-sm">{['music','jingle','advert','community','interview','feature'].map(c => <option key={c} value={c}>{c}</option>)}</select>
        <input type="number" min="1" value={duration} onChange={e => setDuration(e.target.value)} placeholder="Duration in seconds" className="px-4 py-3 rounded-xl bg-brand-cream outline-none text-sm" />
      </div>
      <label className="border-2 border-dashed border-brand-olive/15 rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:bg-brand-cream/60"><Upload className="text-brand-olive" /><div className="flex-1"><p className="font-bold text-sm">{file ? file.name : 'Choose audio file'}</p><p className="text-xs text-brand-ink/40">Upload the real broadcast audio to the Farmers Table library.</p></div><input type="file" accept="audio/*" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} /></label>
      <button disabled={saving} onClick={add} className="px-5 py-3 rounded-xl bg-brand-olive text-white text-sm font-bold disabled:opacity-50">{saving ? 'Adding…' : 'Add to Library'}</button>
    </div>
    <div className="bg-white rounded-[28px] border border-brand-olive/10 p-6"><h4 className="font-bold mb-4">Current library</h4>{loading ? <p className="text-sm text-brand-ink/50">Loading…</p> : items.length === 0 ? <p className="text-sm text-brand-ink/50">Nothing has been added yet.</p> : <div className="space-y-2">{items.map(item => <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-brand-cream"><CheckCircle2 size={17} className="text-brand-olive" /><div className="flex-1"><p className="font-bold text-sm">{item.title}</p><p className="text-xs text-brand-ink/50">{item.artist || item.category} · {item.durationSeconds}s</p></div></div>)}</div>}</div>
  </div>;
};
