-- radio_events table — used by /community-radio page (This Week section)
-- Run this in Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS radio_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  type text NOT NULL DEFAULT 'Event' CHECK (type IN ('Gig', 'Market', 'Pop-Up', 'Event')),
  date timestamptz NOT NULL,
  venue text NOT NULL,
  description text,
  image_url text,
  featured_artist text,
  link text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE radio_events ENABLE ROW LEVEL SECURITY;

-- Anyone can read published events
CREATE POLICY "Public can read radio events"
  ON radio_events FOR SELECT
  USING (true);

-- Only founder can insert/update/delete
CREATE POLICY "Founder can manage radio events"
  ON radio_events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role') = 'founder'
    )
  );

-- REMOVED — demo seed row.
--
-- This file previously inserted a fictional event ('Farnham Artisan
-- Market', featured artist 'The Hop Garden Trio') to test the
-- /community-radio page. It is invented content and must never reach a
-- production database. The INSERT is removed here so new environments
-- never create it; 20260830_remove_demo_radio_event.sql deletes the row
-- from environments that already applied this file.
--
-- The radio_events TABLE itself is real and still used by the
-- /community-radio "This Week" section — only the seed row is gone.
