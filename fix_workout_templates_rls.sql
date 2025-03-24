-- Actualizar políticas RLS para que los workout_templates sean accesibles por usuarios no autenticados
-- y para permitir que los templates del usuario admin sean visibles para todos

-- Eliminar la política actual para la visualización de templates
DROP POLICY IF EXISTS "Users can view their own or public workout templates" ON workout_templates;

-- Crear una nueva política que permita a todos los usuarios (incluso anónimos) ver las plantillas públicas
CREATE POLICY "Anyone can view public workout templates" 
ON workout_templates FOR SELECT 
USING (is_public = true);

-- Crear política para que los usuarios autenticados puedan ver sus propias plantillas
CREATE POLICY "Users can view their own workout templates" 
ON workout_templates FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Actualizar políticas para ejercicios de plantillas
DROP POLICY IF EXISTS "Users can view template exercises of their own or public templates" ON workout_template_exercises;

-- Permitir que cualquiera vea los ejercicios de plantillas públicas
CREATE POLICY "Anyone can view exercises of public templates" 
ON workout_template_exercises FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM workout_templates t 
    WHERE t.id = template_id 
    AND t.is_public = true
));

-- Los usuarios autenticados pueden ver ejercicios de sus propias plantillas
CREATE POLICY "Users can view exercises of their own templates" 
ON workout_template_exercises FOR SELECT 
TO authenticated
USING (EXISTS (
    SELECT 1 FROM workout_templates t 
    WHERE t.id = template_id 
    AND t.user_id = auth.uid()
));

-- Log the change
DO $$
BEGIN
  INSERT INTO public.migrations_log (migration_name, description, executed_at)
  VALUES ('fix_workout_templates_rls', 'Updated RLS policies to make public workout templates accessible to all users including anonymous', NOW());
EXCEPTION WHEN undefined_table THEN
  -- Table doesn't exist, create it first
  CREATE TABLE IF NOT EXISTS public.migrations_log (
    id SERIAL PRIMARY KEY,
    migration_name TEXT NOT NULL,
    description TEXT,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Then insert the record
  INSERT INTO public.migrations_log (migration_name, description, executed_at)
  VALUES ('fix_workout_templates_rls', 'Updated RLS policies to make public workout templates accessible to all users including anonymous', NOW());
END $$; 