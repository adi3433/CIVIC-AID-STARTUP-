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

-- Create active_chats table for session management
-- This stores which bot a phone number is currently talking to
CREATE TABLE IF NOT EXISTS active_chats (
    phone_number TEXT PRIMARY KEY,
    business_id TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for active_chats
ALTER TABLE active_chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active_chats" ON active_chats FOR SELECT USING (true);
CREATE POLICY "Public insert active_chats" ON active_chats FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update active_chats" ON active_chats FOR UPDATE USING (true);
