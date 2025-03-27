-- Crear extensión UUID si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear tipo enum para frecuencia si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'habit_frequency') THEN
        CREATE TYPE habit_frequency AS ENUM ('daily', 'weekly', 'monthly', 'custom');
    END IF;
END$$;

-- Eliminar tabla si existe (para recrearla)
DROP TABLE IF EXISTS habits CASCADE;

-- Crear tabla habits
CREATE TABLE habits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    frequency habit_frequency NOT NULL DEFAULT 'daily',
    specific_days INTEGER[] DEFAULT NULL,
    goal_value INTEGER DEFAULT 1,
    category TEXT,
    reminder_time TEXT,
    cue TEXT,
    reward TEXT,
    current_streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    total_completions INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    is_active BOOLEAN DEFAULT TRUE,
    related_goal_id UUID
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_habits_user_id ON habits(user_id);
CREATE INDEX idx_habits_is_active ON habits(is_active);
CREATE INDEX idx_habits_category ON habits(category);

-- Habilitar Row Level Security
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY "Los usuarios pueden ver sus propios hábitos"
    ON habits FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden crear sus propios hábitos"
    ON habits FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar sus propios hábitos"
    ON habits FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden eliminar sus propios hábitos"
    ON habits FOR DELETE
    USING (auth.uid() = user_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at
CREATE TRIGGER update_habits_updated_at
    BEFORE UPDATE ON habits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentarios para documentación
COMMENT ON TABLE habits IS 'Tabla para almacenar los hábitos de los usuarios';
COMMENT ON COLUMN habits.title IS 'Título o nombre del hábito';
COMMENT ON COLUMN habits.description IS 'Descripción detallada del hábito';
COMMENT ON COLUMN habits.frequency IS 'Frecuencia del hábito (daily, weekly, monthly, custom)';
COMMENT ON COLUMN habits.specific_days IS 'Días específicos para hábitos semanales [0-6] donde 0 es lunes';
COMMENT ON COLUMN habits.goal_value IS 'Valor objetivo para el hábito (ej: 10 flexiones)';
COMMENT ON COLUMN habits.category IS 'Categoría del hábito (ej: salud, productividad, etc)';
COMMENT ON COLUMN habits.reminder_time IS 'Hora del día para el recordatorio (formato HH:MM)';
COMMENT ON COLUMN habits.cue IS 'La señal o disparador que inicia el hábito';
COMMENT ON COLUMN habits.reward IS 'La recompensa asociada al completar el hábito';
COMMENT ON COLUMN habits.current_streak IS 'Racha actual del hábito';
COMMENT ON COLUMN habits.best_streak IS 'Mejor racha histórica del hábito';
COMMENT ON COLUMN habits.total_completions IS 'Número total de veces que se ha completado el hábito';
COMMENT ON COLUMN habits.is_active IS 'Indica si el hábito está activo o ha sido eliminado (soft delete)';
COMMENT ON COLUMN habits.related_goal_id IS 'ID de la meta relacionada con este hábito'; 