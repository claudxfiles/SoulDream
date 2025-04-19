-- Asegurar que existe el tipo enum para estados de suscripción
DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM (
        'Activo',
        'Desactivado'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Eliminar tablas si existen para recrearlas correctamente
DROP TABLE IF EXISTS paypal_events_log CASCADE;
DROP TABLE IF EXISTS paypal_events CASCADE;

-- Crear tabla paypal_events (tabla principal de eventos)
CREATE TABLE paypal_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    subscription_id TEXT NOT NULL,
    plan_id TEXT,
    status TEXT,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_subscription_event UNIQUE (subscription_id, event_type, processed_at)
);

-- Crear tabla paypal_events_log (log detallado de cambios de estado)
CREATE TABLE paypal_events_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES paypal_events(id) ON DELETE CASCADE,
    subscription_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    status_before subscription_status,
    status_after subscription_status,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_subscription_event 
        FOREIGN KEY (subscription_id, event_type, processed_at) 
        REFERENCES paypal_events(subscription_id, event_type, processed_at)
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_paypal_events_subscription_id 
ON paypal_events(subscription_id);

CREATE INDEX IF NOT EXISTS idx_paypal_events_event_type 
ON paypal_events(event_type);

CREATE INDEX IF NOT EXISTS idx_paypal_events_processed_at 
ON paypal_events(processed_at DESC);

CREATE INDEX IF NOT EXISTS idx_paypal_events_log_subscription_id 
ON paypal_events_log(subscription_id);

CREATE INDEX IF NOT EXISTS idx_paypal_events_log_event_type 
ON paypal_events_log(event_type);

CREATE INDEX IF NOT EXISTS idx_paypal_events_log_processed_at 
ON paypal_events_log(processed_at DESC);

CREATE INDEX IF NOT EXISTS idx_paypal_events_log_event_id
ON paypal_events_log(event_id);

-- Crear función para actualizar el timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers para actualizar automáticamente updated_at
CREATE TRIGGER update_paypal_events_updated_at
    BEFORE UPDATE ON paypal_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_paypal_events_log_updated_at
    BEFORE UPDATE ON paypal_events_log
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Agregar comentarios a las tablas
COMMENT ON TABLE paypal_events IS 'Almacena todos los eventos recibidos de PayPal';
COMMENT ON TABLE paypal_events_log IS 'Registra los cambios de estado de las suscripciones de PayPal';

-- Agregar comentarios a las columnas de paypal_events
COMMENT ON COLUMN paypal_events.id IS 'Identificador único UUID del evento';
COMMENT ON COLUMN paypal_events.event_type IS 'Tipo de evento recibido de PayPal (ej: BILLING.SUBSCRIPTION.CREATED)';
COMMENT ON COLUMN paypal_events.subscription_id IS 'ID de la suscripción de PayPal';
COMMENT ON COLUMN paypal_events.plan_id IS 'ID del plan de suscripción';
COMMENT ON COLUMN paypal_events.status IS 'Estado actual de la suscripción';
COMMENT ON COLUMN paypal_events.raw_data IS 'Datos completos del evento en formato JSON';
COMMENT ON COLUMN paypal_events.processed_at IS 'Fecha y hora cuando se procesó el evento';

-- Agregar comentarios a las columnas de paypal_events_log
COMMENT ON COLUMN paypal_events_log.id IS 'Identificador único UUID del registro de log';
COMMENT ON COLUMN paypal_events_log.event_id IS 'Referencia al evento original en paypal_events';
COMMENT ON COLUMN paypal_events_log.event_type IS 'Tipo de evento que causó el cambio de estado';
COMMENT ON COLUMN paypal_events_log.status_before IS 'Estado de la suscripción antes del cambio';
COMMENT ON COLUMN paypal_events_log.status_after IS 'Estado de la suscripción después del cambio';
COMMENT ON COLUMN paypal_events_log.raw_data IS 'Datos completos del evento en formato JSON';
COMMENT ON COLUMN paypal_events_log.processed_at IS 'Fecha y hora cuando se procesó el cambio de estado';

