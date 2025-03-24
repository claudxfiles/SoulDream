-- Añadir una columna de muscle_group a la tabla workout_template_exercises
ALTER TABLE IF EXISTS workout_template_exercises ADD COLUMN muscle_group TEXT;

-- Crear un índice para mejorar las búsquedas por grupo muscular
CREATE INDEX IF NOT EXISTS idx_workout_template_exercises_muscle_group ON workout_template_exercises (muscle_group);

-- Registrar esta migración en el historial de versiones
INSERT INTO schema_migrations (version, name, applied_at)
VALUES ('20250422000000', 'add_muscle_group_to_workout_template_exercises', NOW());

COMMENT ON COLUMN workout_template_exercises.muscle_group IS 'Grupo muscular principal que trabaja este ejercicio'; 