// Shared domain types for Farmers Table Hub Community Radio.
//
// These mirror the V3 station schema in
// supabase/migrations/20260827_radio_v3_station.sql.

/** Content lifecycle shared by every piece of radio content (spec §28). */
export type RadioContentStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'scheduled'
  | 'live'
  | 'published'
  | 'archived'
  | 'expired'
  | 'rejected';

export const RADIO_CONTENT_STATUSES: RadioContentStatus[] = [
  'draft', 'pending', 'approved', 'scheduled', 'live',
  'published', 'archived', 'expired', 'rejected',
];

export type StreamProviderId =
  | 'live365' | 'icecast' | 'shoutcast' | 'radioking' | 'azuracast' | 'custom';

export interface RadioStation {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  logoUrl: string | null;
  channelType: 'main' | 'specialist' | 'podcast' | 'event';
  isActive: boolean;
}

/**
 * Public-safe streaming configuration.
 *
 * Everything here is readable by anonymous listeners because the player
 * needs it. Provider API credentials are NEVER part of this object — they
 * belong in Supabase secrets, read server-side only.
 */
export interface StationStreamConfig {
  stationId: string;
  provider: StreamProviderId;
  providerStationId: string | null;
  streamUrl: string | null;
  playerUrl: string | null;
  metadataUrl: string | null;
  statusUrl: string | null;
  listenerCountUrl: string | null;
  fallbackArtworkUrl: string | null;
  stationTimezone: string;
  metadataPollSeconds: number;
  isStreamEnabled: boolean;
  offlineMessage: string | null;
}

export interface NowPlaying {
  title: string | null;
  artist: string | null;
  album: string | null;
  artworkUrl: string | null;
  startedAt: string | null;
}

export interface StreamStatus {
  isOnline: boolean;
  nowPlaying: NowPlaying | null;
  listenerCount: number | null;
  fetchedAt: string;
  /** Set when the status could not be read. The player degrades, never crashes. */
  error: string | null;
}

export type PresenterRole =
  | 'presenter' | 'producer' | 'guest_presenter'
  | 'community_contributor' | 'news' | 'music_specialist';

export interface RadioPresenter {
  id: string;
  name: string;
  slug: string;
  photoUrl: string | null;
  bio: string | null;
  intro: string | null;
  presenterRole: PresenterRole;
  socialLinks: Record<string, string>;
  contactEmail: string | null;
  availability: string | null;
  status: RadioContentStatus;
  isActive: boolean;
}

export type BroadcastMode = 'planned' | 'live' | 'pre-recorded' | 'automated';

export type ProgrammeFrequency =
  | 'one-off' | 'daily' | 'weekdays' | 'weekends'
  | 'weekly' | 'fortnightly' | 'monthly' | 'special';

export interface RadioProgramme {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  intro: string | null;
  host: string | null;
  presenterId: string | null;
  presenter?: RadioPresenter | null;
  coPresenters?: RadioPresenter[];
  category: string | null;
  imageUrl: string | null;
  colour: string | null;
  icon: string | null;
  frequency: ProgrammeFrequency | null;
  /** Legacy free-text schedule summary from the original radio_shows table. */
  scheduleSummary: string | null;
  broadcastMode: BroadcastMode;
  archiveEnabled: boolean;
  isFeatured: boolean;
  websiteUrl: string | null;
  socialLinks: Record<string, string>;
  contentStatus: RadioContentStatus;
}

export type ScheduleType = 'regular' | 'special' | 'bank_holiday' | 'christmas' | 'emergency';
export type RepeatPattern =
  | 'once' | 'daily' | 'weekdays' | 'weekends' | 'weekly' | 'fortnightly' | 'monthly';

export interface ScheduleRule {
  id: string;
  programmeId: string | null;
  scheduleType: ScheduleType;
  repeatPattern: RepeatPattern;
  /** 0 = Sunday … 6 = Saturday, matching JavaScript's Date.getDay(). */
  dayOfWeek: number | null;
  weekOfMonth: number | null;
  specificDate: string | null;
  startTime: string;
  endTime: string;
  startsOn: string | null;
  endsOn: string | null;
  priority: number;
  isActive: boolean;
  notes: string | null;
}

/** A concrete, resolved slot on a real calendar day. */
export interface ScheduleSlot {
  key: string;
  /** ISO date (YYYY-MM-DD) this slot belongs to. */
  date: string;
  startTime: string;
  endTime: string;
  startsAt: Date;
  endsAt: Date;
  programmeId: string | null;
  programme: RadioProgramme | null;
  /** Title to display when there is no programme record attached. */
  title: string;
  scheduleType: ScheduleType;
  source: 'schedule' | 'special-broadcast';
  /** True when this slot displaced a regular scheduled programme. */
  isOverride: boolean;
  crossesMidnight: boolean;
  notes: string | null;
}

