-- Create the bot_configs table
-- This table stores all WhatsApp bot configurations
-- Columns:
--   business_id: Primary Key, used for lookups
--   slug: Unique human-readable identifier (optional)
--   config: The full JSON configuration object
--   created_at: Timestamp
--   updated_at: Timestamp

CREATE TABLE IF NOT EXISTS bot_configs (
    business_id TEXT PRIMARY KEY,
    slug TEXT UNIQUE,
    config JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on slug for fast lookups
CREATE INDEX IF NOT EXISTS idx_bot_configs_slug ON bot_configs(slug);

-- Create RLS (Row Level Security) Policies if you want to restrict access
-- For now, we'll allow public read/write since the API handles logic
ALTER TABLE bot_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON bot_configs FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON bot_configs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON bot_configs FOR UPDATE USING (true);
