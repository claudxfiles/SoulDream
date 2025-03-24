-- Este script crea la tabla 'exercise_templates' para almacenar plantillas de ejercicios
-- Se ejecuta directamente en Supabase SQL Editor

-- Crear la tabla exercise_templates
CREATE TABLE IF NOT EXISTS exercise_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  muscle_group TEXT NOT NULL, -- Valores de MuscleGroup enum
  exercise_type TEXT NOT NULL, -- Valores de ExerciseType enum
  difficulty_level TEXT, -- Valores de DifficultyLevel enum
  default_sets INTEGER DEFAULT 3,
  default_reps INTEGER DEFAULT 10,
  default_weight NUMERIC,
  default_duration_seconds INTEGER,
  rest_seconds INTEGER DEFAULT 60,
  instructions TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Comentarios para documentación de la tabla
COMMENT ON TABLE exercise_templates IS 'Plantillas de ejercicios que pueden ser utilizados en workouts';
COMMENT ON COLUMN exercise_templates.muscle_group IS 'Grupo muscular principal (abs, biceps, chest, etc.)';
COMMENT ON COLUMN exercise_templates.exercise_type IS 'Tipo de ejercicio (strength, cardio, flexibility, etc.)';
COMMENT ON COLUMN exercise_templates.difficulty_level IS 'Nivel de dificultad (beginner, intermediate, advanced)';

-- Política RLS para que solo el propietario pueda editar sus propias plantillas privadas, pero todos pueden ver las públicas
ALTER TABLE exercise_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver plantillas públicas"
  ON exercise_templates FOR SELECT
  USING (is_public OR auth.uid() = user_id);

CREATE POLICY "Usuarios pueden crear plantillas"
  ON exercise_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propias plantillas"
  ON exercise_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propias plantillas"
  ON exercise_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para actualizar 'updated_at' automáticamente
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_exercise_templates_updated_at
BEFORE UPDATE ON exercise_templates
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Insertar algunas plantillas de ejemplo para empezar
INSERT INTO exercise_templates (name, description, muscle_group, exercise_type, difficulty_level, default_sets, default_reps, instructions)
VALUES 
  ('Press de Banca', 'Ejercicio fundamental para pecho', 'chest', 'strength', 'intermediate', 4, 8, 'Acuéstate en un banco, baja la barra hasta el pecho y empuja hacia arriba'),
  ('Sentadillas', 'El rey de los ejercicios para piernas', 'quadriceps', 'compound', 'intermediate', 4, 10, 'Mantén la espalda recta, dobla las rodillas y baja como si te sentaras'),
  ('Peso Muerto', 'Excelente para espalda baja y posterior', 'back', 'compound', 'advanced', 3, 6, 'Mantén la barra cerca del cuerpo, empuja con las piernas y mantén la espalda neutral'),
  ('Curl de Bíceps', 'Aislamiento para bíceps', 'biceps', 'isolation', 'beginner', 3, 12, 'Mantén los codos pegados al cuerpo y levanta las pesas'),
  ('Fondos de Tríceps', 'Gran ejercicio para tríceps', 'triceps', 'bodyweight', 'intermediate', 3, 10, 'Apóyate en barras paralelas, baja el cuerpo y empuja hacia arriba'),
  ('Pull-ups', 'Dominadas para espalda y bíceps', 'back', 'bodyweight', 'intermediate', 3, 8, 'Agarra la barra con las palmas hacia afuera y levanta el cuerpo'),
  ('Plancha', 'Ejercicio de resistencia para core', 'abs', 'bodyweight', 'beginner', 3, null, 'Mantén la posición con el cuerpo recto y apoyado en antebrazos y pies');
