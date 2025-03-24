-- Eliminar el trigger existente
DROP TRIGGER IF EXISTS update_habit_streaks_after_log ON habit_logs;

-- Eliminar la función existente
DROP FUNCTION IF EXISTS update_habit_streaks();

-- Recrear la función corrigiendo el problema de ambigüedad de current_streak
CREATE OR REPLACE FUNCTION update_habit_streaks()
RETURNS TRIGGER AS $$
DECLARE
  last_completion DATE;
  habit_current_streak INT;
  habit_best_streak INT;
  habit_total_completions INT;
BEGIN
  -- Obtener fecha de última completitud
  SELECT completed_date INTO last_completion
  FROM habit_logs
  WHERE habit_id = NEW.habit_id
    AND id != NEW.id -- Excluir el nuevo log
  ORDER BY completed_date DESC
  LIMIT 1;
  
  -- Obtener valores actuales
  SELECT h.current_streak, h.best_streak, h.total_completions 
  INTO habit_current_streak, habit_best_streak, habit_total_completions
  FROM habits h
  WHERE h.id = NEW.habit_id;
  
  -- Incrementar total_completions
  habit_total_completions := COALESCE(habit_total_completions, 0) + 1;
  
  -- Actualizar current_streak
  IF last_completion IS NULL OR NEW.completed_date = last_completion + INTERVAL '1 day' THEN
    -- Primer registro o día consecutivo
    habit_current_streak := COALESCE(habit_current_streak, 0) + 1;
  ELSIF NEW.completed_date > last_completion + INTERVAL '1 day' THEN
    -- Se perdió la racha
    habit_current_streak := 1;
  ELSE
    -- Completado en el mismo día u otro orden, no afecta streak
    habit_current_streak := COALESCE(habit_current_streak, 0);
  END IF;
  
  -- Actualizar best_streak si necesario
  IF habit_current_streak > COALESCE(habit_best_streak, 0) THEN
    habit_best_streak := habit_current_streak;
  END IF;
  
  -- Actualizar el hábito
  UPDATE habits
  SET 
    current_streak = habit_current_streak,
    best_streak = habit_best_streak,
    total_completions = habit_total_completions,
    updated_at = now()
  WHERE id = NEW.habit_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recrear el trigger
CREATE TRIGGER update_habit_streaks_after_log
AFTER INSERT ON habit_logs
FOR EACH ROW
EXECUTE PROCEDURE update_habit_streaks();

-- Aseguramos que el user_id en habit_logs coincida con el de la tabla habits
CREATE OR REPLACE FUNCTION check_habit_log_user_id()
RETURNS TRIGGER AS $$
DECLARE
  habit_owner_id UUID;
BEGIN
  -- Obtener el user_id del hábito
  SELECT user_id INTO habit_owner_id
  FROM habits
  WHERE id = NEW.habit_id;
  
  -- Asegurarse de que el user_id coincida
  IF NEW.user_id != habit_owner_id THEN
    NEW.user_id := habit_owner_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para asegurar que el user_id sea correcto
CREATE TRIGGER ensure_correct_user_id_before_insert
BEFORE INSERT ON habit_logs
FOR EACH ROW
EXECUTE PROCEDURE check_habit_log_user_id(); 