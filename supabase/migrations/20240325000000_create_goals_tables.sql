-- Drop existing tables if they exist
DROP TABLE IF EXISTS goal_subtasks CASCADE;
DROP TABLE IF EXISTS goal_updates CASCADE;
DROP TABLE IF EXISTS goals CASCADE;

-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    target_value NUMERIC,
    current_value NUMERIC DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    target_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    progress_type VARCHAR(20) NOT NULL CHECK (progress_type IN ('numeric', 'percentage', 'boolean')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create goal_updates table for tracking progress history
CREATE TABLE IF NOT EXISTS goal_updates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
    previous_value NUMERIC,
    new_value NUMERIC,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create goal_subtasks table
CREATE TABLE IF NOT EXISTS goal_subtasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_category ON goals(category);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_goal_updates_goal_id ON goal_updates(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_subtasks_goal_id ON goal_subtasks(goal_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_goals_updated_at
    BEFORE UPDATE ON goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goal_subtasks_updated_at
    BEFORE UPDATE ON goal_subtasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_subtasks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own goals"
    ON goals FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals"
    ON goals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
    ON goals FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals"
    ON goals FOR DELETE
    USING (auth.uid() = user_id);

-- Similar policies for goal_updates and goal_subtasks
CREATE POLICY "Users can view their goal updates"
    ON goal_updates FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM goals
        WHERE goals.id = goal_updates.goal_id
        AND goals.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert goal updates"
    ON goal_updates FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM goals
        WHERE goals.id = goal_updates.goal_id
        AND goals.user_id = auth.uid()
    ));

CREATE POLICY "Users can view their goal subtasks"
    ON goal_subtasks FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM goals
        WHERE goals.id = goal_subtasks.goal_id
        AND goals.user_id = auth.uid()
    ));

CREATE POLICY "Users can manage their goal subtasks"
    ON goal_subtasks FOR ALL
    USING (EXISTS (
        SELECT 1 FROM goals
        WHERE goals.id = goal_subtasks.goal_id
        AND goals.user_id = auth.uid()
    )); 