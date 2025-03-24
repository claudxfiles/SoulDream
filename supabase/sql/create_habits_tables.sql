-- Crear tabla de hábitos
CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL DEFAULT 'daily',
  specific_days JSONB,
  current_streak INT DEFAULT 0,
  best_streak INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  related_goal_id UUID,
  category TEXT,
  reminder_time TEXT,
  cue TEXT,
  reward TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

-- Crear tabla de registros de hábitos
CREATE TABLE IF NOT EXISTS habit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
  completed_date DATE NOT NULL,
  notes TEXT,
  quality_rating INTEGER,
  emotion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Políticas para hábitos
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver sus propios hábitos" ON habits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden crear sus propios hábitos" ON habits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar sus propios hábitos" ON habits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden eliminar sus propios hábitos" ON habits
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para registros de hábitos
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver logs de sus propios hábitos" ON habit_logs
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM habits WHERE id = habit_logs.habit_id
    )
  );

CREATE POLICY "Los usuarios pueden crear logs para sus propios hábitos" ON habit_logs
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM habits WHERE id = habit_logs.habit_id
    )
  );

CREATE POLICY "Los usuarios pueden actualizar logs de sus propios hábitos" ON habit_logs
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM habits WHERE id = habit_logs.habit_id
    )
  );

CREATE POLICY "Los usuarios pueden eliminar logs de sus propios hábitos" ON habit_logs
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM habits WHERE id = habit_logs.habit_id
    )
  );

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS habits_user_id_idx ON habits(user_id);
CREATE INDEX IF NOT EXISTS habit_logs_habit_id_idx ON habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS habit_logs_completed_date_idx ON habit_logs(completed_date);

-- Comentarios para la documentación
COMMENT ON TABLE habits IS 'Tabla de hábitos de los usuarios';
COMMENT ON TABLE habit_logs IS 'Registros de completado de hábitos'; 