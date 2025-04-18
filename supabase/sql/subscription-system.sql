-- Esquema para sistema de suscripciones y pagos de SoulDream
-- Ejecutar este script en el SQL Editor de Supabase

-- Actualizar la tabla de perfiles para incluir el nivel de suscripción
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';

-- Crear tabla de planes de suscripción
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  interval TEXT NOT NULL DEFAULT 'month' CHECK (interval IN ('month', 'year')),
  features JSONB,
  paypal_product_id TEXT,
  paypal_plan_id TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de suscripciones de usuarios
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES subscription_plans(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending', 'trial')),
  payment_provider TEXT NOT NULL DEFAULT 'paypal',
  payment_id TEXT,
  subscription_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear un índice único parcial para evitar duplicados de suscripciones activas
DROP INDEX IF EXISTS idx_unique_active_subscription;
CREATE UNIQUE INDEX idx_unique_active_subscription ON subscriptions(user_id) 
WHERE (status = 'active' OR status = 'trial');

-- Crear tabla de historial de pagos
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  payment_id TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('completed', 'pending', 'failed', 'refunded')),
  payment_method TEXT NOT NULL DEFAULT 'paypal',
  payment_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para búsquedas eficientes
DROP INDEX IF EXISTS idx_subscriptions_user_id;
DROP INDEX IF EXISTS idx_subscriptions_status;
DROP INDEX IF EXISTS idx_payment_history_user_id;
DROP INDEX IF EXISTS idx_payment_history_subscription_id;

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_subscription_id ON payment_history(subscription_id);

-- Habilitar RLS para subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para subscriptions
DROP POLICY IF EXISTS "Los usuarios pueden ver sus propias suscripciones" ON subscriptions;
CREATE POLICY "Los usuarios pueden ver sus propias suscripciones" 
  ON subscriptions FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Solo administradores pueden crear suscripciones" ON subscriptions;
CREATE POLICY "Solo administradores pueden crear suscripciones" 
  ON subscriptions FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR auth.jwt()->>'role' = 'admin');

DROP POLICY IF EXISTS "Solo administradores pueden actualizar suscripciones" ON subscriptions;
CREATE POLICY "Solo administradores pueden actualizar suscripciones" 
  ON subscriptions FOR UPDATE 
  USING (auth.uid() = user_id OR auth.jwt()->>'role' = 'admin');

-- Habilitar RLS para subscription_plans
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para subscription_plans
DROP POLICY IF EXISTS "Cualquier usuario puede ver planes de suscripción" ON subscription_plans;
CREATE POLICY "Cualquier usuario puede ver planes de suscripción" 
  ON subscription_plans FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Solo administradores pueden gestionar planes de suscripción" ON subscription_plans;
CREATE POLICY "Solo administradores pueden gestionar planes de suscripción" 
  ON subscription_plans FOR ALL 
  USING (auth.jwt()->>'role' = 'admin');

-- Habilitar RLS para payment_history
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para payment_history
DROP POLICY IF EXISTS "Los usuarios pueden ver su propio historial de pagos" ON payment_history;
CREATE POLICY "Los usuarios pueden ver su propio historial de pagos" 
  ON payment_history FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Solo administradores pueden crear registros de pago" ON payment_history;
CREATE POLICY "Solo administradores pueden crear registros de pago" 
  ON payment_history FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR auth.jwt()->>'role' = 'admin');

-- Insertar planes de suscripción
INSERT INTO subscription_plans (name, description, price, currency, interval, features, is_active, paypal_plan_id)
VALUES 
  ('Pro Monthly', 'Desbloquea todo el potencial de SoulDream con funciones ilimitadas y prueba gratuita de 7 días', 14.99, 'USD', 'month', 
   '[
     "Tareas, metas y hábitos ilimitados",
     "Asistente IA personalizado 24/7",
     "Gestión financiera completa",
     "Integración con Google Calendar",
     "Analítica avanzada y reportes",
     "Plan de activos financieros",
     "Workout personalizado con IA",
     "Soporte prioritario"
   ]'::jsonb,
   true,
   'P-1H048096T5545353AM7U2EQQ'),
  
  ('Pro Annual', 'Desbloquea todo el potencial de SoulDream con funciones ilimitadas y prueba gratuita de 7 días', 120.00, 'USD', 'year', 
   '[
     "Tareas, metas y hábitos ilimitados",
     "Asistente IA personalizado 24/7",
     "Gestión financiera completa",
     "Integración con Google Calendar",
     "Analítica avanzada y reportes",
     "Plan de activos financieros",
     "Workout personalizado con IA",
     "Soporte prioritario"
   ]'::jsonb,
   true,
   'P-25P774007P7890240M7U2DTA');

-- Función para actualizar subscription_tier en profiles cuando cambia la suscripción
CREATE OR REPLACE FUNCTION update_profile_subscription_tier()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el estado cambia a 'active'
  IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status <> 'active') THEN
    -- Obtener el nombre del plan y actualizar el perfil
    UPDATE profiles 
    SET subscription_tier = (
      SELECT LOWER(name) 
      FROM subscription_plans 
      WHERE id = NEW.plan_id
    )
    WHERE id = NEW.user_id;
  -- Si el estado cambia de 'active' a otro
  ELSIF OLD.status = 'active' AND NEW.status <> 'active' THEN
    -- Restablecer a 'free'
    UPDATE profiles 
    SET subscription_tier = 'free'
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger existente si existe
DROP TRIGGER IF EXISTS on_subscription_status_change ON subscriptions;

-- Crear trigger para actualizar profiles cuando cambia una suscripción
CREATE TRIGGER on_subscription_status_change
  AFTER INSERT OR UPDATE OF status
  ON subscriptions
  FOR EACH ROW
  EXECUTE PROCEDURE update_profile_subscription_tier(); 