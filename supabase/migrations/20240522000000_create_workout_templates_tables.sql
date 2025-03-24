-- Create workout templates tables
CREATE TABLE IF NOT EXISTS workout_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    workout_type VARCHAR(50) NOT NULL,
    is_public BOOLEAN DEFAULT false,
    estimated_duration_minutes INTEGER,
    muscle_groups TEXT[],
    difficulty_level VARCHAR(50) DEFAULT 'intermediate',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workout_template_exercises (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID REFERENCES workout_templates(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sets INTEGER NOT NULL,
    reps INTEGER NOT NULL,
    weight NUMERIC,
    rest_seconds INTEGER,
    order_index INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_workout_templates_updated_at ON workout_templates;
CREATE TRIGGER update_workout_templates_updated_at
    BEFORE UPDATE ON workout_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workout_template_exercises_updated_at ON workout_template_exercises;
CREATE TRIGGER update_workout_template_exercises_updated_at
    BEFORE UPDATE ON workout_template_exercises
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_template_exercises ENABLE ROW LEVEL SECURITY;

-- Create policies for workout templates
CREATE POLICY "Users can insert their own workout templates"
ON workout_templates FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own or public workout templates"
ON workout_templates FOR SELECT 
TO authenticated
USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can update their own workout templates"
ON workout_templates FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout templates"
ON workout_templates FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Create policies for workout template exercises
CREATE POLICY "Users can insert their own workout template exercises"
ON workout_template_exercises FOR INSERT 
TO authenticated
WITH CHECK (EXISTS (
    SELECT 1 FROM workout_templates t 
    WHERE t.id = template_id 
    AND t.user_id = auth.uid()
));

CREATE POLICY "Users can view template exercises of their own or public templates"
ON workout_template_exercises FOR SELECT 
TO authenticated
USING (EXISTS (
    SELECT 1 FROM workout_templates t 
    WHERE t.id = template_id 
    AND (t.user_id = auth.uid() OR t.is_public = true)
));

CREATE POLICY "Users can update their own workout template exercises"
ON workout_template_exercises FOR UPDATE 
TO authenticated
USING (EXISTS (
    SELECT 1 FROM workout_templates t 
    WHERE t.id = template_id 
    AND t.user_id = auth.uid()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM workout_templates t 
    WHERE t.id = template_id 
    AND t.user_id = auth.uid()
));

CREATE POLICY "Users can delete their own workout template exercises"
ON workout_template_exercises FOR DELETE 
TO authenticated
USING (EXISTS (
    SELECT 1 FROM workout_templates t 
    WHERE t.id = template_id 
    AND t.user_id = auth.uid()
)); 