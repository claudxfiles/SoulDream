-- Add missing columns to workout_exercises table
ALTER TABLE workout_exercises
ADD COLUMN IF NOT EXISTS weight DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS distance DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS units VARCHAR(50);

-- Add comment for the new columns
COMMENT ON COLUMN workout_exercises.weight IS 'Weight used for the exercise (in kg/lbs)';
COMMENT ON COLUMN workout_exercises.duration_seconds IS 'Duration of the exercise in seconds';
COMMENT ON COLUMN workout_exercises.distance IS 'Distance covered in the exercise';
COMMENT ON COLUMN workout_exercises.units IS 'Units for weight/distance (kg, lbs, km, mi, etc)'; 