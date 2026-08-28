// Data access for Farmers Table Hub Community Radio.
//
// Reads are shaped for the listener-facing pages; writes are used by the Radio
// Control Centre. Authorisation is NOT enforced here — it is enforced by
// PostgreSQL Row Level Security (see the V3 migration), so a caller that
// bypasses the UI still cannot write station content.
//
// This module covers the V3 station schema. The older radioService.ts remains
// in place for the playlist/media workflow the studio dashboard already uses.

import { supabase } from '../../lib/supabase';
import {
  mapAnnouncement, mapEpisode, mapLibraryItem, mapPresenter, mapProgramme,
  mapPromotedEvent, mapScheduleRule, mapSpecialBroadcast, mapStation,
  mapStreamConfig, mapSubmission,
} from './mappers';
import type { SpecialBroadcastWindow } from './scheduleEngine';
import { addDays, resolveDay, resolveNowAndNext, resolveWeek, startOfWeek, toIsoDate } from './scheduleEngine';
import type {
  NowAndNext, PromotedEvent, RadioAnnouncement, RadioContentStatus, RadioEpisode,
  RadioLibraryItem, RadioPresenter, RadioProgramme, RadioStation, RadioSubmission,
  RadioSubmissionInput, ScheduleRule, ScheduleSlot, StationStreamConfig,
} from './types';

export const STATION_SLUG = 'farmers-table-hub-community-radio';

/**
 * The app runs in a "not configured yet" mode when Supabase is absent.
 *
 * This deliberately does NOT test for a `supabase.co` hostname: a self-hosted
 * Supabase (or any custom domain in front of one) is a perfectly valid target,
 * and matching on the hostname would make the whole radio system silently show
 * empty states against a database that is actually working. What matters is
 * that a real URL and key are configured and are not the placeholders from
 * src/lib/supabase.ts.
 */
const PLACEHOLDER_URL = 'https://placeholder.supabase.co';
const PLACEHOLDER_KEY = 'placeholder-key';

export const isRadioConfigured = (): boolean => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  if (url === PLACEHOLDER_URL || key === PLACEHOLDER_KEY) return false;
  try {
    const { protocol } = new URL(url);
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
};

const requireConfigured = () => {
  if (!isRadioConfigured()) {
    throw new Error('Supabase is not configured, so radio data cannot be saved.');
  }
};

/**
 * A missing table (error 42P01) means the V3 migration has not been applied to
 * this environment yet. That is a setup state, not a fault: the pages show
 * their empty state instead of an error.
 */
const isMissingRelation = (error: any): boolean =>
  error?.code === '42P01' || /does not exist/i.test(error?.message ?? '');

// Supabase query builders are thenables rather than real Promises, so this
// accepts PromiseLike instead of Promise.
const safeSelect = async <T>(
  run: () => PromiseLike<{ data: any; error: any }>,
  map: (row: any) => T,
): Promise<T[]> => {
  if (!isRadioConfigured()) return [];
  const { data, error } = await run();
  if (error) {
    if (isMissingRelation(error)) return [];
    throw error;
  }
  return (data ?? []).map(map);
};

// ------------------------------------------------------------------
// Station identity and streaming configuration (spec §1, §2, §23)
// ------------------------------------------------------------------

export const getStation = async (slug = STATION_SLUG): Promise<RadioStation | null> => {
  if (!isRadioConfigured()) return null;
  const { data, error } = await supabase
    .from('radio_stations').select('*').eq('slug', slug).maybeSingle();
  if (error) {
    if (isMissingRelation(error)) return null;
    throw error;
  }
  return data ? mapStation(data) : null;
};

export const getStreamConfig = async (stationId: string): Promise<StationStreamConfig | null> => {
  if (!isRadioConfigured()) return null;
  const { data, error } = await supabase
    .from('radio_station_settings').select('*').eq('station_id', stationId).maybeSingle();
  if (error) {
    if (isMissingRelation(error)) return null;
    throw error;
  }
  return data ? mapStreamConfig(data) : null;
};

