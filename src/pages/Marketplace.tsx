import React, { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Package, ArrowRight, Info, MapPin, Globe, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { hubService } from '../services/hubService';
import { DirectoryListing } from '../types';

const ALL = 'All Products';

/**
 * Public marketplace.
 *
 * This page was a UI shell: a hardcoded "0 listings" counter, an empty state
 * that showed unconditionally, no data source at all, and three buttons with no
 * onClick. It now reads the real directory.
 *
 * Ordering is alphabetical, deliberately. Paid tiers get a badge but never a
 * better position — the project's stated commitment is free listings that stay
 * permanent, with no pay-to-rank.
 */
export const Marketplace: React.FC = () => {
  const [listings, setListings] = useState<DirectoryListing[]>([]);
  const [activeCategory, setActiveCategory] = useState(ALL);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    hubService.getListings()
      .then(rows => { if (active) setListings(rows.filter((l: DirectoryListing) => l.published)); })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : 'Could not load listings.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  // Categories come from the data rather than a fixed list, so the filters
  // always match what is actually listed.
  const categories = useMemo(() => {
    const found = new Set<string>();
    listings.forEach(l => { if (l.craftCategory) found.add(l.craftCategory); });
    return [ALL, ...[...found].sort((a, b) => a.localeCompare(b))];
  }, [listings]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return listings
      .filter(l => activeCategory === ALL || l.craftCategory === activeCategory)
      .filter(l => !q
        || l.vendorName?.toLowerCase().includes(q)
        || l.craftCategory?.toLowerCase().includes(q)
        || l.location?.toLowerCase().includes(q)
        || l.bio?.toLowerCase().includes(q))
      .sort((a, b) => a.vendorName.localeCompare(b.vendorName));
  }, [listings, activeCategory, searchTerm]);

  const tierBadge = (tier: DirectoryListing['listingTier']) => {
    if (tier === 'featured') return { text: 'Featured', cls: 'bg-amber-100 text-amber-700' };
    if (tier === 'supporter') return { text: 'Supporter', cls: 'bg-brand-olive/10 text-brand-olive' };
    return null;
  };

  return (
    <div className="py-16 md:py-24 bg-brand-cream min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-serif mb-6">The Farmers Table <span className="italic text-brand-olive">Marketplace</span></h1>
            <p className="text-xl text-brand-ink/70 leading-relaxed">
              Local producers, crafters, growers and makers — all in one place. Tools, food, furniture, clothing, equipment and more.
            </p>
          </div>
          <Link to="/apply" className="px-8 py-4 bg-brand-olive text-white rounded-full font-bold flex items-center gap-2 hover:bg-brand-olive/90 transition-all shadow-lg shadow-brand-olive/20 whitespace-nowrap">
            <Plus size={20} /> List Your Products
          </Link>
        </div>

        {/* Search Bar */}
        <div className="relative mb-16">
          <label className="sr-only" htmlFor="marketplace-search">Search the marketplace</label>
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-ink/30" size={24} />
          <input
            id="marketplace-search"
            type="search"
            placeholder="Search products, makers, categories..."
            className="w-full pl-16 pr-6 py-6 rounded-[32px] bg-white border-none shadow-sm focus:ring-2 focus:ring-brand-olive/20 text-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 mb-10 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white p-8 rounded-[40px] border border-brand-olive/5 shadow-sm">
              <h3 className="text-xl font-serif mb-8 border-b border-brand-cream pb-4">Browse Categories</h3>
              <ul className="space-y-2">
                {categories.map(cat => (
                  <li key={cat}>
                    <button
                      onClick={() => setActiveCategory(cat)}
                      aria-pressed={activeCategory === cat}
                      className={`w-full text-left px-4 py-3 rounded-2xl transition-all font-medium text-sm ${
                        activeCategory === cat
                          ? 'bg-brand-olive text-white shadow-md'
                          : 'text-brand-ink/60 hover:bg-brand-cream hover:text-brand-olive'
                      }`}
                    >
                      {cat}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Listings Section */}
          <div className="lg:col-span-3 space-y-12">
            <div className="flex justify-between items-end border-b border-brand-olive/10 pb-6">
              <h2 className="text-4xl font-serif">{activeCategory}</h2>
              <span className="text-sm font-bold uppercase tracking-widest opacity-40">
                {loading ? 'Loading…' : `${filtered.length} listing${filtered.length === 1 ? '' : 's'}`}
              </span>
            </div>

            {loading ? (
              <div className="py-24 flex justify-center">
                <div className="w-8 h-8 border-2 border-brand-olive/30 border-t-brand-olive rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[40px] p-16 md:p-24 text-center border border-dashed border-brand-olive/20"
              >
                <div className="w-20 h-20 bg-brand-cream rounded-full flex items-center justify-center text-brand-olive/30 mx-auto mb-8">
                  <Package size={40} />
                </div>
                <h3 className="text-3xl font-serif mb-4">
                  {searchTerm ? 'Nothing matches that search' : 'No listings yet in this category'}
                </h3>
                <p className="text-lg text-brand-ink/50 mb-12 max-w-md mx-auto">
                  {searchTerm
                    ? 'Try a different word, or browse a category on the left.'
                    : 'Be the first to list your products here and reach the local community.'}
                </p>
                <Link to="/apply" className="inline-block px-10 py-4 bg-brand-olive text-white rounded-full font-bold hover:bg-brand-olive/90 transition-all">
                  Add Your Listing
                </Link>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {filtered.map((listing, idx) => {
                  const badge = tierBadge(listing.listingTier);
                  return (
                    <motion.article
                      key={listing.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(idx, 8) * 0.04 }}
                      className="bg-white rounded-[32px] p-6 border border-brand-olive/5 shadow-sm hover:shadow-md transition-shadow flex flex-col"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-xl font-serif leading-tight">{listing.vendorName}</h3>
                        {badge && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${badge.cls}`}>
                            {badge.text}
                          </span>
                        )}
                      </div>
                      {listing.craftCategory && (
                        <p className="text-[11px] font-bold uppercase tracking-widest text-brand-olive mb-3">
                          {listing.craftCategory}
                        </p>
                      )}
                      {listing.bio && (
                        <p className="text-sm text-brand-ink/60 leading-relaxed mb-4 line-clamp-3">{listing.bio}</p>
                      )}
                      <div className="mt-auto space-y-2 pt-2">
                        {listing.location && (
                          <p className="text-xs text-brand-ink/50 flex items-center gap-2">
                            <MapPin size={13} className="shrink-0" /> {listing.location}
                          </p>
                        )}
                        {listing.website && (
                          <a
                            href={listing.website.startsWith('http') ? listing.website : `https://${listing.website}`}
                            target="_blank" rel="noreferrer noopener"
                            className="text-xs font-bold text-brand-olive hover:underline flex items-center gap-2"
                          >
                            <Globe size={13} className="shrink-0" /> Visit website
                          </a>
                        )}
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            )}

            {/* Add Your Listing Info */}
            <div className="bg-brand-olive text-brand-cream rounded-[40px] p-12 md:p-16 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-4xl font-serif mb-6">Add Your Listing</h2>
                  <p className="text-xl font-serif italic mb-4">Sell here. Reach the community.</p>
                  <p className="opacity-80 leading-relaxed mb-8">
                    List your products, crafts, tools or services. Basic listings are free and stay free — listings are shown in alphabetical order, never ranked by what you pay.
                  </p>
                  <Link to="/apply" className="px-10 py-4 bg-white text-brand-olive rounded-full font-bold hover:bg-brand-cream transition-all inline-flex items-center gap-2">
                    Submit Your Listing <ArrowRight size={20} />
                  </Link>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/10 space-y-6">
                  <div className="flex gap-4">
                    <Info className="shrink-0 opacity-50" size={20} />
                    <p className="text-sm">Reach thousands of local Farnham residents looking for quality goods.</p>
                  </div>
                  <div className="flex gap-4">
                    <Info className="shrink-0 opacity-50" size={20} />
                    <p className="text-sm">Support the Farmers Table Hub's mission while growing your local business.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
