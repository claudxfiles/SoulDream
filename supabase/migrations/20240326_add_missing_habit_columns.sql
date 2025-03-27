-- Agregar columnas faltantes a la tabla habits si no existen
DO $$ 
BEGIN
    -- Agregar columna cue
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'habits' 
        AND column_name = 'cue'
    ) THEN
        ALTER TABLE habits ADD COLUMN cue TEXT;
        COMMENT ON COLUMN habits.cue IS 'La señal o disparador que inicia el hábito';
    END IF;

    -- Agregar columna reward
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'habits' 
        AND column_name = 'reward'
    ) THEN
        ALTER TABLE habits ADD COLUMN reward TEXT;
        COMMENT ON COLUMN habits.reward IS 'La recompensa asociada al completar el hábito';
    END IF;

    -- Agregar columna reminder_time
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'habits' 
        AND column_name = 'reminder_time'
    ) THEN
        ALTER TABLE habits ADD COLUMN reminder_time TEXT;
        COMMENT ON COLUMN habits.reminder_time IS 'Hora del día para el recordatorio (formato HH:MM)';
    END IF;

    -- Agregar columna specific_days si no existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'habits' 
        AND column_name = 'specific_days'
    ) THEN
        ALTER TABLE habits ADD COLUMN specific_days INTEGER[];
        COMMENT ON COLUMN habits.specific_days IS 'Días específicos para hábitos semanales [0-6] donde 0 es lunes';
    END IF;

    -- Agregar columna goal_value si no existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'habits' 
        AND column_name = 'goal_value'
    ) THEN
        ALTER TABLE habits ADD COLUMN goal_value INTEGER DEFAULT 1;
        COMMENT ON COLUMN habits.goal_value IS 'Valor objetivo para el hábito (ej: 10 flexiones)';
    END IF;

    -- Agregar columna total_completions si no existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'habits' 
        AND column_name = 'total_completions'
    ) THEN
        ALTER TABLE habits ADD COLUMN total_completions INTEGER DEFAULT 0;
        COMMENT ON COLUMN habits.total_completions IS 'Número total de veces que se ha completado el hábito';
    END IF;

    -- Agregar columna related_goal_id si no existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'habits' 
        AND column_name = 'related_goal_id'
    ) THEN
        ALTER TABLE habits ADD COLUMN related_goal_id UUID;
        COMMENT ON COLUMN habits.related_goal_id IS 'ID de la meta relacionada con este hábito';
    END IF;
END $$; 