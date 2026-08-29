import { HubEvent, StaffMember, RadioShow, FounderJob, MakerStory, EventCategory, DirectoryListing, PendingListing, PlaylistTrack, SponsorRotation, AdSchedule, SocialPost } from '../types';
import { supabase } from '../lib/supabase';

const isConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return url && url !== 'https://placeholder.supabase.co' && url.includes('supabase.co');
};

// --- Fallback mock data (DEVELOPMENT ONLY) ---
//
// Everything in this block is invented placeholder content: the events,
// staff, radio shows, maker stories, playlist, sponsors and ad schedules
// are not real people, businesses or bookings. It exists so the UI can be
// worked on before Supabase is configured.
//
// It must never render in a production build. Every read path below
// returns it through devOnly(), which yields an empty list outside dev,
// so a misconfigured or briefly failing production deployment shows an
// empty state rather than fictional markets and fabricated sponsors.
// This extends the pattern PR #4 already applied to mockListings.
const devOnly = <T,>(data: T[]): T[] => (import.meta.env.DEV ? data : []);

// --- Fallback mock data (see devOnly note above) ---
const mockEvents: HubEvent[] = import.meta.env.DEV
  ? [
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
]
  : [];

const mockStaff: StaffMember[] = import.meta.env.DEV
  ? [
  { id: '1', name: 'Thalia', role: 'Operations PA', email: 'thalia@farmerstable.org', status: 'active', joinedAt: '2025-01-10' },
  { id: '2', name: 'James', role: 'Volunteer Coordinator', email: 'james@farmerstable.org', status: 'active', joinedAt: '2025-03-01' }
]
  : [];

const mockRadioShows: RadioShow[] = import.meta.env.DEV
  ? [
  { id: '1', title: 'Morning Maker Melodies', host: 'Scott', schedule: 'Mon-Fri 08:00 - 10:00', status: 'live', lastBroadcast: '2026-02-24' },
  { id: '2', title: 'The Artisan Hour', host: 'Guest Artisans', schedule: 'Sat 14:00 - 15:00', status: 'planned' }
]
  : [];

const mockJobs: FounderJob[] = import.meta.env.DEV
  ? [
  { id: '1', task: 'Review Step 7 Ethical Monetisation rules', priority: 'High', status: 'pending', dueDate: '2026-03-01' },
  { id: '2', task: 'Approve 5 new artisan draft listings', priority: 'Medium', status: 'pending' },
  { id: '3', task: 'Check radio logs for technical glitches', priority: 'Low', status: 'completed' },
  { id: '4', task: 'Complete Make.com Automation Setup (Refer to make_automation_guide.md)', priority: 'High', status: 'pending' }
]
  : [];

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

// foodVendors and makerListings both number their ids from 1, and 29 ids
// collide across the two files. Merging them raw produced duplicate keys in any
// list that rendered them, which breaks React's reconciliation (wrong row
// updated or removed). Namespacing on merge keeps each source's ids stable
// while making the combined set unique.
const realListings: DirectoryListing[] = [
  ...foodVendors.map(v => ({
    id: `vendor-${v.id}`,
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
    outreachApproved: false,
    outreachOptedOut: false,
    claimedAt: new Date().toISOString()
  })),
  ...makerListings.map(m => ({
    id: `maker-${m.id}`,
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
    outreachApproved: false,
    outreachOptedOut: false,
    claimedAt: new Date().toISOString()
  }))
];

let mockListings: DirectoryListing[] = [...realListings];

const mockStories: MakerStory[] = import.meta.env.DEV
  ? [
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
]
  : [];

