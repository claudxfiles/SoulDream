-- Drop existing table and related objects if they exist
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP TABLE IF EXISTS tasks CASCADE;

-- Create tasks table
CREATE TABLE tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed')),
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    due_date DATE,
    tags TEXT[] DEFAULT '{}',
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX tasks_user_id_idx ON tasks(user_id);
CREATE INDEX tasks_status_idx ON tasks(status);
CREATE INDEX tasks_created_at_idx ON tasks(created_at DESC);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own tasks"
    ON tasks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks"
    ON tasks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
    ON tasks FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
    ON tasks FOR DELETE
    USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE tasks IS 'Stores user tasks with status tracking and metadata';

-- Add comments to columns
COMMENT ON COLUMN tasks.id IS 'Unique identifier for the task';
COMMENT ON COLUMN tasks.title IS 'Task title';
COMMENT ON COLUMN tasks.description IS 'Optional detailed description of the task';
COMMENT ON COLUMN tasks.status IS 'Current status of the task (pending, in_progress, completed)';
COMMENT ON COLUMN tasks.priority IS 'Task priority level (low, medium, high)';
COMMENT ON COLUMN tasks.due_date IS 'Optional due date for the task';
COMMENT ON COLUMN tasks.tags IS 'Array of tags associated with the task';
COMMENT ON COLUMN tasks.user_id IS 'Reference to the user who owns this task';
COMMENT ON COLUMN tasks.created_at IS 'Timestamp when the task was created';
COMMENT ON COLUMN tasks.updated_at IS 'Timestamp when the task was last updated'; 