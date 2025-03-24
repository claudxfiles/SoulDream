-- Agregar columna goal_value a la tabla habits
ALTER TABLE habits ADD COLUMN IF NOT EXISTS goal_value INTEGER DEFAULT 1;

-- Comentario para documentación
COMMENT ON COLUMN habits.goal_value IS 'Valor numérico objetivo para el hábito (por ejemplo, 10 flexiones)';

-- Actualizar registros existentes
UPDATE habits SET goal_value = 1 WHERE goal_value IS NULL; 