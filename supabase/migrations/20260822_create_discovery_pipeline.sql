-- Farmers Table Discovery Pipeline
-- Internal discovery inbox: public-source leads are reviewed before promotion to the public directory.

CREATE TABLE IF NOT EXISTS directory_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO directory_categories (name, slug, sort_order) VALUES
('Farmers & Growers', 'farmers-growers', 1),
('Meat & Butchers', 'meat-butchers', 2),
('Milk & Dairy', 'milk-dairy', 3),
('Fruit & Vegetables', 'fruit-vegetables', 4),
('Bakery & Bread', 'bakery-bread', 5),
('Fish & Seafood', 'fish-seafood', 6),
('Eggs & Poultry', 'eggs-poultry', 7),
('Preserves, Pickles & Chutneys', 'preserves-pickles-chutneys', 8),
('Cakes & Confectionery', 'cakes-confectionery', 9),
('Drinks & Breweries', 'drinks-breweries', 10),
('Restaurants & Cafés', 'restaurants-cafes', 11),
('Chefs & Food Professionals', 'chefs-food-professionals', 12),
('Farm Shops & Food Retailers', 'farm-shops-food-retailers', 13),
('Artisan Food Makers', 'artisan-food-makers', 14),
('Local Markets & Food Events', 'local-markets-food-events', 15),
('Community Food Projects', 'community-food-projects', 16),
('Craft Makers & Heritage Businesses', 'craft-makers-heritage-businesses', 17),
('Local Businesses & Services', 'local-businesses-services', 18),
('Community Organisations & Support', 'community-organisations-support', 19),
('Farnham Places, Events & Activities', 'farnham-places-events-activities', 20)
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS discovery_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  location TEXT,
  source_url TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'Other',
  description TEXT,
  confidence NUMERIC(5,2) CHECK (confidence >= 0 AND confidence <= 100),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'approved', 'rejected')),
  notes TEXT,
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS discovery_leads_status_idx ON discovery_leads(status);
CREATE INDEX IF NOT EXISTS discovery_leads_category_idx ON discovery_leads(category);
CREATE INDEX IF NOT EXISTS discovery_leads_source_type_idx ON discovery_leads(source_type);
CREATE INDEX IF NOT EXISTS discovery_leads_created_at_idx ON discovery_leads(created_at DESC);

ALTER TABLE directory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active directory categories" ON directory_categories;
CREATE POLICY "Public can view active directory categories"
ON directory_categories FOR SELECT
USING (active = TRUE);

DROP POLICY IF EXISTS "Founder can manage directory categories" ON directory_categories;
CREATE POLICY "Founder can manage directory categories"
ON directory_categories FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('founder', 'staff')))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('founder', 'staff')));

DROP POLICY IF EXISTS "Staff can manage discovery leads" ON discovery_leads;
CREATE POLICY "Staff can manage discovery leads"
ON discovery_leads FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('founder', 'staff')))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('founder', 'staff')));

CREATE OR REPLACE FUNCTION update_discovery_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS discovery_leads_updated_at ON discovery_leads;
CREATE TRIGGER discovery_leads_updated_at
BEFORE UPDATE ON discovery_leads
FOR EACH ROW EXECUTE FUNCTION update_discovery_leads_updated_at();
