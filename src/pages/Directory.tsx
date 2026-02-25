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
  const [featuredRotation, setFeaturedRotation] = useState<DirectoryListing[]>([]);

  React.useEffect(() => {
    const load = async () => {
      const data = await hubService.getListings();
      setAllListings(data);

      // Select 10 featured spots randomly
      const featured = data.filter(l => l.listingTier === 'featured');
      const shuffled = [...featured].sort(() => 0.5 - Math.random());
      setFeaturedRotation(shuffled.slice(0, 10));
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
          </p>
        </div>

        {/* Tiered Pricing / Signup section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {[
            {
              tier: 'free',
              name: 'Basic',
              price: '£0',
              features: ['Verified badge', 'Category listing'],
              cta: 'Get Started'
            },
            {
              tier: 'supporter',
              name: 'Supporter',
              price: '£5',
              features: ['Website links', 'Contact info', 'Social links'],
              cta: 'Claim Listing',
              highlight: true
            },
            {
              tier: 'featured',
              name: 'Featured',
              price: '£15',
              features: ['Priority Spotlight', 'Bio section', 'Affiliate links'],
              cta: 'Go Platinum'
            }
          ].map(tier => (
            <div key={tier.name} className={`bg-white rounded-[32px] p-8 border ${tier.highlight ? 'border-brand-olive ring-1 ring-brand-olive/20' : 'border-brand-olive/5'} transition-all hover:shadow-lg relative overflow-hidden group`}>
              {tier.highlight && <div className="absolute top-0 right-0 bg-brand-olive text-white text-[10px] font-bold px-4 py-1 rounded-bl-xl uppercase tracking-widest">Recommended</div>}
              <h4 className="text-xs font-bold text-brand-olive uppercase tracking-widest mb-2">{tier.name}</h4>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-serif">{tier.price}</span>
                <span className="text-xs text-brand-ink/40">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {tier.features.map(f => (
                  <li key={f} className="text-xs text-brand-ink/60 flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-brand-olive" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/subscriptions" className={`block w-full py-3 rounded-full text-center text-xs font-bold transition-all ${tier.highlight ? 'bg-brand-olive text-white shadow-lg shadow-brand-olive/20' : 'bg-brand-cream text-brand-ink/60 hover:bg-brand-olive/10'}`}>
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Featured Spotlight - 10 Spots Rotation */}
        {selectedCategory === 'All' && featuredRotation.length > 0 && (
          <div className="mb-20">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-2xl font-serif flex items-center gap-3">
                <Crown className="text-amber-400" /> Featured <span className="italic text-brand-olive">Spotlights</span>
              </h2>
              <div className="h-px flex-1 bg-amber-200/30" />
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Premium Showcase</span>
            </div>
            <div className="flex overflow-x-auto pb-8 gap-6 no-scrollbar -mx-4 px-4 snap-x">
              {featuredRotation.map((vendor, idx) => (
                <motion.div
                  key={vendor.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="w-[280px] md:w-[320px] flex-shrink-0 snap-start bg-gradient-to-br from-white to-brand-cream/30 rounded-[32px] p-6 border border-amber-200 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 p-6 opacity-5 -mr-4 -mt-4">
                    <Crown size={80} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand-olive/40 block mb-1">{vendor.craftCategory}</span>
                  <h3 className="text-xl font-serif mb-3 leading-snug">{vendor.vendorName}</h3>
                  <p className="text-xs text-brand-ink/60 mb-6 line-clamp-3 leading-relaxed">{vendor.bio}</p>
                  <div className="flex justify-between items-end">
                    <div className="text-[10px] font-bold text-brand-ink/30 flex items-center gap-1 uppercase tracking-wider">
                      <MapPin size={10} /> {vendor.location}
                    </div>
                    {vendor.website && (
                      <a href={`https://${vendor.website}`} target="_blank" rel="noopener noreferrer" className="p-3 bg-brand-olive text-white rounded-2xl hover:bg-brand-olive/90 transition-all shadow-lg shadow-brand-olive/10">
                        <ArrowRight size={14} />
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

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
