import React, { useState } from 'react';
import { makerListings } from '../data/makerListings';
import { Search, Instagram, Crown, Star, ArrowRight, Palette } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { MakerListing } from '../types';

const CRAFT_CATEGORIES = ['All', 'Ceramics', 'Jewellery', 'Paintings', 'Illustration', 'Textiles', 'Design', 'Other'] as const;

const getCraftCategory = (craft: string): string => {
    const c = craft.toLowerCase();
    if (c.includes('ceramic') || c.includes('pottery')) return 'Ceramics';
    if (c.includes('jewellery') || c.includes('accessories')) return 'Jewellery';
    if (c.includes('paint')) return 'Paintings';
    if (c.includes('illustration') || c.includes('printmaking') || c.includes('paper')) return 'Illustration';
    if (c.includes('textile') || c.includes('crochet') || c.includes('collage')) return 'Textiles';
    if (c.includes('design') || c.includes('graphic') || c.includes('calligraphy')) return 'Design';
    return 'Other';
};

const tierBadge = (tier: MakerListing['tier']) => {
    if (tier === 'featured') return { text: 'Featured', color: 'bg-amber-100 text-amber-700' };
    if (tier === 'supporter') return { text: 'Supporter', color: 'bg-brand-olive/10 text-brand-olive' };
    return null;
};

// Generate a consistent color from the maker name
const makerColor = (name: string) => {
    const colors = [
        'from-rose-200 to-rose-100',
        'from-violet-200 to-violet-100',
        'from-cyan-200 to-cyan-100',
        'from-amber-200 to-amber-100',
        'from-emerald-200 to-emerald-100',
        'from-blue-200 to-blue-100',
        'from-pink-200 to-pink-100',
        'from-teal-200 to-teal-100',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
};

export const MakersShop: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCraft, setSelectedCraft] = useState<string>('All');

    const filtered = makerListings
        .filter(m => {
            const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                m.craft.toLowerCase().includes(searchTerm.toLowerCase()) ||
                m.businessName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCraft = selectedCraft === 'All' || getCraftCategory(m.craft) === selectedCraft;
            return matchesSearch && matchesCraft;
        })
        .sort((a, b) => {
            const tierOrder = { featured: 0, supporter: 1, free: 2 };
            return tierOrder[a.tier] - tierOrder[b.tier];
        });

    return (
        <div className="py-16 md:py-24 bg-brand-cream min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Hero */}
                <div className="mb-16">
                    <h1 className="text-5xl md:text-7xl font-serif mb-6">
                        Makers <span className="italic text-brand-olive">Shop</span>
                    </h1>
                    <p className="text-xl text-brand-ink/70 max-w-2xl">
                        {makerListings.length} local artisans and makers — ceramicists, jewellers, illustrators, textile artists,
                        and more. Discover handmade work from your community.
                    </p>
                </div>

                {/* Filters */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-brand-olive/5 mb-12 flex flex-col md:flex-row gap-6 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-ink/30" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name, craft, or business…"
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-brand-cream/50 border-none focus:ring-2 focus:ring-brand-olive/20 text-lg"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {CRAFT_CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCraft(cat)}
                                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${selectedCraft === cat ? 'bg-brand-olive text-white' : 'bg-brand-cream text-brand-ink/60 hover:bg-brand-olive/10'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <p className="text-sm text-brand-ink/40 mb-6 font-bold">{filtered.length} makers found</p>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((maker, index) => {
                        const badge = tierBadge(maker.tier);
                        const gradientClass = makerColor(maker.name);
                        return (
                            <motion.div
                                key={maker.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: Math.min(index * 0.05, 0.5) }}
                                className={`bg-white rounded-[28px] overflow-hidden shadow-sm border transition-all hover:shadow-lg group ${maker.tier === 'featured' ? 'border-amber-200 ring-2 ring-amber-100' : 'border-brand-olive/5'}`}
                            >
                                {/* Gradient header with initials */}
                                <div className={`h-32 bg-gradient-to-br ${gradientClass} flex items-center justify-center relative`}>
                                    <span className="text-4xl font-serif text-white/80 select-none">
                                        {maker.name.split(' ').map(n => n[0]).join('')}
                                    </span>
                                    {badge && (
                                        <span className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-1 rounded-full ${badge.color} flex items-center gap-1`}>
                                            {maker.tier === 'featured' ? <Crown size={10} /> : <Star size={10} />}
                                            {badge.text}
                                        </span>
                                    )}
                                </div>

                                <div className="p-6">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Palette size={12} className="text-brand-olive/50" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-olive/60">{maker.craft}</span>
                                    </div>
                                    <h3 className="text-xl font-serif mb-1">{maker.businessName || maker.name}</h3>
                                    {maker.businessName && (
                                        <p className="text-sm text-brand-ink/40 mb-3">by {maker.name}</p>
                                    )}

                                    {/* Instagram link (visible for all tiers since it's public) */}
                                    {maker.instagramUrl && (
                                        <a
                                            href={maker.instagramUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-sm text-brand-olive hover:underline mt-2"
                                        >
                                            <Instagram size={14} />
                                            {maker.instagram}
                                        </a>
                                    )}

                                    {/* Supporter / Featured extras */}
                                    {(maker.tier === 'supporter' || maker.tier === 'featured') && (
                                        <div className="mt-4 pt-4 border-t border-brand-olive/5">
                                            <p className="text-xs text-brand-ink/40">✨ Enhanced listing with priority placement</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {filtered.length === 0 && (
                    <div className="text-center py-24">
                        <p className="text-2xl text-brand-ink/40 font-serif italic">No makers found matching your search.</p>
                    </div>
                )}

                {/* CTA */}
                <div className="mt-16 bg-white rounded-[40px] p-12 text-center border border-brand-olive/5">
                    <h3 className="text-3xl font-serif mb-4">Are you a local maker?</h3>
                    <p className="text-brand-ink/60 mb-8 max-w-lg mx-auto">
                        Join our community of artisans. Free basic listing, or upgrade to Supporter (£5/mo) or Featured (£15/mo) for priority placement and enhanced visibility.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/submit-story" className="inline-flex items-center gap-2 px-8 py-4 bg-brand-olive text-white rounded-full font-bold hover:bg-brand-olive/90 transition-all">
                            Submit Your Story <ArrowRight size={18} />
                        </Link>
                        <Link to="/join" className="inline-flex items-center gap-2 px-8 py-4 border-2 border-brand-olive text-brand-olive rounded-full font-bold hover:bg-brand-olive/5 transition-all">
                            Get Listed
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};
