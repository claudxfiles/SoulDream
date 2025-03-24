-- Crear tabla de notificaciones si no existe
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('task', 'habit', 'goal', 'finance', 'workout', 'system')) NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  action_url TEXT,
  priority TEXT CHECK (priority IN ('normal', 'high')) DEFAULT 'normal',
  related_entity_id UUID,
  related_entity_type TEXT
);

-- Crear índices para búsquedas eficientes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(type);

-- Habilitar RLS para notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para notifications
CREATE POLICY "Los usuarios pueden ver sus propias notificaciones" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar sus propias notificaciones" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Solo el sistema puede crear notificaciones" ON notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.jwt()->>'role' = 'admin');

CREATE POLICY "Solo el sistema puede eliminar notificaciones" ON notifications
  FOR DELETE USING (auth.uid() = user_id OR auth.jwt()->>'role' = 'admin');

-- NOTE: The "goals" table does not exist yet. This trigger has been commented out.
-- To enable this functionality, first create a "goals" table with the required fields.
/*
-- Trigger para notificar cuando una meta está próxima a vencer
CREATE OR REPLACE FUNCTION notify_goal_deadline_approaching()
RETURNS TRIGGER AS $$
DECLARE
  _days_remaining INTEGER;
BEGIN
  -- Solo proceder si es un INSERT o si la fecha límite cambió en un UPDATE
  IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.target_date <> NEW.target_date)) THEN
    -- Calcular días restantes hasta la fecha límite
    _days_remaining := NEW.target_date::date - CURRENT_DATE;
    
    -- Si faltan 7 días o menos pero más de 0, crear notificación
    IF _days_remaining <= 7 AND _days_remaining > 0 THEN
      INSERT INTO notifications (
        user_id, title, message, type, 
        related_entity_id, related_entity_type, priority
      ) VALUES (
        NEW.user_id,
        'Meta próxima a vencer',
        'Tu meta "' || NEW.title || '" vence en ' || _days_remaining || ' días',
        'goal',
        NEW.id,
        'goals',
        CASE WHEN _days_remaining <= 2 THEN 'high' ELSE 'normal' END
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
*/

-- Trigger para notificar cuando una meta financiera alcanza el 50%, 75% y 100%
CREATE OR REPLACE FUNCTION notify_finance_goal_milestone()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar si cruzamos el umbral del 50%
  IF OLD.progress_percentage < 50 AND NEW.progress_percentage >= 50 THEN
    INSERT INTO notifications (
      user_id, title, message, type, 
      related_entity_id, related_entity_type
    ) VALUES (
      NEW.user_id,
      '¡Meta financiera al 50%!',
      'Has alcanzado el 50% de tu meta "' || NEW.title || '"',
      'finance',
      NEW.id,
      'finance_goals'
    );
  END IF;
  
  -- Verificar si cruzamos el umbral del 75%
  IF OLD.progress_percentage < 75 AND NEW.progress_percentage >= 75 THEN
    INSERT INTO notifications (
      user_id, title, message, type, 
      related_entity_id, related_entity_type
    ) VALUES (
      NEW.user_id,
      '¡Meta financiera al 75%!',
      'Has alcanzado el 75% de tu meta "' || NEW.title || '"',
      'finance',
      NEW.id,
      'finance_goals'
    );
  END IF;
  
  -- Verificar si completamos la meta (100%)
  IF OLD.progress_percentage < 100 AND NEW.progress_percentage >= 100 THEN
    INSERT INTO notifications (
      user_id, title, message, type, 
      related_entity_id, related_entity_type, priority
    ) VALUES (
      NEW.user_id,
      '¡Meta financiera completada!',
      'Has completado tu meta "' || NEW.title || '" al 100%',
      'finance',
      NEW.id,
      'finance_goals',
      'high'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para notificar cuando se rompe una racha de hábitos
CREATE OR REPLACE FUNCTION notify_habit_streak_broken()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el streak anterior era mayor a 5 y ahora es 0, notificar
  IF OLD.current_streak >= 5 AND NEW.current_streak = 0 THEN
    INSERT INTO notifications (
      user_id, title, message, type, 
      related_entity_id, related_entity_type, priority
    ) VALUES (
      NEW.user_id,
      'Racha interrumpida',
      'Se ha interrumpido tu racha de ' || OLD.current_streak || ' días para el hábito "' || NEW.title || '"',
      'habit',
      NEW.id,
      'habits',
      'high'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para notificar cuando una suscripción está próxima a renovarse
CREATE OR REPLACE FUNCTION notify_subscription_renewal()
RETURNS TRIGGER AS $$
DECLARE
  _days_to_renewal INTEGER;
BEGIN
  -- Calcular días hasta la renovación
  _days_to_renewal := NEW.next_billing_date::date - CURRENT_DATE;
  
  -- Si es un INSERT o si la fecha cambió en un UPDATE
  IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.next_billing_date <> NEW.next_billing_date)) THEN
    -- Notificar si faltan los días configurados para recordatorio
    IF _days_to_renewal = NEW.reminder_days_before THEN
      INSERT INTO notifications (
        user_id, title, message, type, 
        related_entity_id, related_entity_type
      ) VALUES (
        NEW.user_id,
        'Próxima renovación de suscripción',
        'Tu suscripción a "' || NEW.service_name || '" se renovará en ' || _days_to_renewal || ' días por ' || 
        NEW.amount || ' ' || NEW.currency,
        'finance',
        NEW.id,
        'subscriptions_tracker'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Conectar los triggers a sus respectivas tablas
-- NOTE: The connection to the goals table has been commented out since the table doesn't exist
/*
CREATE TRIGGER goal_deadline_approaching
  AFTER INSERT OR UPDATE OF target_date ON goals
  FOR EACH ROW
  EXECUTE FUNCTION notify_goal_deadline_approaching();
*/

CREATE TRIGGER finance_goal_milestone
  AFTER UPDATE OF current_amount ON finance_goals
  FOR EACH ROW
  EXECUTE FUNCTION notify_finance_goal_milestone();

CREATE TRIGGER habit_streak_broken
  AFTER UPDATE OF current_streak ON habits
  FOR EACH ROW
  EXECUTE FUNCTION notify_habit_streak_broken();

CREATE TRIGGER subscription_renewal_notification
  AFTER INSERT OR UPDATE OF next_billing_date ON subscriptions_tracker
  FOR EACH ROW
  EXECUTE FUNCTION notify_subscription_renewal();

-- Programar la función de analítica diaria para ejecutarse automáticamente
CREATE OR REPLACE FUNCTION schedule_daily_analytics()
RETURNS VOID AS $$
BEGIN
  PERFORM generate_daily_analytics();
END;
$$ LANGUAGE plpgsql;

-- Configurar un Job para ejecutar la analítica diaria (usando pg_cron si está disponible)
-- Esto normalmente se haría a nivel de administración de Supabase o con cron externo
-- Como alternativa, puedes usar un servicio externo o una función lambda para esta tarea 