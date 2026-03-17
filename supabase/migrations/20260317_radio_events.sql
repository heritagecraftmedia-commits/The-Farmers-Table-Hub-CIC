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

-- Optional: seed a sample event to test the page
INSERT INTO radio_events (title, type, date, venue, description, featured_artist)
VALUES (
  'Farnham Artisan Market',
  'Market',
  now() + interval '7 days',
  'Farnham Town Centre',
  'Monthly gathering of local makers, bakers, and food producers. Live music from 12pm.',
  'The Hop Garden Trio'
);
