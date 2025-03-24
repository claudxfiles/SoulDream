-- Script para corregir las políticas RLS de habits

-- Primero, eliminar las políticas existentes si hay algún problema con ellas
DROP POLICY IF EXISTS "Los usuarios pueden ver sus propios hábitos" ON habits;
DROP POLICY IF EXISTS "Los usuarios pueden crear sus propios hábitos" ON habits;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar sus propios hábitos" ON habits;
DROP POLICY IF EXISTS "Los usuarios pueden eliminar sus propios hábitos" ON habits;

-- Habilitar RLS en la tabla habits (por si no estaba habilitado)
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

-- Recrear las políticas con configuraciones corregidas
CREATE POLICY "Los usuarios pueden ver sus propios hábitos" ON habits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden crear sus propios hábitos" ON habits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar sus propios hábitos" ON habits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden eliminar sus propios hábitos" ON habits
  FOR DELETE USING (auth.uid() = user_id);

-- Verificar que los tipos de datos sean correctos (especialmente user_id que debe ser UUID)
DO $$
BEGIN
  -- Asegurar que user_id es de tipo UUID
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'habits'
      AND column_name = 'user_id'
      AND data_type = 'uuid'
  ) THEN
    RAISE NOTICE 'La columna user_id no es de tipo UUID, esto podría causar problemas con RLS';
  END IF;
END $$;

-- Opcional: Crear una función para verificar el acceso
CREATE OR REPLACE FUNCTION public.check_habit_access(habit_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM habits
    WHERE id = habit_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mostrar las políticas existentes para verificación
COMMENT ON POLICY "Los usuarios pueden ver sus propios hábitos" ON habits IS 'Permite que los usuarios vean solo sus propios hábitos';
COMMENT ON POLICY "Los usuarios pueden crear sus propios hábitos" ON habits IS 'Permite que los usuarios creen hábitos solo con su propio user_id';
COMMENT ON POLICY "Los usuarios pueden actualizar sus propios hábitos" ON habits IS 'Permite que los usuarios actualicen solo sus propios hábitos';
COMMENT ON POLICY "Los usuarios pueden eliminar sus propios hábitos" ON habits IS 'Permite que los usuarios eliminen solo sus propios hábitos'; 