export const updateStreamConfig = async (
  stationId: string,
  patch: Partial<Omit<StationStreamConfig, 'stationId'>>,
): Promise<void> => {
  requireConfigured();
  const row: Record<string, unknown> = {};
  if (patch.provider !== undefined) row.provider = patch.provider;
  if (patch.providerStationId !== undefined) row.provider_station_id = patch.providerStationId;
  if (patch.streamUrl !== undefined) row.stream_url = patch.streamUrl;
  if (patch.playerUrl !== undefined) row.player_url = patch.playerUrl;
  if (patch.metadataUrl !== undefined) row.metadata_url = patch.metadataUrl;
  if (patch.statusUrl !== undefined) row.status_url = patch.statusUrl;
  if (patch.listenerCountUrl !== undefined) row.listener_count_url = patch.listenerCountUrl;
  if (patch.fallbackArtworkUrl !== undefined) row.fallback_artwork_url = patch.fallbackArtworkUrl;
  if (patch.stationTimezone !== undefined) row.station_timezone = patch.stationTimezone;
  if (patch.metadataPollSeconds !== undefined) row.metadata_poll_seconds = patch.metadataPollSeconds;
  if (patch.isStreamEnabled !== undefined) row.is_stream_enabled = patch.isStreamEnabled;
  if (patch.offlineMessage !== undefined) row.offline_message = patch.offlineMessage;

  const { error } = await supabase
    .from('radio_station_settings').update(row).eq('station_id', stationId);
  if (error) throw error;
};

// ------------------------------------------------------------------
// Presenters (spec §8)
// ------------------------------------------------------------------

const PRESENTER_COLUMNS =
  'id,name,slug,photo_url,bio,intro,presenter_role,social_links,contact_email,availability,status,is_active,sort_order';

export const getPublishedPresenters = (): Promise<RadioPresenter[]> =>
  safeSelect(
    () => supabase.from('radio_presenters').select(PRESENTER_COLUMNS)
      .eq('status', 'published').eq('is_active', true)
      .order('sort_order').order('name'),
    mapPresenter,
  );

/** Staff view: every presenter regardless of status. RLS gates this. */
export const getAllPresenters = (): Promise<RadioPresenter[]> =>
  safeSelect(
    () => supabase.from('radio_presenters').select(PRESENTER_COLUMNS).order('sort_order').order('name'),
    mapPresenter,
  );

export const getPresenterBySlug = async (slug: string): Promise<RadioPresenter | null> => {
  if (!isRadioConfigured()) return null;
  const { data, error } = await supabase
    .from('radio_presenters').select(PRESENTER_COLUMNS).eq('slug', slug).maybeSingle();
  if (error) {
    if (isMissingRelation(error)) return null;
    throw error;
  }
  return data ? mapPresenter(data) : null;
};

export const savePresenter = async (
  presenter: Partial<RadioPresenter> & { name: string; slug: string },
): Promise<RadioPresenter> => {
  requireConfigured();
  const row = {
    name: presenter.name,
    slug: presenter.slug,
    photo_url: presenter.photoUrl ?? null,
    bio: presenter.bio ?? null,
    intro: presenter.intro ?? null,
    presenter_role: presenter.presenterRole ?? 'presenter',
    social_links: presenter.socialLinks ?? {},
    contact_email: presenter.contactEmail ?? null,
    availability: presenter.availability ?? null,
    status: presenter.status ?? 'draft',
    is_active: presenter.isActive ?? true,
  };
  const query = presenter.id
    ? supabase.from('radio_presenters').update(row).eq('id', presenter.id)
    : supabase.from('radio_presenters').insert(row);
  const { data, error } = await query.select().single();
  if (error) throw error;
  return mapPresenter(data);
};

export const setPresenterStatus = async (id: string, status: RadioContentStatus): Promise<void> => {
  requireConfigured();
  const { error } = await supabase.from('radio_presenters').update({ status }).eq('id', id);
  if (error) throw error;
};

// ------------------------------------------------------------------
// Programmes (spec §4, §7)
// ------------------------------------------------------------------

const PROGRAMME_COLUMNS = `
  id,title,slug,description,intro,host,presenter_id,category,image_url,colour,icon,
  frequency,schedule,status,archive_enabled,is_featured,website_url,social_links,
  content_status,sort_order,
  presenter:radio_presenters!radio_shows_presenter_id_fkey(${PRESENTER_COLUMNS}),
  radio_programme_presenters(presenter_role,sort_order,radio_presenters(${PRESENTER_COLUMNS}))
`;

export const getPublishedProgrammes = (): Promise<RadioProgramme[]> =>
  safeSelect(
    () => supabase.from('radio_shows').select(PROGRAMME_COLUMNS)
      .eq('content_status', 'published').order('sort_order').order('title'),
    mapProgramme,
  );

