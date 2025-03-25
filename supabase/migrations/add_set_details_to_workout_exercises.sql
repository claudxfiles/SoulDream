-- Añadir columna set_details como JSONB para almacenar los detalles de cada set
ALTER TABLE workout_exercises
ADD COLUMN IF NOT EXISTS set_details JSONB;

-- Actualizar la política RLS para incluir la nueva columna
ALTER POLICY "Users can insert their own workout exercises" ON workout_exercises
    USING (workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid()));

-- Comentario para documentar el cambio
COMMENT ON COLUMN workout_exercises.set_details IS 'Detalles de cada set del ejercicio en formato JSON, incluyendo peso, repeticiones y estado de completado'; 