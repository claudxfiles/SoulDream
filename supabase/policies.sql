-- Habilitar RLS en las tablas
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE workout_template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_templates ENABLE ROW LEVEL SECURITY;

-- Políticas para la tabla workouts
CREATE POLICY "Usuarios pueden ver sus propios entrenamientos"
ON workouts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden crear sus propios entrenamientos"
ON workouts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propios entrenamientos"
ON workouts FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propios entrenamientos"
ON workouts FOR DELETE
USING (auth.uid() = user_id);

-- Políticas para la tabla workout_exercises
CREATE POLICY "Usuarios pueden ver ejercicios de sus entrenamientos"
ON workout_exercises FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workouts
    WHERE workouts.id = workout_exercises.workout_id
    AND workouts.user_id = auth.uid()
  )
);

CREATE POLICY "Usuarios pueden crear ejercicios para sus entrenamientos"
ON workout_exercises FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workouts
    WHERE workouts.id = workout_exercises.workout_id
    AND workouts.user_id = auth.uid()
  )
);

CREATE POLICY "Usuarios pueden actualizar ejercicios de sus entrenamientos"
ON workout_exercises FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM workouts
    WHERE workouts.id = workout_exercises.workout_id
    AND workouts.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workouts
    WHERE workouts.id = workout_exercises.workout_id
    AND workouts.user_id = auth.uid()
  )
);

CREATE POLICY "Usuarios pueden eliminar ejercicios de sus entrenamientos"
ON workout_exercises FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM workouts
    WHERE workouts.id = workout_exercises.workout_id
    AND workouts.user_id = auth.uid()
  )
);

-- Políticas para las plantillas de ejercicios (lectura pública)
CREATE POLICY "Todos pueden ver las plantillas de ejercicios"
ON exercise_templates FOR SELECT
USING (true); 