export interface NowAndNext {
  current: ScheduleSlot | null;
  next: ScheduleSlot | null;
}

export interface RadioEpisode {
  id: string;
  programmeId: string;
  programmeTitle?: string | null;
  presenterId: string | null;
  title: string;
  slug: string | null;
  description: string | null;
  broadcastDate: string | null;
  durationSeconds: number;
  audioUrl: string | null;
  artworkUrl: string | null;
  transcript: string | null;
  tags: string[];
  episodeCategory: 'episode' | 'interview' | 'community_feature' | 'special_broadcast';
  isDownloadable: boolean;
  status: RadioContentStatus;
  playCount: number;
}

export type LicenceStatus = 'unknown' | 'pending_check' | 'cleared' | 'restricted' | 'rejected';

export type ImagingType =
  | 'station_id' | 'jingle' | 'sweeper' | 'presenter_intro' | 'programme_intro'
  | 'programme_outro' | 'news_intro' | 'weather_intro' | 'community_intro'
  | 'sponsor_ident' | 'advert_intro' | 'emergency_announcement' | 'seasonal_ident';

export const IMAGING_TYPES: { value: ImagingType; label: string }[] = [
  { value: 'station_id', label: 'Station ID' },
  { value: 'jingle', label: 'Jingle' },
  { value: 'sweeper', label: 'Sweeper' },
  { value: 'presenter_intro', label: 'Presenter intro' },
  { value: 'programme_intro', label: 'Programme intro' },
  { value: 'programme_outro', label: 'Programme outro' },
  { value: 'news_intro', label: 'News intro' },
  { value: 'weather_intro', label: 'Weather intro' },
  { value: 'community_intro', label: 'Community announcement intro' },
  { value: 'sponsor_ident', label: 'Sponsor ident' },
  { value: 'advert_intro', label: 'Advert intro' },
  { value: 'emergency_announcement', label: 'Emergency announcement' },
  { value: 'seasonal_ident', label: 'Seasonal ident' },
];

/** Music categories from spec §10. Free text is allowed for anything else. */
export const MUSIC_CATEGORIES = [
  'Local artists', 'Folk', 'Country', 'Roots', 'Acoustic', 'Heritage',
  'Classic', 'Contemporary', 'Community', 'Specialist', 'Seasonal', 'Instrumental',
] as const;

export interface RadioLibraryItem {
  id: string;
  title: string;
  artist: string | null;
  album: string | null;
  genre: string | null;
  releaseYear: number | null;
  mediaType: 'music' | 'jingle' | 'community' | 'advert' | 'interview' | 'feature';
  imagingType: ImagingType | null;
  audioUrl: string | null;
  artworkUrl: string | null;
  durationSeconds: number;
  isLocalArtist: boolean;
  licenceStatus: LicenceStatus;
  licenceNotes: string | null;
  contentStatus: RadioContentStatus;
  programmeId: string | null;
  notes: string | null;
  isActive: boolean;
}

export type AnnouncementType =
  | 'notice' | 'charity' | 'meeting' | 'fundraiser'
  | 'public_information' | 'volunteer' | 'local_project' | 'emergency';

export interface RadioAnnouncement {
  id: string;
  title: string;
  content: string;
  organisationName: string | null;
  directoryListingId: string | null;
  eventId: string | null;
  announcementType: AnnouncementType;
  startDate: string | null;
  endDate: string | null;
  audioUrl: string | null;
  website: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: RadioContentStatus;
  isActive: boolean;
}

export type SubmissionType = 'music' | 'announcement' | 'event' | 'programme_idea' | 'presenter';

export interface RadioSubmission {
  id: string;
  submissionType: SubmissionType;
  submitterName: string;
  submitterEmail: string;
  submitterPhone: string | null;
  organisation: string | null;
  title: string;
  description: string | null;
  localConnection: string | null;
  fileUrl: string | null;
  website: string | null;
  preferredDate: string | null;
  payload: Record<string, unknown>;
  status: RadioContentStatus;
  moderationNotes: string | null;
  createdAt: string;
}

export interface RadioSubmissionInput {
  submissionType: SubmissionType;
  submitterName: string;
  submitterEmail: string;
  submitterPhone?: string;
  organisation?: string;
  title: string;
  description?: string;
  localConnection?: string;
  fileUrl?: string;
  website?: string;
  preferredDate?: string;
  payload?: Record<string, unknown>;
}

/** An event from the existing Farmers Table Hub events table, flagged for radio. */
export interface PromotedEvent {
  eventId: string;
  title: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  venue: string | null;
  location: string | null;
  websiteUrl: string | null;
  craftType: string | null;
  promotionId: string | null;
  priority: number;
  promotedUntil: string | null;
}
