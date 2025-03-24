-- Añadir columna de grupos musculares a la tabla de entrenamientos solo si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'workouts' AND column_name = 'muscle_groups'
    ) THEN
        ALTER TABLE workouts 
        ADD COLUMN muscle_groups TEXT[] DEFAULT '{}';
        
        -- Comentario para la nueva columna
        COMMENT ON COLUMN workouts.muscle_groups IS 'Array de grupos musculares trabajados en el entrenamiento';
        
        -- Añadir índice para mejorar el rendimiento de búsquedas por grupo muscular
        CREATE INDEX IF NOT EXISTS idx_workouts_muscle_groups ON workouts USING GIN (muscle_groups);
    END IF;
END $$;

-- Trigger function para detectar cambios en los grupos musculares
CREATE OR REPLACE FUNCTION trigger_workout_muscle_groups_changed()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para la columna muscle_groups si no existe
DROP TRIGGER IF EXISTS workout_muscle_groups_changed ON workouts;
CREATE TRIGGER workout_muscle_groups_changed
BEFORE UPDATE OF muscle_groups ON workouts
FOR EACH ROW
EXECUTE FUNCTION trigger_workout_muscle_groups_changed(); 