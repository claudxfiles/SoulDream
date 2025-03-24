-- Fix the column name in the goals table (change userid to user_id)
ALTER TABLE IF EXISTS goals RENAME COLUMN userid TO user_id;

-- Log the change
DO $$
BEGIN
  INSERT INTO public.migrations_log (migration_name, description, executed_at)
  VALUES ('fix_goals_userid_column', 'Renamed goals.userid to goals.user_id to match snake_case convention', NOW());
EXCEPTION WHEN undefined_table THEN
  -- Table doesn't exist, create it first
  CREATE TABLE IF NOT EXISTS public.migrations_log (
    id SERIAL PRIMARY KEY,
    migration_name TEXT NOT NULL,
    description TEXT,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Then insert the record
  INSERT INTO public.migrations_log (migration_name, description, executed_at)
  VALUES ('fix_goals_userid_column', 'Renamed goals.userid to goals.user_id to match snake_case convention', NOW());
END $$;