let mockPendingListings: PendingListing[] = import.meta.env.DEV
  ? [
  {
    id: 'p1',
    businessName: 'Bramble & Birch Ceramics',
    category: 'Pottery & Ceramics',
    location: 'Farnham, Surrey',
    website: 'https://bramblebirch.co.uk',
    instagram: '@bramblebirchceramics',
    description: 'Hand-thrown stoneware inspired by the Surrey Hills. Functional and decorative pieces, all wood-fired in a traditional kiln.',
    sourcePlatform: 'Instagram',
    sourceUrl: 'https://instagram.com/bramblebirchceramics',
    discoveredAt: new Date(Date.now() - 86400000).toISOString(),
    status: 'pending',
    contactEmail: 'hello@bramblebirch.co.uk',
    aiConfidenceScore: 92,
  },
  {
    id: 'p2',
    businessName: 'Holt Farm Dairy',
    category: 'Milk & Dairy',
    location: 'Godalming, Surrey',
    website: 'https://holtfarmdairy.co.uk',
    instagram: '@holtfarmdairy',
    description: 'Family-run dairy farm producing raw milk, artisan cheeses, and cultured butter. Available at Guildford Farmers\' Market.',
    sourcePlatform: 'Google Maps',
    sourceUrl: 'https://maps.google.com/?q=holt+farm+dairy',
    discoveredAt: new Date(Date.now() - 172800000).toISOString(),
    status: 'pending',
    contactEmail: 'info@holtfarmdairy.co.uk',
    aiConfidenceScore: 88,
  },
  {
    id: 'p3',
    businessName: 'The Willow Basket Co.',
    category: 'Heritage & Skills',
    location: 'Haslemere, Surrey',
    instagram: '@willowbasketco',
    description: 'Traditional English willow basketry. Commissions welcome. Runs weekend workshops for beginners.',
    sourcePlatform: 'Etsy',
    sourceUrl: 'https://etsy.com/shop/willowbasketco',
    discoveredAt: new Date(Date.now() - 259200000).toISOString(),
    status: 'pending',
    aiConfidenceScore: 79,
  },
]
  : [];

// Mirrors the system_controls table. Keys here are camelCase for the UI; the
// table stores snake_case, mapped by SYSTEM_CONTROL_KEYS below.
export interface SystemSettings {
  discoveryAgentEnabled: boolean;
  qualificationAgentEnabled: boolean;
  enrichmentAgentEnabled: boolean;
  outreachAgentEnabled: boolean;
  maintenanceMode: boolean;
}

const SYSTEM_CONTROL_KEYS: Record<keyof SystemSettings, string> = {
  discoveryAgentEnabled: 'discovery_enabled',
  qualificationAgentEnabled: 'qualification_enabled',
  enrichmentAgentEnabled: 'enrichment_enabled',
  outreachAgentEnabled: 'outreach_enabled',
  maintenanceMode: 'maintenance_mode',
};

// Defaults match the seed rows in supabase-schema.sql. Used when Supabase is
// not configured, and as the fail-safe when a row is missing: the two agents
// that touch real people (enrichment, outreach) default to OFF.
// NOT gated by devOnly() — deliberately. These are the default agent
// feature-toggles, not invented content: no person, business or event is
// described here, and getSystemSettings must return a SystemSettings
// object rather than an empty list. Falling back to "discovery on,
// outreach off" is the safe default when the settings row is unreadable.
let mockSystemSettings: SystemSettings = {
  discoveryAgentEnabled: true, qualificationAgentEnabled: true,
  enrichmentAgentEnabled: false, outreachAgentEnabled: false, maintenanceMode: false
};

// --- Radio System mock data ---
let mockPlaylist: PlaylistTrack[] = import.meta.env.DEV
  ? [
  { id: 'pl1', title: 'Sunrise Acoustic Set', artist: 'Various Artists', durationSeconds: 1800, category: 'music', fileUrl: '', orderIndex: 1, isActive: true, createdAt: new Date().toISOString() },
  { id: 'pl2', title: 'TFT Morning Jingle', artist: 'The Farmers Table', durationSeconds: 15, category: 'jingle', fileUrl: '', orderIndex: 2, isActive: true, createdAt: new Date().toISOString() },
  { id: 'pl3', title: 'Community Notice — Market Day', artist: 'Staff Read', durationSeconds: 60, category: 'community', fileUrl: '', orderIndex: 3, isActive: true, createdAt: new Date().toISOString() },
  { id: 'pl4', title: 'Emergency Playlist — Folk Classics', artist: 'Various', durationSeconds: 3600, category: 'emergency', fileUrl: '', orderIndex: 99, isActive: true, createdAt: new Date().toISOString() },
]
  : [];

