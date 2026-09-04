// Supabase row -> domain object mappers.
//
// Kept separate so the shape of the database is described in exactly one
// place. Every mapper tolerates missing columns, because the V3 migration may
// not have been applied to a given environment yet.

import type {
  AdvertPackage, AdvertRunState, AnnouncementType, BroadcastMode, ImagingType,
  LicenceStatus, PresenterRole, RadioAdvert, RadioSponsorship, SponsorshipType,
  ProgrammeFrequency, PromotedEvent, RadioAnnouncement, RadioContentStatus,
  RadioEpisode, RadioLibraryItem, RadioPresenter, RadioProgramme, RadioStation,
  RadioSubmission, ScheduleRule, StationStreamConfig, StreamProviderId,
  SubmissionType,
} from './types';
import type { SpecialBroadcastWindow } from './scheduleEngine';

const asRecord = (value: unknown): Record<string, string> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, string>;
  }
  return {};
};

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const asNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

export const mapStation = (row: any): RadioStation => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  tagline: row.tagline ?? null,
  description: row.description ?? null,
  logoUrl: row.logo_url ?? null,
  channelType: row.channel_type ?? 'main',
  isActive: row.is_active ?? true,
});

export const mapStreamConfig = (row: any): StationStreamConfig => ({
  stationId: row.station_id,
  provider: (row.provider ?? 'live365') as StreamProviderId,
  providerStationId: row.provider_station_id ?? null,
  streamUrl: row.stream_url ?? null,
  playerUrl: row.player_url ?? null,
  metadataUrl: row.metadata_url ?? null,
  statusUrl: row.status_url ?? null,
  listenerCountUrl: row.listener_count_url ?? null,
  fallbackArtworkUrl: row.fallback_artwork_url ?? null,
  stationTimezone: row.station_timezone ?? 'Europe/London',
  metadataPollSeconds: asNumber(row.metadata_poll_seconds, 20),
  isStreamEnabled: row.is_stream_enabled ?? false,
  offlineMessage: row.offline_message ?? null,
});

export const mapPresenter = (row: any): RadioPresenter => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  photoUrl: row.photo_url ?? null,
  bio: row.bio ?? null,
  intro: row.intro ?? null,
  presenterRole: (row.presenter_role ?? 'presenter') as PresenterRole,
  socialLinks: asRecord(row.social_links),
  contactEmail: row.contact_email ?? null,
  availability: row.availability ?? null,
  status: (row.status ?? 'draft') as RadioContentStatus,
  isActive: row.is_active ?? true,
});

export const mapProgramme = (row: any): RadioProgramme => ({
  id: row.id,
  title: row.title,
  slug: row.slug ?? null,
  description: row.description ?? null,
  intro: row.intro ?? null,
  host: row.host ?? null,
  presenterId: row.presenter_id ?? null,
  presenter: row.presenter ? mapPresenter(row.presenter) : null,
  coPresenters: Array.isArray(row.radio_programme_presenters)
    ? row.radio_programme_presenters
        .map((link: any) => (link.radio_presenters ? mapPresenter(link.radio_presenters) : null))
        .filter(Boolean)
    : undefined,
  category: row.category ?? null,
  imageUrl: row.image_url ?? null,
  colour: row.colour ?? null,
  icon: row.icon ?? null,
  frequency: (row.frequency ?? null) as ProgrammeFrequency | null,
  scheduleSummary: row.schedule ?? null,
  broadcastMode: (row.status ?? 'planned') as BroadcastMode,
  archiveEnabled: row.archive_enabled ?? true,
  isFeatured: row.is_featured ?? false,
  websiteUrl: row.website_url ?? null,
  socialLinks: asRecord(row.social_links),
  contentStatus: (row.content_status ?? 'draft') as RadioContentStatus,
});

export const mapScheduleRule = (row: any): ScheduleRule => ({
  id: row.id,
  programmeId: row.programme_id ?? null,
  scheduleType: row.schedule_type ?? 'regular',
  repeatPattern: row.repeat_pattern ?? 'weekly',
  dayOfWeek: row.day_of_week ?? null,
  weekOfMonth: row.week_of_month ?? null,
  specificDate: row.specific_date ?? null,
  startTime: row.start_time ?? '00:00',
  endTime: row.end_time ?? '00:00',
  startsOn: row.starts_on ?? null,
  endsOn: row.ends_on ?? null,
  priority: asNumber(row.priority),
  isActive: row.is_active ?? true,
  notes: row.notes ?? null,
});

export const mapSpecialBroadcast = (row: any): SpecialBroadcastWindow => ({
  id: row.id,
  title: row.title,
  startsAt: row.starts_at,
  endsAt: row.ends_at ?? null,
  programmeId: row.show_id ?? null,
  overridesSchedule: row.overrides_schedule ?? false,
  priority: asNumber(row.priority, 100),
  broadcastType: row.broadcast_type ?? 'special',
  notes: row.description ?? null,
});

