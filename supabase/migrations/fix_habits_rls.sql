-- Restablecer las políticas RLS para la tabla habits

-- Eliminar políticas existentes
DROP POLICY IF EXISTS habits_select_policy ON habits;
DROP POLICY IF EXISTS habits_insert_policy ON habits;
DROP POLICY IF EXISTS habits_update_policy ON habits;
DROP POLICY IF EXISTS habits_delete_policy ON habits;

-- Eliminar políticas existentes para habit_logs
DROP POLICY IF EXISTS habit_logs_select_policy ON habit_logs;
DROP POLICY IF EXISTS habit_logs_insert_policy ON habit_logs;
DROP POLICY IF EXISTS habit_logs_update_policy ON habit_logs;
DROP POLICY IF EXISTS habit_logs_delete_policy ON habit_logs;

-- Política para que los usuarios solo vean sus propios hábitos
CREATE POLICY habits_select_policy ON habits
  FOR SELECT USING (auth.uid() = user_id);

-- Política para que los usuarios solo inserten sus propios hábitos
CREATE POLICY habits_insert_policy ON habits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para que los usuarios solo actualicen sus propios hábitos
CREATE POLICY habits_update_policy ON habits
  FOR UPDATE USING (auth.uid() = user_id);

-- Política para que los usuarios solo eliminen sus propios hábitos
CREATE POLICY habits_delete_policy ON habits
  FOR DELETE USING (auth.uid() = user_id);

-- Política para que los usuarios solo vean logs de sus propios hábitos
CREATE POLICY habit_logs_select_policy ON habit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Política para que los usuarios solo inserten logs para sus propios hábitos
CREATE POLICY habit_logs_insert_policy ON habit_logs
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM habits WHERE id = habit_id AND user_id = auth.uid()
    )
  );

-- Política para que los usuarios solo actualicen logs de sus propios hábitos
CREATE POLICY habit_logs_update_policy ON habit_logs
  FOR UPDATE USING (auth.uid() = user_id);

-- Política para que los usuarios solo eliminen logs de sus propios hábitos
CREATE POLICY habit_logs_delete_policy ON habit_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Verificar que RLS está habilitado
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;

-- Añadir permisos explícitos
GRANT SELECT, INSERT, UPDATE, DELETE ON habits TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON habits TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON habit_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON habit_logs TO service_role;

-- Mostrar mensaje informativo
DO $$
BEGIN
  RAISE NOTICE 'Políticas RLS para las tablas habits y habit_logs actualizadas correctamente';
END $$; 