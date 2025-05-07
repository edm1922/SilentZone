-- Add is_default column to filter_profiles table
CREATE OR REPLACE FUNCTION add_is_default_column()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the column already exists
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'filter_profiles'
    AND column_name = 'is_default'
  ) THEN
    -- Add the column
    ALTER TABLE filter_profiles ADD COLUMN is_default BOOLEAN DEFAULT false;
  END IF;
END;
$$;
