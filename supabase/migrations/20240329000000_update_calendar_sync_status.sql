-- Actualizar la restricción de sync_status en calendar_events
ALTER TABLE calendar_events 
DROP CONSTRAINT IF EXISTS calendar_events_sync_status_check;

ALTER TABLE calendar_events
ADD CONSTRAINT calendar_events_sync_status_check 
CHECK (sync_status IN ('local', 'synced', 'sync_failed', 'deleted')); 