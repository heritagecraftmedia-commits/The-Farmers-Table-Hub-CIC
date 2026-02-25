import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, ExternalLink, Search, Star, ArrowRight, Tag } from 'lucide-react';
import { motion } from 'motion/react';
import { hubService } from '../services/hubService';
import { HubEvent, EventCategory } from '../types';

const categories: EventCategory[] = [
  'Community', 'Wood & Furniture', 'Textiles & Clothing', 'Pottery & Ceramics',
  'Metal & Tools', 'Heritage & Skills', 'Workshops & Talks', 'Food & Produce', 'Other'
];

export const WhatsOn: React.FC = () => {
  const [events, setEvents] = useState<HubEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'this-week' | 'this-month'>('all');
  const [categoryFilter, setCategoryFilter] = useState<EventCategory | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const all = await hubService.getEvents();
      setEvents(all.filter(e => e.approved));
      setLoading(false);
    };
    load();
  }, []);

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || event.craftType === categoryFilter;

    if (filter === 'all') return matchesSearch && matchesCategory;

    const eventDate = new Date(event.startDate);
    const now = new Date();

    if (filter === 'this-week') {
      const nextWeek = new Date();
      nextWeek.setDate(now.getDate() + 7);
      return matchesSearch && matchesCategory && eventDate >= now && eventDate <= nextWeek;
    }

    if (filter === 'this-month') {
      return matchesSearch && matchesCategory && eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear();
    }

    return matchesSearch && matchesCategory;
  });

  // Featured events: next 3 approved events sorted by date
  const featured = [...events]
    .filter(e => new Date(e.startDate) >= new Date())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 3);

  return (
    <div className="py-16 md:py-24 bg-brand-cream min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="max-w-3xl mb-12">
          <h1 className="text-5xl md:text-7xl font-serif mb-6">What's <span className="italic text-brand-olive">On</span></h1>
          <p className="text-xl text-brand-ink/70 leading-relaxed">
            Discover local craft fairs, workshops, open studios, and community markets. Rooted in the Farnham artisan community.
          </p>
        </div>

        {/* Featured Events Strip */}
        {featured.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <Star size={20} className="text-amber-500 fill-amber-500" />
              <h2 className="text-lg font-bold text-brand-ink">Coming Up Next</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featured.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-gradient-to-br from-brand-olive/10 to-brand-olive/5 rounded-3xl p-6 border border-brand-olive/10"
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand-olive bg-white/60 px-2 py-0.5 rounded-full">{event.craftType || event.source}</span>
                  <h3 className="text-lg font-serif mt-3 mb-2">{event.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-brand-ink/60 mb-1">
                    <Calendar size={14} className="text-brand-olive" />
                    <span>{new Date(event.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-brand-ink/60">
                    <MapPin size={14} className="text-brand-olive" />
                    <span>{event.venue}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Search + Time Filters */}
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-ink/30" size={20} />
            <input
              type="text"
              placeholder="Search events, venues, locations..."
              className="w-full pl-14 pr-6 py-4 rounded-full bg-white border-none shadow-sm focus:ring-2 focus:ring-brand-olive/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 p-1 bg-white rounded-full shadow-sm">
            {(['all', 'this-week', 'this-month'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-6 py-3 rounded-full text-sm font-bold transition-all ${filter === f ? 'bg-brand-olive text-white' : 'text-brand-ink/60 hover:bg-brand-cream'
                  }`}
              >
                {f === 'all' ? 'All Events' : f === 'this-week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex flex-wrap gap-2 mb-12">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${categoryFilter === 'all' ? 'bg-brand-olive text-white' : 'bg-white text-brand-ink/60 hover:bg-brand-cream border border-brand-olive/10'
              }`}
          >
            <Tag size={12} /> All Crafts
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${categoryFilter === cat ? 'bg-brand-olive text-white' : 'bg-white text-brand-ink/60 hover:bg-brand-cream border border-brand-olive/10'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-24">
            <div className="inline-block w-8 h-8 border-2 border-brand-olive/20 border-t-brand-olive rounded-full animate-spin" />
            <p className="mt-4 text-brand-ink/40">Loading events…</p>
          </div>
        )}

        {/* Event Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
            {filteredEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className="bg-white rounded-[40px] overflow-hidden border border-brand-olive/5 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="p-8">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-brand-cream px-2 py-0.5 rounded-full text-brand-olive">{event.craftType || event.source}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-brand-cream/60 px-2 py-0.5 rounded-full text-brand-ink/40">{event.source}</span>
                  </div>
                  <h3 className="text-2xl font-serif mb-4 group-hover:text-brand-olive transition-colors">{event.title}</h3>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-sm text-brand-ink/60">
                      <Calendar size={16} className="text-brand-olive" />
                      <span>{new Date(event.startDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-brand-ink/60">
                      <MapPin size={16} className="text-brand-olive" />
                      <span>{event.venue}, {event.location}</span>
                    </div>
                  </div>
                  <p className="text-sm text-brand-ink/70 mb-8 line-clamp-3 leading-relaxed">{event.description}</p>
                  <a
                    href={event.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-brand-olive font-bold hover:gap-3 transition-all"
                  >
                    Visit event website <ExternalLink size={16} />
                  </a>
                </div>
              </motion.div>
            ))}

            {filteredEvents.length === 0 && !loading && (
              <div className="col-span-full py-24 text-center">
                <p className="text-xl text-brand-ink/40 italic">No events match your filters right now.</p>
                <p className="mt-2 text-sm text-brand-ink/30">More events are being added regularly — check back soon.</p>
                <button
                  onClick={() => { setFilter('all'); setCategoryFilter('all'); setSearchTerm(''); }}
                  className="mt-4 text-brand-olive font-bold underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Submit CTA */}
        <div className="max-w-2xl mx-auto text-center bg-white rounded-[40px] p-12 shadow-sm border border-brand-olive/10 mb-16">
          <h2 className="text-2xl font-serif mb-4">Running a local event?</h2>
          <p className="text-brand-ink/60 mb-6">If you're an organiser with a craft fair, workshop, or open studio, we'd love to list it here — free of charge.</p>
          <a href="/join" className="inline-flex items-center gap-2 bg-brand-olive text-white font-bold px-8 py-4 rounded-full hover:bg-brand-olive/90 transition-all">
            Submit an Event <ArrowRight size={18} />
          </a>
        </div>

        {/* Footer Notice */}
        <div className="max-w-4xl mx-auto text-center border-t border-brand-olive/10 pt-12">
          <p className="text-sm text-brand-ink/40 leading-relaxed">
            Events listed here are publicly advertised by organisers. Details may change — please check the event website.
            If you are an organiser and wish to update or remove a listing, contact us and we will act promptly.
          </p>
        </div>
      </div>
    </div>
  );
};
