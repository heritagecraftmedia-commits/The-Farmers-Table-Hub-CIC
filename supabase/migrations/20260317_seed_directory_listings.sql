-- Seed: 3 real-looking Surrey/Hampshire directory listings
-- Run this in Supabase: Dashboard → SQL Editor → paste and run

-- Create applications table (required by /apply form)
CREATE TABLE IF NOT EXISTS applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  business_name text,
  type text NOT NULL CHECK (type IN ('Grower', 'Beekeeper', 'Maker', 'Other')),
  description text,
  location text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit an application (insert only)
CREATE POLICY "Anyone can submit application"
  ON applications FOR INSERT
  WITH CHECK (true);

-- Only founder can read applications
CREATE POLICY "Founder can read applications"
  ON applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role') = 'founder'
    )
  );

-- Seed 3 directory listings
INSERT INTO directory_listings
  (id, vendor_name, craft_category, display_category, location, bio,
   website, email, phone, social_links, listing_tier, approved, published, claimed_at)
VALUES
  (
    gen_random_uuid(),
    'Alton Honey Farm',
    'Artisan Honey',
    'Makers & Bakers',
    'Alton, Hampshire',
    'Family-run apiary in the Hampshire countryside producing raw, unfiltered honey from wildflower meadows. Established in 1987.',
    'altonhoneyfarm.co.uk',
    'hello@altonhoneyfarm.co.uk',
    '01420 123456',
    '{"instagram": "altonhoneyfarm"}',
    'featured',
    true,
    true,
    now()
  ),
  (
    gen_random_uuid(),
    'Surrey Hills Cheesemakers',
    'Artisan Cheese',
    'Milk & Dairy',
    'Shere, Surrey',
    'Small-batch soft and aged cheeses made from local Jersey milk. Available at Farnham Farmers Market every second Saturday.',
    'surreyhillscheese.co.uk',
    '',
    '',
    '{}',
    'supporter',
    true,
    true,
    now()
  ),
  (
    gen_random_uuid(),
    'The Farnham Herb Garden',
    'Herbs & Plants',
    'Fruit & Veg',
    'Farnham, Surrey',
    'Organic herb grower supplying restaurants and home cooks across East Hampshire. Lavender, rosemary, thyme and seasonal specials.',
    '',
    '',
    '',
    '{}',
    'free',
    true,
    true,
    now()
  );
