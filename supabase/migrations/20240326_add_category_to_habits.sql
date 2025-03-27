-- Agregar columna category a la tabla habits si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'habits' 
        AND column_name = 'category'
    ) THEN
        ALTER TABLE habits ADD COLUMN category TEXT;
    END IF;
END $$;

-- Agregar un índice para mejorar el rendimiento de las consultas que filtran por categoría
CREATE INDEX IF NOT EXISTS idx_habits_category ON habits(category);

-- Comentario para documentación
COMMENT ON COLUMN habits.category IS 'Categoría del hábito (ej: salud, productividad, aprendizaje, etc.)'; 