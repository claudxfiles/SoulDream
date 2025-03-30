-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    interval VARCHAR(20) NOT NULL, -- 'monthly', 'yearly'
    paypal_plan_id VARCHAR(255) NOT NULL UNIQUE,
    features JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES subscription_plans(id),
    paypal_subscription_id VARCHAR(255) UNIQUE,
    status VARCHAR(50) NOT NULL, -- 'APPROVAL_PENDING', 'ACTIVE', 'CANCELLED', 'EXPIRED'
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment_history table
CREATE TABLE IF NOT EXISTS payment_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id),
    payment_id VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Policies for subscription_plans (viewable by all)
CREATE POLICY "subscription_plans_view_all" ON subscription_plans
    FOR SELECT USING (true);

-- Policies for subscriptions
CREATE POLICY "subscriptions_view_own" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "subscriptions_insert_own" ON subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "subscriptions_update_own" ON subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Policies for payment_history
CREATE POLICY "payment_history_view_own" ON payment_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "payment_history_insert_own" ON payment_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert the subscription plans
INSERT INTO subscription_plans (name, description, price, interval, paypal_plan_id, features) VALUES
(
    'SoulDream Pro Monthly',
    'Acceso completo a SoulDream',
    14.99,
    'monthly',
    'P-5ML4271244454362AMXYZK6Y', -- Reemplaza con tu ID de plan real de PayPal
    jsonb_build_array(
        'Tareas, metas y hábitos ilimitados',
        'Asistente IA personalizado 24/7',
        'Gestión financiera completa',
        'Integración con Google Calendar',
        'Analítica avanzada y reportes',
        'Plan de activos financieros',
        'Workout personalizado con IA',
        'Soporte prioritario'
    )
),
(
    'SoulDream Pro Yearly',
    'Acceso completo a SoulDream',
    120.00,
    'yearly',
    'P-86V33535FL4277727MXYZKTA', -- Reemplaza con tu ID de plan real de PayPal
    jsonb_build_array(
        'Tareas, metas y hábitos ilimitados',
        'Asistente IA personalizado 24/7',
        'Gestión financiera completa',
        'Integración con Google Calendar',
        'Analítica avanzada y reportes',
        'Plan de activos financieros',
        'Workout personalizado con IA',
        'Soporte prioritario',
        'Ahorra 33.32% comparado con el plan mensual'
    )
); 