export const getAllProgrammes = (): Promise<RadioProgramme[]> =>
  safeSelect(
    () => supabase.from('radio_shows').select(PROGRAMME_COLUMNS).order('sort_order').order('title'),
    mapProgramme,
  );

export const getFeaturedProgramme = async (): Promise<RadioProgramme | null> => {
  if (!isRadioConfigured()) return null;
  const { data, error } = await supabase
    .from('radio_shows').select(PROGRAMME_COLUMNS)
    .eq('content_status', 'published').eq('is_featured', true)
    .order('sort_order').limit(1).maybeSingle();
  if (error) {
    if (isMissingRelation(error)) return null;
    throw error;
  }
  return data ? mapProgramme(data) : null;
};

export const getProgrammeBySlug = async (slug: string): Promise<RadioProgramme | null> => {
  if (!isRadioConfigured()) return null;
  const { data, error } = await supabase
    .from('radio_shows').select(PROGRAMME_COLUMNS).eq('slug', slug).maybeSingle();
  if (error) {
    if (isMissingRelation(error)) return null;
    throw error;
  }
  return data ? mapProgramme(data) : null;
};

export const saveProgramme = async (
  programme: Partial<RadioProgramme> & { title: string },
): Promise<RadioProgramme> => {
  requireConfigured();
  const row = {
    title: programme.title,
    slug: programme.slug ?? null,
    description: programme.description ?? null,
    intro: programme.intro ?? null,
    host: programme.host ?? null,
    presenter_id: programme.presenterId ?? null,
    category: programme.category ?? null,
    image_url: programme.imageUrl ?? null,
    colour: programme.colour ?? null,
    icon: programme.icon ?? null,
    frequency: programme.frequency ?? null,
    status: programme.broadcastMode ?? 'planned',
    archive_enabled: programme.archiveEnabled ?? true,
    is_featured: programme.isFeatured ?? false,
    website_url: programme.websiteUrl ?? null,
    social_links: programme.socialLinks ?? {},
    content_status: programme.contentStatus ?? 'draft',
  };
  const query = programme.id
    ? supabase.from('radio_shows').update(row).eq('id', programme.id)
    : supabase.from('radio_shows').insert(row);
  const { data, error } = await query.select().single();
  if (error) throw error;
  return mapProgramme(data);
};

/** Spec §7: duplicating a programme is a first-class admin action. */
export const duplicateProgramme = async (id: string): Promise<RadioProgramme> => {
  requireConfigured();
  const { data, error } = await supabase.from('radio_shows').select('*').eq('id', id).single();
  if (error) throw error;

  const { id: _id, created_at: _c, updated_at: _u, ...rest } = data;
  const copy = {
    ...rest,
    title: `${data.title} (copy)`,
    slug: data.slug ? `${data.slug}-copy` : null,
    content_status: 'draft' as const,
    is_featured: false,
  };
  const { data: inserted, error: insertError } =
    await supabase.from('radio_shows').insert(copy).select().single();
  if (insertError) throw insertError;
  return mapProgramme(inserted);
};

export const setProgrammeStatus = async (id: string, status: RadioContentStatus): Promise<void> => {
  requireConfigured();
  const { error } = await supabase.from('radio_shows').update({ content_status: status }).eq('id', id);
  if (error) throw error;
};

export const setFeaturedProgramme = async (id: string): Promise<void> => {
  requireConfigured();
  // Only one programme is featured at a time.
  const { error: clearError } = await supabase
    .from('radio_shows').update({ is_featured: false }).eq('is_featured', true);
  if (clearError) throw clearError;
  const { error } = await supabase.from('radio_shows').update({ is_featured: true }).eq('id', id);
  if (error) throw error;
};

// ------------------------------------------------------------------
// Schedule (spec §4, §5, §6, §18)
// ------------------------------------------------------------------

export const getScheduleRules = (): Promise<ScheduleRule[]> =>
  safeSelect(
    () => supabase.from('radio_schedule').select('*').eq('is_active', true).order('start_time'),
    mapScheduleRule,
  );

export const getAllScheduleRules = (): Promise<ScheduleRule[]> =>
  safeSelect(
    () => supabase.from('radio_schedule').select('*').order('day_of_week').order('start_time'),
    mapScheduleRule,
  );

