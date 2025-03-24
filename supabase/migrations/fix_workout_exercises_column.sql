-- Fix the column name in the workout_exercises table (change workoutid to workout_id)
ALTER TABLE IF EXISTS workout_exercises RENAME COLUMN workoutid TO workout_id;

-- Log the change
DO $$
BEGIN
  INSERT INTO public.migrations_log (migration_name, description, executed_at)
  VALUES ('fix_workout_exercises_column', 'Renamed workout_exercises.workoutid to workout_exercises.workout_id to match snake_case convention', NOW());
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
  VALUES ('fix_workout_exercises_column', 'Renamed workout_exercises.workoutid to workout_exercises.workout_id to match snake_case convention', NOW());
END $$; 