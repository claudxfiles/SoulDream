-- Crear tabla de finanzas (transacciones)
CREATE TABLE IF NOT EXISTS finances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  category TEXT NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  related_goal_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payment_method TEXT,
  recurring BOOLEAN DEFAULT FALSE,
  recurring_frequency TEXT CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly', 'yearly') OR recurring_frequency IS NULL)
);

-- Crear índices para búsquedas eficientes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_finances_user_id') THEN
    CREATE INDEX idx_finances_user_id ON finances(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_finances_type') THEN
    CREATE INDEX idx_finances_type ON finances(type);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_finances_date') THEN
    CREATE INDEX idx_finances_date ON finances(date);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_finances_category') THEN
    CREATE INDEX idx_finances_category ON finances(category);
  END IF;
END $$;

-- Habilitar RLS para finances
ALTER TABLE finances ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para finances
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'finances' AND policyname = 'Los usuarios pueden ver sus propias transacciones financieras') THEN
    CREATE POLICY "Los usuarios pueden ver sus propias transacciones financieras" ON finances
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'finances' AND policyname = 'Los usuarios pueden crear sus propias transacciones financieras') THEN
    CREATE POLICY "Los usuarios pueden crear sus propias transacciones financieras" ON finances
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'finances' AND policyname = 'Los usuarios pueden actualizar sus propias transacciones financieras') THEN
    CREATE POLICY "Los usuarios pueden actualizar sus propias transacciones financieras" ON finances
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'finances' AND policyname = 'Los usuarios pueden eliminar sus propias transacciones financieras') THEN
    CREATE POLICY "Los usuarios pueden eliminar sus propias transacciones financieras" ON finances
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Trigger para actualizar automáticamente el campo updated_at
CREATE OR REPLACE FUNCTION update_finances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_finances_timestamp' AND tgrelid = 'finances'::regclass) THEN
    CREATE TRIGGER update_finances_timestamp
      BEFORE UPDATE ON finances
      FOR EACH ROW
      EXECUTE FUNCTION update_finances_updated_at();
  END IF;
END $$; 