let mockSponsors: SponsorRotation[] = import.meta.env.DEV
  ? [
  { id: 'sp1', name: 'Surrey Ironworks', productDesc: 'Hand-forged tools and decorative ironwork.', contactName: 'James Hill', contactEmail: 'james@surreyironworks.co.uk', package: '30s', readsPerShow: 2, adScript: 'Surrey Ironworks — beautiful hand-forged tools, made with care in the Surrey Hills. Visit surreyironworks.co.uk', renewalDate: '2026-06-01', status: 'active', createdAt: new Date().toISOString() },
  { id: 'sp2', name: 'Farnham Brewery', productDesc: 'Small-batch craft ales brewed locally.', contactName: 'Tom Granger', contactEmail: 'tom@farnhambrewery.co.uk', package: '30s', readsPerShow: 1, adScript: 'Farnham Brewery — award-winning craft ales, brewed right here in Farnham.', renewalDate: '2026-09-15', status: 'active', createdAt: new Date().toISOString() },
  { id: 'sp3', name: 'Rural Candle Co.', productDesc: 'Handmade soy candles with natural fragrances.', contactName: 'Lucy Park', contactEmail: 'lucy@ruralcandleco.com', package: '15s', readsPerShow: 2, adScript: 'Rural Candle Co — natural soy candles, hand-poured with love. Find us at the Farmers Table.', renewalDate: '2026-04-01', status: 'active', createdAt: new Date().toISOString() },
]
  : [];

let mockAdSchedules: AdSchedule[] = import.meta.env.DEV
  ? [
  { id: 'as1', sponsorId: 'sp1', sponsorName: 'Surrey Ironworks', showDay: 'Daily', timeSlot: '11:15', durationSeconds: 30, status: 'scheduled', createdAt: new Date().toISOString() },
  { id: 'as2', sponsorId: 'sp2', sponsorName: 'Farnham Brewery', showDay: 'Mon-Fri', timeSlot: '12:45', durationSeconds: 30, status: 'scheduled', createdAt: new Date().toISOString() },
]
  : [];

let mockSocialPosts: SocialPost[] = [];

