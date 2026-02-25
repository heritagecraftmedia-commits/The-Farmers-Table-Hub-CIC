import { HubEvent, StaffMember, RadioShow, FounderJob, MakerStory, EventCategory, DirectoryListing } from '../types';
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
  { id: '3', task: 'Check radio logs for technical glitches', priority: 'Low', status: 'completed' },
  { id: '4', task: 'Complete Make.com Automation Setup (Refer to make_automation_guide.md)', priority: 'High', status: 'pending' }
];

import { foodVendors } from '../data/foodVendors';
import { makerListings } from '../data/makerListings';

const titleCase = (s: string) => s.replace(/\b\w/g, c => c.toUpperCase());

const getListingCategory = (typeOrCraft: string): DirectoryListing['displayCategory'] => {
  const t = typeOrCraft.toLowerCase();
  if (t.includes('meat')) return 'Meat';
  if (t.includes('milk') || t.includes('dairy') || t.includes('cheese') || t.includes('ice cream')) return 'Milk & Dairy';
  if (t.includes('fruit') || t.includes('vegetable') || t.includes('veg') || t.includes('apple') || t.includes('berry')) return 'Fruit & Veg';
  if (t.includes('egg') || t.includes('poultry') || t.includes('chicken') || t.includes('turkey')) return 'Eggs & Poultry';
  if (t.includes('mixed farm') || t.includes('farm shop')) return 'Mixed Farms';
  if (t.includes('bakery') || t.includes('baker') || t.includes('food') || t.includes('shop')) return 'Makers & Bakers';
  return 'Crafters'; // Default for makers/artisans
};

const realListings: DirectoryListing[] = [
  ...foodVendors.map(v => ({
    id: v.id,
    vendorName: titleCase(v.name),
    craftCategory: v.type,
    displayCategory: getListingCategory(v.type),
    location: `${v.location} (${v.postcode})`,
    bio: `${v.type} producer in ${v.location}.`,
    website: v.website,
    email: v.email,
    phone: v.phone,
    socialLinks: {},
    listingTier: v.tier as any,
    approved: true,
    published: true,
    claimedAt: new Date().toISOString()
  })),
  ...makerListings.map(m => ({
    id: m.id,
    vendorName: m.businessName || m.name,
    craftCategory: m.craft,
    displayCategory: getListingCategory(m.craft),
    location: 'Surrey Area',
    bio: `${m.craft} by ${m.name}.`,
    website: '',
    email: '',
    phone: '',
    socialLinks: { instagram: m.instagram },
    listingTier: m.tier as any,
    approved: true,
    published: true,
    claimedAt: new Date().toISOString()
  }))
];

let mockListings: DirectoryListing[] = [...realListings];

