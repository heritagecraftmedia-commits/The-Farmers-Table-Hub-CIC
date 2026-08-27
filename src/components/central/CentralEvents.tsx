import React, { useEffect, useState } from 'react';
import { hubService } from '../../services/hubService';

interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  category: string;
  organiser: string;
}

export const CentralEvents: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadEvents = async () => {
      try {
        setIsLoading(true);
        const response = await hubService.getEvents();
        if (!cancelled) {
          setEvents(response.map((event) => ({
            id: event.id,
            title: event.title,
            description: event.description,
            date: event.startDate,
            location: event.venue ? `${event.location} — ${event.venue}` : event.location,
            category: event.craftType || 'community',
            organiser: event.source || 'Farmers Table',
          })));
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err : new Error('Failed to load events'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void loadEvents();
    return () => { cancelled = true; };
  }, []);

  const categories = ['all', ...new Set(events.map((event) => event.category))];
  const filteredEvents = events.filter((event) => {
    const searchTerm = search.toLowerCase().trim();
    const matchesSearch = !searchTerm || event.title.toLowerCase().includes(searchTerm) || event.description.toLowerCase().includes(searchTerm);
    const matchesCategory = activeCategory === 'all' || event.category === activeCategory;
    const matchesDate = !selectedDate || event.date.slice(0, 10) === selectedDate;
    return matchesSearch && matchesCategory && matchesDate;
  });

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Central Events</h1>
          <p className="text-muted-foreground">Discover community gatherings, radio shows, and local workshops.</p>
        </div>
        <button type="button" onClick={() => { window.location.href = '/submit-listing'; }} className="rounded-lg bg-brand-olive px-4 py-2 font-semibold text-white hover:opacity-90">
          Host an Event
        </button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <label className="sr-only" htmlFor="event-search">Search events</label>
        <input id="event-search" type="search" placeholder="Search events..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full max-w-md rounded-lg border border-brand-olive/20 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-olive/40" />
        <label className="sr-only" htmlFor="event-date">Filter events by date</label>
        <input id="event-date" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="rounded-lg border border-brand-olive/20 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-olive/40" />
        {selectedDate && <button type="button" onClick={() => setSelectedDate('')} className="rounded-lg px-3 py-2 text-sm text-brand-olive hover:bg-brand-olive/10">Clear date</button>}
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Event categories">
        {categories.map((cat) => (
          <button key={cat} type="button" onClick={() => setActiveCategory(cat)} aria-pressed={activeCategory === cat} className={`rounded-full px-3 py-1.5 text-sm font-medium capitalize ${activeCategory === cat ? 'bg-brand-olive text-white' : 'bg-brand-olive/10 text-brand-olive hover:bg-brand-olive/20'}`}>
            {cat.replace('-', ' ')}
          </button>
        ))}
      </div>

      {isLoading && <div className="py-12 text-center text-muted-foreground">Loading events...</div>}
      {error && <div className="py-12 text-center text-red-700"><p>Failed to load events. Please try again later.</p></div>}

      {!isLoading && !error && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.length ? filteredEvents.map((event) => (
            <article key={event.id} className="flex flex-col justify-between rounded-xl border border-brand-olive/10 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              <div>
                <div className="mb-2 flex items-start justify-between gap-3">
                  <span className="rounded-full border border-brand-olive/20 px-2 py-1 text-xs capitalize text-brand-olive">{event.category.replace('-', ' ')}</span>
                  <time className="text-xs text-muted-foreground" dateTime={event.date}>{new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</time>
                </div>
                <h2 className="text-lg font-semibold">{event.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{event.location}</p>
                <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{event.description}</p>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-brand-olive/10 pt-4 text-xs text-muted-foreground">
                <span>By {event.organiser}</span>
                <button type="button" className="rounded px-2 py-1 text-brand-olive hover:bg-brand-olive/10">View Details</button>
              </div>
            </article>
          )) : <div className="col-span-full py-12 text-center text-muted-foreground">No events found matching your criteria.</div>}
        </div>
      )}
    </div>
  );
};

export default CentralEvents;
