-- Eliminar tabla actual si existe
DROP TABLE IF EXISTS habits CASCADE;
DROP TABLE IF EXISTS habit_logs CASCADE;

-- Crear extensión UUID si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear enum para frecuencia de hábitos
CREATE TYPE habit_frequency AS ENUM ('daily', 'weekly', 'monthly', 'custom');

-- Crear tabla de hábitos
CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  frequency habit_frequency NOT NULL DEFAULT 'daily',
  specific_days INTEGER[] DEFAULT NULL, -- Para hábitos semanales: [0, 1, 2, 3, 4, 5, 6] (0 = lunes)
  goal_value INTEGER DEFAULT 1, -- Por ejemplo, hacer 10 flexiones
  category TEXT,
  reminder_time TEXT, -- Formato "HH:MM"
  cue TEXT, -- La señal que inicia el hábito
  reward TEXT, -- La recompensa al completar
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  total_completions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT TRUE,
  related_goal_id UUID DEFAULT NULL
);

-- Crear tabla de logs de hábitos
CREATE TABLE habit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  quality_rating INTEGER, -- 1-5
  emotion TEXT,
  value INTEGER DEFAULT 1, -- La cantidad realizada (por ejemplo, 8 vasos de agua)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX habits_user_id_idx ON habits(user_id);
CREATE INDEX habits_is_active_idx ON habits(is_active);
CREATE INDEX habit_logs_habit_id_idx ON habit_logs(habit_id);
CREATE INDEX habit_logs_user_id_idx ON habit_logs(user_id);
CREATE INDEX habit_logs_completed_date_idx ON habit_logs(completed_date);

-- Función para actualizar automáticamente updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at en habits
CREATE TRIGGER update_habits_updated_at
BEFORE UPDATE ON habits
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Trigger para actualizar streaks cuando se crea un nuevo log
CREATE OR REPLACE FUNCTION update_habit_streaks()
RETURNS TRIGGER AS $$
DECLARE
  last_completion DATE;
  current_streak INT;
  best_streak INT;
  total_completions INT;
BEGIN
  -- Obtener fecha de última completitud
  SELECT completed_date INTO last_completion
  FROM habit_logs
  WHERE habit_id = NEW.habit_id
    AND id != NEW.id -- Excluir el nuevo log
  ORDER BY completed_date DESC
  LIMIT 1;
  
  -- Obtener valores actuales
  SELECT h.current_streak, h.best_streak, h.total_completions 
  INTO current_streak, best_streak, total_completions
  FROM habits h
  WHERE h.id = NEW.habit_id;
  
  -- Incrementar total_completions
  total_completions := COALESCE(total_completions, 0) + 1;
  
  -- Actualizar current_streak
  IF last_completion IS NULL OR NEW.completed_date = last_completion + INTERVAL '1 day' THEN
    -- Primer registro o día consecutivo
    current_streak := COALESCE(current_streak, 0) + 1;
  ELSIF NEW.completed_date > last_completion + INTERVAL '1 day' THEN
    -- Se perdió la racha
    current_streak := 1;
  ELSE
    -- Completado en el mismo día u otro orden, no afecta streak
    current_streak := COALESCE(current_streak, 0);
  END IF;
  
  -- Actualizar best_streak si necesario
  IF current_streak > COALESCE(best_streak, 0) THEN
    best_streak := current_streak;
  END IF;
  
  -- Actualizar el hábito
  UPDATE habits
  SET 
    current_streak = current_streak,
    best_streak = best_streak,
    total_completions = total_completions,
    updated_at = now()
  WHERE id = NEW.habit_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar streaks después de insertar un log
CREATE TRIGGER update_habit_streaks_after_log
AFTER INSERT ON habit_logs
FOR EACH ROW
EXECUTE PROCEDURE update_habit_streaks();

-- POLÍTICAS DE SEGURIDAD RLS

-- Habilitar RLS en ambas tablas
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes (si las hay)
DROP POLICY IF EXISTS habits_select_policy ON habits;
DROP POLICY IF EXISTS habits_insert_policy ON habits;
DROP POLICY IF EXISTS habits_update_policy ON habits;
DROP POLICY IF EXISTS habits_delete_policy ON habits;

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

-- Permisos para rol anon y authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON habits TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON habit_logs TO anon, authenticated; 