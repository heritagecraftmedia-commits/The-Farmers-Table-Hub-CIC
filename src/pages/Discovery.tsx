import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ExternalLink, Filter, Link2, Plus, Search, ShieldCheck, Sparkles, Trash2, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

type DiscoveryStatus = 'new' | 'reviewing' | 'approved' | 'rejected';

type DiscoveryLead = {
    id: string;
    name: string;
    category: string | null;
    location: string | null;
    source_url: string;
    source_type: string;
    description: string | null;
    confidence: number | null;
    status: DiscoveryStatus;
    notes: string | null;
    created_at: string;
};

const categories = [
    'Farmers & Growers', 'Meat & Butchers', 'Milk & Dairy', 'Fruit & Vegetables',
    'Bakery & Bread', 'Fish & Seafood', 'Eggs & Poultry', 'Preserves, Pickles & Chutneys',
    'Cakes & Confectionery', 'Drinks & Breweries', 'Restaurants & Cafés', 'Chefs & Food Professionals',
    'Farm Shops & Food Retailers', 'Artisan Food Makers', 'Local Markets & Food Events',
    'Community Food Projects', 'Craft Makers & Heritage Businesses', 'Local Businesses & Services',
    'Community Organisations & Support', 'Farnham Places, Events & Activities'
];

const sourceTypes = ['Instagram', 'TikTok', 'Facebook', 'Website', 'Google', 'Referral', 'Other'];

