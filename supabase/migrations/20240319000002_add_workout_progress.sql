-- Create workout progress table
CREATE TABLE IF NOT EXISTS workout_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    exercise_name VARCHAR(255) NOT NULL,
    max_weight DECIMAL(10,2),
    max_reps INTEGER,
    total_volume DECIMAL(10,2),
    last_performed TIMESTAMP WITH TIME ZONE,
    best_set JSON,
    progress_history JSON[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, exercise_name)
);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_workout_progress_updated_at ON workout_progress;
CREATE TRIGGER update_workout_progress_updated_at
    BEFORE UPDATE ON workout_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE workout_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for workout progress
CREATE POLICY "Users can insert their own workout progress"
ON workout_progress FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own workout progress"
ON workout_progress FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout progress"
ON workout_progress FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout progress"
ON workout_progress FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_workout_progress_user_exercise ON workout_progress(user_id, exercise_name);
CREATE INDEX idx_workout_progress_last_performed ON workout_progress(last_performed);

-- Function to update or create workout progress
CREATE OR REPLACE FUNCTION update_workout_progress(
    p_user_id UUID,
    p_exercise_name VARCHAR,
    p_weight DECIMAL,
    p_reps INTEGER,
    p_date TIMESTAMP WITH TIME ZONE
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_volume DECIMAL;
    v_progress_entry JSON;
BEGIN
    -- Calculate volume for this set
    v_total_volume := p_weight * p_reps;
    
    -- Create progress entry
    v_progress_entry := json_build_object(
        'date', p_date,
        'weight', p_weight,
        'reps', p_reps,
        'volume', v_total_volume
    );

    -- Insert or update progress
    INSERT INTO workout_progress (
        user_id,
        exercise_name,
        max_weight,
        max_reps,
        total_volume,
        last_performed,
        best_set,
        progress_history
    )
    VALUES (
        p_user_id,
        p_exercise_name,
        p_weight,
        p_reps,
        v_total_volume,
        p_date,
        v_progress_entry,
        ARRAY[v_progress_entry]::json[]
    )
    ON CONFLICT (user_id, exercise_name)
    DO UPDATE SET
        max_weight = GREATEST(workout_progress.max_weight, p_weight),
        max_reps = GREATEST(workout_progress.max_reps, p_reps),
        total_volume = workout_progress.total_volume + v_total_volume,
        last_performed = p_date,
        best_set = CASE 
            WHEN (p_weight * p_reps) > (COALESCE((workout_progress.best_set->>'weight')::decimal, 0) * COALESCE((workout_progress.best_set->>'reps')::integer, 0))
            THEN v_progress_entry
            ELSE workout_progress.best_set
        END,
        progress_history = array_append(workout_progress.progress_history, v_progress_entry);
END;
$$; 