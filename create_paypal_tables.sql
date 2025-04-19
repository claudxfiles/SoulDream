-- TRIGGER PARA ACTUALIZAR SUBSCRIPTIONS DESDE paypal_events_log
CREATE OR REPLACE FUNCTION update_subscription_from_log()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar la tabla subscriptions basado en los últimos eventos del log
    WITH latest_events AS (
        SELECT DISTINCT ON (subscription_id)
            subscription_id,
            status_after as normalized_status,
            event_type,
            processed_at
        FROM paypal_events_log
        WHERE subscription_id = NEW.subscription_id
        ORDER BY subscription_id, processed_at DESC
    )
    UPDATE subscriptions s
    SET 
        status = le.normalized_status,
        updated_at = NOW(),
        cancel_at_period_end = CASE 
            WHEN le.event_type IN (
                'BILLING.SUBSCRIPTION.CANCELLED',
                'SUBSCRIPTION_CANCELLED_UNMATCHED'
            ) THEN true
            WHEN le.event_type IN (
                'BILLING.SUBSCRIPTION.ACTIVATED',
                'BILLING.SUBSCRIPTION.CREATED',
                'BILLING.SUBSCRIPTION.SUSPENDED',
                'BILLING.SUBSCRIPTION.EXPIRED',
                'BILLING.SUBSCRIPTION.RENEWED',
                'BILLING.SUBSCRIPTION.RE-ACTIVATED'
            ) THEN false
            ELSE s.cancel_at_period_end
        END
    FROM latest_events le
    WHERE s.paypal_subscription_id = le.subscription_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger si existe y crear nuevo
DROP TRIGGER IF EXISTS trg_update_subscription_from_log ON paypal_events_log;

CREATE TRIGGER trg_update_subscription_from_log
    AFTER INSERT ON paypal_events_log
    FOR EACH ROW
    EXECUTE FUNCTION update_subscription_from_log();

-- Función para actualizar todas las suscripciones existentes
CREATE OR REPLACE FUNCTION update_all_subscriptions()
RETURNS void AS $$
BEGIN
    -- Actualizar la tabla subscriptions basado en los últimos eventos del log
    WITH latest_events AS (
        SELECT DISTINCT ON (subscription_id)
            subscription_id,
            status_after as normalized_status,
            event_type,
            processed_at
        FROM paypal_events_log
        ORDER BY subscription_id, processed_at DESC
    )
    UPDATE subscriptions s
    SET 
        status = le.normalized_status,
        updated_at = NOW(),
        cancel_at_period_end = CASE 
            WHEN le.event_type IN (
                'BILLING.SUBSCRIPTION.CANCELLED',
                'SUBSCRIPTION_CANCELLED_UNMATCHED'
            ) THEN true
            WHEN le.event_type IN (
                'BILLING.SUBSCRIPTION.ACTIVATED',
                'BILLING.SUBSCRIPTION.CREATED',
                'BILLING.SUBSCRIPTION.SUSPENDED',
                'BILLING.SUBSCRIPTION.EXPIRED',
                'BILLING.SUBSCRIPTION.RENEWED',
                'BILLING.SUBSCRIPTION.RE-ACTIVATED'
            ) THEN false
            ELSE s.cancel_at_period_end
        END
    FROM latest_events le
    WHERE s.paypal_subscription_id = le.subscription_id;
END;
$$ LANGUAGE plpgsql; 