export const saveScheduleRule = async (
  rule: Partial<ScheduleRule> & Pick<ScheduleRule, 'startTime' | 'endTime'>,
): Promise<ScheduleRule> => {
  requireConfigured();
  const row = {
    programme_id: rule.programmeId ?? null,
    schedule_type: rule.scheduleType ?? 'regular',
    repeat_pattern: rule.repeatPattern ?? 'weekly',
    day_of_week: rule.dayOfWeek ?? null,
    week_of_month: rule.weekOfMonth ?? null,
    specific_date: rule.specificDate ?? null,
    start_time: rule.startTime,
    end_time: rule.endTime,
    starts_on: rule.startsOn ?? null,
    ends_on: rule.endsOn ?? null,
    priority: rule.priority ?? 0,
    is_active: rule.isActive ?? true,
    notes: rule.notes ?? null,
  };
  const query = rule.id
    ? supabase.from('radio_schedule').update(row).eq('id', rule.id)
    : supabase.from('radio_schedule').insert(row);
  const { data, error } = await query.select().single();
  if (error) throw error;
  return mapScheduleRule(data);
};

export const deleteScheduleRule = async (id: string): Promise<void> => {
  requireConfigured();
  const { error } = await supabase.from('radio_schedule').delete().eq('id', id);
  if (error) throw error;
};

/** Special broadcasts that touch a date window (spec §18). */
export const getSpecialBroadcasts = async (from: Date, to: Date): Promise<SpecialBroadcastWindow[]> =>
  safeSelect(
    () => supabase.from('radio_broadcasts')
      .select('id,title,description,starts_at,ends_at,show_id,overrides_schedule,priority,broadcast_type,status')
      .in('status', ['scheduled', 'live'])
      .lt('starts_at', addDays(to, 1).toISOString())
      .or(`ends_at.is.null,ends_at.gte.${addDays(from, -1).toISOString()}`)
      .order('starts_at'),
    mapSpecialBroadcast,
  );

interface ResolvedScheduleInput {
  rules: ScheduleRule[];
  specials: SpecialBroadcastWindow[];
  programmes: Map<string, RadioProgramme>;
}

/** Load everything the schedule engine needs for a date window, once. */
export const loadScheduleInputs = async (from: Date, to: Date): Promise<ResolvedScheduleInput> => {
  const [rules, specials, programmes] = await Promise.all([
    getScheduleRules(),
    getSpecialBroadcasts(from, to),
    getPublishedProgrammes(),
  ]);
  return {
    rules,
    specials,
    programmes: new Map(programmes.map((p) => [p.id, p])),
  };
};

export const getDaySchedule = async (date: Date): Promise<ScheduleSlot[]> => {
  const { rules, specials, programmes } = await loadScheduleInputs(addDays(date, -1), addDays(date, 1));
  return resolveDay(date, rules, specials, programmes);
};

export const getWeekSchedule = async (
  anchor: Date,
): Promise<{ date: Date; isoDate: string; slots: ScheduleSlot[] }[]> => {
  const weekStart = startOfWeek(anchor);
  const { rules, specials, programmes } =
    await loadScheduleInputs(addDays(weekStart, -1), addDays(weekStart, 7));
  return resolveWeek(weekStart, rules, specials, programmes);
};

export const getNowAndNext = async (at: Date = new Date()): Promise<NowAndNext> => {
  const { rules, specials, programmes } = await loadScheduleInputs(addDays(at, -1), addDays(at, 1));
  return resolveNowAndNext(at, rules, specials, programmes);
};

// ------------------------------------------------------------------
// Episodes / Listen Again (spec §9, §19)
// ------------------------------------------------------------------

const EPISODE_COLUMNS = `
  id,programme_id,presenter_id,title,slug,description,broadcast_date,duration_seconds,
  audio_url,artwork_url,transcript,tags,episode_category,is_downloadable,status,play_count,
  radio_shows(title)
`;

export const getPublishedEpisodes = (limit = 24): Promise<RadioEpisode[]> =>
  safeSelect(
    () => supabase.from('radio_episodes').select(EPISODE_COLUMNS)
      .eq('status', 'published')
      .order('broadcast_date', { ascending: false, nullsFirst: false })
      .limit(limit),
    mapEpisode,
  );

