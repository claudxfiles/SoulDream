-- Actualizar la restricción de la columna type en calendar_events
ALTER TABLE calendar_events 
DROP CONSTRAINT IF EXISTS calendar_events_type_check;

ALTER TABLE calendar_events
ADD CONSTRAINT calendar_events_type_check 
CHECK (type IN ('task', 'goal', 'habit', 'workout', 'custom'));

-- Asegurarse de que la columna type existe y tiene el tipo correcto
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'calendar_events' 
        AND column_name = 'type'
    ) THEN
        ALTER TABLE calendar_events ADD COLUMN type TEXT;
    END IF;
END $$; 