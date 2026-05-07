-- SQL Updates for Habitat Tracker Pro Evolution

-- Add category and color columns to habits table
ALTER TABLE habits ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';
ALTER TABLE habits ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#8b5cf6';

-- (Optional) Add index for faster filtering
CREATE INDEX IF NOT EXISTS idx_habits_category ON habits(category);
