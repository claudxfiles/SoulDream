-- Create tasks table if not exists
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    due_date DATE,
    due_time TIME,
    duration_minutes INTEGER,
    timezone TEXT DEFAULT 'America/Santiago',
    is_all_day BOOLEAN DEFAULT FALSE,
    event_start_date DATE,
    event_end_date DATE,
    event_start_time TIME,
    event_end_time TIME,
    is_all_day BOOLEAN DEFAULT FALSE,
    event_start_date DATE,
    event_end_date DATE,
    event_start_time TIME,
    event_end_time TIME,
    column_order INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE,
    related_goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
    category TEXT,
    tags TEXT[]
);

-- Create index for faster queries if not exists
CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON tasks(user_id);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;

-- Create policies
CREATE POLICY "Users can view their own tasks"
    ON tasks
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks"
    ON tasks
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
    ON tasks
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
    ON tasks
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Create or replace function for updating the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers and function
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
DROP TRIGGER IF EXISTS sync_event_dates_trigger ON tasks;
DROP FUNCTION IF EXISTS sync_event_dates();

-- Create trigger for event dates synchronization
CREATE OR REPLACE FUNCTION sync_event_dates()
RETURNS TRIGGER AS $$
BEGIN
    -- Copy dates and times without conversion
    IF NEW.due_date IS NOT NULL THEN
        NEW.event_start_date = NEW.due_date;
        NEW.event_end_date = NEW.due_date;
    END IF;
    
    IF NEW.due_time IS NOT NULL THEN
        NEW.event_start_time = NEW.due_time;
        NEW.event_end_time = CASE 
            WHEN NEW.duration_minutes IS NOT NULL THEN NEW.due_time + (NEW.duration_minutes || ' minutes')::interval
            ELSE NEW.due_time
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER sync_event_dates_trigger
    BEFORE INSERT OR UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION sync_event_dates();

-- Add columns if they don't exist and modify existing ones
DO $$ 
BEGIN
    -- Modify due_date to be DATE type if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'due_date') THEN
        ALTER TABLE tasks ALTER COLUMN due_date TYPE DATE USING due_date::DATE;
    ELSE
        ALTER TABLE tasks ADD COLUMN due_date DATE;
    END IF;

    -- Add new columns for events if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'is_all_day') THEN
        ALTER TABLE tasks ADD COLUMN is_all_day BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'event_start_date') THEN
        ALTER TABLE tasks ADD COLUMN event_start_date DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'event_end_date') THEN
        ALTER TABLE tasks ADD COLUMN event_end_date DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'event_start_time') THEN
        ALTER TABLE tasks ADD COLUMN event_start_time TIME;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'event_end_time') THEN
        ALTER TABLE tasks ADD COLUMN event_end_time TIME;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'due_time') THEN
        ALTER TABLE tasks ADD COLUMN due_time TIME;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'duration_minutes') THEN
        ALTER TABLE tasks ADD COLUMN duration_minutes INTEGER;
    END IF;
END $$;

-- Synchronize existing data
UPDATE tasks 
SET 
    event_start_date = due_date,
    event_end_date = due_date,
    event_start_time = due_time,
    event_end_time = CASE 
        WHEN duration_minutes IS NOT NULL THEN due_time + (duration_minutes || ' minutes')::interval
        ELSE due_time
    END
WHERE due_date IS NOT NULL;
