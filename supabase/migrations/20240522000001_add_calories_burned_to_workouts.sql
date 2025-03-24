-- Add calories_burned column to workouts table
ALTER TABLE workouts
ADD COLUMN IF NOT EXISTS calories_burned INTEGER; 