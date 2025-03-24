-- Crear tabla de analítica de usuario
CREATE TABLE IF NOT EXISTS user_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  tasks_completed INTEGER DEFAULT 0,
  habits_completed INTEGER DEFAULT 0,
  workout_minutes INTEGER DEFAULT 0,
  financial_balance_change DECIMAL(10, 2) DEFAULT 0,
  ai_interactions_count INTEGER DEFAULT 0,
  goals_progress JSONB DEFAULT '[]'::jsonb,
  productivity_score DECIMAL(5, 2),
  streak_days INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para búsquedas eficientes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_analytics_user_id') THEN
    CREATE INDEX idx_user_analytics_user_id ON user_analytics(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_analytics_date') THEN
    CREATE INDEX idx_user_analytics_date ON user_analytics(date);
  END IF;
END $$;

-- Crear restricción única para evitar duplicados por usuario y día
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'unique_user_date' AND conrelid = 'user_analytics'::regclass
  ) THEN
    ALTER TABLE user_analytics ADD CONSTRAINT unique_user_date UNIQUE (user_id, date);
  END IF;
END $$;

-- Habilitar RLS para user_analytics
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para user_analytics
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_analytics' 
    AND policyname = 'Los usuarios pueden ver sus propias analíticas'
  ) THEN
    CREATE POLICY "Los usuarios pueden ver sus propias analíticas" ON user_analytics
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_analytics' 
    AND policyname = 'Solo los administradores pueden insertar analíticas'
  ) THEN
    CREATE POLICY "Solo los administradores pueden insertar analíticas" ON user_analytics
      FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.jwt()->>'role' = 'admin');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_analytics' 
    AND policyname = 'Solo los administradores pueden actualizar analíticas'
  ) THEN
    CREATE POLICY "Solo los administradores pueden actualizar analíticas" ON user_analytics
      FOR UPDATE USING (auth.uid() = user_id OR auth.jwt()->>'role' = 'admin');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_analytics' 
    AND policyname = 'Solo los administradores pueden eliminar analíticas'
  ) THEN
    CREATE POLICY "Solo los administradores pueden eliminar analíticas" ON user_analytics
      FOR DELETE USING (auth.uid() = user_id OR auth.jwt()->>'role' = 'admin');
  END IF;
END $$;

-- Trigger para actualizar automáticamente el campo updated_at
CREATE OR REPLACE FUNCTION update_user_analytics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_analytics_timestamp ON user_analytics;
CREATE TRIGGER update_user_analytics_timestamp
  BEFORE UPDATE ON user_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_user_analytics_updated_at();

-- Función para generar analíticas diarias para todos los usuarios
CREATE OR REPLACE FUNCTION generate_daily_analytics()
RETURNS VOID AS $$
DECLARE
  _user_record RECORD;
  _yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
  _tasks_completed INTEGER;
  _habits_completed INTEGER;
  _workout_minutes INTEGER;
  _financial_balance_change DECIMAL(10, 2);
  _ai_interactions_count INTEGER;
  _goals_progress JSONB;
  _productivity_score DECIMAL(5, 2);
  _streak_days INTEGER;
BEGIN
  -- Para cada usuario en el sistema
  FOR _user_record IN SELECT id FROM auth.users LOOP
    -- Contar tareas completadas ayer
    SELECT COUNT(*) INTO _tasks_completed
    FROM tasks
    WHERE 
      user_id = _user_record.id AND 
      status = 'completed' AND 
      DATE(updated_at) = _yesterday;
      
    -- Contar hábitos completados ayer
    SELECT COUNT(*) INTO _habits_completed
    FROM habit_logs
    WHERE 
      habit_id IN (SELECT id FROM habits WHERE user_id = _user_record.id) AND
      DATE(completed_date) = _yesterday;
    
    -- Calcular minutos de workout
    SELECT COALESCE(SUM(duration_minutes), 0) INTO _workout_minutes
    FROM workouts
    WHERE 
      user_id = _user_record.id AND 
      DATE(date) = _yesterday;
    
    -- Calcular cambio en balance financiero
    SELECT 
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) 
    INTO _financial_balance_change
    FROM finances
    WHERE 
      user_id = _user_record.id AND 
      DATE(date) = _yesterday;
    
    -- Contar interacciones con IA
    SELECT COUNT(*) INTO _ai_interactions_count
    FROM ai_interactions
    WHERE 
      user_id = _user_record.id AND 
      DATE(created_at) = _yesterday;
    
    -- Obtener progreso de metas
    SELECT json_agg(
      json_build_object(
        'goal_id', id,
        'title', title,
        'progress', progress_percentage
      )
    ) INTO _goals_progress
    FROM goals
    WHERE 
      user_id = _user_record.id AND 
      status = 'active';
    
    -- Si no hay metas, usar array vacío
    IF _goals_progress IS NULL THEN
      _goals_progress := '[]'::jsonb;
    END IF;
    
    -- Calcular score de productividad (fórmula simplificada)
    _productivity_score := (
      (_tasks_completed * 10) + 
      (_habits_completed * 15) + 
      (_workout_minutes * 0.5) + 
      (CASE WHEN _financial_balance_change > 0 THEN 10 ELSE 0 END) +
      (_ai_interactions_count * 2)
    ) / 10;
    
    -- Limitar el score a 100 como máximo
    IF _productivity_score > 100 THEN
      _productivity_score := 100;
    END IF;
    
    -- Obtener streak de días activos consecutivos
    SELECT COALESCE(streak_days, 0) + 1 INTO _streak_days
    FROM user_analytics
    WHERE 
      user_id = _user_record.id
      ORDER BY date DESC
      LIMIT 1;
    
    -- Si no hay registro previo o si hubo inactividad, reiniciar a 1
    IF _streak_days IS NULL OR (
      SELECT COUNT(*) = 0 FROM user_analytics 
      WHERE user_id = _user_record.id AND date = _yesterday - INTERVAL '1 day'
    ) THEN
      _streak_days := 1;
    END IF;
    
    -- Si no hubo actividad ayer, reiniciar streak a 0
    IF _tasks_completed = 0 AND _habits_completed = 0 AND _workout_minutes = 0 THEN
      _streak_days := 0;
    END IF;
    
    -- Insertar o actualizar el registro analítico
    INSERT INTO user_analytics (
      user_id, date, tasks_completed, habits_completed, 
      workout_minutes, financial_balance_change, 
      ai_interactions_count, goals_progress, 
      productivity_score, streak_days
    ) VALUES (
      _user_record.id, _yesterday, _tasks_completed, _habits_completed,
      _workout_minutes, _financial_balance_change,
      _ai_interactions_count, _goals_progress,
      _productivity_score, _streak_days
    )
    ON CONFLICT (user_id, date) DO UPDATE SET
      tasks_completed = EXCLUDED.tasks_completed,
      habits_completed = EXCLUDED.habits_completed,
      workout_minutes = EXCLUDED.workout_minutes,
      financial_balance_change = EXCLUDED.financial_balance_change,
      ai_interactions_count = EXCLUDED.ai_interactions_count,
      goals_progress = EXCLUDED.goals_progress,
      productivity_score = EXCLUDED.productivity_score,
      streak_days = EXCLUDED.streak_days,
      updated_at = NOW();
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 