-- Función para calcular el streak actual de un hábito
CREATE OR REPLACE FUNCTION calculate_habit_streak(habit_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  _streak INTEGER := 0;
  _current_date DATE := CURRENT_DATE;
  _last_completed_date DATE;
  _habit_frequency TEXT;
  _specific_days INTEGER[];
  _days_to_check INTEGER;
  _found_date BOOLEAN;
  _expected_date DATE;
BEGIN
  -- Obtener la frecuencia del hábito
  SELECT 
    CASE 
      WHEN frequency::TEXT = 'daily' THEN 'daily'::TEXT
      WHEN frequency::TEXT = 'weekly' THEN 'weekly'::TEXT
      ELSE frequency::TEXT
    END,
    specific_days 
  INTO _habit_frequency, _specific_days
  FROM habits
  WHERE id = habit_uuid;
  
  -- Si no existe el hábito, devolver 0
  IF _habit_frequency IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Obtener la última fecha completada
  SELECT MAX(completed_date) INTO _last_completed_date
  FROM habit_logs
  WHERE habit_id = habit_uuid;
  
  -- Si no hay registros, devolver 0
  IF _last_completed_date IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Verificar si la última entrada es reciente según la frecuencia
  IF _habit_frequency = 'daily' THEN
    -- Para hábitos diarios, verificar cada día hacia atrás
    _days_to_check := _current_date - _last_completed_date;
    
    -- Si la última entrada es de hoy, comenzar el conteo
    IF _days_to_check = 0 THEN
      _streak := 1;
      _current_date := _current_date - 1;
      
      -- Contar hacia atrás mientras haya entradas consecutivas
      WHILE TRUE LOOP
        SELECT EXISTS (
          SELECT 1 
          FROM habit_logs 
          WHERE habit_id = habit_uuid AND DATE(completed_date) = _current_date
        ) INTO _found_date;
        
        EXIT WHEN NOT _found_date;
        
        _streak := _streak + 1;
        _current_date := _current_date - 1;
      END LOOP;
    -- Si la última entrada es de ayer, aún considerar un posible streak
    ELSIF _days_to_check = 1 THEN
      _streak := 1;
      _current_date := _last_completed_date - 1;
      
      -- Contar hacia atrás mientras haya entradas consecutivas
      WHILE TRUE LOOP
        SELECT EXISTS (
          SELECT 1 
          FROM habit_logs 
          WHERE habit_id = habit_uuid AND DATE(completed_date) = _current_date
        ) INTO _found_date;
        
        EXIT WHEN NOT _found_date;
        
        _streak := _streak + 1;
        _current_date := _current_date - 1;
      END LOOP;
    -- Si hay un intervalo mayor, no hay streak
    ELSE
      _streak := 0;
    END IF;
    
  ELSIF _habit_frequency = 'weekly' THEN
    -- Para hábitos semanales, verificar si está en la misma semana o la anterior
    IF DATE_PART('week', _current_date) = DATE_PART('week', _last_completed_date) 
       AND DATE_PART('year', _current_date) = DATE_PART('year', _last_completed_date) THEN
      -- La última entrada es de esta semana
      _streak := 1;
      
      -- Verificar semanas anteriores consecutivas
      _expected_date := _last_completed_date - INTERVAL '7 days';
      
      WHILE TRUE LOOP
        SELECT EXISTS (
          SELECT 1 
          FROM habit_logs 
          WHERE habit_id = habit_uuid 
          AND DATE_PART('week', completed_date) = DATE_PART('week', _expected_date)
          AND DATE_PART('year', completed_date) = DATE_PART('year', _expected_date)
        ) INTO _found_date;
        
        EXIT WHEN NOT _found_date;
        
        _streak := _streak + 1;
        _expected_date := _expected_date - INTERVAL '7 days';
      END LOOP;
    -- Si está en la semana anterior, verificar si sigue siendo un streak
    ELSIF (DATE_PART('week', _current_date) - DATE_PART('week', _last_completed_date) = 1 
           OR (DATE_PART('week', _current_date) = 1 AND DATE_PART('week', _last_completed_date) > 50))
           AND DATE_PART('year', _current_date) - DATE_PART('year', _last_completed_date) <= 1 THEN
      -- La última entrada es de la semana anterior
      _streak := 1;
      
      -- Verificar semanas anteriores consecutivas
      _expected_date := _last_completed_date - INTERVAL '7 days';
      
      WHILE TRUE LOOP
        SELECT EXISTS (
          SELECT 1 
          FROM habit_logs 
          WHERE habit_id = habit_uuid 
          AND DATE_PART('week', completed_date) = DATE_PART('week', _expected_date)
          AND DATE_PART('year', completed_date) = DATE_PART('year', _expected_date)
        ) INTO _found_date;
        
        EXIT WHEN NOT _found_date;
        
        _streak := _streak + 1;
        _expected_date := _expected_date - INTERVAL '7 days';
      END LOOP;
    ELSE
      _streak := 0;
    END IF;
  
  ELSIF _habit_frequency = 'custom' OR _habit_frequency = 'monthly' THEN
    -- Para días específicos, es más complejo
    -- Simplificamos contando las entradas del último mes
    _streak := 0;
  END IF;
  
  RETURN _streak;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar el streak de un hábito después de registrar una entrada
-- Solo crear si no existe un trigger similar
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_habit_streak_on_log'
    ) THEN
        CREATE OR REPLACE FUNCTION update_habit_streak()
        RETURNS TRIGGER AS $function$
        DECLARE
          _current_streak INTEGER;
          _best_streak INTEGER;
        BEGIN
          -- Calcular el streak actual
          _current_streak := calculate_habit_streak(NEW.habit_id);
          
          -- Actualizar el current_streak en la tabla de hábitos
          UPDATE habits
          SET current_streak = _current_streak
          WHERE id = NEW.habit_id;
          
          -- Verificar si este es un nuevo mejor streak
          SELECT best_streak INTO _best_streak
          FROM habits
          WHERE id = NEW.habit_id;
          
          -- Actualizar best_streak si el current_streak es mayor
          IF _current_streak > _best_streak THEN
            UPDATE habits
            SET best_streak = _current_streak
            WHERE id = NEW.habit_id;
          END IF;
          
          RETURN NEW;
        END;
        $function$ LANGUAGE plpgsql;

        -- Crear trigger
        CREATE TRIGGER update_habit_streak_on_log
          AFTER INSERT ON habit_logs
          FOR EACH ROW
          EXECUTE FUNCTION update_habit_streak();
    END IF;
END $$;

-- Función para reiniciar streaks de hábitos no completados diariamente
CREATE OR REPLACE FUNCTION reset_missed_habit_streaks()
RETURNS VOID AS $$
DECLARE
  _habit RECORD;
  _yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
  _last_completion DATE;
  _should_reset BOOLEAN;
BEGIN
  -- Para cada hábito diario activo
  FOR _habit IN 
    SELECT id, frequency, specific_days 
    FROM habits 
    WHERE frequency::text = 'daily' AND current_streak > 0 AND is_active = TRUE
  LOOP
    -- Obtener la última fecha de completado
    SELECT MAX(DATE(completed_date)) INTO _last_completion
    FROM habit_logs
    WHERE habit_id = _habit.id;
    
    -- Determinar si debe reiniciarse (sin completar ayer)
    _should_reset := _last_completion IS NULL OR _last_completion < _yesterday;
    
    -- Reiniciar el streak si es necesario
    IF _should_reset THEN
      UPDATE habits
      SET current_streak = 0
      WHERE id = _habit.id;
    END IF;
  END LOOP;
  
  -- Para hábitos semanales, lógica similar pero con semanas
  -- (Esta implementación es simplificada)
END;
$$ LANGUAGE plpgsql; 