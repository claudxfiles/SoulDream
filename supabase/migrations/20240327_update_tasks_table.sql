-- Drop existing indexes if they exist
DROP INDEX IF EXISTS tasks_user_id_idx;
DROP INDEX IF EXISTS tasks_status_idx;
DROP INDEX IF EXISTS tasks_created_at_idx;

-- Create new indexes
CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON tasks(user_id);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);
CREATE INDEX IF NOT EXISTS tasks_created_at_idx ON tasks(created_at DESC);

-- Update or create constraints
ALTER TABLE tasks 
    DROP CONSTRAINT IF EXISTS tasks_status_check,
    ADD CONSTRAINT tasks_status_check 
        CHECK (status IN ('pending', 'in_progress', 'completed'));

ALTER TABLE tasks 
    DROP CONSTRAINT IF EXISTS tasks_priority_check,
    ADD CONSTRAINT tasks_priority_check 
        CHECK (priority IN ('low', 'medium', 'high'));

-- Ensure RLS is enabled
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;

-- Create or update RLS policies
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

-- Update or create trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update table and column comments
COMMENT ON TABLE tasks IS 'Stores user tasks with status tracking and metadata';
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

-- Agregar la columna category a la tabla tasks
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS category text;

-- Actualizar las políticas RLS para incluir la nueva columna
CREATE POLICY "Users can update their own tasks category"
ON tasks
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Permitir que la columna category sea null
ALTER TABLE tasks
ALTER COLUMN category DROP NOT NULL; 