-- Agregar la columna plan_id a la tabla subscriptions
ALTER TABLE subscriptions
ADD COLUMN plan_id UUID REFERENCES subscription_plans(id);

-- Agregar un índice para mejorar el rendimiento de las consultas
CREATE INDEX idx_subscriptions_plan_id ON subscriptions(plan_id);

-- Actualizar las suscripciones existentes con el plan_id correspondiente
UPDATE subscriptions s
SET plan_id = sp.id
FROM subscription_plans sp
WHERE s.plan_type = sp.interval;

-- Hacer la columna plan_id NOT NULL después de actualizar los datos existentes
ALTER TABLE subscriptions
ALTER COLUMN plan_id SET NOT NULL; 