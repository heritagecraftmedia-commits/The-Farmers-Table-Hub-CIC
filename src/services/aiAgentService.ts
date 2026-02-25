import { RawLead, EnrichedLead, OutreachLog } from '../types';
import { supabase } from '../lib/supabase';

const isConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return url && url !== 'https://placeholder.supabase.co' && url.includes('supabase.co');
};

// Mock fallback data
let mockRawLeads: RawLead[] = [
  {
    id: 'rl1', sourcePlatform: 'Instagram',
    profileUrl: 'https://instagram.com/farnham_blacksmith',
    displayName: 'Farnham Blacksmith',
    bioText: 'Traditional hand-forged tools and decorative ironwork. Surrey based.',
    locationHint: 'Farnham, Surrey', categoryHint: 'Metalwork',
    discoveredAt: new Date().toISOString(),
  },
  {
    id: 'rl2', sourcePlatform: 'YouTube',
    profileUrl: 'https://youtube.com/@surrey_woodturner',
    displayName: 'Surrey Woodturner',
    bioText: 'Turning local timber into beautiful bowls and plates. #woodturning #craft',
    locationHint: 'Tilford, Surrey', categoryHint: 'Woodwork',
    discoveredAt: new Date().toISOString(),
  }
];

let mockEnrichedLeads: EnrichedLead[] = [];
let mockOutreachLogs: OutreachLog[] = [];

export const aiAgentService = {
  // Discovery Agent
  getRawLeads: async (): Promise<RawLead[]> => {
    if (!isConfigured()) return mockRawLeads;
    const { data, error } = await supabase.from('raw_leads').select('*').order('discovered_at', { ascending: false });
    if (error) { console.error('getRawLeads:', error); return mockRawLeads; }
    return data.map((r: any) => ({ id: r.id, sourcePlatform: r.source_platform, profileUrl: r.profile_url, displayName: r.display_name, bioText: r.bio_text, locationHint: r.location_hint, categoryHint: r.category_hint, discoveredAt: r.discovered_at }));
  },

  addRawLeads: async (leads: Omit<RawLead, 'id' | 'discoveredAt'>[]): Promise<void> => {
    if (!isConfigured()) {
      leads.forEach(l => mockRawLeads.push({ ...l, id: Math.random().toString(36).substr(2, 9), discoveredAt: new Date().toISOString() }));
      return;
    }
    await supabase.from('raw_leads').insert(leads.map(l => ({ source_platform: l.sourcePlatform, profile_url: l.profileUrl, display_name: l.displayName, bio_text: l.bioText, location_hint: l.locationHint, category_hint: l.categoryHint })));
  },

  discardRawLead: async (id: string): Promise<void> => {
    if (!isConfigured()) { mockRawLeads = mockRawLeads.filter(l => l.id !== id); return; }
    await supabase.from('raw_leads').delete().eq('id', id);
  },

  // Enrichment (combines qualification + enrichment steps)
  enrichLead: async (rawLead: RawLead, aiSummary?: string): Promise<EnrichedLead | null> => {
    const enriched: Omit<EnrichedLead, 'id' | 'createdAt'> = {
      vendorName: rawLead.displayName,
      vendorType: 'Artisan Maker',
      craftCategory: rawLead.categoryHint,
      location: rawLead.locationHint,
      website: rawLead.profileUrl,
      publicEmail: '',
      socialLinks: { [rawLead.sourcePlatform]: rawLead.profileUrl },
      summary: aiSummary || rawLead.bioText,
      status: 'draft',
    };

    if (!isConfigured()) {
      const ne: EnrichedLead = { ...enriched, id: `el-${Math.random().toString(36).substr(2, 9)}`, createdAt: new Date().toISOString() };
      mockEnrichedLeads.push(ne);
      mockRawLeads = mockRawLeads.filter(l => l.id !== rawLead.id);
      return ne;
    }

    const { data, error } = await supabase.from('enriched_leads').insert({ vendor_name: enriched.vendorName, vendor_type: enriched.vendorType, craft_category: enriched.craftCategory, location: enriched.location, website: enriched.website, public_email: enriched.publicEmail, summary: enriched.summary, status: 'draft' }).select().single();
    if (error) { console.error('enrichLead:', error); return null; }
    await supabase.from('raw_leads').delete().eq('id', rawLead.id);
    return { id: data.id, vendorName: data.vendor_name, vendorType: data.vendor_type, craftCategory: data.craft_category, location: data.location, website: data.website, publicEmail: data.public_email, socialLinks: {}, summary: data.summary, status: data.status, createdAt: data.created_at };
  },

  getEnrichedLeads: async (): Promise<EnrichedLead[]> => {
    if (!isConfigured()) return mockEnrichedLeads;
    const { data, error } = await supabase.from('enriched_leads').select('*').order('created_at', { ascending: false });
    if (error) { console.error('getEnrichedLeads:', error); return mockEnrichedLeads; }
    return data.map((r: any) => ({ id: r.id, vendorName: r.vendor_name, vendorType: r.vendor_type, craftCategory: r.craft_category, location: r.location, website: r.website, publicEmail: r.public_email, socialLinks: {}, summary: r.summary, status: r.status, createdAt: r.created_at }));
  },

  // Outreach Agent
  draftOutreach: async (enrichedLead: EnrichedLead): Promise<OutreachLog | null> => {
    const message = `Hello ${enrichedLead.vendorName}, we love your work and would like to invite you to join The Farmers Table Hub CIC directory — a free, permanent listing celebrating local makers. No pay-to-rank, no pressure. Would you like to know more?`;

    const log: OutreachLog = {
      id: `ol-${Math.random().toString(36).substr(2, 9)}`,
      enrichedLeadId: enrichedLead.id,
      contactMethod: 'Email',
      messageSent: message,
      sentAt: new Date().toISOString(),
    };

    if (!isConfigured()) {
      mockOutreachLogs.push(log);
      mockEnrichedLeads.forEach(l => { if (l.id === enrichedLead.id) l.status = 'invited'; });
      return log;
    }

    await supabase.from('enriched_leads').update({ status: 'invited' }).eq('id', enrichedLead.id);
    return log;
  },

  getOutreachLogs: async (): Promise<OutreachLog[]> => {
    if (!isConfigured()) return mockOutreachLogs;
    // Outreach logs derived from enriched leads with invited/claimed status
    const { data, error } = await supabase.from('enriched_leads').select('*').in('status', ['invited', 'claimed']);
    if (error) { console.error('getOutreachLogs:', error); return mockOutreachLogs; }
    return data.map((r: any) => ({
      id: r.id,
      enrichedLeadId: r.id,
      contactMethod: 'Email',
      messageSent: `Invitation sent to ${r.vendor_name}`,
      sentAt: r.created_at,
    }));
  },
};
