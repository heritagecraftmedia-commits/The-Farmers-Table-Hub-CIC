import { HubEvent, StaffMember, RadioShow, FounderJob, MakerStory } from '../types';

let events: HubEvent[] = [
  {
    id: '1',
    title: 'Farnham Artisan Market',
    description: 'A monthly gathering of the finest local makers and producers.',
    startDate: '2026-03-15T10:00:00',
    endDate: '2026-03-15T16:00:00',
    location: 'Farnham Town Centre',
    venue: 'Market Square',
    websiteUrl: 'https://example.com/artisan-market',
    source: 'Eventbrite',
    approved: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Willow Weaving Workshop',
    description: 'Learn the ancient craft of willow weaving with master artisan Sarah.',
    startDate: '2026-03-20T11:00:00',
    endDate: '2026-03-20T14:00:00',
    location: 'The Farmers Table Hub',
    venue: 'Makers Studio',
    websiteUrl: 'https://example.com/weaving-workshop',
    source: 'Manual',
    approved: false,
    createdAt: new Date().toISOString()
  }
];

let staff: StaffMember[] = [
  {
    id: '1',
    name: 'Thalia',
    role: 'Operations PA',
    email: 'thalia@farmerstable.org',
    status: 'active',
    joinedAt: '2025-01-10'
  },
  {
    id: '2',
    name: 'James',
    role: 'Volunteer Coordinator',
    email: 'james@farmerstable.org',
    status: 'active',
    joinedAt: '2025-03-01'
  }
];

let radioShows: RadioShow[] = [
  {
    id: '1',
    title: 'Morning Maker Melodies',
    host: 'Scott',
    schedule: 'Mon-Fri 08:00 - 10:00',
    status: 'live',
    lastBroadcast: '2026-02-24'
  },
  {
    id: '2',
    title: 'The Artisan Hour',
    host: 'Guest Artisans',
    schedule: 'Sat 14:00 - 15:00',
    status: 'planned'
  }
];

let founderJobs: FounderJob[] = [
  {
    id: '1',
    task: 'Review Step 7 Ethical Monetisation rules',
    priority: 'High',
    status: 'pending',
    dueDate: '2026-03-01'
  },
  {
    id: '2',
    task: 'Approve 5 new artisan draft listings',
    priority: 'Medium',
    status: 'pending'
  },
  {
    id: '3',
    task: 'Check radio logs for technical glitches',
    priority: 'Low',
    status: 'completed'
  }
];

let makerStories: MakerStory[] = [
  {
    id: '1',
    makerName: 'Thomas Ironworks',
    craft: 'Blacksmithing',
    image: 'https://picsum.photos/seed/forge/800/600',
    q1: 'I learned by watching my grandfather in his small workshop in the Surrey Hills. It took years of burnt fingers and heavy hammers.',
    q2: 'My 1920s Peter Wright anvil. It has a ring like a bell and has shaped thousands of pieces of steel.',
    q3: 'A cold morning, the forge at full heat, and a complex commission that finally starts to take its true shape.',
    published: true
  }
];

let systemSettings = {
  discoveryAgentEnabled: true,
  qualificationAgentEnabled: true,
  enrichmentAgentEnabled: false,
  outreachAgentEnabled: false,
  maintenanceMode: false
};

export const hubService = {
  getEvents: () => events,
  approveEvent: (id: string) => {
    events = events.map(e => e.id === id ? { ...e, approved: true } : e);
  },
  deleteEvent: (id: string) => {
    events = events.filter(e => e.id !== id);
  },
  
  getStaff: () => staff,
  addStaff: (member: Omit<StaffMember, 'id' | 'joinedAt'>) => {
    const newMember: StaffMember = {
      ...member,
      id: Math.random().toString(36).substr(2, 9),
      joinedAt: new Date().toISOString().split('T')[0]
    };
    staff.push(newMember);
    return newMember;
  },
  removeStaff: (id: string) => {
    staff = staff.filter(s => s.id !== id);
  },

  getRadioShows: () => radioShows,
  updateRadioStatus: (id: string, status: RadioShow['status']) => {
    radioShows = radioShows.map(s => s.id === id ? { ...s, status } : s);
  },

  getFounderJobs: () => founderJobs,
  completeJob: (id: string) => {
    founderJobs = founderJobs.map(j => j.id === id ? { ...j, status: 'completed' } : j);
  },
  addJob: (task: string, priority: FounderJob['priority']) => {
    const newJob: FounderJob = {
      id: Math.random().toString(36).substr(2, 9),
      task,
      priority,
      status: 'pending'
    };
    founderJobs.push(newJob);
    return newJob;
  },

  getMakerStories: () => makerStories,
  publishStory: (id: string) => {
    makerStories = makerStories.map(s => s.id === id ? { ...s, published: true } : s);
  },

  getSystemSettings: () => systemSettings,
  updateSystemSettings: (settings: Partial<typeof systemSettings>) => {
    systemSettings = { ...systemSettings, ...settings };
    return systemSettings;
  }
};
