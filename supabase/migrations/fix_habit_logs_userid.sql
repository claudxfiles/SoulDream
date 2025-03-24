-- Migración para corregir el problema de uid vs user_id en las tablas de hábitos

-- Verificar primero si hay problema con uid vs user_id
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  -- Verificar si existe la columna uid en habit_logs
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'habit_logs' AND column_name = 'uid'
  ) INTO column_exists;
  
  -- Si existe la columna uid, sincronizar los datos
  IF column_exists THEN
    RAISE NOTICE 'Columna uid encontrada en habit_logs, sincronizando datos...';
    
    -- Actualizar registros donde uid y user_id no coinciden
    UPDATE habit_logs
    SET user_id = uid
    WHERE user_id != uid;
    
    -- Eliminar la columna uid
    ALTER TABLE habit_logs DROP COLUMN uid;
    RAISE NOTICE 'Columna uid eliminada de habit_logs';
  ELSE
    RAISE NOTICE 'La columna uid no existe en habit_logs, no se requiere acción';
  END IF;
  
  -- Verificar si existe la columna uid en habits
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'habits' AND column_name = 'uid'
  ) INTO column_exists;
  
  -- Si existe la columna uid, sincronizar los datos
  IF column_exists THEN
    RAISE NOTICE 'Columna uid encontrada en habits, sincronizando datos...';
    
    -- Actualizar registros donde uid y user_id no coinciden
    UPDATE habits
    SET user_id = uid
    WHERE user_id != uid;
    
    -- Eliminar la columna uid
    ALTER TABLE habits DROP COLUMN uid;
    RAISE NOTICE 'Columna uid eliminada de habits';
  ELSE
    RAISE NOTICE 'La columna uid no existe en habits, no se requiere acción';
  END IF;
END $$;

-- Verificar que las políticas RLS están utilizando auth.uid()
DROP POLICY IF EXISTS habit_logs_select_policy ON habit_logs;
DROP POLICY IF EXISTS habit_logs_insert_policy ON habit_logs;
DROP POLICY IF EXISTS habit_logs_update_policy ON habit_logs;
DROP POLICY IF EXISTS habit_logs_delete_policy ON habit_logs;

-- Recrear políticas para habit_logs
CREATE POLICY habit_logs_select_policy ON habit_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY habit_logs_insert_policy ON habit_logs
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM habits WHERE id = habit_id AND user_id = auth.uid()
    )
  );

CREATE POLICY habit_logs_update_policy ON habit_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY habit_logs_delete_policy ON habit_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Asegurar que RLS está habilitado
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;

-- Asegurar permisos
GRANT SELECT, INSERT, UPDATE, DELETE ON habit_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON habit_logs TO service_role;

-- Mensaje de conclusión
DO $$
BEGIN
  RAISE NOTICE 'Migración para corregir problema de uid vs user_id completada';
END $$; 