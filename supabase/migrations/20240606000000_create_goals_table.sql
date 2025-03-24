-- Crear tabla de metas (goals)
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  area TEXT,
  target_date TIMESTAMP WITH TIME ZONE,
  progress_percentage INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  parent_goal_id UUID REFERENCES goals(id),
  priority TEXT DEFAULT 'medium',
  visualization_image_url TEXT,
  type TEXT
);

-- Crear índices para búsquedas eficientes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_goals_user_id') THEN
    CREATE INDEX idx_goals_user_id ON goals(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_goals_status') THEN
    CREATE INDEX idx_goals_status ON goals(status);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_goals_parent_id') THEN
    CREATE INDEX idx_goals_parent_id ON goals(parent_goal_id);
  END IF;
END $$;

-- Crear tabla para pasos de metas (goal_steps)
CREATE TABLE IF NOT EXISTS goal_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ai_generated BOOLEAN DEFAULT FALSE
);

-- Crear índices para goal_steps
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_goal_steps_goal_id') THEN
    CREATE INDEX idx_goal_steps_goal_id ON goal_steps(goal_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_goal_steps_status') THEN
    CREATE INDEX idx_goal_steps_status ON goal_steps(status);
  END IF;
END $$;

-- Habilitar RLS para goals
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS para goal_steps
ALTER TABLE goal_steps ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para goals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'goals' 
    AND policyname = 'Los usuarios pueden ver sus propias metas'
  ) THEN
    CREATE POLICY "Los usuarios pueden ver sus propias metas" 
    ON goals FOR SELECT 
    USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'goals' 
    AND policyname = 'Los usuarios pueden insertar sus propias metas'
  ) THEN
    CREATE POLICY "Los usuarios pueden insertar sus propias metas" 
    ON goals FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'goals' 
    AND policyname = 'Los usuarios pueden actualizar sus propias metas'
  ) THEN
    CREATE POLICY "Los usuarios pueden actualizar sus propias metas" 
    ON goals FOR UPDATE 
    USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'goals' 
    AND policyname = 'Los usuarios pueden eliminar sus propias metas'
  ) THEN
    CREATE POLICY "Los usuarios pueden eliminar sus propias metas" 
    ON goals FOR DELETE 
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Políticas de seguridad para goal_steps
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'goal_steps' 
    AND policyname = 'Los usuarios pueden ver pasos de sus propias metas'
  ) THEN
    CREATE POLICY "Los usuarios pueden ver pasos de sus propias metas" 
    ON goal_steps FOR SELECT 
    USING (EXISTS (
      SELECT 1 FROM goals 
      WHERE goals.id = goal_steps.goal_id 
      AND goals.user_id = auth.uid()
    ));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'goal_steps' 
    AND policyname = 'Los usuarios pueden insertar pasos en sus propias metas'
  ) THEN
    CREATE POLICY "Los usuarios pueden insertar pasos en sus propias metas" 
    ON goal_steps FOR INSERT 
    WITH CHECK (EXISTS (
      SELECT 1 FROM goals 
      WHERE goals.id = goal_steps.goal_id 
      AND goals.user_id = auth.uid()
    ));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'goal_steps' 
    AND policyname = 'Los usuarios pueden actualizar pasos de sus propias metas'
  ) THEN
    CREATE POLICY "Los usuarios pueden actualizar pasos de sus propias metas" 
    ON goal_steps FOR UPDATE 
    USING (EXISTS (
      SELECT 1 FROM goals 
      WHERE goals.id = goal_steps.goal_id 
      AND goals.user_id = auth.uid()
    ));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'goal_steps' 
    AND policyname = 'Los usuarios pueden eliminar pasos de sus propias metas'
  ) THEN
    CREATE POLICY "Los usuarios pueden eliminar pasos de sus propias metas" 
    ON goal_steps FOR DELETE 
    USING (EXISTS (
      SELECT 1 FROM goals 
      WHERE goals.id = goal_steps.goal_id 
      AND goals.user_id = auth.uid()
    ));
  END IF;
END $$; 