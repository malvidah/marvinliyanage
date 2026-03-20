-- Shared apartment comparison state for Marvin & Reese
CREATE TABLE IF NOT EXISTS apartment_state (
  key TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed initial empty state
INSERT INTO apartment_state (key, data)
VALUES ('shared', '{"favorites": [], "notes": {}, "favoriteOrder": []}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Allow public read/write (this is a private household tool, no auth needed)
ALTER TABLE apartment_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all" ON apartment_state
  FOR ALL USING (true) WITH CHECK (true);
