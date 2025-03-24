-- Drop existing tables if they exist
DROP TABLE IF EXISTS workout_exercises;
DROP TABLE IF EXISTS workouts;
DROP TABLE IF EXISTS ai_interactions;

-- Recreate tables with correct structure
CREATE TABLE IF NOT EXISTS workouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    workout_type VARCHAR(50) NOT NULL,
    duration_minutes INTEGER,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    muscle_groups TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workout_exercises (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sets INTEGER NOT NULL,
    reps INTEGER NOT NULL,
    rest_seconds INTEGER,
    order_index INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    query TEXT NOT NULL,
    response TEXT,
    context VARCHAR(50),
    model_used VARCHAR(50),
    tokens_used INTEGER,
    feedback_rating INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_workouts_updated_at ON workouts;
CREATE TRIGGER update_workouts_updated_at
    BEFORE UPDATE ON workouts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workout_exercises_updated_at ON workout_exercises;
CREATE TRIGGER update_workout_exercises_updated_at
    BEFORE UPDATE ON workout_exercises
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_interactions_updated_at ON ai_interactions;
CREATE TRIGGER update_ai_interactions_updated_at
    BEFORE UPDATE ON ai_interactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own workouts" ON workouts;
DROP POLICY IF EXISTS "Users can view their own workouts" ON workouts;
DROP POLICY IF EXISTS "Users can update their own workouts" ON workouts;
DROP POLICY IF EXISTS "Users can delete their own workouts" ON workouts;

DROP POLICY IF EXISTS "Users can insert their own workout exercises" ON workout_exercises;
DROP POLICY IF EXISTS "Users can view their own workout exercises" ON workout_exercises;
DROP POLICY IF EXISTS "Users can update their own workout exercises" ON workout_exercises;
DROP POLICY IF EXISTS "Users can delete their own workout exercises" ON workout_exercises;

DROP POLICY IF EXISTS "Users can insert their own AI interactions" ON ai_interactions;
DROP POLICY IF EXISTS "Users can view their own AI interactions" ON ai_interactions;
DROP POLICY IF EXISTS "Users can update their own AI interactions" ON ai_interactions;

-- Create new policies for workouts
CREATE POLICY "Users can insert their own workouts"
ON workouts FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own workouts"
ON workouts FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own workouts"
ON workouts FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workouts"
ON workouts FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Create new policies for workout exercises
CREATE POLICY "Users can insert their own workout exercises"
ON workout_exercises FOR INSERT 
TO authenticated
WITH CHECK (EXISTS (
    SELECT 1 FROM workouts w 
    WHERE w.id = workout_id 
    AND w.user_id = auth.uid()
));

CREATE POLICY "Users can view their own workout exercises"
ON workout_exercises FOR SELECT 
TO authenticated
USING (EXISTS (
    SELECT 1 FROM workouts w 
    WHERE w.id = workout_id 
    AND w.user_id = auth.uid()
));

CREATE POLICY "Users can update their own workout exercises"
ON workout_exercises FOR UPDATE 
TO authenticated
USING (EXISTS (
    SELECT 1 FROM workouts w 
    WHERE w.id = workout_id 
    AND w.user_id = auth.uid()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM workouts w 
    WHERE w.id = workout_id 
    AND w.user_id = auth.uid()
));

CREATE POLICY "Users can delete their own workout exercises"
ON workout_exercises FOR DELETE 
TO authenticated
USING (EXISTS (
    SELECT 1 FROM workouts w 
    WHERE w.id = workout_id 
    AND w.user_id = auth.uid()
));

-- Create new policies for AI interactions
CREATE POLICY "Users can insert their own AI interactions"
ON ai_interactions FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own AI interactions"
ON ai_interactions FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI interactions"
ON ai_interactions FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id); 