// --- Real Supabase service ---
export const hubService = {
  getEvents: async (): Promise<HubEvent[]> => {
    if (!isConfigured()) return devOnly(mockEvents);
    const { data, error } = await supabase.from('events').select('*').order('start_date', { ascending: true });
    if (error) { console.error('getEvents:', error); return devOnly(mockEvents); }
    return data.map((r: any) => ({ id: r.id, title: r.title, description: r.description, startDate: r.start_date, endDate: r.end_date, location: r.location, venue: r.venue, websiteUrl: r.website_url, craftType: r.craft_type, source: r.source, approved: r.approved, createdAt: r.created_at }));
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
    const { data, error } = await supabase.from('events').insert({ title: event.title, description: event.description, start_date: event.startDate, end_date: event.endDate, location: event.location, venue: event.venue, website_url: event.websiteUrl, craft_type: event.craftType, source: event.source, approved: event.approved }).select().single();
    if (error) { console.error('addEvent:', error); return null; }
    return { ...event, id: data.id, createdAt: data.created_at };
  },

  getStaff: async (): Promise<StaffMember[]> => {
    if (!isConfigured()) return devOnly(mockStaff);
    const { data, error } = await supabase.from('staff').select('*').order('name');
    if (error) { console.error('getStaff:', error); return devOnly(mockStaff); }
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

  updateStaff: async (id: string, updates: Partial<Pick<StaffMember, 'name' | 'role' | 'email'>>): Promise<void> => {
    if (!isConfigured()) { const m = mockStaff.find(s => s.id === id); if (m) Object.assign(m, updates); return; }
    await supabase.from('staff').update({ name: updates.name, role: updates.role, email: updates.email }).eq('id', id);
  },

  removeStaff: async (id: string) => {
    if (!isConfigured()) { const i = mockStaff.findIndex(s => s.id === id); if (i > -1) mockStaff.splice(i, 1); return; }
    await supabase.from('staff').delete().eq('id', id);
  },

  getRadioShows: async (): Promise<RadioShow[]> => {
    if (!isConfigured()) return devOnly(mockRadioShows);
    const { data, error } = await supabase.from('radio_shows').select('*').order('title');
    if (error) { console.error('getRadioShows:', error); return devOnly(mockRadioShows); }
    return data.map((r: any) => ({ id: r.id, title: r.title, host: r.host, schedule: r.schedule, status: r.status, lastBroadcast: r.last_broadcast }));
  },

  updateRadioStatus: async (id: string, status: RadioShow['status']) => {
    if (!isConfigured()) { mockRadioShows.forEach(s => { if (s.id === id) s.status = status; }); return; }
    await supabase.from('radio_shows').update({ status }).eq('id', id);
  },

  getFounderJobs: async (): Promise<FounderJob[]> => {
    if (!isConfigured()) return devOnly(mockJobs);
    const { data, error } = await supabase.from('founder_jobs').select('*').order('created_at', { ascending: false });
    if (error) { console.error('getFounderJobs:', error); return devOnly(mockJobs); }
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
    if (!isConfigured()) return devOnly(mockStories);
    const { data, error } = await supabase.from('maker_stories').select('*').order('created_at', { ascending: false });
    if (error) { console.error('getMakerStories:', error); return devOnly(mockStories); }
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

  // Public directory reader. Reads the curated `public_directory_listings`
  // view, which exposes only the columns a visitor is meant to see: no
  // contact_email or phone except for paid tiers, and none of the outreach /
  // moderation fields. getListings() below stays for admin screens, where the
  // caller is an authenticated admin and RLS allows the base table.
  //
  // Every public route that shows directory data must come through here.
  // directory_listings itself is admin-only from 20260828 onwards, so an
  // anonymous visitor calling getListings() gets "permission denied".
  //
  // On failure this throws rather than substituting mockListings. Those are
  // invented businesses; serving them from the live site would present fiction
  // as a real trader directory. Callers show an error or an empty state
  // instead. Mock data survives only for local development without Supabase,
  // matching demoModeAvailable() in AuthContext.
  getPublicListings: async (): Promise<any[]> => {
    if (!isConfigured()) return devOnly(mockListings);
    const { data, error } = await supabase
      .from('public_directory_listings')
      .select('id,name,category,location,description,website,tier,status,created_at,contact_email,phone')
      .order('name');
    if (error) { console.error('getPublicListings:', error); throw error; }
    return data.map((r: any) => ({
      id: r.id,
      vendorName: r.name,
      craftCategory: r.category,
      displayCategory: getListingCategory(r.category ?? ''),
      location: r.location,
      website: r.website ?? '',
      bio: r.description ?? '',
      email: r.contact_email ?? '',
      phone: r.phone ?? '',
      socialLinks: {},
      affiliateLinks: [],
      listingTier: r.tier ?? 'free',
      approved: r.status === 'active',
      published: r.status === 'active',
      claimedAt: r.created_at,
      outreachStatus: 'not_contacted',
      outreachDate: null,
      response: null,
      claimed: false,
    }));
  },

  getListings: async (): Promise<any[]> => {
    if (!isConfigured()) return devOnly(mockListings);
    const { data, error } = await supabase.from('directory_listings').select('*').order('name');
    if (error) { console.error('getListings:', error); return devOnly(mockListings); }
    return data.map((r: any) => ({
      id: r.id,
      vendorName: r.name,
      craftCategory: r.category,
      displayCategory: getListingCategory(r.category ?? ''),
      location: r.location,
      website: r.website ?? '',
      bio: r.description ?? '',
      email: r.contact_email ?? '',
      phone: r.phone ?? '',
      socialLinks: {},
      affiliateLinks: [],
      listingTier: r.tier ?? 'free',
      approved: r.status === 'active',
      published: r.status === 'active',
      claimedAt: r.created_at,
      outreachStatus: r.outreach_status ?? 'not_contacted',
      outreachDate: r.outreach_date,
      outreachApproved: r.outreach_approved ?? false,
      outreachApprovedAt: r.outreach_approved_at,
      outreachOptedOut: r.outreach_opted_out ?? false,
      response: r.response,
      claimed: r.claimed ?? false,
    }));
  },

  approveListing: async (id: string) => {
    if (!isConfigured()) { mockListings.forEach(l => { if (l.id === id) l.approved = true; }); return; }
    await supabase.from('directory_listings').update({ status: 'active' }).eq('id', id);
  },

  deleteListing: async (id: string) => {
    if (!isConfigured()) { const i = mockListings.findIndex(l => l.id === id); if (i > -1) mockListings.splice(i, 1); return; }
    await supabase.from('directory_listings').delete().eq('id', id);
  },

  getClaimedVendors: async (): Promise<any[]> => {
    if (!isConfigured()) return [];
    const { data, error } = await supabase.from('claimed_vendors').select('*').eq('approved', false).order('created_at', { ascending: false });
    if (error) { console.error('getClaimedVendors:', error); return []; }
    return data ?? [];
  },

  submitMakerApplication: async (application: {
    businessName: string;
    category: string;
    website: string;
    location: string;
    description: string;
    contactName: string;
  }): Promise<void> => {
    if (!isConfigured()) return; // local submitted state handles this case
    await supabase.from('directory_listings').insert({
      name: application.businessName,
      category: application.category,
      location: application.location,
      description: application.description,
      website: application.website,
      tier: 'free',
      status: 'pending',
    });
  },

  approveClaimedVendor: async (claim: any): Promise<void> => {
    if (!isConfigured()) return;
    await supabase.from('directory_listings').insert({
      name: claim.vendor_name,
      category: claim.craft_category,
      location: claim.location,
      description: claim.bio,
      website: claim.website,
      tier: 'free',
      status: 'active',
    });
    await supabase.from('claimed_vendors').update({ approved: true }).eq('id', claim.id);
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

  /**
   * Read the agent kill switches from system_controls.
   *
   * These previously read and wrote an in-memory object that nothing else ever
   * consulted, so the founder's toggles — including Maintenance Mode — changed
   * nothing at all. A kill switch that silently does nothing is worse than no
   * kill switch, because it is trusted.
   */
  getSystemSettings: async (): Promise<SystemSettings> => {
    if (!isConfigured()) return mockSystemSettings;
    const { data, error } = await supabase.from('system_controls').select('key, value');
    if (error || !data) {
      console.error('getSystemSettings:', error?.message);
      return mockSystemSettings;
    }
    const byKey = new Map(data.map((r: any) => [r.key, Boolean(r.value)]));
    const resolved = { ...mockSystemSettings };
    (Object.keys(SYSTEM_CONTROL_KEYS) as (keyof SystemSettings)[]).forEach(k => {
      const v = byKey.get(SYSTEM_CONTROL_KEYS[k]);
      // A missing row keeps the fail-safe default rather than assuming enabled.
      if (typeof v === 'boolean') resolved[k] = v;
    });
    return resolved;
  },

  updateSystemSettings: async (settings: Partial<SystemSettings>): Promise<SystemSettings> => {
    if (!isConfigured()) {
      mockSystemSettings = { ...mockSystemSettings, ...settings };
      return mockSystemSettings;
    }
    const rows = (Object.entries(settings) as [keyof SystemSettings, boolean][])
      .filter(([, v]) => typeof v === 'boolean')
      .map(([k, v]) => ({ key: SYSTEM_CONTROL_KEYS[k], value: v, updated_at: new Date().toISOString() }));

    if (rows.length) {
      // RLS restricts system_controls to admins, so a non-admin write fails
      // here rather than appearing to succeed.
      const { error } = await supabase.from('system_controls').upsert(rows, { onConflict: 'key' });
      if (error) throw new Error(`Could not update system controls: ${error.message}`);
    }
    return hubService.getSystemSettings();
  },

  /** True when the named agent is permitted to run right now. */
  isAgentEnabled: async (agent: keyof SystemSettings): Promise<boolean> => {
    const settings = await hubService.getSystemSettings();
    if (settings.maintenanceMode) return false;
    return Boolean(settings[agent]);
  },

  // --- Pending Listings (AI Discovery Approval Queue) ---

  getPendingListings: async (): Promise<PendingListing[]> => {
    if (!isConfigured()) return devOnly(mockPendingListings);
    const { data } = await supabase
      .from('pending_listings')
      .select('*')
      .order('discovered_at', { ascending: false });
    if (!data) return devOnly(mockPendingListings);
    return data.map(row => ({
      id: row.id,
      businessName: row.business_name,
      category: row.category,
      location: row.location,
      website: row.website,
      instagram: row.instagram,
      description: row.description,
      sourceUrl: row.source_url,
      sourcePlatform: row.source_platform,
      discoveredAt: row.discovered_at,
      status: row.status,
      reviewedAt: row.reviewed_at,
      contactEmail: row.contact_email,
      contactName: row.contact_name,
      aiConfidenceScore: row.ai_confidence_score,
    }));
  },

  addPendingListing: async (listing: Omit<PendingListing, 'id' | 'discoveredAt' | 'status'>): Promise<void> => {
    if (!isConfigured()) {
      mockPendingListings.unshift({
        ...listing,
        id: Date.now().toString(),
        discoveredAt: new Date().toISOString(),
        status: 'pending',
      });
      return;
    }
    await supabase.from('pending_listings').insert({
      business_name: listing.businessName,
      category: listing.category,
      location: listing.location,
      website: listing.website,
      instagram: listing.instagram,
      description: listing.description,
      source_url: listing.sourceUrl,
      source_platform: listing.sourcePlatform ?? 'Manual',
      contact_email: listing.contactEmail,
      contact_name: listing.contactName,
      ai_confidence_score: listing.aiConfidenceScore,
      status: 'pending',
      discovered_at: new Date().toISOString(),
    });
  },

  approvePendingListing: async (id: string): Promise<void> => {
    const all = await hubService.getPendingListings();
    const listing = all.find(l => l.id === id);
    if (!listing) return;

    if (!isConfigured()) {
      const idx = mockPendingListings.findIndex(l => l.id === id);
      if (idx !== -1) mockPendingListings[idx].status = 'approved';
      return;
    }
    await supabase.from('pending_listings').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', id);
    // Publish to directory_listings
    await supabase.from('directory_listings').insert({
      name: listing.businessName,
      category: listing.category,
      location: listing.location,
      description: listing.description,
      website: listing.website ?? '',
      tier: 'free',
      status: 'active',
      contact_email: listing.contactEmail ?? '',
    });
  },

  rejectPendingListing: async (id: string): Promise<void> => {
    if (!isConfigured()) {
      const idx = mockPendingListings.findIndex(l => l.id === id);
      if (idx !== -1) mockPendingListings[idx].status = 'rejected';
      return;
    }
    await supabase.from('pending_listings').update({ status: 'rejected', reviewed_at: new Date().toISOString() }).eq('id', id);
  },

  // ── Radio System ─────────────────────────────────────────────────────────────

  // Playlist
  getPlaylist: async (): Promise<PlaylistTrack[]> => {
    if (!isConfigured()) return devOnly(mockPlaylist);
    const { data, error } = await supabase.from('playlists').select('*').order('order_index');
    if (error) { console.error('getPlaylist:', error); return devOnly(mockPlaylist); }
    return data.map((r: any) => ({
      id: r.id, title: r.title, artist: r.artist,
      durationSeconds: r.duration_seconds, category: r.category,
      fileUrl: r.file_url, orderIndex: r.order_index,
      isActive: r.is_active, createdAt: r.created_at,
    }));
  },

  addTrack: async (track: Omit<PlaylistTrack, 'id' | 'createdAt'>): Promise<PlaylistTrack | null> => {
    if (!isConfigured()) {
      const t: PlaylistTrack = { ...track, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
      mockPlaylist.push(t); return t;
    }
    const { data, error } = await supabase.from('playlists').insert({
      title: track.title, artist: track.artist, duration_seconds: track.durationSeconds,
      category: track.category, file_url: track.fileUrl, order_index: track.orderIndex, is_active: track.isActive,
    }).select().single();
    if (error) { console.error('addTrack:', error); return null; }
    return { ...track, id: data.id, createdAt: data.created_at };
  },

  removeTrack: async (id: string): Promise<void> => {
    if (!isConfigured()) { const i = mockPlaylist.findIndex(t => t.id === id); if (i > -1) mockPlaylist.splice(i, 1); return; }
    await supabase.from('playlists').delete().eq('id', id);
  },

  toggleTrack: async (id: string, isActive: boolean): Promise<void> => {
    if (!isConfigured()) { mockPlaylist.forEach(t => { if (t.id === id) t.isActive = isActive; }); return; }
    await supabase.from('playlists').update({ is_active: isActive }).eq('id', id);
  },

  // Sponsors
  getSponsors: async (): Promise<SponsorRotation[]> => {
    if (!isConfigured()) return devOnly(mockSponsors);
    const { data, error } = await supabase.from('sponsor_rotations').select('*').order('name');
    if (error) { console.error('getSponsors:', error); return devOnly(mockSponsors); }
    return data.map((r: any) => ({
      id: r.id, name: r.name, productDesc: r.product_desc, contactName: r.contact_name,
      contactEmail: r.contact_email, package: r.package, readsPerShow: r.reads_per_show,
      adScript: r.ad_script, renewalDate: r.renewal_date, status: r.status, createdAt: r.created_at,
    }));
  },

  addSponsor: async (s: Omit<SponsorRotation, 'id' | 'createdAt'>): Promise<SponsorRotation | null> => {
    if (!isConfigured()) {
      const ns: SponsorRotation = { ...s, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
      mockSponsors.push(ns); return ns;
    }
    const { data, error } = await supabase.from('sponsor_rotations').insert({
      name: s.name, product_desc: s.productDesc, contact_name: s.contactName,
      contact_email: s.contactEmail, package: s.package, reads_per_show: s.readsPerShow,
      ad_script: s.adScript, renewal_date: s.renewalDate, status: s.status,
    }).select().single();
    if (error) { console.error('addSponsor:', error); return null; }
    return { ...s, id: data.id, createdAt: data.created_at };
  },

  updateSponsorStatus: async (id: string, status: SponsorRotation['status']): Promise<void> => {
    if (!isConfigured()) { mockSponsors.forEach(s => { if (s.id === id) s.status = status; }); return; }
    await supabase.from('sponsor_rotations').update({ status }).eq('id', id);
  },

  // Ad Schedules
  getAdSchedules: async (): Promise<AdSchedule[]> => {
    if (!isConfigured()) return devOnly(mockAdSchedules);
    const { data, error } = await supabase
      .from('ad_schedules')
      .select('*, sponsor_rotations(name)')
      .order('time_slot');
    if (error) { console.error('getAdSchedules:', error); return devOnly(mockAdSchedules); }
    return data.map((r: any) => ({
      id: r.id, sponsorId: r.sponsor_id,
      sponsorName: r.sponsor_rotations?.name,
      showDay: r.show_day, timeSlot: r.time_slot,
      durationSeconds: r.duration_seconds, status: r.status,
      playedAt: r.played_at, createdAt: r.created_at,
    }));
  },

  addAdSlot: async (slot: Omit<AdSchedule, 'id' | 'createdAt' | 'sponsorName'>): Promise<AdSchedule | null> => {
    if (!isConfigured()) {
      const sponsor = mockSponsors.find(s => s.id === slot.sponsorId);
      const ns: AdSchedule = { ...slot, id: crypto.randomUUID(), sponsorName: sponsor?.name, createdAt: new Date().toISOString() };
      mockAdSchedules.push(ns); return ns;
    }
    const { data, error } = await supabase.from('ad_schedules').insert({
      sponsor_id: slot.sponsorId, show_day: slot.showDay, time_slot: slot.timeSlot,
      duration_seconds: slot.durationSeconds, status: slot.status,
    }).select().single();
    if (error) { console.error('addAdSlot:', error); return null; }
    return { ...slot, id: data.id, createdAt: data.created_at };
  },

  markAdPlayed: async (id: string): Promise<void> => {
    const now = new Date().toISOString();
    if (!isConfigured()) { mockAdSchedules.forEach(s => { if (s.id === id) { s.status = 'played'; s.playedAt = now; } }); return; }
    await supabase.from('ad_schedules').update({ status: 'played', played_at: now }).eq('id', id);
  },

  // Social Posts
  getSocialPosts: async (): Promise<SocialPost[]> => {
    if (!isConfigured()) return devOnly(mockSocialPosts);
    const { data, error } = await supabase.from('social_posts').select('*').order('created_at', { ascending: false });
    if (error) { console.error('getSocialPosts:', error); return devOnly(mockSocialPosts); }
    return data.map((r: any) => ({
      id: r.id, content: r.content, platform: r.platform, sourceType: r.source_type,
      sourceId: r.source_id, status: r.status, scheduledAt: r.scheduled_at,
      postedAt: r.posted_at, createdAt: r.created_at,
    }));
  },

  saveSocialPost: async (post: Omit<SocialPost, 'id' | 'createdAt'>): Promise<SocialPost | null> => {
    if (!isConfigured()) {
      const np: SocialPost = { ...post, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
      mockSocialPosts.unshift(np); return np;
    }
    const { data, error } = await supabase.from('social_posts').insert({
      content: post.content, platform: post.platform, source_type: post.sourceType,
      source_id: post.sourceId, status: post.status, scheduled_at: post.scheduledAt,
    }).select().single();
    if (error) { console.error('saveSocialPost:', error); return null; }
    return { ...post, id: data.id, createdAt: data.created_at };
  },

  approveSocialPost: async (id: string): Promise<void> => {
    if (!isConfigured()) { mockSocialPosts.forEach(p => { if (p.id === id) p.status = 'approved'; }); return; }
    await supabase.from('social_posts').update({ status: 'approved' }).eq('id', id);
  },

  // ── Outreach approval (human-in-the-loop gate) ───────────────────────────
  // directory-outreach refuses to email a listing unless outreach_approved is
  // true, so approving is a deliberate, recorded act by a named admin rather
  // than a side effect of pressing "send".

  setOutreachApproval: async (listingId: string, approved: boolean): Promise<{ error: string | null }> => {
    if (!isConfigured()) return { error: 'Supabase is not configured.' };
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('directory_listings')
      .update({
        outreach_approved: approved,
        outreach_approved_by: approved ? user?.id ?? null : null,
        outreach_approved_at: approved ? new Date().toISOString() : null,
      })
      .eq('id', listingId);
    return { error: error ? error.message : null };
  },

  setOutreachOptOut: async (listingId: string, optedOut: boolean): Promise<{ error: string | null }> => {
    if (!isConfigured()) return { error: 'Supabase is not configured.' };
    const { error } = await supabase
      .from('directory_listings')
      .update({
        outreach_opted_out: optedOut,
        // Opting out also withdraws any approval, so a later bulk action
        // cannot pick the row back up.
        ...(optedOut ? { outreach_approved: false, outreach_approved_by: null, outreach_approved_at: null } : {}),
      })
      .eq('id', listingId);
    return { error: error ? error.message : null };
  },
};
