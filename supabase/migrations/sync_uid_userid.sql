-- Script para sincronizar uid con user_id en tablas de hábitos

-- Sincronizar uid con user_id en la tabla habits
UPDATE habits
SET user_id = uid
WHERE uid IS NOT NULL AND user_id != uid;

-- Sincronizar uid con user_id en la tabla habit_logs
UPDATE habit_logs
SET user_id = uid
WHERE uid IS NOT NULL AND user_id != uid;

-- Mensaje informativo
DO $$
BEGIN
  RAISE NOTICE 'Sincronización entre uid y user_id completada';
END $$; 