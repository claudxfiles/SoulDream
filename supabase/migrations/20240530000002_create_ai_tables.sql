-- Crear tabla para registrar interacciones con IA
CREATE TABLE IF NOT EXISTS ai_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  model_used TEXT NOT NULL,
  tokens_used INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  context TEXT CHECK (context IN ('tasks', 'goals', 'finance', 'workout', 'habits', 'general')),
  feedback_rating INTEGER CHECK (feedback_rating BETWEEN 1 AND 5),
  conversation_id UUID
);

-- Crear tabla para planes generados por IA
CREATE TABLE IF NOT EXISTS ai_generated_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  goal_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  creation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  steps JSONB NOT NULL,
  version_number INTEGER DEFAULT 1,
  status TEXT CHECK (status IN ('active', 'archived', 'superseded')) NOT NULL DEFAULT 'active',
  type TEXT CHECK (type IN ('financial', 'personal_development', 'fitness', 'habit', 'general')) NOT NULL,
  estimated_completion_time INTERVAL,
  applied BOOLEAN DEFAULT FALSE,
  last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para búsquedas eficientes
CREATE INDEX idx_ai_interactions_user_id ON ai_interactions(user_id);
CREATE INDEX idx_ai_interactions_created_at ON ai_interactions(created_at);

-- Crear índice para conversation_id sólo si la columna existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'ai_interactions' 
    AND column_name = 'conversation_id'
  ) THEN
    EXECUTE 'CREATE INDEX idx_ai_interactions_conversation_id ON ai_interactions(conversation_id)';
  END IF;
END $$;

CREATE INDEX idx_ai_interactions_context ON ai_interactions(context);

CREATE INDEX idx_ai_generated_plans_user_id ON ai_generated_plans(user_id);
CREATE INDEX idx_ai_generated_plans_goal_id ON ai_generated_plans(goal_id);
CREATE INDEX idx_ai_generated_plans_type ON ai_generated_plans(type);
CREATE INDEX idx_ai_generated_plans_status ON ai_generated_plans(status);

-- Habilitar RLS para ai_interactions
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para ai_interactions
CREATE POLICY "Los usuarios pueden ver sus propias interacciones con IA" ON ai_interactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden crear sus propias interacciones con IA" ON ai_interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar sus propias interacciones con IA" ON ai_interactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden eliminar sus propias interacciones con IA" ON ai_interactions
  FOR DELETE USING (auth.uid() = user_id);

-- Habilitar RLS para ai_generated_plans
ALTER TABLE ai_generated_plans ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para ai_generated_plans
CREATE POLICY "Los usuarios pueden ver sus propios planes generados por IA" ON ai_generated_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden crear sus propios planes generados por IA" ON ai_generated_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar sus propios planes generados por IA" ON ai_generated_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden eliminar sus propios planes generados por IA" ON ai_generated_plans
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger para actualizar automáticamente el campo last_modified
CREATE OR REPLACE FUNCTION update_ai_generated_plans_modified_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_modified = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_generated_plans_timestamp
  BEFORE UPDATE ON ai_generated_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_generated_plans_modified_at();

-- Función para contabilizar el uso de IA por usuario
CREATE OR REPLACE FUNCTION get_ai_usage_by_user(user_uuid UUID, period TEXT)
RETURNS TABLE (
  total_interactions BIGINT,
  total_tokens BIGINT,
  most_used_context TEXT
) AS $$
DECLARE
  period_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Determinar el periodo de tiempo
  IF period = 'day' THEN
    period_start := NOW() - INTERVAL '1 day';
  ELSIF period = 'week' THEN
    period_start := NOW() - INTERVAL '7 days';
  ELSIF period = 'month' THEN
    period_start := NOW() - INTERVAL '30 days';
  ELSE
    period_start := NOW() - INTERVAL '365 days';
  END IF;
  
  RETURN QUERY
  WITH context_counts AS (
    SELECT 
      context, 
      COUNT(*) as context_count
    FROM ai_interactions
    WHERE 
      user_id = user_uuid AND 
      created_at >= period_start
    GROUP BY context
    ORDER BY context_count DESC
    LIMIT 1
  )
  SELECT
    COUNT(*)::BIGINT as total_interactions,
    COALESCE(SUM(tokens_used), 0)::BIGINT as total_tokens,
    (SELECT context FROM context_counts LIMIT 1) as most_used_context
  FROM ai_interactions
  WHERE 
    user_id = user_uuid AND 
    created_at >= period_start;
END;
$$ LANGUAGE plpgsql; 