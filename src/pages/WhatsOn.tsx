import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, ExternalLink, Filter, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { hubService } from '../services/hubService';
import { HubEvent } from '../types';

export const WhatsOn: React.FC = () => {
  const [events, setEvents] = useState<HubEvent[]>([]);
  const [filter, setFilter] = useState<'all' | 'this-week' | 'this-month'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Only show approved events to the public
    setEvents(hubService.getEvents().filter(e => e.approved));
  }, []);

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         event.venue.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    
    const eventDate = new Date(event.startDate);
    const now = new Date();
    
    if (filter === 'this-week') {
      const nextWeek = new Date();
      nextWeek.setDate(now.getDate() + 7);
      return matchesSearch && eventDate >= now && eventDate <= nextWeek;
    }
    
    if (filter === 'this-month') {
      return matchesSearch && eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear();
    }
    
    return matchesSearch;
  });

  return (
    <div className="py-16 md:py-24 bg-brand-cream min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mb-16">
          <h1 className="text-5xl md:text-7xl font-serif mb-6">What's <span className="italic text-brand-olive">On</span></h1>
          <p className="text-xl text-brand-ink/70 leading-relaxed">
            Discover local craft fairs, workshops, open studios, and community markets. Rooted in the Farnham artisan community.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-6 mb-12">
          <div className="relative flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-ink/30" size={20} />
            <input 
              type="text" 
              placeholder="Search events, venues..."
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
                className={`px-6 py-3 rounded-full text-sm font-bold transition-all ${
                  filter === f ? 'bg-brand-olive text-white' : 'text-brand-ink/60 hover:bg-brand-cream'
                }`}
              >
                {f === 'all' ? 'All Events' : f === 'this-week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>
        </div>

        {/* Event Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          {filteredEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-[40px] overflow-hidden border border-brand-olive/5 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="p-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-brand-cream px-2 py-0.5 rounded-full text-brand-olive">
                    {event.source}
                  </span>
                </div>
                <h3 className="text-2xl font-serif mb-4 group-hover:text-brand-olive transition-colors">{event.title}</h3>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm text-brand-ink/60">
                    <Calendar size={16} className="text-brand-olive" />
                    <span>{new Date(event.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-brand-ink/60">
                    <MapPin size={16} className="text-brand-olive" />
                    <span>{event.venue}, {event.location}</span>
                  </div>
                </div>
                <p className="text-sm text-brand-ink/70 mb-8 line-clamp-3 leading-relaxed">
                  {event.description}
                </p>
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

          {filteredEvents.length === 0 && (
            <div className="col-span-full py-24 text-center">
              <p className="text-xl text-brand-ink/40 italic">No events found matching your criteria.</p>
              <button 
                onClick={() => {setFilter('all'); setSearchTerm('');}}
                className="mt-4 text-brand-olive font-bold underline"
              >
                Clear all filters
              </button>
            </div>
          )}
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
