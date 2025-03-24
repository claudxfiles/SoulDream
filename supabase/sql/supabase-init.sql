-- Crear tabla de perfiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  phone TEXT,
  address TEXT,
  birth_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  subscription_tier TEXT DEFAULT 'free'
);

-- Crear tabla de tareas
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de transacciones financieras
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de metas financieras
CREATE TABLE IF NOT EXISTS financial_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  target_amount DECIMAL(10, 2) NOT NULL,
  current_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  deadline TIMESTAMP WITH TIME ZONE,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de conversaciones con IA
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de mensajes de conversaciones
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  sender TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de analítica para almacenar métricas personales
CREATE TABLE IF NOT EXISTS analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  metric_type TEXT NOT NULL,
  period TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla para almacenar insights generados por IA
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  insight_type TEXT NOT NULL,
  description TEXT NOT NULL,
  data JSONB,
  relevance INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  related_metrics JSONB
);

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
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Corregir la tabla de suscripciones (eliminar la restricción problemática)
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

-- Agregar la restricción parcial correctamente
DROP INDEX IF EXISTS unique_active_subscription;
CREATE UNIQUE INDEX unique_active_subscription ON subscriptions (user_id)
WHERE status IN ('active', 'trial');

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
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX idx_payment_history_subscription_id ON payment_history(subscription_id);

-- Habilitar RLS para subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para subscriptions
CREATE POLICY "Los usuarios pueden ver sus propias suscripciones" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Solo administradores pueden crear suscripciones" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.jwt()->>'role' = 'admin');

CREATE POLICY "Solo administradores pueden actualizar suscripciones" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id OR auth.jwt()->>'role' = 'admin');

-- Habilitar RLS para payment_history
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para payment_history
CREATE POLICY "Los usuarios pueden ver su propio historial de pagos" ON payment_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Solo administradores pueden crear registros de pago" ON payment_history
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.jwt()->>'role' = 'admin');

-- Datos iniciales para planes de suscripción
INSERT INTO subscription_plans (name, description, price, currency, interval, features, is_active)
VALUES 
  ('Free', 'Plan básico con funcionalidades limitadas', 0.00, 'USD', 'month', 
   '[{"name": "Gestión básica de tareas", "included": true}, 
     {"name": "Seguimiento de hábitos", "included": true}, 
     {"name": "Registro financiero básico", "included": true}, 
     {"name": "5 interacciones con IA al día", "included": true}]'::jsonb, 
   true),
  
  ('Pro', 'Plan profesional con funcionalidades avanzadas', 9.99, 'USD', 'month', 
   '[{"name": "Gestión básica de tareas", "included": true}, 
     {"name": "Seguimiento de hábitos", "included": true}, 
     {"name": "Registro financiero avanzado", "included": true}, 
     {"name": "50 interacciones con IA al día", "included": true}, 
     {"name": "Análisis financiero avanzado", "included": true}, 
     {"name": "Integración con Google Calendar", "included": true}]'::jsonb, 
   true),
  
  ('Premium', 'Plan completo con todas las funcionalidades', 19.99, 'USD', 'month', 
   '[{"name": "Gestión básica de tareas", "included": true}, 
     {"name": "Seguimiento de hábitos", "included": true}, 
     {"name": "Registro financiero avanzado", "included": true}, 
     {"name": "Interacciones ilimitadas con IA", "included": true}, 
     {"name": "Análisis financiero avanzado", "included": true}, 
     {"name": "Integración con Google Calendar", "included": true}, 
     {"name": "Soporte prioritario", "included": true}, 
     {"name": "Generación de planes avanzados con IA", "included": true}]'::jsonb, 
   true);

-- Crear función para manejar nuevos usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente cuando se crea un usuario
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Configurar políticas de seguridad para las tablas de analítica
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver sus propias métricas" ON analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden crear sus propias métricas" ON analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar sus propias métricas" ON analytics
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden eliminar sus propias métricas" ON analytics
  FOR DELETE USING (auth.uid() = user_id);

-- Configurar políticas de seguridad para la tabla de insights
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver sus propios insights" ON ai_insights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden crear sus propios insights" ON ai_insights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar sus propios insights" ON ai_insights
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden eliminar sus propios insights" ON ai_insights
  FOR DELETE USING (auth.uid() = user_id); 