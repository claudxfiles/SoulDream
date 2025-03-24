-- Crear tabla de metas financieras
CREATE TABLE IF NOT EXISTS finance_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_amount DECIMAL(10, 2) NOT NULL,
  current_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  type TEXT CHECK (type IN ('savings', 'debt_payoff', 'purchase')) NOT NULL,
  target_date TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('active', 'completed', 'abandoned')) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  visualization_image_url TEXT,
  related_goal_id UUID,
  automatic_savings_amount DECIMAL(10, 2),
  automatic_savings_frequency TEXT CHECK (automatic_savings_frequency IN ('daily', 'weekly', 'monthly', 'yearly') OR automatic_savings_frequency IS NULL),
  milestones JSONB,
  progress_percentage DECIMAL(5, 2) GENERATED ALWAYS AS (
    CASE 
      WHEN target_amount = 0 THEN 0
      ELSE LEAST((current_amount / target_amount) * 100, 100)
    END
  ) STORED
);

-- Crear índices para búsquedas eficientes, solo si no existen
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_finance_goals_user_id') THEN
    CREATE INDEX idx_finance_goals_user_id ON finance_goals(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_finance_goals_status') THEN
    CREATE INDEX idx_finance_goals_status ON finance_goals(status);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_finance_goals_type') THEN
    CREATE INDEX idx_finance_goals_type ON finance_goals(type);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_finance_goals_target_date') THEN
    CREATE INDEX idx_finance_goals_target_date ON finance_goals(target_date);
  END IF;
END $$;

-- Habilitar RLS para finance_goals
ALTER TABLE finance_goals ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para finance_goals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'finance_goals' AND policyname = 'Los usuarios pueden ver sus propias metas financieras'
  ) THEN
    CREATE POLICY "Los usuarios pueden ver sus propias metas financieras" ON finance_goals
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'finance_goals' AND policyname = 'Los usuarios pueden crear sus propias metas financieras'
  ) THEN
    CREATE POLICY "Los usuarios pueden crear sus propias metas financieras" ON finance_goals
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'finance_goals' AND policyname = 'Los usuarios pueden actualizar sus propias metas financieras'
  ) THEN
    CREATE POLICY "Los usuarios pueden actualizar sus propias metas financieras" ON finance_goals
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'finance_goals' AND policyname = 'Los usuarios pueden eliminar sus propias metas financieras'
  ) THEN
    CREATE POLICY "Los usuarios pueden eliminar sus propias metas financieras" ON finance_goals
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Trigger para actualizar automáticamente el campo updated_at
CREATE OR REPLACE FUNCTION update_finance_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_finance_goals_timestamp' AND tgrelid = 'finance_goals'::regclass
  ) THEN
    CREATE TRIGGER update_finance_goals_timestamp
      BEFORE UPDATE ON finance_goals
      FOR EACH ROW
      EXECUTE FUNCTION update_finance_goals_updated_at();
  END IF;
END $$;

-- Función para actualizar progress_percentage cuando se modifican transacciones relacionadas
CREATE OR REPLACE FUNCTION update_finance_goal_after_transaction()
RETURNS TRIGGER AS $$
DECLARE
  _finance_goal_id UUID;
  _amount DECIMAL(10, 2);
BEGIN
  -- Si es un INSERT o UPDATE, obtenemos el related_goal_id y amount
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    _finance_goal_id := NEW.related_goal_id;
    
    -- Si es ingreso sumamos, si es gasto restamos
    IF NEW.type = 'income' THEN
      _amount := NEW.amount;
    ELSE
      _amount := -NEW.amount;
    END IF;
  END IF;
  
  -- Si es un DELETE, obtenemos el related_goal_id y amount del OLD
  IF (TG_OP = 'DELETE') THEN
    _finance_goal_id := OLD.related_goal_id;
    
    -- Invertimos la operación: si era ingreso restamos, si era gasto sumamos
    IF OLD.type = 'income' THEN
      _amount := -OLD.amount;
    ELSE
      _amount := OLD.amount;
    END IF;
  END IF;
  
  -- Actualizamos el current_amount de la meta financiera si tiene related_goal_id
  IF _finance_goal_id IS NOT NULL THEN
    UPDATE finance_goals
    SET current_amount = current_amount + _amount
    WHERE id = _finance_goal_id;
    
    -- Si alcanzamos o superamos el target_amount, marcamos como completada
    UPDATE finance_goals
    SET status = 'completed'
    WHERE id = _finance_goal_id AND current_amount >= target_amount AND status = 'active';
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers para la actualización automática del progreso de metas financieras
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'finance_transaction_inserted' AND tgrelid = 'finances'::regclass
  ) THEN
    CREATE TRIGGER finance_transaction_inserted
      AFTER INSERT ON finances
      FOR EACH ROW
      WHEN (NEW.related_goal_id IS NOT NULL)
      EXECUTE FUNCTION update_finance_goal_after_transaction();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'finance_transaction_updated' AND tgrelid = 'finances'::regclass
  ) THEN
    CREATE TRIGGER finance_transaction_updated
      AFTER UPDATE ON finances
      FOR EACH ROW
      WHEN (NEW.related_goal_id IS NOT NULL OR OLD.related_goal_id IS NOT NULL)
      EXECUTE FUNCTION update_finance_goal_after_transaction();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'finance_transaction_deleted' AND tgrelid = 'finances'::regclass
  ) THEN
    CREATE TRIGGER finance_transaction_deleted
      AFTER DELETE ON finances
      FOR EACH ROW
      WHEN (OLD.related_goal_id IS NOT NULL)
      EXECUTE FUNCTION update_finance_goal_after_transaction();
  END IF;
END $$; 