-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own AI interactions" ON ai_interactions;
DROP POLICY IF EXISTS "Users can view their own AI interactions" ON ai_interactions;
DROP POLICY IF EXISTS "Users can update their own AI interactions" ON ai_interactions;
DROP POLICY IF EXISTS "Users can insert their own workouts" ON workouts;
DROP POLICY IF EXISTS "Users can view their own workouts" ON workouts;
DROP POLICY IF EXISTS "Users can update their own workouts" ON workouts;

-- Enable RLS
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- AI Interactions policies
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

-- Workouts policies
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