-- Función para insertar un evento y su log
CREATE OR REPLACE FUNCTION insert_paypal_event(
    p_event_type TEXT,
    p_subscription_id TEXT,
    p_plan_id TEXT,
    p_status TEXT,
    p_raw_data JSONB,
    p_status_before subscription_status DEFAULT NULL,
    p_status_after subscription_status DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_event_id UUID;
BEGIN
    -- Insertar en paypal_events
    INSERT INTO paypal_events (
        event_type,
        subscription_id,
        plan_id,
        status,
        raw_data
    ) VALUES (
        p_event_type,
        p_subscription_id,
        p_plan_id,
        p_status,
        p_raw_data
    ) RETURNING id INTO v_event_id;

    -- Insertar en paypal_events_log
    INSERT INTO paypal_events_log (
        event_id,
        subscription_id,
        event_type,
        status_before,
        status_after,
        raw_data,
        processed_at
    ) VALUES (
        v_event_id,
        p_subscription_id,
        p_event_type,
        p_status_before,
        p_status_after,
        p_raw_data,
        NOW()
    );

    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql;

-- TRIGGER PARA NORMALIZAR DATOS Y CREAR LOG
CREATE OR REPLACE FUNCTION insert_and_normalize_paypal_event_log()
RETURNS TRIGGER AS $$
DECLARE
    v_status_normalized subscription_status;
    v_status_before subscription_status;
BEGIN
    -- Normalizar el estado basado en el tipo de evento
    v_status_normalized := CASE 
        WHEN NEW.event_type = 'BILLING.SUBSCRIPTION.CANCELLED' THEN 'Desactivado'
        WHEN NEW.event_type = 'BILLING.SUBSCRIPTION.ACTIVATED' THEN 'Activo'
        WHEN NEW.event_type = 'BILLING.SUBSCRIPTION.SUSPENDED' THEN 'Desactivado'
        WHEN NEW.event_type = 'BILLING.SUBSCRIPTION.EXPIRED' THEN 'Desactivado'
        WHEN NEW.event_type = 'BILLING.SUBSCRIPTION.CREATED' THEN 'Activo'
        ELSE 'Activo'
    END::subscription_status;
    
    -- Obtener el estado anterior de la tabla subscriptions
    SELECT status::subscription_status INTO v_status_before
    FROM subscriptions
    WHERE paypal_subscription_id = NEW.subscription_id;
    
    -- Insertar en paypal_events_log con estados normalizados
    INSERT INTO paypal_events_log (
        event_id,
        subscription_id,
        event_type,
        status_before,
        status_after,
        processed_at,
        raw_data
    ) VALUES (
        NEW.id,
        NEW.subscription_id,
        NEW.event_type,
        v_status_before,
        v_status_normalized,
        COALESCE(NEW.processed_at, NOW()),
        NEW.raw_data
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger si existe y crear nuevo
DROP TRIGGER IF EXISTS trg_insert_and_normalize_paypal_event_log ON paypal_events;

CREATE TRIGGER trg_insert_and_normalize_paypal_event_log
    AFTER INSERT ON paypal_events
    FOR EACH ROW
    EXECUTE FUNCTION insert_and_normalize_paypal_event_log();

-- TRIGGER PARA ACTUALIZAR SUBSCRIPTIONS DESDE paypal_events_log
CREATE OR REPLACE FUNCTION update_subscription_from_log()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar la tabla subscriptions cuando hay un nuevo registro en paypal_events_log
    IF NEW.event_type IN (
        'BILLING.SUBSCRIPTION.CANCELLED',
        'BILLING.SUBSCRIPTION.ACTIVATED',
        'BILLING.SUBSCRIPTION.SUSPENDED',
        'BILLING.SUBSCRIPTION.EXPIRED'
    ) THEN
        UPDATE subscriptions
        SET 
            status = NEW.status_after::text,
            updated_at = COALESCE(NEW.processed_at, NOW()),
            cancel_at_period_end = CASE 
                WHEN NEW.event_type = 'BILLING.SUBSCRIPTION.CANCELLED' THEN true
                ELSE cancel_at_period_end
            END
        WHERE paypal_subscription_id = NEW.subscription_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger si existe y crear nuevo
DROP TRIGGER IF EXISTS trg_update_subscription_from_log ON paypal_events_log;

CREATE TRIGGER trg_update_subscription_from_log
    AFTER INSERT ON paypal_events_log
    FOR EACH ROW
    EXECUTE FUNCTION update_subscription_from_log();

-- 3. FUNCIÓN PARA MIGRAR DATOS EXISTENTES DE paypal_events A paypal_events_log
CREATE OR REPLACE FUNCTION migrate_existing_events()
RETURNS void AS $$
DECLARE
    rec RECORD;
    v_status_normalized subscription_status;
    v_status_before subscription_status;
BEGIN
    -- Procesar cada evento no migrado
    FOR rec IN (
        SELECT pe.*
        FROM paypal_events pe
        LEFT JOIN paypal_events_log pel ON pe.id = pel.event_id
        WHERE pel.id IS NULL
        ORDER BY pe.id
    )
    LOOP
        -- Normalizar el estado
        v_status_normalized := CASE 
            WHEN rec.event_type = 'BILLING.SUBSCRIPTION.CANCELLED' THEN 'Desactivado'
            WHEN rec.event_type = 'BILLING.SUBSCRIPTION.ACTIVATED' THEN 'Activo'
            WHEN rec.event_type = 'BILLING.SUBSCRIPTION.SUSPENDED' THEN 'Desactivado'
            WHEN rec.event_type = 'BILLING.SUBSCRIPTION.EXPIRED' THEN 'Desactivado'
            WHEN rec.event_type = 'BILLING.SUBSCRIPTION.CREATED' THEN 'Activo'
            ELSE 'Activo'
        END::subscription_status;
        
        -- Obtener el estado anterior
        SELECT status::subscription_status INTO v_status_before
        FROM subscriptions
        WHERE paypal_subscription_id = rec.subscription_id;
        
        -- Insertar en paypal_events_log
        INSERT INTO paypal_events_log (
            event_id,
            subscription_id,
            event_type,
            status_before,
            status_after,
            processed_at,
            raw_data
        ) VALUES (
            rec.id,
            rec.subscription_id,
            rec.event_type,
            v_status_before,
            v_status_normalized,
            rec.processed_at,
            rec.raw_data
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 4. FUNCIÓN PARA CORREGIR SUSCRIPCIONES EXISTENTES
CREATE OR REPLACE FUNCTION fix_existing_subscriptions()
RETURNS void AS $$
DECLARE
    rec RECORD;
BEGIN
    -- Buscar el último evento para cada suscripción y actualizar
    FOR rec IN (
        SELECT DISTINCT ON (pel.subscription_id) 
            pel.subscription_id, 
            pel.event_type,
            pel.status_after,
            pel.processed_at
        FROM paypal_events_log pel
        WHERE pel.event_type IN (
            'BILLING.SUBSCRIPTION.CANCELLED',
            'BILLING.SUBSCRIPTION.ACTIVATED',
            'BILLING.SUBSCRIPTION.SUSPENDED',
            'BILLING.SUBSCRIPTION.EXPIRED'
        )
        ORDER BY pel.subscription_id, pel.processed_at DESC
    )
    LOOP
        UPDATE subscriptions
        SET 
            status = rec.status_after::text,
            updated_at = rec.processed_at,
            cancel_at_period_end = CASE 
                WHEN rec.event_type = 'BILLING.SUBSCRIPTION.CANCELLED' THEN true
                ELSE cancel_at_period_end
            END
        WHERE paypal_subscription_id = rec.subscription_id
        AND status != rec.status_after::text;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Función para reiniciar y reordenar los IDs
CREATE OR REPLACE FUNCTION reset_and_reorder_paypal_events()
RETURNS void AS $$
DECLARE
    temp_table_name TEXT;
    max_id UUID;
BEGIN
    -- Crear tabla temporal con nuevo orden
    temp_table_name := 'temp_paypal_events_' || floor(random() * 1000000)::text;
    
    EXECUTE format('
        CREATE TABLE %I AS 
        SELECT 
            ROW_NUMBER() OVER (ORDER BY processed_at, id) AS new_id,
            event_type,
            subscription_id,
            plan_id,
            status,
            processed_at,
            raw_data,
            created_at,
            updated_at
        FROM paypal_events
        ORDER BY processed_at, id;
    ', temp_table_name);

    -- Vaciar tabla original
    TRUNCATE TABLE paypal_events CASCADE;

    -- Insertar datos reordenados
    EXECUTE format('
        INSERT INTO paypal_events (
            id, event_type, subscription_id, plan_id, status, 
            processed_at, raw_data, created_at, updated_at
        )
        SELECT 
            new_id, event_type, subscription_id, plan_id, status,
            processed_at, raw_data, created_at, updated_at
        FROM %I
        ORDER BY new_id;
    ', temp_table_name);

    -- Obtener el máximo ID con valor por defecto
    EXECUTE format('
        SELECT COALESCE(MAX(new_id), ''00000000-0000-0000-0000-000000000000'') 
        FROM %I
    ', temp_table_name) INTO max_id;

    -- Reiniciar la secuencia con valor por defecto
    IF max_id IS NOT NULL AND max_id != '00000000-0000-0000-0000-000000000000' THEN
        EXECUTE 'ALTER SEQUENCE paypal_events_id_seq RESTART WITH ' || max_id;
    ELSE
        EXECUTE 'ALTER SEQUENCE paypal_events_id_seq RESTART WITH ''00000000-0000-0000-0000-000000000000''';
    END IF;

    -- Eliminar tabla temporal
    EXECUTE format('DROP TABLE %I', temp_table_name);
END;
$$ LANGUAGE plpgsql;

-- Función para migrar datos a paypal_events_log
CREATE OR REPLACE FUNCTION migrate_paypal_events_to_log()
RETURNS void AS $$
BEGIN
    -- Primero reiniciamos y reordenamos los IDs
    PERFORM reset_and_reorder_paypal_events();
    
    -- Luego migramos los datos al log
    TRUNCATE TABLE paypal_events_log;
    
    -- Ejecutar la migración
    PERFORM migrate_existing_events();
    
    -- Reiniciar la secuencia de paypal_events_log con manejo de NULL
    EXECUTE 'SELECT setval(''paypal_events_log_id_seq'', COALESCE((SELECT MAX(id) FROM paypal_events_log), ''00000000-0000-0000-0000-000000000000'') + 1, false)';
END;
$$ LANGUAGE plpgsql;

-- Ejecutar la migración completa
SELECT migrate_paypal_events_to_log();

-- Verificar resultados
SELECT 
    (SELECT COUNT(*) FROM paypal_events) as total_events,
    (SELECT COUNT(*) FROM paypal_events_log) as total_logs,
    (SELECT COALESCE(MIN(id), ''00000000-0000-0000-0000-000000000000'') FROM paypal_events) as min_event_id,
    (SELECT COALESCE(MAX(id), ''00000000-0000-0000-0000-000000000000'') FROM paypal_events) as max_event_id,
    (SELECT COALESCE(MIN(id), ''00000000-0000-0000-0000-000000000000'') FROM paypal_events_log) as min_log_id,
    (SELECT COALESCE(MAX(id), ''00000000-0000-0000-0000-000000000000'') FROM paypal_events_log) as max_log_id; 