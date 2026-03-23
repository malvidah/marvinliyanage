-- ============================================================
-- RUN THIS IN SUPABASE SQL EDITOR (supabase.com → SQL Editor)
-- ============================================================

-- 1. Listings table — stores all apartment listings (seed + custom)
CREATE TABLE IF NOT EXISTS apartment_listings (
  id          TEXT PRIMARY KEY,
  data        JSONB NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE apartment_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow all on listings" ON apartment_listings
  FOR ALL USING (true) WITH CHECK (true);

-- 2. Drop photos from shared state (they'll live in Storage now)
--    The app will stop writing photos into apartment_state automatically.
--    This just cleans up the column if needed:
UPDATE apartment_state
SET data = data - 'photos',
    updated_at = now()
WHERE key = 'shared'
  AND data ? 'photos';

-- 3. Storage bucket for photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'apartment-photos',
  'apartment-photos',
  true,
  5242880, -- 5MB max per photo
  ARRAY['image/jpeg','image/jpg','image/png','image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 4. Storage policy — allow all reads and writes
CREATE POLICY "allow all on photos" ON storage.objects
  FOR ALL
  USING (bucket_id = 'apartment-photos')
  WITH CHECK (bucket_id = 'apartment-photos');