export const Discovery: React.FC = () => {
    const { user, loading } = useAuth();
    const [leads, setLeads] = useState<DiscoveryLead[]>([]);
    const [loadingLeads, setLoadingLeads] = useState(true);
    const [query, setQuery] = useState('');
    const [status, setStatus] = useState<'all' | DiscoveryStatus>('all');
    const [category, setCategory] = useState('all');
    const [showAdd, setShowAdd] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: '', category: categories[0], location: 'Farnham / Surrey', source_url: '', source_type: 'Instagram', description: '', confidence: '90', notes: '' });

    const loadLeads = async () => {
        setLoadingLeads(true);
        const { data } = await supabase.from('discovery_leads').select('*').order('created_at', { ascending: false });
        setLeads((data || []) as DiscoveryLead[]);
        setLoadingLeads(false);
    };

    useEffect(() => { loadLeads(); }, []);

    const filtered = useMemo(() => leads.filter((lead) => {
        const haystack = `${lead.name} ${lead.location || ''} ${lead.description || ''}`.toLowerCase();
        return (!query || haystack.includes(query.toLowerCase()))
            && (status === 'all' || lead.status === status)
            && (category === 'all' || lead.category === category);
    }), [leads, query, status, category]);

    const addLead = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!form.name.trim() || !form.source_url.trim()) return;
        setSaving(true);
        const { error } = await supabase.from('discovery_leads').insert({
            ...form,
            name: form.name.trim(),
            source_url: form.source_url.trim(),
            confidence: Math.min(100, Math.max(0, Number(form.confidence) || 0)),
            status: 'new'
        });
        setSaving(false);
        if (!error) {
            setForm({ name: '', category: categories[0], location: 'Farnham / Surrey', source_url: '', source_type: 'Instagram', description: '', confidence: '90', notes: '' });
            setShowAdd(false);
            loadLeads();
        }
    };

    const updateStatus = async (id: string, nextStatus: DiscoveryStatus) => {
        await supabase.from('discovery_leads').update({ status: nextStatus }).eq('id', id);
        setLeads((current) => current.map((lead) => lead.id === id ? { ...lead, status: nextStatus } : lead));
    };

    const promoteToDirectory = async (lead: DiscoveryLead) => {
        const { error } = await supabase.from('directory_listings').insert({
            name: lead.name,
            category: lead.category,
            location: lead.location,
            website: lead.source_type === 'Website' ? lead.source_url : null,
            description: lead.description,
            status: 'active',
            tier: 'free',
            outreach_status: 'not_contacted',
            claimed: false
        });
        if (!error) await updateStatus(lead.id, 'approved');
    };

    const removeLead = async (id: string) => {
        await supabase.from('discovery_leads').delete().eq('id', id);
        setLeads((current) => current.filter((lead) => lead.id !== id));
    };

    if (loading) return <div className="min-h-screen bg-brand-cream flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-olive/30 border-t-brand-olive rounded-full animate-spin" /></div>;
    if (!user || (user.role !== 'founder' && user.role !== 'staff')) return <Navigate to="/login" replace state={{ message: 'Discovery is restricted.' }} />;

    const counts = {
        all: leads.length,
        new: leads.filter((l) => l.status === 'new').length,
        reviewing: leads.filter((l) => l.status === 'reviewing').length,
        approved: leads.filter((l) => l.status === 'approved').length,
    };

    return (
        <div className="min-h-screen bg-brand-cream pb-20">
            <div className="bg-white border-b border-brand-olive/10">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-olive/10 text-brand-olive text-xs font-bold uppercase tracking-wider"><Sparkles size={13} /> Farmers Table Discovery</div>
                            <h1 className="text-4xl md:text-5xl font-serif mt-3">Find the people already doing it.</h1>
                            <p className="text-brand-ink/55 mt-3 max-w-2xl">A review inbox for discovering local producers, chefs, food businesses and community organisations from public sources. Discovery first. Verification before publishing.</p>
                        </div>
                        <button onClick={() => setShowAdd(true)} className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-olive text-white font-bold shadow-sm hover:opacity-90"><Plus size={18} /> Add discovery lead</button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
                        {[['All', counts.all], ['New', counts.new], ['Reviewing', counts.reviewing], ['Approved', counts.approved]].map(([label, count]) => <div key={label} className="bg-brand-cream rounded-xl p-4"><div className="text-xs uppercase tracking-wider text-brand-ink/45 font-bold">{label}</div><div className="text-2xl font-bold mt-1">{count}</div></div>)}
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 pt-8">
                <div className="bg-white rounded-2xl border border-brand-olive/10 p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1"><Search size={17} className="absolute left-3 top-3.5 text-brand-ink/35" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search discovered businesses..." className="w-full pl-10 pr-4 py-3 rounded-xl bg-brand-cream border-0 outline-none focus:ring-2 focus:ring-brand-olive/20" /></div>
                        <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="px-4 py-3 rounded-xl bg-brand-cream border-0"><option value="all">All statuses</option><option value="new">New</option><option value="reviewing">Reviewing</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select>
                        <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-4 py-3 rounded-xl bg-brand-cream border-0"><option value="all">All directories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select>
                    </div>
                </div>

                {showAdd && <form onSubmit={addLead} className="bg-white rounded-2xl border border-brand-olive/10 p-6 mb-6">
                    <div className="flex items-center justify-between mb-5"><div><h2 className="text-xl font-serif">Add a discovery lead</h2><p className="text-sm text-brand-ink/50 mt-1">This is an internal lead. It is not published until reviewed.</p></div><ShieldCheck className="text-brand-olive" /></div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <label className="text-sm font-bold">Business / person<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-2 w-full px-4 py-3 rounded-xl bg-brand-cream border-0" /></label>
                        <label className="text-sm font-bold">Directory<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-2 w-full px-4 py-3 rounded-xl bg-brand-cream border-0">{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
                        <label className="text-sm font-bold">Source<select value={form.source_type} onChange={(e) => setForm({ ...form, source_type: e.target.value })} className="mt-2 w-full px-4 py-3 rounded-xl bg-brand-cream border-0">{sourceTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
                        <label className="text-sm font-bold">Location<input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="mt-2 w-full px-4 py-3 rounded-xl bg-brand-cream border-0" /></label>
                        <label className="text-sm font-bold md:col-span-2">Public source URL<input required type="url" value={form.source_url} onChange={(e) => setForm({ ...form, source_url: e.target.value })} className="mt-2 w-full px-4 py-3 rounded-xl bg-brand-cream border-0" placeholder="https://..." /></label>
                        <label className="text-sm font-bold md:col-span-2">What did we find?<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="mt-2 w-full px-4 py-3 rounded-xl bg-brand-cream border-0" /></label>
                        <label className="text-sm font-bold">Confidence %<input type="number" min="0" max="100" value={form.confidence} onChange={(e) => setForm({ ...form, confidence: e.target.value })} className="mt-2 w-full px-4 py-3 rounded-xl bg-brand-cream border-0" /></label>
                        <label className="text-sm font-bold">Internal notes<input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-2 w-full px-4 py-3 rounded-xl bg-brand-cream border-0" /></label>
                    </div>
                    <div className="flex gap-3 mt-5"><button disabled={saving} className="px-5 py-3 rounded-xl bg-brand-olive text-white font-bold">{saving ? 'Saving...' : 'Save lead'}</button><button type="button" onClick={() => setShowAdd(false)} className="px-5 py-3 rounded-xl bg-brand-cream font-bold">Cancel</button></div>
                </form>}

                <div className="space-y-4">
                    {loadingLeads ? <div className="text-center py-16 text-brand-ink/50">Loading discovery inbox...</div> : filtered.length === 0 ? <div className="bg-white rounded-2xl border border-brand-olive/10 p-12 text-center"><Users size={36} className="mx-auto text-brand-olive/40" /><h2 className="font-serif text-2xl mt-4">Nothing here yet.</h2><p className="text-brand-ink/50 mt-2">Add the first lead, then we can connect automated discovery sources to this inbox.</p></div> : filtered.map((lead) => <article key={lead.id} className="bg-white rounded-2xl border border-brand-olive/10 p-5">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-serif">{lead.name}</h2><span className="px-2.5 py-1 rounded-full bg-brand-olive/10 text-brand-olive text-xs font-bold">{lead.category || 'Uncategorised'}</span><span className="px-2.5 py-1 rounded-full bg-brand-cream text-xs font-bold">{lead.source_type}</span></div>
                                <p className="text-sm text-brand-ink/50 mt-2">{lead.location || 'Location not yet known'} · Confidence {lead.confidence ?? 0}%</p>
                                {lead.description && <p className="mt-3 text-brand-ink/75">{lead.description}</p>}
                                <a href={lead.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mt-3 text-sm font-bold text-brand-olive hover:underline"><Link2 size={15} /> Open source <ExternalLink size={13} /></a>
                            </div>
                            <div className="flex flex-wrap gap-2 lg:max-w-xs lg:justify-end">
                                <button onClick={() => updateStatus(lead.id, 'reviewing')} className="px-3 py-2 rounded-lg bg-brand-cream text-sm font-bold">Review</button>
                                <button onClick={() => promoteToDirectory(lead)} className="px-3 py-2 rounded-lg bg-brand-olive text-white text-sm font-bold inline-flex items-center gap-1.5"><CheckCircle2 size={15} /> Add to directory</button>
                                <button onClick={() => updateStatus(lead.id, 'rejected')} className="px-3 py-2 rounded-lg border border-brand-ink/10 text-sm font-bold">Reject</button>
                                <button onClick={() => removeLead(lead.id)} aria-label="Delete lead" className="p-2 rounded-lg hover:bg-red-50 text-brand-ink/40 hover:text-red-600"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    </article>)}
                </div>
            </main>
        </div>
    );
};
