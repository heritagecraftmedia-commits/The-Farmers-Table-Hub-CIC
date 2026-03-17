import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Radio, Music, Utensils, Users, ArrowRight, MapPin,
  Calendar, Mic2, Waves, ExternalLink
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// ─── Types ───────────────────────────────────────────────────────────────────

interface RadioEvent {
  id: string;
  title: string;
  type: string;
  date: string;
  venue: string;
  description: string;
  image_url?: string;
  featured_artist?: string;
  link?: string;
}

// ─── Fallback data (shown until Supabase table is seeded) ────────────────────

const FALLBACK_EVENTS: RadioEvent[] = [
  {
    id: '1', title: 'Farnham Artisan Market', type: 'Market',
    date: '2026-04-05T10:00:00', venue: 'Farnham Town Centre',
    description: 'Monthly gathering of local makers, bakers, and food producers. Live music from 12pm.',
    featured_artist: 'The Hop Garden Trio',
  },
  {
    id: '2', title: 'Surrey Folk Night', type: 'Gig',
    date: '2026-04-11T19:30:00', venue: 'The Wheatsheaf, Farnham',
    description: 'An evening of folk and acoustic music celebrating the seasons. Supporting local artists.',
    featured_artist: 'Clara Moss & Band',
  },
  {
    id: '3', title: 'Spring Harvest Pop-Up', type: 'Pop-Up',
    date: '2026-04-19T11:00:00', venue: 'The Farmers Table Hub',
    description: 'Seasonal produce direct from growers. Wild garlic, asparagus, early strawberries.',
  },
  {
    id: '4', title: 'Beekeepers Open Day', type: 'Event',
    date: '2026-04-26T10:00:00', venue: 'Frensham Ponds',
    description: 'Meet local beekeepers, see hives up close, and taste this season\'s first honey.',
    featured_artist: 'Surrey Beekeepers Association',
  },
];

const FALLBACK_ARTISTS = [
  { name: 'The Hop Garden Trio', genre: 'Folk / Acoustic', gig: 'Farnham Artisan Market — 5 Apr' },
  { name: 'Clara Moss & Band', genre: 'Singer-Songwriter', gig: 'Surrey Folk Night — 11 Apr' },
  { name: 'Old Railway Sessions', genre: 'Blues / Country', gig: 'TBC May 2026' },
  { name: 'Meadow String Quartet', genre: 'Classical / Folk', gig: 'Harvest Festival — Jun 2026' },
];

