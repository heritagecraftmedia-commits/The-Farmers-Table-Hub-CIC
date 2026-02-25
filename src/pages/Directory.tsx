import React, { useState } from 'react';
import { Search, MapPin, ExternalLink, Star, Crown, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { hubService } from '../services/hubService';
import { DirectoryListing } from '../types';

const CATEGORY_ORDER: DirectoryListing['displayCategory'][] = [
  'Meat', 'Milk & Dairy', 'Fruit & Veg', 'Eggs & Poultry', 'Mixed Farms', 'Makers & Bakers', 'Crafters'
];

export const Directory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [allListings, setAllListings] = useState<DirectoryListing[]>([]);

  React.useEffect(() => {
    const load = async () => {
      const data = await hubService.getListings();
      setAllListings(data);
    };
    load();
  }, []);

  const filtered = allListings
    .filter(v => {
      const matchesSearch = v.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.craftCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = selectedCategory === 'All' || v.displayCategory === selectedCategory;
      return matchesSearch && matchesCat;
    });

  const groupedByCat = CATEGORY_ORDER.reduce((acc, cat) => {
    const items = filtered.filter(f => f.displayCategory === cat)
      .sort((a, b) => {
        const tierOrder = { featured: 0, supporter: 1, free: 2 };
        return tierOrder[a.listingTier] - tierOrder[b.listingTier];
      });
    if (items.length > 0) acc.push({ cat, items });
    return acc;
  }, [] as { cat: string; items: DirectoryListing[] }[]);

  const counts = ['All', ...CATEGORY_ORDER].map(cat => ({
    cat,
    count: cat === 'All' ? allListings.length : allListings.filter(v => v.displayCategory === cat).length,
  }));

  const tierLabel = (tier: DirectoryListing['listingTier']) => {
    if (tier === 'featured') return { text: 'Featured', color: 'bg-amber-100 text-amber-700 border-amber-200' };
    if (tier === 'supporter') return { text: 'Supporter', color: 'bg-brand-olive/10 text-brand-olive border-brand-olive/20' };
    return null;
  };

  return (
    <div className="py-16 md:py-24 bg-brand-cream min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Hero */}
        <div className="mb-16">
          <h1 className="text-5xl md:text-7xl font-serif mb-6">
            Local <span className="italic text-brand-olive">Directory</span>
          </h1>
          <p className="text-xl text-brand-ink/70 max-w-2xl">
            {allListings.length} local producers and artisans bringing real quality from farm to table.
            Support the people who grow, rear, and craft our community.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-brand-olive/5 mb-12 flex flex-col md:flex-row gap-6 items-center sticky top-24 z-10">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-ink/30" size={20} />
            <input
              type="text"
              placeholder="Search by name, category, or area…"
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-brand-cream/50 border-none focus:ring-2 focus:ring-brand-olive/20 text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {counts.map(({ cat, count }) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${selectedCategory === cat ? 'bg-brand-olive text-white' : 'bg-brand-cream text-brand-ink/60 hover:bg-brand-olive/10'}`}
              >
                {cat} <span className="ml-1 opacity-60">({count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Categorized Results */}
        <div className="space-y-16">
          {groupedByCat.map(({ cat, items }) => (
            <div key={cat}>
              <div className="flex items-center gap-4 mb-8">
                <h2 className="text-3xl font-serif">{cat}</h2>
                <div className="h-px flex-1 bg-brand-olive/10" />
                <span className="text-xs font-bold text-brand-olive/40">{items.length} Listings</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((vendor, index) => {
                  const badge = tierLabel(vendor.listingTier);
                  return (
                    <motion.div
                      key={vendor.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.03, 0.3) }}
                      className={`bg-white rounded-[28px] p-6 shadow-sm border transition-all hover:shadow-lg group ${vendor.listingTier === 'featured' ? 'border-amber-200 ring-2 ring-amber-100' : vendor.listingTier === 'supporter' ? 'border-brand-olive/20' : 'border-brand-olive/5'}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-olive/60 block mb-1">{vendor.craftCategory}</span>
                          <h3 className="text-lg font-serif leading-snug">{vendor.vendorName}</h3>
                        </div>
                        {badge && (
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${badge.color} flex items-center gap-1 flex-shrink-0`}>
                            {vendor.listingTier === 'featured' ? <Crown size={10} /> : <Star size={10} />}
                            {badge.text}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-sm text-brand-ink/50 mb-4">
                        <MapPin size={14} />
                        <span>{vendor.location}</span>
                      </div>

                      {/* Bio for tiered listings */}
                      {vendor.listingTier !== 'free' && (
                        <p className="text-sm text-brand-ink/60 mb-4 line-clamp-2">{vendor.bio}</p>
                      )}

                      {/* Supporter / Featured contact info */}
                      {(vendor.listingTier === 'supporter' || vendor.listingTier === 'featured') && (
                        <div className="space-y-2 pt-4 border-t border-brand-cream">
                          {vendor.website && (
                            <a href={`https://${vendor.website}`} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-olive font-bold flex items-center gap-1 hover:underline">
                              <ExternalLink size={12} /> {vendor.website.replace('https://', '').replace('www.', '')}
                            </a>
                          )}
                          {vendor.email && (
                            <div className="flex items-center gap-2 text-xs text-brand-ink/60">
                              <span className="font-bold">Email:</span> {vendor.email}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Free tier – just the basics */}
                      {vendor.listingTier === 'free' && (
                        <p className="text-xs text-brand-ink/30 italic mt-4 pt-4 border-t border-brand-cream/50">Basic listing — links visible after upgrade</p>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
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

        {/* Legal / GDPR disclaimer */}
        <div className="mt-12 text-center">
          <p className="text-xs text-brand-ink/30 max-w-xl mx-auto leading-relaxed">
            This directory features independent food producers and farms. Listings are created with permission or at the producer's request.
            If you believe any information is incorrect or would like a listing removed, please <a href="mailto:hello@thefarmerstable.co.uk" className="underline hover:text-brand-olive">contact us</a> and we will act promptly.
          </p>
        </div>
      </div>
    </div>
  );
};
