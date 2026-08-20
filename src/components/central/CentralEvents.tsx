import React, { useEffect, useState } from 'react';
import base44Client from '../../api/base44Client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';

interface CommunityEvent { id: string; title: string; description: string; date: string; location: string; category: 'workshop' | 'radio-live' | 'community' | 'volunteer'; organiser: string; }

export const CentralEvents: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [activeCategory, setActiveCategory] = useState('all');
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadEvents = async () => {
      try {
        setIsLoading(true);
        const response = await base44Client.get('/events');
        if (!cancelled) setEvents(response.data ?? []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err : new Error('Failed to load events'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void loadEvents();
    return () => { cancelled = true; };
  }, []);

  const filteredEvents = events.filter((event) => {
    const searchTerm = search.toLowerCase();
    return (event.title.toLowerCase().includes(searchTerm) || event.description.toLowerCase().includes(searchTerm)) &&
      (activeCategory === 'all' || event.category === activeCategory) &&
      (!selectedDate || new Date(event.date).toDateString() === selectedDate.toDateString());
  });

  return <div className="container mx-auto px-4 py-8 space-y-6">
    <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:items-center"><div><h1 className="text-3xl font-bold tracking-tight">Central Events</h1><p className="text-muted-foreground">Discover community gatherings, radio shows, and local workshops.</p></div><Button onClick={() => { window.location.href = '/submit-listing'; }}>Host an Event</Button></div>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center"><Input placeholder="Search events..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" /><Popover><PopoverTrigger asChild><Button variant="outline">{selectedDate ? selectedDate.toLocaleDateString() : 'Pick a date'}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus /></PopoverContent></Popover>{selectedDate && <Button variant="ghost" onClick={() => setSelectedDate(undefined)}>Clear Date</Button>}</div>
    <div className="flex flex-wrap gap-2">{['all', 'workshop', 'radio-live', 'community', 'volunteer'].map((cat) => <Badge key={cat} variant={activeCategory === cat ? 'default' : 'secondary'} className="cursor-pointer capitalize px-3 py-1 text-sm" onClick={() => setActiveCategory(cat)}>{cat.replace('-', ' ')}</Badge>)}</div>
    {isLoading && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{[1,2,3].map((i) => <Card key={i}><CardHeader><Skeleton className="h-5 w-2/3" /><Skeleton className="h-4 w-1/2" /></CardHeader><CardContent><Skeleton className="h-16 w-full" /></CardContent></Card>)}</div>}
    {error && <div className="text-center py-12 text-destructive"><p>Failed to load events. Please try again later.</p></div>}
    {!isLoading && !error && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{filteredEvents.length ? filteredEvents.map((event) => <Card key={event.id} className="flex flex-col justify-between hover:shadow-md transition-shadow"><CardHeader><div className="flex justify-between items-start mb-2"><Badge variant="outline" className="capitalize">{event.category.replace('-', ' ')}</Badge><span className="text-xs text-muted-foreground">{new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></div><CardTitle className="line-clamp-1">{event.title}</CardTitle><CardDescription>{event.location}</CardDescription></CardHeader><CardContent><p className="text-sm text-muted-foreground line-clamp-3">{event.description}</p></CardContent><CardFooter className="pt-0 flex justify-between items-center text-xs text-muted-foreground border-t mt-4 p-4"><span>By {event.organiser}</span><Button size="sm" variant="ghost">View Details</Button></CardFooter></Card>) : <div className="col-span-full text-center py-12 text-muted-foreground">No events found matching your criteria.</div>}</div>}
  </div>;
};
export default CentralEvents;
