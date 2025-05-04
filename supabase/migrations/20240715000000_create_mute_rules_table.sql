-- Create mute_rules table
CREATE TABLE IF NOT EXISTS mute_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  keywords TEXT[] NOT NULL,
  platforms JSONB NOT NULL,
  start_time BIGINT NOT NULL,
  duration_ms BIGINT NOT NULL,
  use_regex BOOLEAN DEFAULT FALSE,
  case_sensitive BOOLEAN DEFAULT FALSE,
  match_whole_word BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS mute_rules_user_id_idx ON mute_rules(user_id);

-- Set up Row Level Security (RLS)
ALTER TABLE mute_rules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own mute rules"
  ON mute_rules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mute rules"
  ON mute_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mute rules"
  ON mute_rules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mute rules"
  ON mute_rules FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_mute_rules_updated_at
BEFORE UPDATE ON mute_rules
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create filter_profiles table
CREATE TABLE IF NOT EXISTS filter_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS filter_profiles_user_id_idx ON filter_profiles(user_id);

-- Set up Row Level Security (RLS)
ALTER TABLE filter_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own filter profiles"
  ON filter_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own filter profiles"
  ON filter_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own filter profiles"
  ON filter_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own filter profiles"
  ON filter_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_filter_profiles_updated_at
BEFORE UPDATE ON filter_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'system',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  sync_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Set up Row Level Security (RLS)
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON user_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