export const getEpisodesForProgramme = (programmeId: string, limit = 50): Promise<RadioEpisode[]> =>
  safeSelect(
    () => supabase.from('radio_episodes').select(EPISODE_COLUMNS)
      .eq('programme_id', programmeId).eq('status', 'published')
      .order('broadcast_date', { ascending: false, nullsFirst: false })
      .limit(limit),
    mapEpisode,
  );

export const getEpisodesByCategory = (
  category: RadioEpisode['episodeCategory'],
  limit = 24,
): Promise<RadioEpisode[]> =>
  safeSelect(
    () => supabase.from('radio_episodes').select(EPISODE_COLUMNS)
      .eq('status', 'published').eq('episode_category', category)
      .order('broadcast_date', { ascending: false, nullsFirst: false })
      .limit(limit),
    mapEpisode,
  );

export const getAllEpisodes = (limit = 200): Promise<RadioEpisode[]> =>
  safeSelect(
    () => supabase.from('radio_episodes').select(EPISODE_COLUMNS)
      .order('broadcast_date', { ascending: false, nullsFirst: false }).limit(limit),
    mapEpisode,
  );

export const saveEpisode = async (
  episode: Partial<RadioEpisode> & { programmeId: string; title: string },
): Promise<RadioEpisode> => {
  requireConfigured();
  const row = {
    programme_id: episode.programmeId,
    presenter_id: episode.presenterId ?? null,
    title: episode.title,
    slug: episode.slug ?? null,
    description: episode.description ?? null,
    broadcast_date: episode.broadcastDate ?? null,
    duration_seconds: episode.durationSeconds ?? 0,
    audio_url: episode.audioUrl ?? null,
    artwork_url: episode.artworkUrl ?? null,
    transcript: episode.transcript ?? null,
    tags: episode.tags ?? [],
    episode_category: episode.episodeCategory ?? 'episode',
    is_downloadable: episode.isDownloadable ?? false,
    status: episode.status ?? 'draft',
  };
  const query = episode.id
    ? supabase.from('radio_episodes').update(row).eq('id', episode.id)
    : supabase.from('radio_episodes').insert(row);
  const { data, error } = await query.select(EPISODE_COLUMNS).single();
  if (error) throw error;
  return mapEpisode(data);
};

export const setEpisodeStatus = async (id: string, status: RadioContentStatus): Promise<void> => {
  requireConfigured();
  const { error } = await supabase.from('radio_episodes').update({ status }).eq('id', id);
  if (error) throw error;
};

// ------------------------------------------------------------------
// Content library: music and station imaging (spec §10, §11)
// ------------------------------------------------------------------

const LIBRARY_COLUMNS = `
  id,title,artist,album,genre,release_year,media_type,imaging_type,audio_url,artwork_url,
  duration_seconds,is_local_artist,licence_status,licence_notes,content_status,programme_id,notes,is_active
`;

export const getLibrary = (limit = 500): Promise<RadioLibraryItem[]> =>
  safeSelect(
    () => supabase.from('radio_media').select(LIBRARY_COLUMNS)
      .order('created_at', { ascending: false }).limit(limit),
    mapLibraryItem,
  );

export const getImagingLibrary = (): Promise<RadioLibraryItem[]> =>
  safeSelect(
    () => supabase.from('radio_media').select(LIBRARY_COLUMNS)
      .not('imaging_type', 'is', null).order('imaging_type').order('title'),
    mapLibraryItem,
  );

/**
 * Music that may actually be broadcast. Licence status is checked explicitly:
 * uploaded music is never assumed cleared (spec §10).
 */
export const getBroadcastableMusic = (): Promise<RadioLibraryItem[]> =>
  safeSelect(
    () => supabase.from('radio_media').select(LIBRARY_COLUMNS)
      .eq('media_type', 'music').eq('licence_status', 'cleared').eq('is_active', true)
      .order('artist').order('title'),
    mapLibraryItem,
  );

export const getMusicAwaitingLicenceCheck = (): Promise<RadioLibraryItem[]> =>
  safeSelect(
    () => supabase.from('radio_media').select(LIBRARY_COLUMNS)
      .eq('media_type', 'music').in('licence_status', ['unknown', 'pending_check'])
      .order('created_at', { ascending: false }),
    mapLibraryItem,
  );

