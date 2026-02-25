import { HubEvent, StaffMember, RadioShow, FounderJob, MakerStory, EventCategory } from '../types';
import { supabase } from '../lib/supabase';

const isConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return url && url !== 'https://placeholder.supabase.co' && url.includes('supabase.co');
};

// --- Fallback mock data (used when Supabase not yet configured) ---
const mockEvents: HubEvent[] = [
  {
    id: '1', title: 'Farnham Artisan Market',
    description: 'A monthly gathering of the finest local makers and producers.',
    startDate: '2026-03-15T10:00:00', endDate: '2026-03-15T16:00:00',
    location: 'Farnham Town Centre', venue: 'Market Square',
    websiteUrl: 'https://example.com/artisan-market', craftType: 'Community',
    source: 'Manual', approved: true, createdAt: new Date().toISOString()
  },
  {
    id: '2', title: 'Willow Weaving Workshop',
    description: 'Learn the ancient craft of willow weaving with master artisan Sarah.',
    startDate: '2026-03-20T11:00:00', endDate: '2026-03-20T14:00:00',
    location: 'The Farmers Table Hub', venue: 'Makers Studio',
    websiteUrl: 'https://example.com/weaving-workshop', craftType: 'Workshops & Talks',
    source: 'Manual', approved: false, createdAt: new Date().toISOString()
  },
  {
    id: '3', title: 'Surrey Pottery Open Day',
    description: 'Watch potters at work, try throwing a pot, and browse handmade ceramics.',
    startDate: '2026-04-05T09:30:00', endDate: '2026-04-05T17:00:00',
    location: 'Wrecclesham', venue: 'Wrecclesham Pottery',
    websiteUrl: 'https://example.com/pottery-open-day', craftType: 'Pottery & Ceramics',
    source: 'Manual', approved: true, createdAt: new Date().toISOString()
  },
  {
    id: '4', title: 'Blacksmithing Demonstration',
    description: 'See traditional forging techniques and hand-made tool making by a local blacksmith.',
    startDate: '2026-04-12T11:00:00', endDate: '2026-04-12T15:00:00',
    location: 'Farnham', venue: 'The Rural Life Centre',
    websiteUrl: 'https://example.com/blacksmith-demo', craftType: 'Metal & Tools',
    source: 'Manual', approved: true, createdAt: new Date().toISOString()
  },
  {
    id: '5', title: 'Heritage Textile Fair',
    description: 'Natural dyes, handspun wool, and heritage weaving from Surrey and Hampshire makers.',
    startDate: '2026-04-20T10:00:00', endDate: '2026-04-20T16:00:00',
    location: 'Guildford', venue: 'Guildford Museum',
    websiteUrl: 'https://example.com/textile-fair', craftType: 'Textiles & Clothing',
    source: 'Manual', approved: true, createdAt: new Date().toISOString()
  }
];

const mockStaff: StaffMember[] = [
  { id: '1', name: 'Thalia', role: 'Operations PA', email: 'thalia@farmerstable.org', status: 'active', joinedAt: '2025-01-10' },
  { id: '2', name: 'James', role: 'Volunteer Coordinator', email: 'james@farmerstable.org', status: 'active', joinedAt: '2025-03-01' }
];

const mockRadioShows: RadioShow[] = [
  { id: '1', title: 'Morning Maker Melodies', host: 'Scott', schedule: 'Mon-Fri 08:00 - 10:00', status: 'live', lastBroadcast: '2026-02-24' },
  { id: '2', title: 'The Artisan Hour', host: 'Guest Artisans', schedule: 'Sat 14:00 - 15:00', status: 'planned' }
];

const mockJobs: FounderJob[] = [
  { id: '1', task: 'Review Step 7 Ethical Monetisation rules', priority: 'High', status: 'pending', dueDate: '2026-03-01' },
  { id: '2', task: 'Approve 5 new artisan draft listings', priority: 'Medium', status: 'pending' },
  { id: '3', task: 'Check radio logs for technical glitches', priority: 'Low', status: 'completed' }
];

const mockStories: MakerStory[] = [
  {
    id: '1', makerName: 'Thomas Ironworks', craft: 'Blacksmithing',
    image: 'https://picsum.photos/seed/forge/800/600',
    q1: 'I learned by watching my grandfather in his small workshop in the Surrey Hills.',
    q2: 'My 1920s Peter Wright anvil. It has a ring like a bell.',
    q3: 'A cold morning, the forge at full heat, and a complex commission taking shape.',
    published: true
  }
];

let mockSystemSettings = {
  discoveryAgentEnabled: true, qualificationAgentEnabled: true,
  enrichmentAgentEnabled: false, outreachAgentEnabled: false, maintenanceMode: false
};

