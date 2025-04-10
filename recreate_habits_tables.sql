CREATE OR REPLACE FUNCTION update_habit_streaks()
RETURNS TRIGGER AS $$
DECLARE
  last_completion DATE;
  v_current_streak INT;
  v_best_streak INT;
  v_total_completions INT;
BEGIN
  -- Obtener fecha de última completitud
  SELECT completed_date INTO last_completion
  FROM habit_logs
  WHERE habit_id = NEW.habit_id
    AND id != NEW.id
  ORDER BY completed_date DESC
  LIMIT 1;
  
  -- Obtener valores actuales
  SELECT h.current_streak, h.best_streak, h.total_completions 
  INTO v_current_streak, v_best_streak, v_total_completions
  FROM habits h
  WHERE h.id = NEW.habit_id;
  
  -- Incrementar total_completions
  v_total_completions := COALESCE(v_total_completions, 0) + 1;
  
  -- Actualizar current_streak
  IF last_completion IS NULL OR NEW.completed_date = last_completion + INTERVAL '1 day' THEN
    v_current_streak := COALESCE(v_current_streak, 0) + 1;
  ELSIF NEW.completed_date > last_completion + INTERVAL '1 day' THEN
    v_current_streak := 1;
  ELSE
    v_current_streak := COALESCE(v_current_streak, 0);
  END IF;
  
  -- Actualizar best_streak si necesario
  IF v_current_streak > COALESCE(v_best_streak, 0) THEN
    v_best_streak := v_current_streak;
  END IF;
  
  -- Actualizar el hábito
  UPDATE habits
  SET 
    current_streak = v_current_streak,
    best_streak = v_best_streak,
    total_completions = v_total_completions,
    updated_at = now()
  WHERE id = NEW.habit_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql; 