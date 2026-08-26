export type ProgrammeRecipe = {
  id: string;
  name: string;
  durationMinutes: number;
  purpose: string;
  sequence: string[];
  notes: string;
};

export const PROGRAMME_RECIPES: ProgrammeRecipe[] = [
  {
    id: 'fth-morning-show', name: 'FTH Morning Show', durationMinutes: 60,
    purpose: 'Local breakfast/community programme.',
    sequence: ['JINGLE — station opener', 'LOCAL BUSINESS AD — placement holder', 'PRESENTER / NEWS LINK — real recording', 'MUSIC — rotation 01', 'COMMUNITY ANNOUNCEMENT — placement holder', 'MUSIC — rotation 02', 'WEATHER / RURAL LINK — real content', 'LOCAL BUSINESS AD — placement holder', 'STATION ID', 'MUSIC — rotation 03'],
    notes: 'Replace every holder with real approved material before broadcast.'
  },
  {
    id: 'smallholders-corner', name: "The Smallholders' Corner", durationMinutes: 30,
    purpose: 'Growers, seasonal advice and practical rural content.',
    sequence: ['JINGLE — programme opener', 'FEATURE / INTERVIEW — real recording', 'MUSIC — folk/acoustic', 'COMMUNITY ANNOUNCEMENT — placement holder', 'FEATURE / INTERVIEW — real recording', 'STATION ID', 'MUSIC — short closer'],
    notes: 'Best home for recorded field visits and grower interviews.'
  },
  {
    id: 'community-hour', name: 'FTH Community Hour', durationMinutes: 60,
    purpose: 'Farmers, makers, social enterprises and community voices.',
    sequence: ['JINGLE — programme opener', 'INTERVIEW — real recording', 'LOCAL BUSINESS AD — placement holder', 'MUSIC — rotation', 'COMMUNITY ANNOUNCEMENT — placement holder', 'INTERVIEW — real recording', 'EVENT PROMO — placement holder', 'MUSIC — rotation', 'STATION ID'],
    notes: 'Use real local voices; never invent an interview or announcement.'
  },
  {
    id: 'market-roundup', name: 'FTH Market Roundup', durationMinutes: 30,
    purpose: 'Farm-gate prices, livestock reports and cooperative news.',
    sequence: ['JINGLE — rural sting', 'MARKET REPORT — real content', 'MUSIC — short track', 'COMMUNITY ANNOUNCEMENT — placement holder', 'MARKET REPORT — real content', 'STATION ID'],
    notes: 'Time-sensitive material must be checked before broadcast.'
  },
  {
    id: 'evening-magazine', name: 'FTH Evening Magazine', durationMinutes: 30,
    purpose: 'Day highlights, events diary and local stories.',
    sequence: ['JINGLE — evening opener', 'DAY HIGHLIGHTS — real recording', 'EVENT PROMO — placement holder', 'MUSIC — rotation', 'LOCAL BUSINESS AD — placement holder', 'COMMUNITY LINK — real content', 'STATION ID'],
    notes: 'A natural place for same-day outside-broadcast highlights.'
  },
  {
    id: 'spotlight-sessions', name: 'FTH Spotlight Sessions', durationMinutes: 60,
    purpose: 'Live music and artist interviews.',
    sequence: ['JINGLE — live music opener', 'ARTIST INTRO — real recording', 'LIVE MUSIC / RECORDED SET', 'ARTIST INTERVIEW — real recording', 'LIVE MUSIC / RECORDED SET', 'STATION ID', 'LIVE MUSIC / RECORDED SET'],
    notes: 'For a live venue, BUTT supplies the live audio; the recipe is the planned programme structure.'
  },
  {
    id: 'late-night-acoustic', name: 'FTH Late Night Acoustic', durationMinutes: 60,
    purpose: 'Recorded sets from partner venues.',
    sequence: ['JINGLE — late-night opener', 'RECORDED LIVE SET', 'STATION ID', 'RECORDED LIVE SET', 'SHORT FEATURE / ARTIST LINK', 'RECORDED LIVE SET'],
    notes: 'Only use recordings that Farmers Table has permission to broadcast.'
  },
];

export const CHRISTMAS_OB_TEST = {
  id: 'FT-OB-CHRISTMAS-001',
  title: 'Farmers Table Christmas Event — Outside Broadcast Test',
  mode: 'Live',
  purpose: 'End-to-end rehearsal before a real Christmas event.',
  before: [
    'Confirm venue and permission to broadcast.',
    'Confirm Live365 account and UK/Europe coverage with Mike/account records.',
    'Charge laptop, phone, power bank and headphones.',
    'Check mobile signal / venue Wi-Fi and prepare a backup connection.',
    'Open the prepared BUTT profile before leaving.',
    'Prepare opening liner and event information.',
  ],
  live: [
    'Arrive early and choose the quietest practical microphone position.',
    'Run a 10-second headphone sound check.',
    'Start BUTT and confirm the connection.',
    'Use the prepared opening liner.',
    'Broadcast the event naturally; do not fill every second.',
    'Capture a few photos, a short video and two lines of notes.',
  ],
  recovery: [
    'If the live connection is unreliable, stop forcing it.',
    'Switch to Record-Only.',
    'Keep the event recording running and capture the same photos/video/notes.',
  ],
  after: [
    'Stop BUTT.',
    'Confirm automation/AutoDJ has resumed.',
    'Save the recording as FT-OB-CHRISTMAS-001.',
    'Trim the best 3–8 minutes for a feature.',
    'File the audio, photos, video and notes under the same asset ID.',
    'Add the finished feature to the appropriate RadioDJ playlist.',
  ],
};
