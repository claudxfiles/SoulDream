-- Agregar columna is_active a la tabla habits si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'habits' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE habits ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- Asegurar que todos los registros existentes tengan un valor para is_active
UPDATE habits SET is_active = TRUE WHERE is_active IS NULL;

-- Agregar un índice para mejorar el rendimiento de las consultas que filtran por is_active
CREATE INDEX IF NOT EXISTS idx_habits_is_active ON habits(is_active);

-- Comentario para documentación
COMMENT ON COLUMN habits.is_active IS 'Indica si el hábito está activo o ha sido eliminado (soft delete)'; 