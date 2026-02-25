import React, { useState } from 'react';
import { foodVendors } from '../data/foodVendors';
import { Search, MapPin, ExternalLink, Star, Crown, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { FoodVendor } from '../types';

const CATEGORIES = ['All', 'Meat Products', 'Milk and Dairy', 'Fruit and Vegetables', 'Eggs and Poultry'] as const;

const tierLabel = (tier: FoodVendor['tier']) => {
  if (tier === 'featured') return { text: 'Featured', color: 'bg-amber-100 text-amber-700 border-amber-200' };
  if (tier === 'supporter') return { text: 'Supporter', color: 'bg-brand-olive/10 text-brand-olive border-brand-olive/20' };
  return null;
};

const titleCase = (s: string) => s.replace(/\b\w/g, c => c.toUpperCase());

export const Directory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const filtered = foodVendors
    .filter(v => {
      const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.postcode.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = selectedCategory === 'All' || v.type === selectedCategory;
      return matchesSearch && matchesCat;
    })
    .sort((a, b) => {
      const tierOrder = { featured: 0, supporter: 1, free: 2 };
      return tierOrder[a.tier] - tierOrder[b.tier];
    });

  const counts = CATEGORIES.map(cat => ({
    cat,
    count: cat === 'All' ? foodVendors.length : foodVendors.filter(v => v.type === cat).length,
  }));

  return (
    <div className="py-16 md:py-24 bg-brand-cream min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Hero */}
        <div className="mb-16">
          <h1 className="text-5xl md:text-7xl font-serif mb-6">
            Food <span className="italic text-brand-olive">Directory</span>
          </h1>
          <p className="text-xl text-brand-ink/70 max-w-2xl">
            {foodVendors.length} local producers bringing real food from farm to table.
            Support the people who grow, rear, and make our food.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-brand-olive/5 mb-12 flex flex-col md:flex-row gap-6 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-ink/30" size={20} />
            <input
              type="text"
              placeholder="Search by name, type, or postcode…"
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-brand-cream/50 border-none focus:ring-2 focus:ring-brand-olive/20 text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {counts.map(({ cat, count }) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${selectedCategory === cat ? 'bg-brand-olive text-white' : 'bg-brand-cream text-brand-ink/60 hover:bg-brand-olive/10'}`}
              >
                {cat} <span className="ml-1 opacity-60">({count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-brand-ink/40 mb-6 font-bold">{filtered.length} producers found</p>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((vendor, index) => {
            const badge = tierLabel(vendor.tier);
            return (
              <motion.div
                key={vendor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.03, 0.5) }}
                className={`bg-white rounded-[28px] p-6 shadow-sm border transition-all hover:shadow-lg group ${vendor.tier === 'featured' ? 'border-amber-200 ring-2 ring-amber-100' : vendor.tier === 'supporter' ? 'border-brand-olive/20' : 'border-brand-olive/5'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-olive/60 block mb-1">{vendor.type}</span>
                    <h3 className="text-lg font-serif leading-snug">{titleCase(vendor.name)}</h3>
                  </div>
                  {badge && (
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${badge.color} flex items-center gap-1`}>
                      {vendor.tier === 'featured' ? <Crown size={10} /> : <Star size={10} />}
                      {badge.text}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-sm text-brand-ink/50 mb-4">
                  <MapPin size={14} />
                  <span>{vendor.postcode.toUpperCase()}</span>
                </div>

                {/* Supporter / Featured extras */}
                {(vendor.tier === 'supporter' || vendor.tier === 'featured') && (
                  <div className="space-y-2 mb-4">
                    {vendor.website && (
                      <a href={`https://${vendor.website}`} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-olive flex items-center gap-1 hover:underline">
                        <ExternalLink size={12} /> {vendor.website}
                      </a>
                    )}
                    {vendor.email && (
                      <p className="text-sm text-brand-ink/60">{vendor.email}</p>
                    )}
                    {vendor.phone && (
                      <p className="text-sm text-brand-ink/60">{vendor.phone}</p>
                    )}
                  </div>
                )}

                {/* Free tier – just the basics */}
                {vendor.tier === 'free' && (
                  <p className="text-xs text-brand-ink/30 italic">Basic listing — contact info visible after upgrade</p>
                )}

                {vendor.rating > 0 && (
                  <div className="flex gap-0.5 mt-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={12} className={i < vendor.rating ? 'text-amber-400 fill-amber-400' : 'text-brand-ink/10'} />
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-24">
            <p className="text-2xl text-brand-ink/40 font-serif italic">No producers found matching your search.</p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 bg-white rounded-[40px] p-12 text-center border border-brand-olive/5">
          <h3 className="text-3xl font-serif mb-4">Are you a local producer?</h3>
          <p className="text-brand-ink/60 mb-8 max-w-lg mx-auto">
            Get listed for free. Upgrade to Supporter (£5/mo) or Featured (£15/mo) for enhanced visibility, website links, and contact details shown publicly.
          </p>
          <Link to="/join" className="inline-flex items-center gap-2 px-8 py-4 bg-brand-olive text-white rounded-full font-bold hover:bg-brand-olive/90 transition-all">
            Claim Your Listing <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
};