const FALLBACK_CHEFS = [
  {
    name: 'The Herb & Board', type: 'Farm-to-table restaurant', location: 'Farnham',
    bio: 'Seasonal menus built around Surrey produce. Head chef Sarah Turner sources 90% of ingredients within 30 miles.',
  },
  {
    name: 'Wrecclesham Kitchen', type: 'Neighbourhood bistro', location: 'Wrecclesham',
    bio: 'Family-run bistro specialising in slow-cooked Hampshire lamb and locally foraged vegetables.',
  },
  {
    name: 'The Granary Café', type: 'Daytime café', location: 'Alton',
    bio: 'All-day brunch using eggs from local farms, sourdough baked on-site, and seasonal specials on the board daily.',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
};

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

const TYPE_COLOURS: Record<string, string> = {
  Market:  'bg-amber-100 text-amber-700',
  Gig:     'bg-purple-100 text-purple-700',
  'Pop-Up':'bg-green-100  text-green-700',
  Event:   'bg-blue-100   text-blue-700',
};

// ─── Component ───────────────────────────────────────────────────────────────

export const CommunityRadio: React.FC = () => {
  const [events, setEvents] = useState<RadioEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from('radio_events')
        .select('*')
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })
        .limit(8);

      if (error || !data || data.length === 0) {
        setEvents(FALLBACK_EVENTS);
      } else {
        setEvents(data);
      }
      setLoadingEvents(false);
    };
    fetchEvents();
  }, []);

  return (
    <div className="min-h-screen bg-brand-cream">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="py-20 md:py-32 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-olive bg-brand-olive/10 px-4 py-2 rounded-full">
              Community Radio
            </span>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-brand-olive/10 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)] animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wide text-brand-ink/60">On Air</span>
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif mb-6">
            What's <span className="italic text-brand-olive">On</span>
          </h1>
          <p className="text-xl text-brand-ink/60 max-w-2xl mb-10">
            Gigs, markets, pop-ups, and events from across the Farmers Table community.
            Local talent, local food, local life.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/community"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-brand-olive text-white rounded-full font-bold hover:bg-brand-olive/90 transition-all shadow-lg shadow-brand-olive/20"
            >
              <Users size={16} /> Join the Community
            </Link>
            <a
              href="#stream"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-white border border-brand-olive/20 text-brand-ink rounded-full font-bold hover:bg-brand-olive/5 transition-all"
            >
              <Waves size={16} /> Live Stream
            </a>
          </div>
        </div>
      </div>

      {/* ── This Week ─────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-10">
            <Calendar size={20} className="text-brand-olive" />
            <h2 className="text-3xl font-serif">This Week & Upcoming</h2>
            <div className="h-px flex-1 bg-brand-olive/10" />
          </div>

          {loadingEvents ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-40 bg-brand-cream/60 rounded-[28px] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map((ev, i) => (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-brand-cream rounded-[28px] p-6 border border-brand-olive/5 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${TYPE_COLOURS[ev.type] || 'bg-brand-olive/10 text-brand-olive'}`}>
                      {ev.type}
                    </span>
                    {ev.link && (
                      <a href={ev.link} target="_blank" rel="noopener noreferrer" className="text-brand-ink/30 hover:text-brand-olive transition-all">
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                  <h3 className="text-xl font-serif mb-1 leading-snug">{ev.title}</h3>
                  {ev.featured_artist && (
                    <p className="text-xs font-bold text-brand-olive/70 mb-2 flex items-center gap-1">
                      <Mic2 size={10} /> {ev.featured_artist}
                    </p>
                  )}
                  <p className="text-sm text-brand-ink/60 mb-4 line-clamp-2">{ev.description}</p>
                  <div className="flex items-center justify-between text-xs text-brand-ink/40 font-bold">
                    <span className="flex items-center gap-1"><MapPin size={11} /> {ev.venue}</span>
                    <span className="flex items-center gap-1">
                      <Calendar size={11} /> {formatDate(ev.date)} · {formatTime(ev.date)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Featured Artists ──────────────────────────────────────────────── */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-10">
            <Music size={20} className="text-brand-olive" />
            <h2 className="text-3xl font-serif">Featured Artists</h2>
            <div className="h-px flex-1 bg-brand-olive/10" />
          </div>
          <div className="flex overflow-x-auto gap-5 pb-4 -mx-4 px-4 snap-x no-scrollbar">
            {FALLBACK_ARTISTS.map((artist, i) => (
              <motion.div
                key={artist.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.07 }}
                className="w-56 flex-shrink-0 snap-start bg-white rounded-[28px] p-6 border border-brand-olive/5 shadow-sm"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-olive/20 to-brand-olive/5 flex items-center justify-center mb-4">
                  <Mic2 size={20} className="text-brand-olive" />
                </div>
                <h3 className="font-serif text-lg mb-1 leading-snug">{artist.name}</h3>
                <p className="text-xs font-bold text-brand-olive/60 mb-3">{artist.genre}</p>
                <p className="text-xs text-brand-ink/40 leading-relaxed">{artist.gig}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Restaurants & Chefs ──────────────────────────────────── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-10">
            <Utensils size={20} className="text-brand-olive" />
            <h2 className="text-3xl font-serif">Featured Restaurants & Chefs</h2>
            <div className="h-px flex-1 bg-brand-olive/10" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FALLBACK_CHEFS.map((chef, i) => (
              <motion.div
                key={chef.name}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-brand-cream rounded-[28px] p-6 border border-brand-olive/5"
              >
                <div className="w-12 h-12 rounded-2xl bg-brand-olive/10 flex items-center justify-center mb-4">
                  <Utensils size={18} className="text-brand-olive" />
                </div>
                <h3 className="font-serif text-xl mb-1">{chef.name}</h3>
                <p className="text-xs font-bold uppercase tracking-widest text-brand-olive/60 mb-1">{chef.type}</p>
                <p className="text-xs text-brand-ink/40 mb-3 flex items-center gap-1">
                  <MapPin size={10} /> {chef.location}
                </p>
                <p className="text-sm text-brand-ink/60 leading-relaxed">{chef.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live Stream ───────────────────────────────────────────────────── */}
      <section id="stream" className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-10">
            <Radio size={20} className="text-brand-olive" />
            <h2 className="text-3xl font-serif">Live Stream</h2>
            <div className="h-px flex-1 bg-brand-olive/10" />
          </div>
          <div className="bg-white rounded-[32px] border border-brand-olive/5 p-16 text-center">
            <div className="w-20 h-20 rounded-full bg-brand-olive/10 flex items-center justify-center mx-auto mb-6">
              <Waves size={32} className="text-brand-olive/40" />
            </div>
            <h3 className="text-2xl font-serif mb-3">Stream coming soon</h3>
            <p className="text-brand-ink/50 max-w-sm mx-auto mb-6">
              Our Live365 stream will appear here once broadcasting begins.
              Programming runs from the Farmers Table Hub studio.
            </p>
            <a
              href="https://live365.com/manage"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-bold text-brand-olive hover:underline"
            >
              Manage Live365 <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </section>

      {/* ── Crossover CTA ─────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-brand-olive text-white">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-3">Farmers Table Network</p>
            <h2 className="text-3xl font-serif mb-3">Part of the community?</h2>
            <p className="opacity-70 max-w-md">
              See who's performing, share your own events, and connect with other makers, growers, and food lovers — all in one place.
            </p>
          </div>
          <Link
            to="/community"
            className="flex-shrink-0 inline-flex items-center gap-2 px-8 py-4 bg-white text-brand-olive rounded-full font-bold hover:bg-brand-cream transition-all shadow-xl"
          >
            See who's performing <ArrowRight size={18} />
          </Link>
        </div>
      </section>

    </div>
  );
};
