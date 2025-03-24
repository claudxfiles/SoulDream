-- Añadir la columna muscle_group a la tabla workout_template_exercises
ALTER TABLE workout_template_exercises ADD COLUMN muscle_group TEXT;

-- Crear un índice para mejorar las búsquedas por grupo muscular
CREATE INDEX idx_workout_template_exercises_muscle_group ON workout_template_exercises (muscle_group);

-- Añadir un comentario para documentar el propósito de la columna
COMMENT ON COLUMN workout_template_exercises.muscle_group IS 'Grupo muscular principal que trabaja este ejercicio'; 