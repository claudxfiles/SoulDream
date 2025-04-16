-- Ensure admin user exists
DO $$
DECLARE
  admin_id UUID := '00000000-0000-0000-0000-000000000000';
  user_exists BOOLEAN;
BEGIN
  -- Check if user exists
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = admin_id) INTO user_exists;
  
  -- Create user if not exists
  IF NOT user_exists THEN
    -- En Supabase, no podemos insertar directamente en auth.users
    -- Deberíamos usar las funciones de auth proporcionadas por Supabase o simplemente
    -- usar un ID de usuario existente en el sistema
    RAISE NOTICE 'No se puede crear un usuario directamente. Por favor, usa un ID de usuario existente.';
  END IF;
END $$;

-- Eliminar datos existentes para evitar duplicados
DELETE FROM workout_template_exercises;
DELETE FROM workout_templates;

-- Buscar un usuario existente para usar como propietario de las plantillas
DO $$
DECLARE
  template_owner_id UUID;
BEGIN
  -- Intentar obtener un ID de usuario existente
  SELECT id INTO template_owner_id FROM auth.users LIMIT 1;
  
  IF template_owner_id IS NULL THEN
    RAISE EXCEPTION 'No hay usuarios en el sistema. Por favor, crea al menos un usuario antes de ejecutar este script.';
  END IF;
  
  -- Insertar plantillas de entrenamiento con el ID de usuario encontrado
  INSERT INTO workout_templates (id, user_id, name, description, estimated_duration_minutes, workout_type, difficulty_level, is_public, muscle_groups)
  VALUES 
    (gen_random_uuid(), template_owner_id, 'Rutina Full Body', 'Entrenamiento completo que trabaja todo el cuerpo', 60, 'STRENGTH', 'INTERMEDIATE', true, ARRAY['CHEST', 'BACK', 'LEGS', 'SHOULDERS', 'ARMS', 'ABS', 'FULL_BODY']),
    (gen_random_uuid(), template_owner_id, 'Entrenamiento de Pecho', 'Rutina enfocada en desarrollar los músculos del pecho', 45, 'STRENGTH', 'INTERMEDIATE', true, ARRAY['CHEST']),
    (gen_random_uuid(), template_owner_id, 'Piernas y Glúteos', 'Entrenamiento intenso para piernas y glúteos', 50, 'STRENGTH', 'ADVANCED', true, ARRAY['QUADRICEPS', 'HAMSTRING', 'GLUTES', 'CALVES']),
    (gen_random_uuid(), template_owner_id, 'HIIT Cardio', 'Entrenamiento de alta intensidad para quemar grasa', 30, 'HIIT', 'ADVANCED', true, ARRAY['ABS', 'QUADRICEPS', 'CARDIO']),
    (gen_random_uuid(), template_owner_id, 'Brazos Definidos', 'Rutina para tonificar y definir los brazos', 40, 'STRENGTH', 'BEGINNER', true, ARRAY['BICEPS', 'TRICEPS', 'FOREARMS']),
    
    -- Nuevas plantillas para cubrir más grupos musculares y tipos
    (gen_random_uuid(), template_owner_id, 'Abs de Acero', 'Rutina intensiva para fortalecer el core', 35, 'STRENGTH', 'INTERMEDIATE', true, ARRAY['ABS', 'OBLIQUES']),
    (gen_random_uuid(), template_owner_id, 'Yoga Principiantes', 'Sesión básica de yoga para mejorar flexibilidad', 45, 'YOGA', 'BEGINNER', true, ARRAY['FULL_BODY', 'FLEXIBILITY']),
    (gen_random_uuid(), template_owner_id, 'Pilates Core', 'Entrenamiento de pilates enfocado en el core', 40, 'PILATES', 'INTERMEDIATE', true, ARRAY['ABS', 'BACK']),
    (gen_random_uuid(), template_owner_id, 'Cardio Quemagrasa', 'Entrenamiento cardiovascular para quemar calorías', 35, 'CARDIO', 'INTERMEDIATE', true, ARRAY['CARDIO', 'FULL_BODY']),
    (gen_random_uuid(), template_owner_id, 'Pantorrillas Definidas', 'Rutina específica para el desarrollo de pantorrillas', 30, 'STRENGTH', 'INTERMEDIATE', true, ARRAY['CALVES']),
    (gen_random_uuid(), template_owner_id, 'Crossfit WOD', 'Entrenamiento del día estilo crossfit', 40, 'CROSSFIT', 'ADVANCED', true, ARRAY['FULL_BODY', 'CARDIO']),
    (gen_random_uuid(), template_owner_id, 'Glúteos Perfectos', 'Rutina enfocada exclusivamente en glúteos', 40, 'STRENGTH', 'INTERMEDIATE', true, ARRAY['GLUTES']),
    (gen_random_uuid(), template_owner_id, 'Estiramiento Completo', 'Sesión de estiramientos para todo el cuerpo', 30, 'FLEXIBILITY', 'BEGINNER', true, ARRAY['FULL_BODY', 'FLEXIBILITY']),
    (gen_random_uuid(), template_owner_id, 'Hombros 3D', 'Desarrollo completo de los hombros', 40, 'STRENGTH', 'INTERMEDIATE', true, ARRAY['SHOULDER']),
    (gen_random_uuid(), template_owner_id, 'Espalda en V', 'Rutina para desarrollar una espalda más ancha', 45, 'STRENGTH', 'INTERMEDIATE', true, ARRAY['BACK']),
    (gen_random_uuid(), template_owner_id, 'Sentadillas Challenge', 'Entrenamiento intensivo de piernas con sentadillas', 35, 'STRENGTH', 'ADVANCED', true, ARRAY['QUADRICEPS', 'GLUTES']),
    (gen_random_uuid(), template_owner_id, 'Definición Abdominal', 'Rutina avanzada para marcar abdominales', 35, 'STRENGTH', 'ADVANCED', true, ARRAY['ABS'])
    ;
