import React, { useEffect, useState } from 'react';
import { Megaphone, Copy, Save, Building2, Radio, Clock3 } from 'lucide-react';
import { radioService } from '../../services/radioService';
import { saveAdvert } from '../../services/radio/stationService';
import { ADVERT_PACKAGES } from '../../services/radio/types';
import type { AdvertPackage } from '../../services/radio/types';

type Listing = { id: string; name: string; category: string | null; location: string | null; description: string | null; website: string | null; tier: string | null; };

// The full package list lives in one place so the studio and the advertising
// manager can never drift apart.
const packages = ADVERT_PACKAGES.map(p => ({ id: p.value, label: p.label, hint: p.hint }));

export const RadioAdvertiserStudio: React.FC<{ onSaved?: () => void }> = ({ onSaved }) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [selected, setSelected] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [pkg, setPkg] = useState<AdvertPackage>('30s');
  const [script, setScript] = useState('');
  const [reads, setReads] = useState('1');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    radioService.getPublicDirectory(100).then(setListings).catch(() => setMessage('The local directory could not be loaded.'));
  }, []);

  const chooseListing = (id: string) => {
    setSelected(id);
    const item = listings.find(x => x.id === id);
    if (!item) return;
    setBusinessName(item.name);
    const description = item.description?.trim() || 'a great local business';
    const location = item.location ? ` in ${item.location}` : '';
    const website = item.website ? ` Find out more at ${item.website.replace(/^https?:\/\//, '')}.` : '';
    setScript(`Looking for something local? Discover ${item.name}${location}. ${description}. Support local and discover what is happening right here in our community.${website}`);
  };

  const copy = async () => { await navigator.clipboard?.writeText(script); setMessage('Script copied. You can use it for a presenter read or send it for voice production.'); };

  const save = async () => {
    if (!businessName.trim()) return setMessage('Choose a local business or enter the business name first.');
    if (!script.trim()) return setMessage('Add a simple script before saving.');
    setSaving(true); setMessage('Saving promotion…');
    try {
      // Saved as a DRAFT: a promotion drafted here is never publicly visible
      // until someone publishes it in the advertising manager.
      await saveAdvert({
        businessName: businessName.trim(),
        contactName: contactName.trim() || null,
        contactEmail: contactEmail.trim() || null,
        package: pkg,
        adScript: script.trim(),
        readsPerShow: Math.max(1, Number(reads) || 1),
        directoryListingId: selected || null,
        runState: 'active',
        contentStatus: 'draft',
      });
      setMessage('Promotion saved as a draft. Publish it in the advertising list when the real audio and dates are confirmed.');
      onSaved?.();
    } catch (e) { console.error(e); setMessage('Could not save this promotion. Check the radio database migration and staff permissions.'); }
    finally { setSaving(false); }
  };

  return <div className="space-y-6">
    <div className="flex items-center gap-3"><div className="w-11 h-11 rounded-2xl bg-brand-olive/10 flex items-center justify-center"><Megaphone className="text-brand-olive" /></div><div><h3 className="text-2xl font-serif">Local Promotion Studio</h3><p className="text-sm text-brand-ink/50">Turn an approved Farnham directory listing into a simple radio promotion. No remembering scripts or business details.</p></div></div>

    <div className="rounded-[28px] bg-brand-cream border border-brand-olive/10 p-6"><div className="flex items-center gap-3 mb-4"><Building2 className="text-brand-olive"/><h4 className="font-bold text-lg">1. Choose a local business</h4></div><select value={selected} onChange={e => chooseListing(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white outline-none text-sm"><option value="">Choose from the approved local directory…</option>{listings.map(item => <option key={item.id} value={item.id}>{item.name}{item.category ? ` — ${item.category}` : ''}</option>)}</select><p className="text-xs text-brand-ink/50 mt-3">Only active directory listings are offered here. This prevents the radio team accidentally inventing or using an unapproved business.</p></div>

    <div className="bg-white rounded-[28px] border border-brand-olive/10 p-6 space-y-5"><div className="flex items-center gap-3"><Radio className="text-brand-olive"/><h4 className="font-bold text-lg">2. Choose the promotion</h4></div><div className="grid md:grid-cols-2 gap-3">{packages.map(item => <button key={item.id} onClick={() => setPkg(item.id)} className={`text-left p-4 rounded-2xl border ${pkg === item.id ? 'border-brand-olive bg-brand-olive/5' : 'border-brand-olive/10 bg-brand-cream'}`}><p className="font-bold text-sm">{item.label}</p><p className="text-xs text-brand-ink/50 mt-1">{item.hint}</p></button>)}</div><div className="grid md:grid-cols-2 gap-4"><input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Business name" className="px-4 py-3 rounded-xl bg-brand-cream outline-none text-sm"/><input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Contact name (optional)" className="px-4 py-3 rounded-xl bg-brand-cream outline-none text-sm"/><input value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="Contact email (optional)" className="px-4 py-3 rounded-xl bg-brand-cream outline-none text-sm"/><div className="relative"><Clock3 size={17} className="absolute left-4 top-3.5 text-brand-olive"/><input type="number" min="1" value={reads} onChange={e => setReads(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl bg-brand-cream outline-none text-sm" placeholder="Reads per show"/></div></div></div>

    <div className="bg-white rounded-[28px] border border-brand-olive/10 p-6 space-y-4"><div><h4 className="font-bold text-lg">3. Radio script</h4><p className="text-sm text-brand-ink/50">The first draft is created for you. Read it aloud, change anything that sounds wrong, then save it.</p></div><textarea value={script} onChange={e => setScript(e.target.value)} rows={7} placeholder="Choose a business above to create a first draft…" className="w-full px-4 py-4 rounded-2xl bg-brand-cream outline-none text-sm leading-relaxed"/><div className="flex flex-wrap gap-3"><button onClick={copy} disabled={!script} className="px-5 py-3 rounded-xl bg-brand-cream text-brand-ink text-sm font-bold flex items-center gap-2 disabled:opacity-40"><Copy size={17}/> Copy script</button><button onClick={save} disabled={saving} className="px-5 py-3 rounded-xl bg-brand-olive text-white text-sm font-bold flex items-center gap-2 disabled:opacity-50"><Save size={17}/>{saving ? 'Saving…' : 'Save promotion'}</button></div>{message && <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm">{message}</div>}</div>

    <div className="rounded-[28px] bg-brand-ink text-brand-cream p-6"><h4 className="font-serif text-xl mb-2">Remember the rule</h4><p className="text-sm text-brand-cream/70 leading-relaxed">The radio system prepares the content. Live365, BUTT and RadioDJ remain the broadcast technology. This screen is simply the friendly place where the team decides what local content belongs on air.</p></div>
  </div>;
};
