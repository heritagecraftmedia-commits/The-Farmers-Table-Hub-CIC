import { RawLead, QualifiedLead, EnrichedLead, OutreachLog } from '../types';

// Mock data for initial state
let rawLeads: RawLead[] = [
  {
    id: 'rl1',
    sourcePlatform: 'Instagram',
    profileUrl: 'https://instagram.com/farnham_blacksmith',
    displayName: 'Farnham Blacksmith',
    bioText: 'Traditional hand-forged tools and decorative ironwork. Surrey based.',
    locationHint: 'Farnham, Surrey',
    categoryHint: 'Metalwork',
    discoveredAt: new Date().toISOString(),
  },
  {
    id: 'rl2',
    sourcePlatform: 'YouTube',
    profileUrl: 'https://youtube.com/@surrey_woodturner',
    displayName: 'Surrey Woodturner',
    bioText: 'Turning local timber into beautiful bowls and plates. #woodturning #craft',
    locationHint: 'Tilford, Surrey',
    categoryHint: 'Woodwork',
    discoveredAt: new Date().toISOString(),
  }
];

let qualifiedLeads: QualifiedLead[] = [];
let enrichedLeads: EnrichedLead[] = [];
let outreachLogs: OutreachLog[] = [];

export const aiAgentService = {
  // Discovery Agent
  getRawLeads: () => rawLeads,
  
  discardRawLead: (id: string) => {
    rawLeads = rawLeads.filter(l => l.id !== id);
  },

  // Qualification Agent
  qualifyLead: (rawLeadId: string) => {
    const lead = rawLeads.find(l => l.id === rawLeadId);
    if (!lead) return;

    const qualifiedLead: QualifiedLead = {
      id: `ql-${Math.random().toString(36).substr(2, 9)}`,
      rawLeadId,
      artisanScore: 4, // Mock score
      qualificationNotes: 'Shows clear workshop process and local materials.',
      qualified: true,
      reviewed: false,
      createdAt: new Date().toISOString(),
    };

    qualifiedLeads.push(qualifiedLead);
    rawLeads = rawLeads.filter(l => l.id !== rawLeadId);
    return qualifiedLead;
  },

  getQualifiedLeads: () => qualifiedLeads,

  // Enrichment Agent
  enrichLead: (qualifiedLeadId: string) => {
    const qLead = qualifiedLeads.find(l => l.id === qualifiedLeadId);
    if (!qLead) return;

    const enrichedLead: EnrichedLead = {
      id: `el-${Math.random().toString(36).substr(2, 9)}`,
      vendorName: 'Draft Vendor Name',
      vendorType: 'Artisan Maker',
      craftCategory: 'General Craft',
      location: 'Local Area',
      website: '',
      publicEmail: '',
      socialLinks: {},
      summary: 'AI generated summary of the maker and their craft.',
      status: 'draft',
      createdAt: new Date().toISOString(),
    };

    enrichedLeads.push(enrichedLead);
    qualifiedLeads = qualifiedLeads.filter(l => l.id !== qualifiedLeadId);
    return enrichedLead;
  },

  getEnrichedLeads: () => enrichedLeads,

  // Outreach Agent
  draftOutreach: (enrichedLeadId: string) => {
    const eLead = enrichedLeads.find(l => l.id === enrichedLeadId);
    if (!eLead) return;

    const log: OutreachLog = {
      id: `ol-${Math.random().toString(36).substr(2, 9)}`,
      enrichedLeadId,
      contactMethod: 'Email',
      messageSent: `Hello ${eLead.vendorName}, we love your work and would like to invite you to join our directory...`,
      sentAt: new Date().toISOString(),
    };

    outreachLogs.push(log);
    eLead.status = 'invited';
    return log;
  },

  getOutreachLogs: () => outreachLogs,
};