export const mapEpisode = (row: any): RadioEpisode => ({
  id: row.id,
  programmeId: row.programme_id,
  programmeTitle: row.radio_shows?.title ?? null,
  presenterId: row.presenter_id ?? null,
  title: row.title,
  slug: row.slug ?? null,
  description: row.description ?? null,
  broadcastDate: row.broadcast_date ?? null,
  durationSeconds: asNumber(row.duration_seconds),
  audioUrl: row.audio_url ?? null,
  artworkUrl: row.artwork_url ?? null,
  transcript: row.transcript ?? null,
  tags: asStringArray(row.tags),
  episodeCategory: row.episode_category ?? 'episode',
  isDownloadable: row.is_downloadable ?? false,
  status: (row.status ?? 'draft') as RadioContentStatus,
  playCount: asNumber(row.play_count),
});

export const mapLibraryItem = (row: any): RadioLibraryItem => ({
  id: row.id,
  title: row.title,
  artist: row.artist ?? null,
  album: row.album ?? null,
  genre: row.genre ?? null,
  releaseYear: row.release_year ?? null,
  mediaType: row.media_type ?? 'music',
  imagingType: (row.imaging_type ?? null) as ImagingType | null,
  audioUrl: row.audio_url ?? null,
  artworkUrl: row.artwork_url ?? null,
  durationSeconds: asNumber(row.duration_seconds),
  isLocalArtist: row.is_local_artist ?? false,
  licenceStatus: (row.licence_status ?? 'unknown') as LicenceStatus,
  licenceNotes: row.licence_notes ?? null,
  contentStatus: (row.content_status ?? 'draft') as RadioContentStatus,
  programmeId: row.programme_id ?? null,
  notes: row.notes ?? null,
  isActive: row.is_active ?? true,
});

export const mapAnnouncement = (row: any): RadioAnnouncement => ({
  id: row.id,
  title: row.title,
  content: row.content,
  organisationName: row.organisation_name ?? null,
  directoryListingId: row.directory_listing_id ?? null,
  eventId: row.event_id ?? null,
  announcementType: (row.announcement_type ?? 'notice') as AnnouncementType,
  startDate: row.start_date ?? null,
  endDate: row.end_date ?? null,
  audioUrl: row.audio_url ?? null,
  website: row.website ?? null,
  contactEmail: row.contact_email ?? null,
  contactPhone: row.contact_phone ?? null,
  priority: row.priority ?? 'normal',
  status: (row.status ?? 'draft') as RadioContentStatus,
  isActive: row.is_active ?? true,
});

export const mapSubmission = (row: any): RadioSubmission => ({
  id: row.id,
  submissionType: (row.submission_type ?? 'music') as SubmissionType,
  submitterName: row.submitter_name,
  submitterEmail: row.submitter_email,
  submitterPhone: row.submitter_phone ?? null,
  organisation: row.organisation ?? null,
  title: row.title,
  description: row.description ?? null,
  localConnection: row.local_connection ?? null,
  fileUrl: row.file_url ?? null,
  website: row.website ?? null,
  preferredDate: row.preferred_date ?? null,
  payload: (row.payload ?? {}) as Record<string, unknown>,
  status: (row.status ?? 'pending') as RadioContentStatus,
  moderationNotes: row.moderation_notes ?? null,
  createdAt: row.created_at,
});

/** A radio_event_promotions row joined to the existing events row. */
export const mapPromotedEvent = (row: any): PromotedEvent => {
  const event = row.events ?? row;
  return {
    eventId: event.id,
    title: event.title,
    description: event.description ?? null,
    startDate: event.start_date ?? null,
    endDate: event.end_date ?? null,
    venue: event.venue ?? null,
    location: event.location ?? null,
    websiteUrl: event.website_url ?? null,
    craftType: event.craft_type ?? null,
    promotionId: row.id ?? null,
    priority: asNumber(row.priority),
    promotedUntil: row.promoted_until ?? null,
  };
};

export const mapAdvert = (row: any): RadioAdvert => ({
  id: row.id,
  businessName: row.business_name,
  contactName: row.contact_name ?? null,
  contactEmail: row.contact_email ?? null,
  website: row.website ?? null,
  category: row.category ?? null,
  directoryListingId: row.directory_listing_id ?? null,
  package: (row.package ?? '30s') as AdvertPackage,
  adScript: row.ad_script ?? null,
  audioUrl: row.audio_url ?? null,
  artworkUrl: row.artwork_url ?? null,
  readsPerShow: asNumber(row.reads_per_show, 1),
  startDate: row.start_date ?? null,
  endDate: row.end_date ?? null,
  renewalDate: row.renewal_date ?? null,
  notes: row.notes ?? null,
  campaignDetails: row.campaign_details ?? null,
  runState: (row.status ?? 'active') as AdvertRunState,
  contentStatus: (row.content_status ?? 'draft') as RadioContentStatus,
});

export const mapSponsorship = (row: any): RadioSponsorship => ({
  id: row.id,
  sponsorId: row.sponsor_id,
  sponsorName: row.radio_sponsors?.business_name ?? null,
  programmeId: row.programme_id ?? null,
  programmeTitle: row.radio_shows?.title ?? null,
  broadcastId: row.broadcast_id ?? null,
  eventId: row.event_id ?? null,
  sponsorshipType: (row.sponsorship_type ?? 'programme') as SponsorshipType,
  package: row.package ?? null,
  startDate: row.start_date ?? null,
  endDate: row.end_date ?? null,
  audioUrl: row.audio_url ?? null,
  artworkUrl: row.artwork_url ?? null,
  notes: row.notes ?? null,
  status: (row.status ?? 'draft') as RadioContentStatus,
});
