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

-- Reconfigurar RLS para calendar_sync_logs
-- Primero desactivamos RLS temporalmente para limpiar las políticas
ALTER TABLE calendar_sync_logs DISABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas existentes de forma segura
DO $$ 
BEGIN
    -- Intentar eliminar cada política individualmente
    BEGIN
        DROP POLICY IF EXISTS "Users can view their own sync logs" ON calendar_sync_logs;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Users can insert their own sync logs" ON calendar_sync_logs;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Users can update their own sync logs" ON calendar_sync_logs;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Users can delete their own sync logs" ON calendar_sync_logs;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Authenticated users can insert sync logs temporary" ON calendar_sync_logs;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
END $$;

-- Volver a activar RLS
ALTER TABLE calendar_sync_logs ENABLE ROW LEVEL SECURITY;

-- Crear las nuevas políticas
CREATE POLICY "Users can view their own sync logs"
ON calendar_sync_logs FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync logs"
ON calendar_sync_logs FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sync logs"
ON calendar_sync_logs FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sync logs"
ON calendar_sync_logs FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Asegurar que los usuarios autenticados tienen los permisos necesarios
GRANT SELECT, INSERT, UPDATE, DELETE ON calendar_sync_logs TO authenticated; 