export const saveLibraryItem = async (
  item: Partial<RadioLibraryItem> & { title: string },
): Promise<RadioLibraryItem> => {
  requireConfigured();
  const row = {
    title: item.title,
    artist: item.artist ?? null,
    album: item.album ?? null,
    genre: item.genre ?? null,
    release_year: item.releaseYear ?? null,
    media_type: item.mediaType ?? 'music',
    imaging_type: item.imagingType ?? null,
    audio_url: item.audioUrl ?? null,
    artwork_url: item.artworkUrl ?? null,
    duration_seconds: item.durationSeconds ?? 0,
    is_local_artist: item.isLocalArtist ?? false,
    licence_status: item.licenceStatus ?? 'unknown',
    licence_notes: item.licenceNotes ?? null,
    content_status: item.contentStatus ?? 'draft',
    programme_id: item.programmeId ?? null,
    notes: item.notes ?? null,
    is_active: item.isActive ?? true,
  };
  const query = item.id
    ? supabase.from('radio_media').update(row).eq('id', item.id)
    : supabase.from('radio_media').insert(row);
  const { data, error } = await query.select(LIBRARY_COLUMNS).single();
  if (error) throw error;
  return mapLibraryItem(data);
};

export const setLibraryItemActive = async (id: string, isActive: boolean): Promise<void> => {
  requireConfigured();
  const { error } = await supabase.from('radio_media').update({ is_active: isActive }).eq('id', id);
  if (error) throw error;
};

export const setLicenceStatus = async (
  id: string,
  licenceStatus: RadioLibraryItem['licenceStatus'],
  licenceNotes?: string,
): Promise<void> => {
  requireConfigured();
  const patch: Record<string, unknown> = { licence_status: licenceStatus };
  if (licenceNotes !== undefined) patch.licence_notes = licenceNotes;
  const { error } = await supabase.from('radio_media').update(patch).eq('id', id);
  if (error) throw error;
};

