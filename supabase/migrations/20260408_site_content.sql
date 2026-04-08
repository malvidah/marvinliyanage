-- Site entries: projects + experience (all editable from the frontend)
CREATE TABLE IF NOT EXISTS site_entries (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  org TEXT NOT NULL,
  date TEXT NOT NULL,
  url TEXT,
  github TEXT,
  role TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'past',
  gradient TEXT NOT NULL DEFAULT 'gradient-card-1',
  description TEXT NOT NULL DEFAULT '',
  highlight TEXT,
  entry_type TEXT NOT NULL DEFAULT 'role',
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- About section text blocks
CREATE TABLE IF NOT EXISTS site_about (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Storage bucket for project images
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-images', 'site-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: public read, service-role write
ALTER TABLE site_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_about ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read site_entries" ON site_entries
  FOR SELECT USING (true);

CREATE POLICY "Public read site_about" ON site_about
  FOR SELECT USING (true);

-- Storage policy: public read
CREATE POLICY "Public read site-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'site-images');

CREATE POLICY "Authenticated upload site-images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'site-images');

CREATE POLICY "Authenticated update site-images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'site-images');
