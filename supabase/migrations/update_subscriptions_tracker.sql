-- Modificar la tabla subscriptions_tracker
-- Primero, renombrar service_name a name
ALTER TABLE IF EXISTS subscriptions_tracker RENAME COLUMN service_name TO name;

-- Modificar el CHECK constraint para billing_cycle para incluir 'annual'
ALTER TABLE IF EXISTS subscriptions_tracker 
DROP CONSTRAINT IF EXISTS subscriptions_tracker_billing_cycle_check;

ALTER TABLE IF EXISTS subscriptions_tracker
ADD CONSTRAINT subscriptions_tracker_billing_cycle_check 
CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly', 'annual'));

-- Agregar el campo auto_renewal
ALTER TABLE IF EXISTS subscriptions_tracker
ADD COLUMN IF NOT EXISTS auto_renewal BOOLEAN DEFAULT TRUE;

-- Agregar el campo status
ALTER TABLE IF EXISTS subscriptions_tracker
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' 
CHECK (status IN ('active', 'cancelled', 'pending'));

-- Agregar el campo payment_method
ALTER TABLE IF EXISTS subscriptions_tracker
ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Si la tabla no tiene un campo para notas, agrégalo
ALTER TABLE IF EXISTS subscriptions_tracker
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Crear un trigger para establecer automáticamente el user_id
CREATE OR REPLACE FUNCTION set_subscription_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_subscription_user_id_trigger ON subscriptions_tracker;

CREATE TRIGGER set_subscription_user_id_trigger
  BEFORE INSERT ON subscriptions_tracker
  FOR EACH ROW
  EXECUTE FUNCTION set_subscription_user_id();

-- Actualizar Políticas RLS si es necesario
DROP POLICY IF EXISTS "Los usuarios pueden ver sus propias suscripciones tracker" ON subscriptions_tracker;
DROP POLICY IF EXISTS "Los usuarios pueden crear sus propias suscripciones tracker" ON subscriptions_tracker;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar sus propias suscripciones tracker" ON subscriptions_tracker;
DROP POLICY IF EXISTS "Los usuarios pueden eliminar sus propias suscripciones tracker" ON subscriptions_tracker;

CREATE POLICY "Los usuarios pueden ver sus propias suscripciones tracker" ON subscriptions_tracker
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden crear sus propias suscripciones tracker" ON subscriptions_tracker
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar sus propias suscripciones tracker" ON subscriptions_tracker
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden eliminar sus propias suscripciones tracker" ON subscriptions_tracker
  FOR DELETE USING (auth.uid() = user_id);

-- Crear un trigger para actualizar automáticamente el campo updated_at
CREATE OR REPLACE FUNCTION update_subscriptions_tracker_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_subscriptions_tracker_timestamp ON subscriptions_tracker;

CREATE TRIGGER update_subscriptions_tracker_timestamp
  BEFORE UPDATE ON subscriptions_tracker
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_tracker_updated_at(); 