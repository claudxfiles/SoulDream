-- Función para manejar la cancelación de suscripciones
CREATE OR REPLACE FUNCTION handle_subscription_cancellation()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el estado cambia a 'CANCELLED'
    IF NEW.status = 'CANCELLED' AND OLD.status = 'ACTIVE' THEN
        -- Actualizar la fecha de cancelación
        NEW.cancelled_at = CURRENT_TIMESTAMP;
        
        -- Marcar que se cancelará al final del período
        NEW.cancel_at_period_end = TRUE;
        
        -- No modificamos current_period_end para mantener el acceso hasta que termine
        -- el período ya pagado
        
        -- Registrar el evento en payment_history
        INSERT INTO payment_history (
            user_id,
            subscription_id,
            payment_id,
            amount,
            currency,
            status,
            payment_method,
            payment_details
        ) VALUES (
            NEW.user_id,
            NEW.id,
            NEW.paypal_subscription_id,
            0.00,
            'USD',
            'completed',
            'paypal',
            jsonb_build_object(
                'event', 'subscription_cancelled',
                'cancelled_at', NEW.cancelled_at,
                'effective_end_date', NEW.current_period_end
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
DROP TRIGGER IF EXISTS on_subscription_cancellation ON subscriptions;

CREATE TRIGGER on_subscription_cancellation
    BEFORE UPDATE OF status
    ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION handle_subscription_cancellation();

-- Crear una función para procesar webhooks de PayPal
CREATE OR REPLACE FUNCTION process_paypal_webhook(
    webhook_data JSONB
)
RETURNS void AS $$
DECLARE
    subscription_id TEXT;
    event_type TEXT;
BEGIN
    -- Extraer datos relevantes del webhook
    subscription_id := webhook_data->'resource'->>'id';
    event_type := webhook_data->>'event_type';
    
    -- Manejar diferentes tipos de eventos
    IF event_type = 'BILLING.SUBSCRIPTION.CANCELLED' THEN
        -- Actualizar la suscripción
        UPDATE subscriptions
        SET status = 'CANCELLED'
        WHERE paypal_subscription_id = subscription_id
        AND status = 'ACTIVE';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Función para manejar cambios de estado en suscripciones
CREATE OR REPLACE FUNCTION handle_subscription_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el estado cambia a 'EXPIRED' o no se encuentra (404)
    IF NEW.status = 'EXPIRED' OR NEW.status = 'NOT_FOUND' THEN
        -- Actualizar la fecha de expiración
        NEW.expired_at = CURRENT_TIMESTAMP;
        
        -- Registrar el evento en payment_history
        INSERT INTO payment_history (
            user_id,
            subscription_id,
            payment_id,
            amount,
            currency,
            status,
            payment_method,
            payment_details
        ) VALUES (
            NEW.user_id,
            NEW.id,
            NEW.paypal_subscription_id,
            0.00,
            'USD',
            'completed',
            'paypal',
            jsonb_build_object(
                'event', CASE 
                    WHEN NEW.status = 'EXPIRED' THEN 'subscription_expired'
                    ELSE 'subscription_not_found'
                END,
                'expired_at', NEW.expired_at,
                'reason', CASE 
                    WHEN NEW.status = 'NOT_FOUND' THEN '404_not_found'
                    ELSE 'subscription_expired'
                END
            )
        );

        -- Actualizar el perfil del usuario a plan gratuito
        UPDATE profiles
        SET subscription_tier = 'free'
        WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger para cambios de estado
DROP TRIGGER IF EXISTS on_subscription_status_change ON subscriptions;

CREATE TRIGGER on_subscription_status_change
    BEFORE UPDATE OF status
    ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION handle_subscription_status_change();