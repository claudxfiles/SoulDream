-- Crear un tipo enum para los estados de suscripción si no existe
DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM (
        'active',
        'cancelled',
        'suspended',
        'expired',
        'pending'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Crear la tabla de log de eventos si no existe
CREATE TABLE IF NOT EXISTS paypal_events_log (
    id SERIAL PRIMARY KEY,
    subscription_id TEXT,
    event_type TEXT NOT NULL,
    status_before subscription_status,
    status_after subscription_status,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    raw_data JSONB
);

-- Función para mapear eventos de PayPal a estados de suscripción
CREATE OR REPLACE FUNCTION get_subscription_status_from_event(event_type TEXT)
RETURNS subscription_status AS $$
BEGIN
    RETURN CASE
        WHEN event_type = 'BILLING.SUBSCRIPTION.ACTIVATED' THEN 'active'::subscription_status
        WHEN event_type = 'BILLING.SUBSCRIPTION.CANCELLED' THEN 'cancelled'::subscription_status
        WHEN event_type = 'BILLING.SUBSCRIPTION.SUSPENDED' THEN 'suspended'::subscription_status
        WHEN event_type = 'BILLING.SUBSCRIPTION.EXPIRED' THEN 'expired'::subscription_status
        WHEN event_type = 'BILLING.SUBSCRIPTION.CREATED' THEN 'pending'::subscription_status
        ELSE NULL
    END;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar suscripciones basada en eventos
CREATE OR REPLACE FUNCTION update_subscription_from_event()
RETURNS TRIGGER AS $$
DECLARE
    new_status subscription_status;
    current_status subscription_status;
BEGIN
    -- Obtener el nuevo estado basado en el evento
    new_status := get_subscription_status_from_event(NEW.event_type);
    
    -- Si no podemos determinar el nuevo estado, salir
    IF new_status IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Obtener el estado actual de la suscripción
    SELECT status::subscription_status INTO current_status
    FROM subscriptions
    WHERE paypal_subscription_id = NEW.subscription_id;
    
    -- Guardar el estado anterior en el log
    NEW.status_before := current_status;
    NEW.status_after := new_status;
    
    -- Actualizar la suscripción
    UPDATE subscriptions
    SET 
        status = new_status,
        updated_at = NEW.processed_at,
        cancel_at_period_end = CASE 
            WHEN NEW.event_type = 'BILLING.SUBSCRIPTION.CANCELLED' THEN true
            ELSE false
        END
    WHERE paypal_subscription_id = NEW.subscription_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar el trigger si existe
DROP TRIGGER IF EXISTS subscription_event_trigger ON paypal_events_log;

-- Crear el trigger
CREATE TRIGGER subscription_event_trigger
    BEFORE INSERT ON paypal_events_log
    FOR EACH ROW
    EXECUTE FUNCTION update_subscription_from_event();

-- Eliminar la función existente si existe
DROP FUNCTION IF EXISTS sync_subscriptions_with_events_log();

-- Función para sincronizar manualmente todas las suscripciones
CREATE OR REPLACE FUNCTION sync_subscriptions_with_events_log()
RETURNS TABLE (
    subscription_id text,
    old_status text,
    new_status text,
    event_type text,
    processed_at timestamp with time zone
) AS $$
BEGIN
    RETURN QUERY
    WITH latest_events AS (
        SELECT DISTINCT ON (pel.subscription_id)
            pel.subscription_id,
            pel.event_type,
            pel.status_after,
            pel.processed_at,
            s.status as current_status
        FROM paypal_events_log pel
        LEFT JOIN subscriptions s ON s.paypal_subscription_id = pel.subscription_id
        WHERE pel.event_type IN (
            'BILLING.SUBSCRIPTION.CANCELLED',
            'BILLING.SUBSCRIPTION.ACTIVATED',
            'BILLING.SUBSCRIPTION.SUSPENDED',
            'BILLING.SUBSCRIPTION.EXPIRED',
            'BILLING.SUBSCRIPTION.CREATED'
        )
        ORDER BY pel.subscription_id, pel.processed_at DESC
    )
    UPDATE subscriptions s
    SET
        status = le.status_after::text::subscription_status,
        updated_at = le.processed_at,
        cancel_at_period_end = CASE 
            WHEN le.event_type = 'BILLING.SUBSCRIPTION.CANCELLED' THEN true
            ELSE false
        END
    FROM latest_events le
    WHERE s.paypal_subscription_id = le.subscription_id
    AND s.status IS DISTINCT FROM le.status_after::text
    RETURNING 
        s.paypal_subscription_id,
        s.status as old_status,
        le.status_after as new_status,
        le.event_type,
        le.processed_at;
END;
$$ LANGUAGE plpgsql;

-- Crear un índice para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_paypal_events_log_subscription_id_processed_at 
ON paypal_events_log(subscription_id, processed_at DESC);

-- Comentario explicativo
COMMENT ON FUNCTION update_subscription_from_event() IS 
'Trigger function que actualiza automáticamente el estado de las suscripciones 
basándose en los eventos de PayPal recibidos. Mantiene un registro del estado 
anterior y posterior en la tabla paypal_events_log.'; 