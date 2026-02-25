import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Edit3, Globe, MapPin, Tag, ArrowLeft, Loader } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';

interface DraftListing {
    id: string;
    vendor_name: string;
    craft_category: string;
    location: string;
    summary: string;
    website: string;
    status: string;
}

export const ClaimListing: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [listing, setListing] = useState<DraftListing | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    // Editable fields
    const [vendorName, setVendorName] = useState('');
    const [craft, setCraft] = useState('');
    const [location, setLocation] = useState('');
    const [bio, setBio] = useState('');
    const [website, setWebsite] = useState('');

    useEffect(() => {
        const loadListing = async () => {
            setLoading(true);
            if (!id) { setError('No listing ID provided.'); setLoading(false); return; }

            // Try Supabase first
            const url = import.meta.env.VITE_SUPABASE_URL;
            const isConfigured = url && url !== 'https://placeholder.supabase.co' && url.includes('supabase.co');

            if (isConfigured) {
                const { data, error: fetchErr } = await supabase.from('enriched_leads').select('*').eq('id', id).single();
                if (fetchErr || !data) {
                    setError('Listing not found. It may have already been claimed or the link is invalid.');
                    setLoading(false);
                    return;
                }
                setListing(data);
                setVendorName(data.vendor_name || '');
                setCraft(data.craft_category || '');
                setLocation(data.location || '');
                setBio(data.summary || '');
                setWebsite(data.website || '');
            } else {
                // Demo mode — mock listing
                setListing({
                    id: id, vendor_name: 'Example Maker', craft_category: 'Woodwork',
                    location: 'Farnham, Surrey', summary: 'Handmade wooden bowls and chopping boards from reclaimed timber.',
                    website: 'https://example.com', status: 'draft'
                });
                setVendorName('Example Maker');
                setCraft('Woodwork');
                setLocation('Farnham, Surrey');
                setBio('Handmade wooden bowls and chopping boards from reclaimed timber.');
                setWebsite('https://example.com');
            }
            setLoading(false);
        };
        loadListing();
    }, [id]);

    const handleClaim = async () => {
        if (!vendorName.trim() || !craft.trim()) { setError('Name and craft are required.'); return; }

        const url = import.meta.env.VITE_SUPABASE_URL;
        const isConfigured = url && url !== 'https://placeholder.supabase.co' && url.includes('supabase.co');

        if (isConfigured) {
            await supabase.from('claimed_vendors').insert({
                enriched_lead_id: id,
                vendor_name: vendorName,
                craft_category: craft,
                location,
                bio,
                website,
                approved: false,
                published: false,
            });
            await supabase.from('enriched_leads').update({ status: 'claimed' }).eq('id', id);
        }
        setSubmitted(true);
    };

    if (loading) {
        return (
            <div className="py-32 text-center bg-brand-cream min-h-screen">
                <Loader className="mx-auto animate-spin text-brand-olive" size={32} />
                <p className="mt-4 text-brand-ink/40">Loading your listing…</p>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="py-32 bg-brand-cream min-h-screen">
                <div className="max-w-xl mx-auto text-center px-6">
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                        <CheckCircle className="mx-auto text-brand-olive mb-6" size={64} />
                        <h1 className="text-4xl font-serif mb-4">Listing Claimed!</h1>
                        <p className="text-brand-ink/60 mb-8">Thank you for joining The Farmers Table Hub directory. Your listing will be reviewed and published shortly.</p>
                        <Link to="/directory" className="inline-flex items-center gap-2 bg-brand-olive text-white font-bold px-8 py-4 rounded-full hover:bg-brand-olive/90">
                            Browse the Directory
                        </Link>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="py-16 md:py-24 bg-brand-cream min-h-screen">
            <div className="max-w-2xl mx-auto px-4 sm:px-6">
                <Link to="/" className="inline-flex items-center gap-2 text-brand-olive font-bold mb-8 hover:gap-3 transition-all">
                    <ArrowLeft size={16} /> Back to Hub
                </Link>

                <h1 className="text-4xl md:text-5xl font-serif mb-4">Claim Your <span className="italic text-brand-olive">Listing</span></h1>
                <p className="text-brand-ink/60 mb-12 leading-relaxed">
                    We found your work through publicly shared content and created a draft listing. Review, edit, and publish — it's completely free and optional.
                </p>

                {error && (
                    <div className="bg-red-50 text-red-700 px-6 py-4 rounded-2xl mb-8 text-sm">{error}</div>
                )}

                <div className="bg-white rounded-[32px] p-8 md:p-10 shadow-sm border border-brand-olive/10 space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-brand-ink/60 mb-2">Your Name / Business Name</label>
                        <div className="relative">
                            <Edit3 className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-ink/20" size={16} />
                            <input
                                type="text" value={vendorName} onChange={e => setVendorName(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-brand-olive/10 focus:ring-2 focus:ring-brand-olive/20"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-brand-ink/60 mb-2">Craft / Trade</label>
                        <div className="relative">
                            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-ink/20" size={16} />
                            <input
                                type="text" value={craft} onChange={e => setCraft(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-brand-olive/10 focus:ring-2 focus:ring-brand-olive/20"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-brand-ink/60 mb-2">Location</label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-ink/20" size={16} />
                            <input
                                type="text" value={location} onChange={e => setLocation(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-brand-olive/10 focus:ring-2 focus:ring-brand-olive/20"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-brand-ink/60 mb-2">About Your Work</label>
                        <textarea
                            value={bio} onChange={e => setBio(e.target.value)} rows={4}
                            className="w-full px-4 py-3 rounded-xl border border-brand-olive/10 focus:ring-2 focus:ring-brand-olive/20"
                            placeholder="Tell us what you make, how, and why…"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-brand-ink/60 mb-2">Website or Social Link</label>
                        <div className="relative">
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-ink/20" size={16} />
                            <input
                                type="url" value={website} onChange={e => setWebsite(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-brand-olive/10 focus:ring-2 focus:ring-brand-olive/20"
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            onClick={handleClaim}
                            className="w-full bg-brand-olive text-white font-bold py-4 rounded-full hover:bg-brand-olive/90 transition-all flex items-center justify-center gap-2"
                        >
                            <CheckCircle size={20} /> Claim & Publish My Listing
                        </button>
                        <p className="text-center text-xs text-brand-ink/30 mt-3">
                            Free forever. No hidden charges. You can update or remove your listing at any time.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
