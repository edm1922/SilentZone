-- Add platform_settings and mute_rules columns to filter_profiles table
ALTER TABLE filter_profiles 
ADD COLUMN IF NOT EXISTS platform_settings JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS mute_rules TEXT[] DEFAULT '{}'::text[];
