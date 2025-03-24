-- Agregar columna total_completions a la tabla habits
ALTER TABLE habits ADD COLUMN IF NOT EXISTS total_completions INTEGER DEFAULT 0;

-- Comentario para documentación
COMMENT ON COLUMN habits.total_completions IS 'Número total de veces que el hábito ha sido completado';

-- Actualizar registros existentes
UPDATE habits SET total_completions = 0 WHERE total_completions IS NULL; 