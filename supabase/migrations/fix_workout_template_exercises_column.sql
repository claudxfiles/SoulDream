-- Fix the column name in the workout_template_exercises table (change templateid to template_id)
ALTER TABLE IF EXISTS workout_template_exercises RENAME COLUMN templateid TO template_id;

-- Log the change
DO $$
BEGIN
  INSERT INTO public.migrations_log (migration_name, description, executed_at)
  VALUES ('fix_workout_template_exercises_column', 'Renamed workout_template_exercises.templateid to workout_template_exercises.template_id to match snake_case convention', NOW());
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
  VALUES ('fix_workout_template_exercises_column', 'Renamed workout_template_exercises.templateid to workout_template_exercises.template_id to match snake_case convention', NOW());
END $$; 