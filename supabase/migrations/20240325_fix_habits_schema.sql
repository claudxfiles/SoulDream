-- Verificar si la columna best_streak existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'habits' 
        AND column_name = 'best_streak'
    ) THEN
        -- Agregar la columna best_streak si no existe
        ALTER TABLE habits ADD COLUMN best_streak INTEGER DEFAULT 0;
    END IF;
END $$;

-- Verificar si la columna current_streak existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'habits' 
        AND column_name = 'current_streak'
    ) THEN
        -- Agregar la columna current_streak si no existe
        ALTER TABLE habits ADD COLUMN current_streak INTEGER DEFAULT 0;
    END IF;
END $$;

-- Verificar si la columna total_completions existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'habits' 
        AND column_name = 'total_completions'
    ) THEN
        -- Agregar la columna total_completions si no existe
        ALTER TABLE habits ADD COLUMN total_completions INTEGER DEFAULT 0;
    END IF;
END $$;

-- Fix habits and habit_logs tables structure
-- Drop current_streak column from habit_logs if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'habit_logs' 
        AND column_name = 'current_streak'
    ) THEN
        ALTER TABLE habit_logs DROP COLUMN current_streak;
    END IF;
END $$;

-- Ensure habits table has the correct columns
DO $$ 
BEGIN
    -- Add current_streak if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'habits' 
        AND column_name = 'current_streak'
    ) THEN
        ALTER TABLE habits ADD COLUMN current_streak integer DEFAULT 0;
    END IF;

    -- Add best_streak if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'habits' 
        AND column_name = 'best_streak'
    ) THEN
        ALTER TABLE habits ADD COLUMN best_streak integer DEFAULT 0;
    END IF;

    -- Add total_completions if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'habits' 
        AND column_name = 'total_completions'
    ) THEN
        ALTER TABLE habits ADD COLUMN total_completions integer DEFAULT 0;
    END IF;
END $$;

-- Create or replace function to update streaks
CREATE OR REPLACE FUNCTION update_habit_streaks()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the habit's streaks
    UPDATE habits h
    SET 
        current_streak = (
            SELECT COUNT(*)
            FROM habit_logs hl
            WHERE hl.habit_id = h.id
            AND hl.completed_date >= CURRENT_DATE - interval '1 day'
            GROUP BY h.id
        ),
        best_streak = GREATEST(
            (SELECT COUNT(*)
            FROM habit_logs hl
            WHERE hl.habit_id = h.id
            AND hl.completed_date >= CURRENT_DATE - interval '1 day'
            GROUP BY h.id),
            best_streak
        ),
        total_completions = (
            SELECT COUNT(*)
            FROM habit_logs hl
            WHERE hl.habit_id = h.id
            GROUP BY h.id
        )
    WHERE h.id = NEW.habit_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for habit_logs
DROP TRIGGER IF EXISTS update_habit_streaks_trigger ON habit_logs;
CREATE TRIGGER update_habit_streaks_trigger
AFTER INSERT OR UPDATE OR DELETE ON habit_logs
FOR EACH ROW
EXECUTE FUNCTION update_habit_streaks(); 