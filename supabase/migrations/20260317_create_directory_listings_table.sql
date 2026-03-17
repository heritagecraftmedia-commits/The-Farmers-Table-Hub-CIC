-- Step 1 of 2: Create directory_listings table structure
-- Run this first, confirm it succeeds, then run the seed file.

CREATE TABLE IF NOT EXISTS directory_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  location TEXT,
  contact_email TEXT,
  website TEXT,
  phone TEXT,
  status TEXT DEFAULT 'active',
  tier TEXT DEFAULT 'free',
  description TEXT,
  outreach_status TEXT DEFAULT 'not_contacted',
  outreach_date TIMESTAMP,
  response TEXT,
  claimed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE directory_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active listings"
ON directory_listings FOR SELECT
USING (status = 'active');

CREATE POLICY "Founder can do everything"
ON directory_listings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'founder'
  )
);
