-- Add outreach tracking columns to directory_listings
-- Run in Supabase: Dashboard → SQL Editor

ALTER TABLE directory_listings
ADD COLUMN IF NOT EXISTS outreach_status TEXT DEFAULT 'not_contacted',
ADD COLUMN IF NOT EXISTS outreach_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS response TEXT,
ADD COLUMN IF NOT EXISTS claimed BOOLEAN DEFAULT FALSE;
