-- Crear tabla subscriptions_tracker
CREATE TABLE IF NOT EXISTS subscriptions_tracker (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly')),
  next_billing_date TIMESTAMP WITH TIME ZONE NOT NULL,
  category TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reminder_days_before INTEGER DEFAULT 3
);

-- Crear índices para búsquedas eficientes
CREATE INDEX idx_subscriptions_tracker_user_id ON subscriptions_tracker(user_id);
CREATE INDEX idx_subscriptions_tracker_next_billing_date ON subscriptions_tracker(next_billing_date);

-- Habilitar RLS para subscriptions_tracker
ALTER TABLE subscriptions_tracker ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para subscriptions_tracker
CREATE POLICY "Los usuarios pueden ver sus propias suscripciones tracker" ON subscriptions_tracker
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden crear sus propias suscripciones tracker" ON subscriptions_tracker
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar sus propias suscripciones tracker" ON subscriptions_tracker
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden eliminar sus propias suscripciones tracker" ON subscriptions_tracker
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger para actualizar automáticamente el campo updated_at
CREATE OR REPLACE FUNCTION update_subscriptions_tracker_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscriptions_tracker_timestamp
  BEFORE UPDATE ON subscriptions_tracker
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_tracker_updated_at(); 