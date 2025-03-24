-- Mejorar la tabla calendar_events con soporte para eventos recurrentes
ALTER TABLE calendar_events 
ADD COLUMN IF NOT EXISTS recurrence_rule TEXT, -- Regla RRULE para eventos recurrentes
ADD COLUMN IF NOT EXISTS recurrence_id UUID REFERENCES calendar_events(id), -- Para vincular instancias con evento original
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS google_event_id TEXT, -- ID del evento en Google Calendar
ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'local', -- local, synced, sync_failed, deleted
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS related_id UUID, -- ID de la entidad relacionada (tarea, meta, etc.)
ADD COLUMN IF NOT EXISTS related_type TEXT; -- task, goal, habit, workout

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS calendar_events_google_id_idx ON calendar_events(google_event_id);
CREATE INDEX IF NOT EXISTS calendar_events_recurrence_id_idx ON calendar_events(recurrence_id);
CREATE INDEX IF NOT EXISTS calendar_events_related_id_type_idx ON calendar_events(related_id, related_type);

-- Crear tabla calendar_event_relations para relaciones entre eventos y otras entidades
CREATE TABLE IF NOT EXISTS calendar_event_relations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    google_event_id TEXT,
    local_event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
    goal_id UUID, -- Sin referencia para evitar errores si la tabla no existe
    task_id UUID, -- Sin referencia para evitar errores si la tabla no existe
    habit_id UUID, -- Sin referencia para evitar errores si la tabla no existe
    workout_id UUID, -- Sin referencia para evitar errores si la tabla no existe
    event_title TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    sync_status TEXT DEFAULT 'synced',
    sync_error TEXT
);

-- Enable Row Level Security para la nueva tabla
ALTER TABLE calendar_event_relations ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY "Users can insert their own calendar event relations"
ON calendar_event_relations FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own calendar event relations"
ON calendar_event_relations FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar event relations"
ON calendar_event_relations FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar event relations"
ON calendar_event_relations FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Función y trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_calendar_event_relations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_calendar_event_relations_updated_at
BEFORE UPDATE ON calendar_event_relations
FOR EACH ROW
EXECUTE FUNCTION update_calendar_event_relations_updated_at();

-- Crear tabla para sincronización de eventos
CREATE TABLE IF NOT EXISTS calendar_sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sync_type TEXT NOT NULL, -- 'push', 'pull', 'manual', 'auto'
    status TEXT NOT NULL, -- 'success', 'partial', 'failed'
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    events_created INTEGER DEFAULT 0,
    events_updated INTEGER DEFAULT 0,
    events_deleted INTEGER DEFAULT 0,
    error_message TEXT,
    error_details JSONB
);

-- Enable Row Level Security
ALTER TABLE calendar_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sync logs"
ON calendar_sync_logs FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync logs"
ON calendar_sync_logs FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id); 