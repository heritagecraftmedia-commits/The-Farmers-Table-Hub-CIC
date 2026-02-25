import React, { useState } from 'react';
import { Search, Plus, Package, ArrowRight, Info } from 'lucide-react';
import { motion } from 'motion/react';

const categories = [
  'All Products',
  'Food & Drink',
  'Crafts & Handmade',
  'Clothing & Textiles',
  'Bees & Honey',
  'Furniture & Woodwork',
  'Plants, Seeds & Growing',
  'Tool Makers',
  'Artisan Clothing',
  'Footwear & Leather',
  'Woodcraft & Furniture',
  'Heritage Crafts',
  'Metalwork & Ironcraft',
  'Home & Living',
  'Garden & Land-Based',
  'Services',
  'Other'
];

export const Marketplace: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('All Products');
  const [searchTerm, setSearchTerm] = useState('');

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
          <button className="px-8 py-4 bg-brand-olive text-white rounded-full font-bold flex items-center gap-2 hover:bg-brand-olive/90 transition-all shadow-lg shadow-brand-olive/20 whitespace-nowrap">
            <Plus size={20} /> List Your Products
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-16">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-ink/30" size={24} />
          <input 
            type="text" 
            placeholder="Search products, makers, categories..."
            className="w-full pl-16 pr-6 py-6 rounded-[32px] bg-white border-none shadow-sm focus:ring-2 focus:ring-brand-olive/20 text-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

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
              <span className="text-sm font-bold uppercase tracking-widest opacity-40">0 listings</span>
            </div>

            {/* Empty State */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[40px] p-16 md:p-24 text-center border border-dashed border-brand-olive/20"
            >
              <div className="w-20 h-20 bg-brand-cream rounded-full flex items-center justify-center text-brand-olive/30 mx-auto mb-8">
                <Package size={40} />
              </div>
              <h3 className="text-3xl font-serif mb-4">No listings yet in this category</h3>
              <p className="text-lg text-brand-ink/50 mb-12 max-w-md mx-auto">
                Be the first to list your products here and reach the local community.
              </p>
              <button className="px-10 py-4 bg-brand-olive text-white rounded-full font-bold hover:bg-brand-olive/90 transition-all">
                Add Your Listing
              </button>
            </motion.div>

            {/* Add Your Listing Info */}
            <div className="bg-brand-olive text-brand-cream rounded-[40px] p-12 md:p-16 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-4xl font-serif mb-6">Add Your Listing</h2>
                  <p className="text-xl font-serif italic mb-4">Sell here. Reach the community.</p>
                  <p className="opacity-80 leading-relaxed mb-8">
                    List your products, crafts, tools or services. Basic listings link out to your own website. Featured and Premium listings get placement boosts and analytics.
                  </p>
                  <button className="px-10 py-4 bg-white text-brand-olive rounded-full font-bold hover:bg-brand-cream transition-all flex items-center gap-2">
                    Submit Your Listing <ArrowRight size={20} />
                  </button>
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

