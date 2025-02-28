-- Add is_archived flag to pages table
ALTER TABLE pages ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- Create index for faster querying of archived pages
CREATE INDEX IF NOT EXISTS idx_pages_is_archived ON pages(is_archived); 