/** Upload audio or artwork to the radio storage buckets. */
export const uploadRadioFile = async (
  file: File,
  bucket: 'radio-audio' | 'radio-images' = 'radio-audio',
): Promise<string> => {
  requireConfigured();
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
  const path = `${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  });
  if (error) throw error;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
};

// ------------------------------------------------------------------
// Community announcements (spec §14)
// ------------------------------------------------------------------

const ANNOUNCEMENT_COLUMNS = `
  id,title,content,organisation_name,directory_listing_id,event_id,announcement_type,
  start_date,end_date,audio_url,website,contact_email,contact_phone,priority,status,is_active
`;

const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };

export const getPublishedAnnouncements = async (limit = 12): Promise<RadioAnnouncement[]> => {
  const rows = await safeSelect(
    () => supabase.from('radio_announcements').select(ANNOUNCEMENT_COLUMNS)
      .eq('status', 'published').eq('is_active', true)
      .order('created_at', { ascending: false }).limit(limit),
    mapAnnouncement,
  );
  // Urgent notices lead, matching how they would be read on air.
  return rows.sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9));
};

export const getAllAnnouncements = (): Promise<RadioAnnouncement[]> =>
  safeSelect(
    () => supabase.from('radio_announcements').select(ANNOUNCEMENT_COLUMNS)
      .order('created_at', { ascending: false }),
    mapAnnouncement,
  );

export const saveAnnouncement = async (
  announcement: Partial<RadioAnnouncement> & { title: string; content: string },
): Promise<RadioAnnouncement> => {
  requireConfigured();
  const row = {
    title: announcement.title,
    content: announcement.content,
    organisation_name: announcement.organisationName ?? null,
    directory_listing_id: announcement.directoryListingId ?? null,
    event_id: announcement.eventId ?? null,
    announcement_type: announcement.announcementType ?? 'notice',
    start_date: announcement.startDate ?? null,
    end_date: announcement.endDate ?? null,
    audio_url: announcement.audioUrl ?? null,
    website: announcement.website ?? null,
    contact_email: announcement.contactEmail ?? null,
    contact_phone: announcement.contactPhone ?? null,
    priority: announcement.priority ?? 'normal',
    status: announcement.status ?? 'draft',
    is_active: announcement.isActive ?? true,
  };
  const query = announcement.id
    ? supabase.from('radio_announcements').update(row).eq('id', announcement.id)
    : supabase.from('radio_announcements').insert(row);
  const { data, error } = await query.select(ANNOUNCEMENT_COLUMNS).single();
  if (error) throw error;
  return mapAnnouncement(data);
};

export const setAnnouncementStatus = async (id: string, status: RadioContentStatus): Promise<void> => {
  requireConfigured();
  const { error } = await supabase.from('radio_announcements').update({ status }).eq('id', id);
  if (error) throw error;
};

// ------------------------------------------------------------------
// Events integration (spec §15) — links to the existing events table
// ------------------------------------------------------------------

const PROMOTED_EVENT_COLUMNS = `
  id,priority,promoted_until,promoted_from,is_active,
  events(id,title,description,start_date,end_date,venue,location,website_url,craft_type,approved)
`;

export const getEventsOnAirThisWeek = async (limit = 8): Promise<PromotedEvent[]> => {
  const today = toIsoDate(new Date());
  const rows = await safeSelect(
    () => supabase.from('radio_event_promotions').select(PROMOTED_EVENT_COLUMNS)
      .eq('is_active', true)
      .or(`promoted_until.is.null,promoted_until.gte.${today}`)
      .order('priority', { ascending: false }).limit(limit),
    mapPromotedEvent,
  );
  return rows
    .filter((event) => Boolean(event.title))
    .sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''));
};

/** Staff: flag an existing event for radio promotion. Never copies the event. */
export const promoteEvent = async (
  eventId: string,
  options: { programmeId?: string; promotedFrom?: string; promotedUntil?: string; priority?: number; notes?: string } = {},
): Promise<void> => {
  requireConfigured();
  const { error } = await supabase.from('radio_event_promotions').upsert({
    event_id: eventId,
    programme_id: options.programmeId ?? null,
    promoted_from: options.promotedFrom ?? null,
    promoted_until: options.promotedUntil ?? null,
    priority: options.priority ?? 0,
    notes: options.notes ?? null,
    is_active: true,
  }, { onConflict: 'event_id' });
  if (error) throw error;
};

export const unpromoteEvent = async (eventId: string): Promise<void> => {
  requireConfigured();
  const { error } = await supabase
    .from('radio_event_promotions').update({ is_active: false }).eq('event_id', eventId);
  if (error) throw error;
};

/** Approved events the station could promote but has not flagged yet. */
export const getPromotableEvents = async (limit = 40) => {
  if (!isRadioConfigured()) return [];
  const { data, error } = await supabase
    .from('events')
    .select('id,title,start_date,venue,location,approved')
    .eq('approved', true)
    .gte('start_date', new Date().toISOString())
    .order('start_date')
    .limit(limit);
  if (error) {
    if (isMissingRelation(error)) return [];
    throw error;
  }
  return data ?? [];
};

// ------------------------------------------------------------------
// Community submissions (spec §16)
// ------------------------------------------------------------------

/**
 * Public submission. The status is deliberately not settable by the caller —
 * the RLS policy rejects any insert that is not a clean pending row, so a
 * submission cannot arrive pre-approved.
 */
export const createSubmission = async (input: RadioSubmissionInput): Promise<void> => {
  requireConfigured();
  const { error } = await supabase.from('radio_submissions').insert({
    submission_type: input.submissionType,
    submitter_name: input.submitterName,
    submitter_email: input.submitterEmail,
    submitter_phone: input.submitterPhone ?? null,
    organisation: input.organisation ?? null,
    title: input.title,
    description: input.description ?? null,
    local_connection: input.localConnection ?? null,
    file_url: input.fileUrl ?? null,
    website: input.website ?? null,
    preferred_date: input.preferredDate ?? null,
    payload: input.payload ?? {},
  });
  if (error) throw error;
};

export const getSubmissionQueue = (status?: RadioContentStatus): Promise<RadioSubmission[]> =>
  safeSelect(
    () => {
      const query = supabase.from('radio_submissions').select('*').order('created_at', { ascending: false });
      return status ? query.eq('status', status) : query;
    },
    mapSubmission,
  );

export const moderateSubmission = async (
  id: string,
  status: Extract<RadioContentStatus, 'approved' | 'rejected' | 'archived' | 'pending'>,
  moderationNotes?: string,
): Promise<void> => {
  requireConfigured();
  const { data: session } = await supabase.auth.getUser();
  const { error } = await supabase.from('radio_submissions').update({
    status,
    moderation_notes: moderationNotes ?? null,
    reviewed_by: session?.user?.id ?? null,
    reviewed_at: new Date().toISOString(),
  }).eq('id', id);
  if (error) throw error;
};