END $$;

-- Obtener IDs de las plantillas para referenciarlas al agregar ejercicios
DO $$
DECLARE
  full_body_id UUID;
  chest_id UUID;
  legs_id UUID;
  cardio_id UUID;
  arms_id UUID;
  abs_id UUID;
  yoga_id UUID;
  pilates_id UUID;
  cardio_quema_id UUID;
  calves_id UUID;
  crossfit_id UUID;
  glutes_id UUID;
  stretch_id UUID;
  shoulders_id UUID;
  back_id UUID;
  squat_id UUID;
  abs_def_id UUID;
BEGIN
  -- Obtener los IDs
  SELECT id INTO full_body_id FROM workout_templates WHERE name = 'Rutina Full Body' LIMIT 1;
  SELECT id INTO chest_id FROM workout_templates WHERE name = 'Entrenamiento de Pecho' LIMIT 1;
  SELECT id INTO legs_id FROM workout_templates WHERE name = 'Piernas y Glúteos' LIMIT 1;
  SELECT id INTO cardio_id FROM workout_templates WHERE name = 'HIIT Cardio' LIMIT 1;
  SELECT id INTO arms_id FROM workout_templates WHERE name = 'Brazos Definidos' LIMIT 1;
  SELECT id INTO abs_id FROM workout_templates WHERE name = 'Abs de Acero' LIMIT 1;
  SELECT id INTO yoga_id FROM workout_templates WHERE name = 'Yoga Principiantes' LIMIT 1;
  SELECT id INTO pilates_id FROM workout_templates WHERE name = 'Pilates Core' LIMIT 1;
  SELECT id INTO cardio_quema_id FROM workout_templates WHERE name = 'Cardio Quemagrasa' LIMIT 1;
  SELECT id INTO calves_id FROM workout_templates WHERE name = 'Pantorrillas Definidas' LIMIT 1;
  SELECT id INTO crossfit_id FROM workout_templates WHERE name = 'Crossfit WOD' LIMIT 1;
  SELECT id INTO glutes_id FROM workout_templates WHERE name = 'Glúteos Perfectos' LIMIT 1;
  SELECT id INTO stretch_id FROM workout_templates WHERE name = 'Estiramiento Completo' LIMIT 1;
  SELECT id INTO shoulders_id FROM workout_templates WHERE name = 'Hombros 3D' LIMIT 1;
  SELECT id INTO back_id FROM workout_templates WHERE name = 'Espalda en V' LIMIT 1;
  SELECT id INTO squat_id FROM workout_templates WHERE name = 'Sentadillas Challenge' LIMIT 1;
  SELECT id INTO abs_def_id FROM workout_templates WHERE name = 'Definición Abdominal' LIMIT 1;

  -- Insertar ejercicios para Full Body
  INSERT INTO workout_template_exercises (id, template_id, name, sets, reps, rest_seconds, order_index, muscle_group)
  VALUES
    (gen_random_uuid(), full_body_id, 'Press de Banca', 3, 12, 90, 1, 'chest'),
    (gen_random_uuid(), full_body_id, 'Sentadillas', 3, 15, 120, 2, 'quadriceps'),
    (gen_random_uuid(), full_body_id, 'Dominadas', 3, 10, 90, 3, 'back'),
    (gen_random_uuid(), full_body_id, 'Press Militar', 3, 12, 90, 4, 'shoulder'),
    (gen_random_uuid(), full_body_id, 'Curl de Bíceps', 3, 12, 60, 5, 'biceps'),
    (gen_random_uuid(), full_body_id, 'Abdominales', 3, 20, 60, 6, 'abs');

  -- Insertar ejercicios para Pecho
  INSERT INTO workout_template_exercises (id, template_id, name, sets, reps, rest_seconds, order_index, muscle_group)
  VALUES
    (gen_random_uuid(), chest_id, 'Press de Banca', 4, 10, 90, 1, 'chest'),
    (gen_random_uuid(), chest_id, 'Aperturas con Mancuernas', 3, 12, 60, 2, 'chest'),
    (gen_random_uuid(), chest_id, 'Fondos en Paralelas', 3, 12, 90, 3, 'chest'),
    (gen_random_uuid(), chest_id, 'Press Inclinado', 3, 10, 90, 4, 'chest'),
    (gen_random_uuid(), chest_id, 'Pullover', 3, 12, 60, 5, 'chest');

  -- Insertar ejercicios para Piernas
  INSERT INTO workout_template_exercises (id, template_id, name, sets, reps, rest_seconds, order_index, muscle_group)
  VALUES
    (gen_random_uuid(), legs_id, 'Sentadillas', 4, 12, 120, 1, 'quadriceps'),
    (gen_random_uuid(), legs_id, 'Peso Muerto', 4, 10, 120, 2, 'hamstring'),
    (gen_random_uuid(), legs_id, 'Hip Thrust', 3, 15, 90, 3, 'glutes'),
    (gen_random_uuid(), legs_id, 'Extensiones de Cuádriceps', 3, 12, 60, 4, 'quadriceps'),
    (gen_random_uuid(), legs_id, 'Curl Femoral', 3, 12, 60, 5, 'hamstring'),
    (gen_random_uuid(), legs_id, 'Elevaciones de Pantorrilla', 4, 15, 60, 6, 'calves');

  -- Insertar ejercicios para HIIT
  INSERT INTO workout_template_exercises (id, template_id, name, sets, reps, rest_seconds, order_index, muscle_group)
  VALUES
    (gen_random_uuid(), cardio_id, 'Burpees', 4, 20, 30, 1, 'full_body'),
    (gen_random_uuid(), cardio_id, 'Mountain Climbers', 4, 30, 30, 2, 'abs'),
    (gen_random_uuid(), cardio_id, 'Saltos de Caja', 4, 15, 30, 3, 'quadriceps'),
    (gen_random_uuid(), cardio_id, 'Sentadillas con Salto', 4, 15, 30, 4, 'quadriceps'),
    (gen_random_uuid(), cardio_id, 'Sprints', 4, 30, 60, 5, 'cardio');

  -- Insertar ejercicios para Brazos
  INSERT INTO workout_template_exercises (id, template_id, name, sets, reps, rest_seconds, order_index, muscle_group)
  VALUES
    (gen_random_uuid(), arms_id, 'Curl de Bíceps', 3, 12, 60, 1, 'biceps'),
    (gen_random_uuid(), arms_id, 'Press Francés', 3, 12, 60, 2, 'triceps'),
    (gen_random_uuid(), arms_id, 'Curl Martillo', 3, 12, 60, 3, 'biceps'),
    (gen_random_uuid(), arms_id, 'Extensiones de Tríceps', 3, 12, 60, 4, 'triceps'),
    (gen_random_uuid(), arms_id, 'Curl de Antebrazo', 3, 15, 45, 5, 'forearms'),
    (gen_random_uuid(), arms_id, 'Fondos de Tríceps', 3, 12, 60, 6, 'triceps');

  -- Insertar ejercicios para las nuevas plantillas
  INSERT INTO workout_template_exercises (id, template_id, name, sets, reps, rest_seconds, order_index, muscle_group)
  VALUES
    -- Ejercicios para Abs de Acero
    (gen_random_uuid(), abs_id, 'Crunches', 3, 20, 45, 1, 'abs'),
    (gen_random_uuid(), abs_id, 'Plancha Frontal', 3, 60, 60, 2, 'abs'),
    (gen_random_uuid(), abs_id, 'Russian Twist', 3, 16, 45, 3, 'obliques'),
    (gen_random_uuid(), abs_id, 'Elevaciones de Piernas', 3, 15, 45, 4, 'abs'),
    (gen_random_uuid(), abs_id, 'Mountain Climbers', 3, 20, 45, 5, 'abs'),
    
    -- Ejercicios para Yoga Principiantes
    (gen_random_uuid(), yoga_id, 'Postura del Perro Boca Abajo', 1, 5, 0, 1, 'full_body'),
    (gen_random_uuid(), yoga_id, 'Postura del Guerrero', 1, 5, 0, 2, 'full_body'),
    (gen_random_uuid(), yoga_id, 'Postura del Árbol', 1, 5, 0, 3, 'full_body'),
    (gen_random_uuid(), yoga_id, 'Postura del Niño', 1, 5, 0, 4, 'full_body'),
    
    -- Ejercicios para Pilates Core
    (gen_random_uuid(), pilates_id, 'The Hundred', 1, 100, 60, 1, 'abs'),
    (gen_random_uuid(), pilates_id, 'Roll Up', 3, 10, 45, 2, 'abs'),
    (gen_random_uuid(), pilates_id, 'Leg Circles', 3, 10, 30, 3, 'abs'),
    (gen_random_uuid(), pilates_id, 'Rolling Like a Ball', 3, 10, 30, 4, 'abs'),
    
    -- Ejercicios para ABS definido
    (gen_random_uuid(), abs_def_id, 'Crunches con Peso', 4, 15, 45, 1, 'abs'),
    (gen_random_uuid(), abs_def_id, 'Plancha Lateral', 3, 45, 45, 2, 'obliques'),
    (gen_random_uuid(), abs_def_id, 'Elevaciones de Piernas en Barra', 4, 12, 60, 3, 'abs'),
    (gen_random_uuid(), abs_def_id, 'Dragon Flag', 3, 8, 90, 4, 'abs'),
    
    -- Ejercicios para Hombros 3D
    (gen_random_uuid(), shoulders_id, 'Press Militar', 4, 10, 90, 1, 'shoulder'),
    (gen_random_uuid(), shoulders_id, 'Elevaciones Laterales', 4, 12, 60, 2, 'shoulder'),
    (gen_random_uuid(), shoulders_id, 'Elevaciones Frontales', 4, 12, 60, 3, 'shoulder'),
    (gen_random_uuid(), shoulders_id, 'Pájaros', 4, 12, 60, 4, 'shoulder'),
    (gen_random_uuid(), shoulders_id, 'Press Arnold', 3, 10, 60, 5, 'shoulder'),
    
    -- Ejercicios para Espalda en V
    (gen_random_uuid(), back_id, 'Dominadas', 4, 8, 90, 1, 'back'),
    (gen_random_uuid(), back_id, 'Remo con Barra', 4, 10, 90, 2, 'back'),
    (gen_random_uuid(), back_id, 'Pulldown', 4, 12, 60, 3, 'back'),
    (gen_random_uuid(), back_id, 'Remo con Mancuerna', 3, 12, 60, 4, 'back'),
    (gen_random_uuid(), back_id, 'Hiperextensiones', 3, 15, 60, 5, 'back');
END $$; 