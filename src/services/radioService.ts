import { supabase } from '../lib/supabase';

export type RadioShow = { id: string; title: string; host: string; schedule: string; status: 'live' | 'pre-recorded' | 'planned'; lastBroadcast?: string; };
export type RadioPlaylist = { id: string; name: string; description: string | null; durationSeconds: number; status: 'draft' | 'ready' | 'archived'; };
export type RadioMedia = { id: string; title: string; artist: string | null; category: 'music' | 'jingle' | 'community' | 'ad' | 'emergency'; fileUrl: string; durationSeconds: number; isActive: boolean; };
export type RadioBroadcast = { id: string; title: string; broadcastType: 'scheduled' | 'live' | 'outside'; startsAt: string; endsAt: string | null; status: 'scheduled' | 'live' | 'completed' | 'cancelled'; showId: string | null; playlistId: string | null; };

const configured = () => Boolean(import.meta.env.VITE_SUPABASE_URL?.includes('supabase.co'));
const requireConfigured = () => { if (!configured()) throw new Error('Supabase is not configured.'); };
const mapMedia = (r: any): RadioMedia => ({ id: r.id, title: r.title, artist: r.artist, category: r.category, fileUrl: r.file_url, durationSeconds: r.duration_seconds, isActive: r.is_active });

export const radioService = {
  async getShows(): Promise<RadioShow[]> {
    if (!configured()) return [];
    const { data, error } = await supabase.from('radio_shows').select('*').order('title'); if (error) throw error;
    return (data ?? []).map((r: any) => ({ id: r.id, title: r.title, host: r.host, schedule: r.schedule, status: r.status, lastBroadcast: r.last_broadcast }));
  },
  async getReadyPlaylists(): Promise<RadioPlaylist[]> {
    if (!configured()) return [];
    const { data, error } = await supabase.from('radio_playlists').select('id,name,description,duration_seconds,status').eq('status', 'ready').order('name'); if (error) throw error;
    return (data ?? []).map((r: any) => ({ id: r.id, name: r.name, description: r.description, durationSeconds: r.duration_seconds, status: r.status }));
  },
  async getActiveMedia(): Promise<RadioMedia[]> {
    if (!configured()) return [];
    const { data, error } = await supabase.from('radio_media').select('id,title,artist,category,file_url,duration_seconds,is_active').eq('is_active', true).order('created_at', { ascending: false }); if (error) throw error;
    return (data ?? []).map(mapMedia);
  },
  async getPlaylistItems(playlistId: string): Promise<RadioMedia[]> {
    if (!configured()) return [];
    const { data, error } = await supabase.from('radio_playlist_items').select('order_index,radio_media(*)').eq('playlist_id', playlistId).order('order_index'); if (error) throw error;
    return (data ?? []).map((r: any) => mapMedia(r.radio_media)).filter(Boolean);
  },
  async getUpcomingBroadcasts(limit = 8): Promise<RadioBroadcast[]> {
    if (!configured()) return [];
    const { data, error } = await supabase.from('radio_broadcasts').select('id,title,broadcast_type,starts_at,ends_at,status,show_id,playlist_id').in('status', ['scheduled', 'live']).order('starts_at').limit(limit); if (error) throw error;
    return (data ?? []).map((r: any) => ({ id: r.id, title: r.title, broadcastType: r.broadcast_type, startsAt: r.starts_at, endsAt: r.ends_at, status: r.status, showId: r.show_id, playlistId: r.playlist_id }));
  },
  async getPublicDirectory(limit = 12) {
    if (!configured()) return [];
    const { data, error } = await supabase.from('directory_listings').select('id,name,category,location,description,website,tier,status').eq('status', 'active').order('name').limit(limit); if (error) throw error; return data ?? [];
  },
  async addMedia(input: Omit<RadioMedia, 'id' | 'isActive'>) {
    requireConfigured(); const { data, error } = await supabase.from('radio_media').insert({ title: input.title, artist: input.artist, category: input.category, file_url: input.fileUrl, duration_seconds: input.durationSeconds, is_active: true }).select().single(); if (error) throw error; return data;
  },
  async createPlaylist(name: string, description = '', status: 'draft' | 'ready' = 'draft') {
    requireConfigured(); const { data, error } = await supabase.from('radio_playlists').insert({ name, description, status }).select().single(); if (error) throw error; return data;
  },
  async updatePlaylist(playlistId: string, input: { name?: string; description?: string; durationSeconds?: number; status?: 'draft' | 'ready' | 'archived' }) {
    requireConfigured();
    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description;
    if (input.durationSeconds !== undefined) patch.duration_seconds = input.durationSeconds;
    if (input.status !== undefined) patch.status = input.status;
    patch.updated_at = new Date().toISOString();
    const { data, error } = await supabase.from('radio_playlists').update(patch).eq('id', playlistId).select().single(); if (error) throw error; return data;
  },
  async addPlaylistItem(playlistId: string, mediaId: string, orderIndex: number) {
    requireConfigured(); const { data, error } = await supabase.from('radio_playlist_items').insert({ playlist_id: playlistId, media_id: mediaId, order_index: orderIndex }).select().single(); if (error) throw error; return data;
  },
  async clearPlaylistItems(playlistId: string) {
    requireConfigured(); const { error } = await supabase.from('radio_playlist_items').delete().eq('playlist_id', playlistId); if (error) throw error;
  },
  async createSponsor(input: { businessName: string; contactName?: string; contactEmail?: string; package: '15s' | '30s' | '60s' | 'sponsorship'; adScript?: string; audioUrl?: string; readsPerShow?: number; directoryListingId?: string }) {
    requireConfigured(); const { data, error } = await supabase.from('radio_sponsors').insert({ business_name: input.businessName, contact_name: input.contactName, contact_email: input.contactEmail, package: input.package, ad_script: input.adScript, audio_url: input.audioUrl, reads_per_show: input.readsPerShow ?? 1, directory_listing_id: input.directoryListingId }).select().single(); if (error) throw error; return data;
  },
};
