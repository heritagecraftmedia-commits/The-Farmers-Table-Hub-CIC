export type ScheduleKind = 'fth' | 'partner' | 'music' | 'rural' | 'venue' | 'placeholder';

export type ScheduleEntry = {
  id: string;
  date: string;
  day: string;
  start: string;
  end: string;
  title: string;
  description: string;
  kind: ScheduleKind;
  assetHint?: string;
  outsideBroadcast?: boolean;
  placeholder?: boolean;
};

const MASTER_CLOCK: Omit<ScheduleEntry, 'id' | 'date' | 'day'>[] = [
  { start: '05:20', end: '06:00', title: 'Shipping Forecast & Farming Today', description: 'Essential weather, tides and rural news.', kind: 'rural' },
  { start: '06:00', end: '07:00', title: 'FTH Morning Show', description: 'Local community news, market prices, countryside diary and listener messages.', kind: 'fth' },
  { start: '07:00', end: '09:00', title: 'Today Programme — BBC / Partner Feed', description: 'Authorised partner-feed slot. Audio is not supplied by this test build.', kind: 'partner', assetHint: 'AUTHORISED-PARTNER-FEED' },
  { start: '09:00', end: '10:00', title: 'Start the Week / In Our Time — BBC / Partner Feed', description: 'Authorised partner-feed slot. Audio is not supplied by this test build.', kind: 'partner', assetHint: 'AUTHORISED-PARTNER-FEED' },
  { start: '10:00', end: '10:30', title: "The Smallholders' Corner", description: 'Local growers, tips, stories and seasonal advice.', kind: 'fth', assetHint: 'FT-SMALLHOLDERS' },
  { start: '10:30', end: '11:00', title: "Woman's Hour — BBC / Partner Feed", description: 'Authorised partner-feed slot. Audio is not supplied by this test build.', kind: 'partner', assetHint: 'AUTHORISED-PARTNER-FEED' },
  { start: '11:00', end: '12:00', title: 'FTH Community Hour', description: 'Local voices — farmers, makers and social enterprises.', kind: 'fth', assetHint: 'FT-COMMUNITY-HOUR' },
  { start: '12:00', end: '13:00', title: 'You and Yours — BBC / Partner Feed', description: 'Authorised partner-feed slot. Audio is not supplied by this test build.', kind: 'partner', assetHint: 'AUTHORISED-PARTNER-FEED' },
  { start: '13:00', end: '14:00', title: 'The World at One — BBC / Partner Feed', description: 'Authorised partner-feed slot. Audio is not supplied by this test build.', kind: 'partner', assetHint: 'AUTHORISED-PARTNER-FEED' },
  { start: '14:00', end: '14:15', title: 'The Archers — Repeat / Partner Feed', description: 'Authorised partner-feed slot. Audio is not supplied by this test build.', kind: 'partner', assetHint: 'AUTHORISED-PARTNER-FEED' },
  { start: '14:15', end: '15:00', title: 'FTH Lunchtime Sessions', description: 'Live music from local venues and acoustic sessions.', kind: 'music', assetHint: 'FT-LUNCHTIME-SESSIONS' },
  { start: '15:00', end: '15:30', title: 'Gardeners’ Question Time / Book Reviews', description: 'Rotating gardening, literature and countryside culture features.', kind: 'partner', assetHint: 'AUTHORISED-PARTNER-FEED' },
  { start: '15:30', end: '16:00', title: 'FTH Market Roundup', description: 'Farm gate prices, livestock reports and cooperative news.', kind: 'rural', assetHint: 'FT-MARKET-ROUNDUP' },
  { start: '16:00', end: '17:00', title: 'The Media Show / Analysis — Partner Feed', description: 'Authorised partner-feed slot. Audio is not supplied by this test build.', kind: 'partner', assetHint: 'AUTHORISED-PARTNER-FEED' },
  { start: '17:00', end: '18:00', title: 'PM — BBC / Partner Feed', description: 'Authorised partner-feed slot. Audio is not supplied by this test build.', kind: 'partner', assetHint: 'AUTHORISED-PARTNER-FEED' },
  { start: '18:00', end: '18:30', title: 'Six O’Clock News — BBC / Partner Feed', description: 'Authorised partner-feed slot. Audio is not supplied by this test build.', kind: 'partner', assetHint: 'AUTHORISED-PARTNER-FEED' },
  { start: '18:30', end: '19:00', title: 'FTH Evening Magazine', description: 'Day highlights, community events diary and local stories.', kind: 'fth', assetHint: 'FT-EVENING-MAGAZINE' },
  { start: '19:00', end: '19:15', title: 'The Archers — Partner Feed', description: 'Authorised partner-feed slot. Audio is not supplied by this test build.', kind: 'partner', assetHint: 'AUTHORISED-PARTNER-FEED' },
  { start: '19:15', end: '20:00', title: 'Live at the Venue', description: 'Live broadcast from a partner venue — folk, acoustic, jazz, blues or roots.', kind: 'venue', outsideBroadcast: true, assetHint: 'VENUE-TO-CONFIRM' },
  { start: '20:00', end: '21:00', title: 'FTH Spotlight Sessions', description: 'In-depth live music and artist interviews.', kind: 'music', assetHint: 'FT-SPOTLIGHT-SESSIONS' },
  { start: '21:00', end: '22:00', title: 'Special Interests — Rotating', description: 'Science, ethics, religion, philosophy, arts and culture.', kind: 'partner', assetHint: 'AUTHORISED-PARTNER-FEED' },
  { start: '22:00', end: '22:45', title: 'The World Tonight — BBC / Partner Feed', description: 'Authorised partner-feed slot. Audio is not supplied by this test build.', kind: 'partner', assetHint: 'AUTHORISED-PARTNER-FEED' },
  { start: '22:45', end: '23:00', title: 'Book at Bedtime — BBC / Partner Feed', description: 'Authorised partner-feed slot. Audio is not supplied by this test build.', kind: 'partner', assetHint: 'AUTHORISED-PARTNER-FEED' },
  { start: '23:00', end: '00:00', title: 'FTH Late Night Acoustic', description: 'Recorded sets from local venues — calm late-night listening.', kind: 'music', assetHint: 'FT-LATE-NIGHT-ACOUSTIC' },
  { start: '00:00', end: '01:00', title: 'FTH Archive & Repeat', description: 'Best-of programming — community stories and seasonal features.', kind: 'fth', assetHint: 'FT-ARCHIVE-REPEAT' },
  { start: '01:00', end: '05:20', title: 'BBC World Service / Authorised Partner Feed', description: 'Authorised partner-feed overnight slot. Audio is not supplied by this test build.', kind: 'partner', assetHint: 'AUTHORISED-PARTNER-FEED' },
];

