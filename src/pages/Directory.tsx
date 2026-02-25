import React, { useState } from 'react';
import { producers } from '../data/producers';
import { Search, MapPin, Tag, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export const Directory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const allTags = Array.from(new Set(producers.flatMap(p => p.tags)));

  const filteredProducers = producers.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = selectedTag ? p.tags.includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  return (
    <div className="py-16 md:py-24 bg-brand-cream min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16">
          <h1 className="text-5xl md:text-7xl font-serif mb-6">Local Producer <span className="italic text-brand-olive">Directory</span></h1>
          <p className="text-xl text-brand-ink/70 max-w-2xl">
            Support the people who grow, bake, and make our food. Use the filters below to find exactly what you're looking for.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-brand-olive/5 mb-12 flex flex-col md:flex-row gap-6 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-ink/30" size={20} />
            <input 
              type="text" 
              placeholder="Search by name or type..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-brand-cream/50 border-none focus:ring-2 focus:ring-brand-olive/20 text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setSelectedTag(null)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${!selectedTag ? 'bg-brand-olive text-white' : 'bg-brand-cream text-brand-ink/60 hover:bg-brand-olive/10'}`}
            >
              All
            </button>
            {allTags.map(tag => (
              <button 
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${selectedTag === tag ? 'bg-brand-olive text-white' : 'bg-brand-cream text-brand-ink/60 hover:bg-brand-olive/10'}`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {filteredProducers.map((producer, index) => (
            <motion.div 
              key={producer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-brand-olive/5 hover:shadow-xl hover:shadow-brand-olive/5 transition-all group"
            >
              <div className="flex flex-col md:flex-row h-full">
                <div className="md:w-2/5 h-64 md:h-auto overflow-hidden">
                  <img 
                    src={producer.image} 
                    alt={producer.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="md:w-3/5 p-8 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-widest text-brand-olive/60 mb-1 block">{producer.type}</span>
                      <h3 className="text-3xl font-serif">{producer.name}</h3>
                    </div>
                  </div>
                  <p className="text-brand-ink/70 mb-6 line-clamp-2 leading-relaxed">
                    {producer.description}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-brand-ink/50 mb-6">
                    <MapPin size={16} />
                    <span>{producer.location}</span>
                  </div>
                  <div className="mt-auto flex justify-between items-center">
                    <div className="flex gap-2">
                      {producer.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="px-3 py-1 bg-brand-cream rounded-full text-[10px] font-bold uppercase tracking-wider text-brand-olive">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <button className="w-10 h-10 rounded-full bg-brand-olive/5 text-brand-olive flex items-center justify-center group-hover:bg-brand-olive group-hover:text-white transition-all">
                      <ArrowRight size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredProducers.length === 0 && (
          <div className="text-center py-24">
            <p className="text-2xl text-brand-ink/40 font-serif italic">No producers found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};
