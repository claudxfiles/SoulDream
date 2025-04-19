-- Asegurar que los índices necesarios existen para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_paypal_events_log_subscription_id ON paypal_events_log(subscription_id);
CREATE INDEX IF NOT EXISTS idx_paypal_events_log_processed_at ON paypal_events_log(processed_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paypal_subscription_id ON subscriptions(paypal_subscription_id);

-- Crear tabla de logs si no existe
CREATE TABLE IF NOT EXISTS subscription_update_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id TEXT NOT NULL,
    trigger_event_id UUID NOT NULL,
    old_status TEXT,
    new_status TEXT,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    success BOOLEAN DEFAULT false
);

-- Función del trigger mejorada
CREATE OR REPLACE FUNCTION update_subscription_from_log()
RETURNS TRIGGER AS $$
DECLARE
    v_old_status TEXT;
    v_new_status TEXT;
    v_error TEXT;
    v_success BOOLEAN := false;
    v_subscription_exists BOOLEAN;
BEGIN
    -- Verificar si la suscripción existe antes de proceder
    SELECT EXISTS(
        SELECT 1 FROM subscriptions 
        WHERE paypal_subscription_id = NEW.subscription_id
    ) INTO v_subscription_exists;
    
    IF NOT v_subscription_exists THEN
        v_error := 'La suscripción con ID ' || NEW.subscription_id || ' no existe en la tabla subscriptions';
        
        -- Registrar el error y terminar
        INSERT INTO subscription_update_logs (
            subscription_id,
            trigger_event_id,
            error,
            success
        ) VALUES (
            NEW.subscription_id,
            NEW.id,
            v_error,
            false
        );
        
        RETURN NEW;
    END IF;

    -- Obtener el estado actual antes de la actualización
    SELECT status INTO v_old_status
    FROM subscriptions
    WHERE paypal_subscription_id = NEW.subscription_id;

    -- Evitar procesamiento innecesario si el evento ya fue procesado
    IF EXISTS (
        SELECT 1 FROM subscription_update_logs
        WHERE trigger_event_id = NEW.id AND success = true
    ) THEN
        RETURN NEW; -- Ya procesado, evitar duplicación
    END IF;

    BEGIN
        -- Actualizar la tabla subscriptions basado en los últimos eventos del log
        -- Usando FOR UPDATE SKIP LOCKED para evitar bloqueos en caso de actualizaciones concurrentes
        WITH latest_events AS (
            SELECT DISTINCT ON (subscription_id)
                subscription_id,
                status_after as normalized_status,
                event_type,
                processed_at
            FROM paypal_events_log
            WHERE subscription_id = NEW.subscription_id
            ORDER BY subscription_id, processed_at DESC
            LIMIT 1
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
        WHERE s.paypal_subscription_id = le.subscription_id
        -- Solo actualizar si hay cambios reales para evitar actualizaciones innecesarias
        AND (s.status != le.normalized_status OR 
             s.updated_at < le.processed_at)
        RETURNING le.normalized_status INTO v_new_status;

        -- Si la actualización fue exitosa
        IF v_new_status IS NOT NULL THEN
            v_success := true;
        ELSE
            -- No hubo actualización, pero podría ser porque no hubo cambios necesarios
            SELECT normalized_status INTO v_new_status
            FROM (
                SELECT DISTINCT ON (subscription_id)
                    status_after as normalized_status
                FROM paypal_events_log
                WHERE subscription_id = NEW.subscription_id
                ORDER BY subscription_id, processed_at DESC
                LIMIT 1
            ) subq;
            
            IF v_new_status = v_old_status THEN
                v_error := 'No se requirieron cambios: el estado actual ya coincide con el evento';
                v_success := true; -- Consideramos esto un éxito ya que no se necesitaban cambios
            ELSE
                v_error := 'No se pudo actualizar la suscripción';
                v_success := false;
            END IF;
        END IF;

    EXCEPTION WHEN OTHERS THEN
        v_error := SQLERRM || ' | ' || SQLSTATE;
        v_success := false;
    END;

    -- Registrar el intento de actualización con información más detallada
    INSERT INTO subscription_update_logs (
        subscription_id,
        trigger_event_id,
        old_status,
        new_status,
        error,
        success
    ) VALUES (
        NEW.subscription_id,
        NEW.id,
        v_old_status,
        v_new_status,
        v_error,
        v_success
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger existente y crear el nuevo
DROP TRIGGER IF EXISTS trg_update_subscription_from_log ON paypal_events_log;

CREATE TRIGGER trg_update_subscription_from_log
    AFTER INSERT OR UPDATE ON paypal_events_log
    FOR EACH ROW
    WHEN (NEW.subscription_id IS NOT NULL)  -- Solo ejecutar si hay ID de suscripción
    EXECUTE FUNCTION update_subscription_from_log();

-- Función para actualizar todas las suscripciones con mejor manejo de errores y rendimiento
CREATE OR REPLACE FUNCTION update_all_subscriptions()
RETURNS TABLE (
    updated_count INTEGER,
    execution_time NUMERIC,
    success BOOLEAN,
    error_message TEXT
) AS $$
DECLARE
    v_updated_count INTEGER := 0;
    v_start_time TIMESTAMPTZ;
    v_end_time TIMESTAMPTZ;
    v_error TEXT;
    v_batch_size INTEGER := 100; -- Procesar en lotes para evitar bloqueos prolongados
    v_total_processed INTEGER := 0;
    v_subscription_ids TEXT[];
BEGIN
    v_start_time := NOW();
    
    BEGIN
        -- Obtener todos los IDs de suscripción que necesitan actualizarse
        WITH latest_events AS (
            SELECT DISTINCT ON (subscription_id)
                subscription_id,
                status_after as normalized_status,
                event_type,
                processed_at
            FROM paypal_events_log
            WHERE subscription_id IS NOT NULL
            ORDER BY subscription_id, processed_at DESC
        )
        SELECT array_agg(s.paypal_subscription_id)
        INTO v_subscription_ids
        FROM subscriptions s
        JOIN latest_events le ON s.paypal_subscription_id = le.subscription_id
        WHERE (s.status != le.normalized_status OR s.updated_at < le.processed_at);
        
        -- Si no hay suscripciones para actualizar, terminar
        IF v_subscription_ids IS NULL OR array_length(v_subscription_ids, 1) IS NULL THEN
            RETURN QUERY SELECT 0, EXTRACT(EPOCH FROM (NOW() - v_start_time))::NUMERIC, TRUE, 'No se requieren actualizaciones'::TEXT;
            RETURN;
        END IF;
        
        -- Procesar las suscripciones en lotes
        FOR i IN 1..CEIL(array_length(v_subscription_ids, 1)::FLOAT / v_batch_size) LOOP
            WITH batch_subscriptions AS (
                SELECT unnest(v_subscription_ids[(i-1)*v_batch_size+1:LEAST(i*v_batch_size, array_length(v_subscription_ids, 1))]) AS subscription_id
            ),
            latest_events AS (
                SELECT DISTINCT ON (pel.subscription_id)
                    pel.subscription_id,
                    pel.status_after as normalized_status,
                    pel.event_type,
                    pel.processed_at
                FROM paypal_events_log pel
                JOIN batch_subscriptions bs ON pel.subscription_id = bs.subscription_id
                ORDER BY pel.subscription_id, pel.processed_at DESC
            ),
            updates AS (
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
                WHERE s.paypal_subscription_id = le.subscription_id
                    AND (s.status != le.normalized_status OR s.updated_at < le.processed_at)
                RETURNING 1
            )
            SELECT COUNT(*) INTO v_batch_size FROM updates;
            
            v_updated_count := v_updated_count + v_batch_size;
            v_total_processed := v_total_processed + v_batch_size;
            
            -- Registrar progreso cada 1000 actualizaciones
            IF v_total_processed >= 1000 THEN
                INSERT INTO subscription_update_logs (
                    subscription_id,
                    trigger_event_id,
                    old_status,
                    new_status,
                    success
                ) VALUES (
                    'SCHEDULED_UPDATE_PROGRESS',
                    uuid_generate_v4(),
                    format('Processed %s of %s subscriptions', v_updated_count, array_length(v_subscription_ids, 1)),
                    format('Running for %s seconds', EXTRACT(EPOCH FROM (NOW() - v_start_time))),
                    true
                );
                v_total_processed := 0;
            END IF;
            
            -- Pequeña pausa para reducir carga en la base de datos
            PERFORM pg_sleep(0.1);
        END LOOP;

    EXCEPTION WHEN OTHERS THEN
        v_error := SQLERRM || ' | ' || SQLSTATE;
        
        -- Registrar el error en los logs
        INSERT INTO subscription_update_logs (
            subscription_id,
            trigger_event_id,
            error,
            success
        ) VALUES (
            'SCHEDULED_UPDATE_ERROR',
            uuid_generate_v4(),
            v_error,
            false
        );
        
        RETURN QUERY SELECT v_updated_count, EXTRACT(EPOCH FROM (NOW() - v_start_time))::NUMERIC, FALSE, v_error;
        RETURN;
    END;

    v_end_time := NOW();
    
    -- Registrar el éxito en los logs
    INSERT INTO subscription_update_logs (
        subscription_id,
        trigger_event_id,
        old_status,
        new_status,
        success
    ) VALUES (
        'SCHEDULED_UPDATE_COMPLETE',
        uuid_generate_v4(),
        format('Updated %s subscriptions', v_updated_count),
        format('Total execution time: %s seconds', EXTRACT(EPOCH FROM (v_end_time - v_start_time))),
        true
    );
    
    RETURN QUERY SELECT v_updated_count, EXTRACT(EPOCH FROM (v_end_time - v_start_time))::NUMERIC, TRUE, NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener estadísticas de las actualizaciones
CREATE OR REPLACE FUNCTION get_subscription_update_stats(
    p_days_ago INTEGER DEFAULT 7
)
RETURNS TABLE (
    date_bucket DATE,
    total_updates INTEGER,
    successful_updates INTEGER,
    failed_updates INTEGER,
    avg_execution_time_seconds NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE_TRUNC('day', created_at)::DATE AS date_bucket,
        COUNT(*) AS total_updates,
        SUM(CASE WHEN success THEN 1 ELSE 0 END) AS successful_updates,
        SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) AS failed_updates,
        CASE 
            WHEN subscription_id = 'SCHEDULED_UPDATE_COMPLETE' THEN 
                AVG(EXTRACT(EPOCH FROM (NULLIF(new_status, '')::TEXT)::INTERVAL))
            ELSE NULL
        END AS avg_execution_time_seconds
    FROM subscription_update_logs
    WHERE created_at >= NOW() - (p_days_ago || ' days')::INTERVAL
    GROUP BY 1
    ORDER BY 1 DESC;
END;
$$ LANGUAGE plpgsql;