// --- Real Supabase service ---
export const hubService = {
  getEvents: async (): Promise<HubEvent[]> => {
    if (!isConfigured()) return mockEvents;
    const { data, error } = await supabase.from('events').select('*').order('start_date', { ascending: true });
    if (error) { console.error('getEvents:', error); return mockEvents; }
    return data.map((r: any) => ({ id: r.id, title: r.title, description: r.description, startDate: r.start_date, endDate: r.end_date, location: r.location, venue: r.venue, websiteUrl: r.website_url, source: r.source, approved: r.approved, createdAt: r.created_at }));
  },

  approveEvent: async (id: string) => {
    if (!isConfigured()) { mockEvents.forEach(e => { if (e.id === id) e.approved = true; }); return; }
    await supabase.from('events').update({ approved: true }).eq('id', id);
  },

  deleteEvent: async (id: string) => {
    if (!isConfigured()) { const i = mockEvents.findIndex(e => e.id === id); if (i > -1) mockEvents.splice(i, 1); return; }
    await supabase.from('events').delete().eq('id', id);
  },

  addEvent: async (event: Omit<HubEvent, 'id' | 'createdAt'>): Promise<HubEvent | null> => {
    if (!isConfigured()) {
      const ne = { ...event, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString() };
      mockEvents.push(ne); return ne;
    }
    const { data, error } = await supabase.from('events').insert({ title: event.title, description: event.description, start_date: event.startDate, end_date: event.endDate, location: event.location, venue: event.venue, website_url: event.websiteUrl, source: event.source, approved: event.approved }).select().single();
    if (error) { console.error('addEvent:', error); return null; }
    return { ...event, id: data.id, createdAt: data.created_at };
  },

  getStaff: async (): Promise<StaffMember[]> => {
    if (!isConfigured()) return mockStaff;
    const { data, error } = await supabase.from('staff').select('*').order('name');
    if (error) { console.error('getStaff:', error); return mockStaff; }
    return data.map((r: any) => ({ id: r.id, name: r.name, role: r.role, email: r.email, status: r.status, joinedAt: r.joined_at }));
  },

  addStaff: async (member: Omit<StaffMember, 'id' | 'joinedAt'>): Promise<StaffMember | null> => {
    if (!isConfigured()) {
      const nm = { ...member, id: Math.random().toString(36).substr(2, 9), joinedAt: new Date().toISOString().split('T')[0] };
      mockStaff.push(nm); return nm;
    }
    const { data, error } = await supabase.from('staff').insert({ name: member.name, role: member.role, email: member.email, status: member.status }).select().single();
    if (error) { console.error('addStaff:', error); return null; }
    return { id: data.id, name: data.name, role: data.role, email: data.email, status: data.status, joinedAt: data.joined_at };
  },

  removeStaff: async (id: string) => {
    if (!isConfigured()) { const i = mockStaff.findIndex(s => s.id === id); if (i > -1) mockStaff.splice(i, 1); return; }
    await supabase.from('staff').delete().eq('id', id);
  },

  getRadioShows: async (): Promise<RadioShow[]> => {
    if (!isConfigured()) return mockRadioShows;
    const { data, error } = await supabase.from('radio_shows').select('*').order('title');
    if (error) { console.error('getRadioShows:', error); return mockRadioShows; }
    return data.map((r: any) => ({ id: r.id, title: r.title, host: r.host, schedule: r.schedule, status: r.status, lastBroadcast: r.last_broadcast }));
  },

  updateRadioStatus: async (id: string, status: RadioShow['status']) => {
    if (!isConfigured()) { mockRadioShows.forEach(s => { if (s.id === id) s.status = status; }); return; }
    await supabase.from('radio_shows').update({ status }).eq('id', id);
  },

  getFounderJobs: async (): Promise<FounderJob[]> => {
    if (!isConfigured()) return mockJobs;
    const { data, error } = await supabase.from('founder_jobs').select('*').order('created_at', { ascending: false });
    if (error) { console.error('getFounderJobs:', error); return mockJobs; }
    return data.map((r: any) => ({ id: r.id, task: r.task, priority: r.priority, status: r.status, dueDate: r.due_date }));
  },

  completeJob: async (id: string) => {
    if (!isConfigured()) { mockJobs.forEach(j => { if (j.id === id) j.status = 'completed'; }); return; }
    await supabase.from('founder_jobs').update({ status: 'completed' }).eq('id', id);
  },

  addJob: async (task: string, priority: FounderJob['priority']): Promise<FounderJob | null> => {
    if (!isConfigured()) {
      const nj: FounderJob = { id: Math.random().toString(36).substr(2, 9), task, priority, status: 'pending' };
      mockJobs.push(nj); return nj;
    }
    const { data, error } = await supabase.from('founder_jobs').insert({ task, priority, status: 'pending' }).select().single();
    if (error) { console.error('addJob:', error); return null; }
    return { id: data.id, task: data.task, priority: data.priority, status: data.status, dueDate: data.due_date };
  },

  getMakerStories: async (): Promise<MakerStory[]> => {
    if (!isConfigured()) return mockStories;
    const { data, error } = await supabase.from('maker_stories').select('*').order('created_at', { ascending: false });
    if (error) { console.error('getMakerStories:', error); return mockStories; }
    return data.map((r: any) => ({ id: r.id, makerName: r.maker_name, craft: r.craft, image: r.image, q1: r.q1, q2: r.q2, q3: r.q3, published: r.published }));
  },

  publishStory: async (id: string) => {
    if (!isConfigured()) { mockStories.forEach(s => { if (s.id === id) s.published = true; }); return; }
    await supabase.from('maker_stories').update({ published: true }).eq('id', id);
  },

  getSystemSettings: () => mockSystemSettings,
  updateSystemSettings: (settings: Partial<typeof mockSystemSettings>) => {
    mockSystemSettings = { ...mockSystemSettings, ...settings };
    return mockSystemSettings;
  }
};