const mockStories: MakerStory[] = [
  {
    id: '1', makerName: 'Thomas Ironworks', craft: 'Blacksmithing',
    image: 'https://images.unsplash.com/photo-1504917595217-d4dc5f649771?auto=format&fit=crop&w=800&q=80',
    q1: 'I learned by watching my grandfather in his small workshop in the Surrey Hills.',
    q2: 'My 1920s Peter Wright anvil. It has a ring like a bell.',
    q3: 'A cold morning, the forge at full heat, and a complex commission taking shape.',
    published: true
  },
  {
    id: '2', makerName: 'Sarah Willow', craft: 'Willow Weaving',
    image: 'https://images.unsplash.com/photo-1590733479497-6a9bc276f571?auto=format&fit=crop&w=800&q=80',
    q1: 'I took a weekend course 10 years ago and never stopped. The rhythm of weaving is meditative.',
    q2: 'A sharp pair of Felco secateurs and my handmade bodkin.',
    q3: 'Working outside in the sun, surrounded by fresh bundles of Somerset willow.',
    published: true
  },
  {
    id: '3', makerName: 'Oak & Ember', craft: 'Furniture Making',
    image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=800&q=80',
    q1: 'Self-taught mostly, through thousands of hours of trial and error in my garage.',
    q2: 'My Japanese hand saws. The precision they offer is unmatched.',
    q3: 'When the final coat of oil goes on a piece and the grain truly comes to life.',
    published: false
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

  addMakerStory: async (story: Omit<MakerStory, 'id'>): Promise<MakerStory | null> => {
    if (!isConfigured()) {
      const ns = { ...story, id: Math.random().toString(36).substr(2, 9) };
      mockStories.push(ns); return ns;
    }
    const { data, error } = await supabase.from('maker_stories').insert({
      maker_name: story.makerName,
      craft: story.craft,
      image: story.image,
      q1: story.q1,
      q2: story.q2,
      q3: story.q3,
      published: story.published
    }).select().single();
    if (error) { console.error('addMakerStory:', error); return null; }
    return { ...story, id: data.id };
  },

  deleteMakerStory: async (id: string) => {
    if (!isConfigured()) { const i = mockStories.findIndex(s => s.id === id); if (i > -1) mockStories.splice(i, 1); return; }
    await supabase.from('maker_stories').delete().eq('id', id);
  },

  updateAffiliateLinks: async (listingId: string, links: { label: string, url: string }[]) => {
    if (!isConfigured()) { mockListings.forEach(l => { if (l.id === listingId) l.affiliateLinks = links; }); return; }
    await supabase.from('directory_listings').update({ affiliate_links: links }).eq('id', listingId);
  },

  getListings: async (): Promise<any[]> => {
    if (!isConfigured()) return mockListings;
    const { data, error } = await supabase.from('directory_listings').select('*').order('vendor_name');
    if (error) { console.error('getListings:', error); return mockListings; }
    return data.map((r: any) => ({
      id: r.id, vendorName: r.vendor_name, craftCategory: r.craft_category,
      location: r.location, website: r.website, bio: r.bio,
      socialLinks: r.social_links, listingTier: r.listing_tier,
      approved: r.approved, published: r.published,
      claimedAt: r.claimed_at, affiliateLinks: r.affiliate_links || []
    }));
  },

  approveListing: async (id: string) => {
    if (!isConfigured()) { mockListings.forEach(l => { if (l.id === id) l.approved = true; }); return; }
    await supabase.from('directory_listings').update({ approved: true }).eq('id', id);
  },

  deleteListing: async (id: string) => {
    if (!isConfigured()) { const i = mockListings.findIndex(l => l.id === id); if (i > -1) mockListings.splice(i, 1); return; }
    await supabase.from('directory_listings').delete().eq('id', id);
  },

  // --- Event-Maker Linkage ---
  getEventMakerLinks: async (eventId?: string): Promise<{ eventId: string, makerId: string, makerName?: string }[]> => {
    if (!isConfigured()) return [];
    let query = supabase.from('event_makers').select('*');
    if (eventId) query = query.eq('event_id', eventId);

    const { data, error } = await query;
    if (error) { console.error('getEventMakerLinks:', error); return []; }
    return data.map((r: any) => ({ eventId: r.event_id, makerId: r.maker_id, makerName: r.maker_name }));
  },

  linkMakerToEvent: async (eventId: string, makerId: string, makerName?: string) => {
    if (!isConfigured()) return;
    const { error } = await supabase.from('event_makers').upsert({ event_id: eventId, maker_id: makerId, maker_name: makerName });
    if (error) console.error('linkMakerToEvent:', error);
  },

  unlinkMakerFromEvent: async (eventId: string, makerId: string) => {
    if (!isConfigured()) return;
    const { error } = await supabase.from('event_makers').delete().match({ event_id: eventId, maker_id: makerId });
    if (error) console.error('unlinkMakerFromEvent:', error);
  },

  // --- External API Integrations (Skeletons) ---
  getXeroInvoices: async () => {
    const key = import.meta.env.VITE_XERO_CLIENT_ID;
    if (!key || key === 'placeholder') {
      return [
        { id: '1', contact: 'Thompson & Morgan', amount: 150.00, status: 'PAID', date: '2026-02-20' },
        { id: '2', contact: 'Lakeland', amount: 45.50, status: 'PENDING', date: '2026-02-25' }
      ];
    }
    // Real fetch logic would go here
    return [];
  },

  getHubSpotContacts: async () => {
    const key = import.meta.env.VITE_HUBSPOT_KEY;
    if (!key || key === 'placeholder') {
      return [
        { id: '1', name: 'Sarah Willow', email: 'sarah@willowcraft.com', type: 'Maker' },
        { id: '2', name: 'John Tools', email: 'john@forgedtools.co.uk', type: 'Supplier' }
      ];
    }
    // Real fetch logic would go here
    return [];
  },

  getNotionPages: async () => {
    const key = import.meta.env.VITE_NOTION_KEY;
    if (!key || key === 'placeholder') {
      return [
        { id: '1', title: 'Marketing Strategy 2026', url: 'https://notion.so/1' },
        { id: '2', title: 'Maker Onboarding Flow', url: 'https://notion.so/2' }
      ];
    }
    // Real fetch logic would go here
    return [];
  },

  getSystemSettings: () => mockSystemSettings,
  updateSystemSettings: (settings: Partial<typeof mockSystemSettings>) => {
    mockSystemSettings = { ...mockSystemSettings, ...settings };
    return mockSystemSettings;
  }
};
