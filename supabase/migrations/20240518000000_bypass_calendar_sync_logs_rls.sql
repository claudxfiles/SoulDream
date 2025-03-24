-- Desactivar temporalmente RLS en la tabla calendar_sync_logs
-- NOTA: Esta es una solución temporal y debe revertirse una vez solucionado el problema de autenticación

-- Guardar el estado actual de RLS
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = 'calendar_sync_logs' AND rowsecurity = true
    ) THEN
        -- Guardar en una tabla temporal que tenía RLS activado
        CREATE TABLE IF NOT EXISTS _rls_status (
            table_name text PRIMARY KEY,
            rls_enabled boolean,
            backup_date timestamp with time zone DEFAULT now()
        );
        
        INSERT INTO _rls_status (table_name, rls_enabled)
        VALUES ('calendar_sync_logs', true)
        ON CONFLICT (table_name) DO NOTHING;
    END IF;
END
$$;

-- Desactivar RLS para la tabla
ALTER TABLE calendar_sync_logs DISABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas existentes para evitar confusiones
DROP POLICY IF EXISTS "Users can view their own sync logs" ON calendar_sync_logs;
DROP POLICY IF EXISTS "Users can insert their own sync logs" ON calendar_sync_logs;
DROP POLICY IF EXISTS "Users can update their own sync logs" ON calendar_sync_logs;
DROP POLICY IF EXISTS "Users can delete their own sync logs" ON calendar_sync_logs;
DROP POLICY IF EXISTS "Authenticated users can insert sync logs temporary" ON calendar_sync_logs;

-- Comentario para revertir estos cambios después
-- Para revertir: ALTER TABLE calendar_sync_logs ENABLE ROW LEVEL SECURITY;
-- Luego recrear las políticas necesarias 