const venueOverrides: Record<string, ScheduleEntry> = {
  Tue: { id: 'override-tue', date: '', day: 'Tue', start: '14:15', end: '15:00', title: 'Live Music: The Village Arms Session', description: 'Acoustic folk and singer-songwriter session. Venue booking/confirmation required.', kind: 'venue', outsideBroadcast: true, assetHint: 'VENUE-VILLAGE-ARMS', placeholder: true },
  Thu: { id: 'override-thu', date: '', day: 'Thu', start: '19:15', end: '20:00', title: 'Live Music: The Granary Live', description: 'Jazz, blues and roots. Venue booking/confirmation required.', kind: 'venue', outsideBroadcast: true, assetHint: 'VENUE-GRANARY', placeholder: true },
  Fri: { id: 'override-fri', date: '', day: 'Fri', start: '19:15', end: '21:00', title: 'Live Music: Friday Night Sessions', description: 'Mixed bill — local bands, open mic nights and touring acts. Booking/confirmation required.', kind: 'venue', outsideBroadcast: true, assetHint: 'VENUE-FRIDAY-SESSIONS', placeholder: true },
  Sat: { id: 'override-sat', date: '', day: 'Sat', start: '10:00', end: '12:00', title: "Live Music: FTH Farmers' Market Stage", description: 'Outdoor live music at the weekly market. Venue/event confirmation required.', kind: 'venue', outsideBroadcast: true, assetHint: 'EVENT-FARMERS-MARKET-STAGE', placeholder: true },
  Sun: { id: 'override-sun', date: '', day: 'Sun', start: '11:00', end: '12:00', title: 'Live Music: Sunday Acoustic Circle', description: 'Community acoustic session. Venue/event confirmation required.', kind: 'venue', outsideBroadcast: true, assetHint: 'VENUE-SUNDAY-ACOUSTIC', placeholder: true },
};

const toMinutes = (value: string) => {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
};

const overlaps = (a: ScheduleEntry, b: ScheduleEntry) => {
  const aStart = toMinutes(a.start);
  const aEnd = a.end === '00:00' ? 1440 : toMinutes(a.end);
  const bStart = toMinutes(b.start);
  const bEnd = b.end === '00:00' ? 1440 : toMinutes(b.end);
  return aStart < bEnd && bStart < aEnd;
};

export function buildMonthSchedule(year = 2026, month = 9): ScheduleEntry[] {
  const days = new Date(year, month, 0).getDate();
  const output: ScheduleEntry[] = [];
  for (let dayNumber = 1; dayNumber <= days; dayNumber += 1) {
    const date = new Date(year, month - 1, dayNumber);
    const iso = `${year}-${String(month).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
    const day = date.toLocaleDateString('en-GB', { weekday: 'short' });
    let entries = MASTER_CLOCK.map((entry, index) => ({ ...entry, id: `${iso}-${index}`, date: iso, day }));
    const override = venueOverrides[day];
    if (override) {
      const replacement = { ...override, id: `${iso}-${override.assetHint}`, date: iso, day };
      entries = entries.filter(entry => !overlaps(entry, replacement));
      entries.push(replacement);
    }
    output.push(...entries.sort((a, b) => toMinutes(a.start) - toMinutes(b.start)));
  }
  return output;
}

export const PLACEHOLDERS = {
  advert: '[LOCAL BUSINESS AD — REPLACE WITH REAL CLIENT]',
  jingle: '[STATION JINGLE — FINAL AUDIO TO BE INSERTED]',
  event: '[EVENT PROMO — REPLACE WITH REAL EVENT]',
  venue: '[VENUE SLOT — CONFIRM BOOKING]',
};

export const getMonthLabel = (year: number, month: number) =>
  new Date(year, month - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
