-- Fix the column name in the goal_steps table (change goalid to goal_id)
ALTER TABLE IF EXISTS goal_steps RENAME COLUMN goalid TO goal_id;

-- Log the change
DO $$
BEGIN
  INSERT INTO public.migrations_log (migration_name, description, executed_at)
  VALUES ('fix_goal_steps_column', 'Renamed goal_steps.goalid to goal_steps.goal_id to match snake_case convention', NOW());
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
  VALUES ('fix_goal_steps_column', 'Renamed goal_steps.goalid to goal_steps.goal_id to match snake_case convention', NOW());
END $$; 