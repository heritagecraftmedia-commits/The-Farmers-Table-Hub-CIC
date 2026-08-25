-- Farmers Table Radio V2
-- Align the live database schema with the staff radio service and dashboard.
-- This is safe to run after radio_v1 has already been applied.

alter table if exists radio_media rename column category to media_type;
alter table if exists radio_media rename column file_url to audio_url;
alter table if exists radio_playlist_items rename column order_index to position;

alter table if exists radio_media drop constraint if exists radio_media_category_check;
alter table if exists radio_media drop constraint if exists radio_media_media_type_check;
alter table if exists radio_media add constraint radio_media_media_type_check
  check (media_type in ('music','jingle','community','advert','interview','feature'));

create index if not exists radio_media_type_idx on radio_media(media_type);
create index if not exists radio_media_active_idx on radio_media(is_active);

-- Keep playlist ordering stable for the staff dashboard.
create unique index if not exists radio_playlist_items_playlist_position_idx
  on radio_playlist_items(playlist_id, position);
