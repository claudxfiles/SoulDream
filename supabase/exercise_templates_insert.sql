-- Inserción de ejercicios por grupo muscular
-- Ejercicios existentes
INSERT INTO "public"."exercise_templates" ("id", "name", "description", "muscle_group", "exercise_type", "difficulty_level", "default_sets", "default_reps", "default_weight", "default_duration_seconds", "rest_seconds", "instructions", "is_public", "user_id", "created_at", "updated_at") VALUES 
('3f57cc9a-5f75-48dd-8d4f-d234bfb5d5e9', 'Sentadillas', 'El rey de los ejercicios para piernas', 'quadriceps', 'compound', 'intermediate', '4', '10', null, null, '60', 'Mantén la espalda recta, dobla las rodillas y baja como si te sentaras', 'true', null, '2025-03-21 00:44:04.953188+00', '2025-03-21 00:44:04.953188+00'),
('52a594d8-33b9-4e89-92db-cdb60c5caabb', 'Peso Muerto', 'Excelente para espalda baja y posterior', 'back', 'compound', 'advanced', '3', '6', null, null, '60', 'Mantén la barra cerca del cuerpo, empuja con las piernas y mantén la espalda neutral', 'true', null, '2025-03-21 00:44:04.953188+00', '2025-03-21 00:44:04.953188+00'),
('83203df4-f6bc-4c3b-a558-ed26f7d909df', 'Fondos de Tríceps', 'Gran ejercicio para tríceps', 'triceps', 'bodyweight', 'intermediate', '3', '10', null, null, '60', 'Apóyate en barras paralelas, baja el cuerpo y empuja hacia arriba', 'true', null, '2025-03-21 00:44:04.953188+00', '2025-03-21 00:44:04.953188+00'),
('a34746b9-adc2-44c1-9579-3c80295d3f07', 'Press de Banca', 'Ejercicio fundamental para pecho', 'chest', 'strength', 'intermediate', '4', '8', null, null, '60', 'Acuéstate en un banco, baja la barra hasta el pecho y empuja hacia arriba', 'true', null, '2025-03-21 00:44:04.953188+00', '2025-03-21 00:44:04.953188+00'),
('ce690212-f8ee-4b37-af73-f4935187d5e6', 'Plancha', 'Ejercicio de resistencia para core', 'abs', 'bodyweight', 'beginner', '3', null, null, '60', '60', 'Mantén la posición con el cuerpo recto y apoyado en antebrazos y pies', 'true', null, '2025-03-21 00:44:04.953188+00', '2025-03-21 00:44:04.953188+00'),
('d38a23a9-6a1b-4fef-bdad-dd1a956b3736', 'Pull-ups', 'Dominadas para espalda y bíceps', 'back', 'bodyweight', 'intermediate', '3', '8', null, null, '60', 'Agarra la barra con las palmas hacia afuera y levanta el cuerpo', 'true', null, '2025-03-21 00:44:04.953188+00', '2025-03-21 00:44:04.953188+00'),
('d9786d7a-122a-4db4-9ab8-16b5e5f707f0', 'Curl de Bíceps', 'Aislamiento para bíceps', 'biceps', 'isolation', 'beginner', '3', '12', null, null, '60', 'Mantén los codos pegados al cuerpo y levanta las pesas', 'true', null, '2025-03-21 00:44:04.953188+00', '2025-03-21 00:44:04.953188+00');

-- Nuevos ejercicios por grupo muscular

-- ABS (Abdominales) adicionales
INSERT INTO "public"."exercise_templates" ("id", "name", "description", "muscle_group", "exercise_type", "difficulty_level", "default_sets", "default_reps", "default_weight", "default_duration_seconds", "rest_seconds", "instructions", "is_public", "user_id") VALUES 
(gen_random_uuid(), 'Crunch', 'Ejercicio básico para abdominales superiores', 'abs', 'bodyweight', 'beginner', '3', '15', null, null, '45', 'Acuéstate boca arriba, dobla las rodillas y levanta los hombros del suelo contrayendo los abdominales', 'true', null),
(gen_random_uuid(), 'Russian Twist', 'Rotaciones para trabajar oblicuos y core', 'abs', 'bodyweight', 'intermediate', '3', '20', null, null, '45', 'Siéntate con las rodillas flexionadas, inclina el tronco hacia atrás y gira de un lado a otro', 'true', null),
(gen_random_uuid(), 'Leg Raises', 'Excelente para abdomen inferior', 'abs', 'bodyweight', 'intermediate', '3', '12', null, null, '45', 'Acuéstate boca arriba, mantén las piernas rectas y eleva hasta formar un ángulo de 90° con el suelo', 'true', null),
(gen_random_uuid(), 'Mountain Climbers', 'Cardio y core en un solo ejercicio', 'abs', 'cardio', 'intermediate', '3', null, null, '30', '30', 'En posición de plancha, alterna llevando las rodillas hacia el pecho en un movimiento rápido', 'true', null);

-- BICEPS adicionales
INSERT INTO "public"."exercise_templates" ("id", "name", "description", "muscle_group", "exercise_type", "difficulty_level", "default_sets", "default_reps", "default_weight", "default_duration_seconds", "rest_seconds", "instructions", "is_public", "user_id") VALUES 
(gen_random_uuid(), 'Curl con Barra', 'Ejercicio clásico para bíceps con barra', 'biceps', 'isolation', 'beginner', '3', '12', null, null, '60', 'De pie, agarra una barra con agarre supino y flexiona los codos para levantar la barra', 'true', null),
(gen_random_uuid(), 'Curl Martillo', 'Trabaja bíceps y antebrazos simultáneamente', 'biceps', 'isolation', 'beginner', '3', '12', null, null, '60', 'Sostén las mancuernas con agarre neutro (pulgares hacia arriba) y flexiona los codos', 'true', null),
(gen_random_uuid(), 'Curl Concentrado', 'Aislamiento perfecto del bíceps', 'biceps', 'isolation', 'intermediate', '3', '10', null, null, '60', 'Siéntate, apoya el codo en la cara interna del muslo y flexiona el codo elevando la mancuerna', 'true', null),
(gen_random_uuid(), 'Curl en Banco Inclinado', 'Mayor estiramiento del bíceps', 'biceps', 'isolation', 'intermediate', '3', '10', null, null, '60', 'Acuéstate en un banco inclinado con mancuernas en las manos y flexiona los codos', 'true', null);

-- CALVES (Pantorrillas)
INSERT INTO "public"."exercise_templates" ("id", "name", "description", "muscle_group", "exercise_type", "difficulty_level", "default_sets", "default_reps", "default_weight", "default_duration_seconds", "rest_seconds", "instructions", "is_public", "user_id") VALUES 
(gen_random_uuid(), 'Elevación de Talones de Pie', 'Básico para desarrollar pantorrillas', 'calves', 'isolation', 'beginner', '4', '15', null, null, '45', 'De pie, eleva los talones del suelo lo más alto posible y baja lentamente', 'true', null),
(gen_random_uuid(), 'Elevación de Talones Sentado', 'Mayor aislamiento del sóleo', 'calves', 'isolation', 'beginner', '3', '15', null, null, '45', 'Sentado con las rodillas a 90 grados, coloca peso sobre los muslos y eleva los talones', 'true', null),
(gen_random_uuid(), 'Saltos de Pantorrilla', 'Ejercicio dinámico para fuerza explosiva', 'calves', 'plyometric', 'intermediate', '3', '15', null, null, '60', 'Da pequeños saltos usando solo la parte anterior del pie, sin flexionar las rodillas', 'true', null),
(gen_random_uuid(), 'Elevación de Talones en Prensa', 'Permite usar mayor carga', 'calves', 'isolation', 'intermediate', '4', '12', null, null, '60', 'En la máquina de prensa, coloca solo la parte delantera del pie en la plataforma y empuja con los dedos', 'true', null);

-- CHEST (Pecho) adicionales
INSERT INTO "public"."exercise_templates" ("id", "name", "description", "muscle_group", "exercise_type", "difficulty_level", "default_sets", "default_reps", "default_weight", "default_duration_seconds", "rest_seconds", "instructions", "is_public", "user_id") VALUES 
(gen_random_uuid(), 'Press de Banca Inclinado', 'Enfoca la parte superior del pecho', 'chest', 'compound', 'intermediate', '4', '8', null, null, '90', 'Como el press banca regular pero en un banco inclinado a 30-45 grados', 'true', null),
(gen_random_uuid(), 'Aperturas con Mancuernas', 'Gran estiramiento y contracción pectoral', 'chest', 'isolation', 'intermediate', '3', '12', null, null, '60', 'Acostado en un banco plano, abre los brazos al lado como abrazando un árbol', 'true', null),
(gen_random_uuid(), 'Flexiones', 'Ejercicio básico sin equipo', 'chest', 'bodyweight', 'beginner', '3', '15', null, null, '60', 'Manos separadas al ancho de los hombros, cuerpo recto, baja hasta casi tocar el pecho con el suelo', 'true', null),
(gen_random_uuid(), 'Pullover con Mancuerna', 'Trabaja pecho y serrato', 'chest', 'isolation', 'intermediate', '3', '12', null, null, '60', 'Acostado con cabeza al borde del banco, lleva la mancuerna en arco sobre la cabeza', 'true', null);

-- FOREARMS (Antebrazos)
INSERT INTO "public"."exercise_templates" ("id", "name", "description", "muscle_group", "exercise_type", "difficulty_level", "default_sets", "default_reps", "default_weight", "default_duration_seconds", "rest_seconds", "instructions", "is_public", "user_id") VALUES 
(gen_random_uuid(), 'Curl de Muñeca', 'Ejercicio básico para flexores', 'forearms', 'isolation', 'beginner', '3', '15', null, null, '45', 'Sentado con antebrazos apoyados y palmas hacia arriba, flexiona las muñecas elevando el peso', 'true', null),
(gen_random_uuid(), 'Extensión de Muñeca', 'Fortalece extensores del antebrazo', 'forearms', 'isolation', 'beginner', '3', '15', null, null, '45', 'Sentado con antebrazos apoyados y palmas hacia abajo, extiende las muñecas elevando el peso', 'true', null),
(gen_random_uuid(), 'Agarre con pinza', 'Mejora la fuerza de agarre', 'forearms', 'isolation', 'intermediate', '3', '15', null, null, '45', 'Sostén un disco de peso con los dedos en pinza y mantén durante el tiempo indicado', 'true', null),
(gen_random_uuid(), 'Roller de Antebrazo', 'Ejercicio avanzado con máxima tensión', 'forearms', 'isolation', 'advanced', '3', null, null, null, '60', 'Con un roller de antebrazo, enrolla la cuerda levantando el peso y luego controla al desenrollar', 'true', null);

-- GLUTES (Glúteos)
INSERT INTO "public"."exercise_templates" ("id", "name", "description", "muscle_group", "exercise_type", "difficulty_level", "default_sets", "default_reps", "default_weight", "default_duration_seconds", "rest_seconds", "instructions", "is_public", "user_id") VALUES 
(gen_random_uuid(), 'Hip Thrust', 'El mejor ejercicio para glúteos', 'glutes', 'compound', 'intermediate', '4', '12', null, null, '60', 'Siéntate con la espalda en un banco, coloca una barra en las caderas y empuja hacia arriba', 'true', null),
(gen_random_uuid(), 'Peso Muerto Rumano', 'Excelente para glúteos y femoral', 'glutes', 'compound', 'intermediate', '3', '10', null, null, '60', 'De pie con barra o mancuernas, inclina el torso manteniendo la espalda recta y rodillas ligeramente flexionadas', 'true', null),
(gen_random_uuid(), 'Patada de Glúteo', 'Aislamiento con cable o máquina', 'glutes', 'isolation', 'beginner', '3', '15', null, null, '45', 'Con apoyo, extiende la pierna hacia atrás activando el glúteo en la máxima contracción', 'true', null),
(gen_random_uuid(), 'Bulgarian Split Squat', 'Sentadilla unilateral para glúteos', 'glutes', 'compound', 'intermediate', '3', '10', null, null, '60', 'Con el pie trasero elevado en un banco, baja en una sentadilla y empuja hacia arriba', 'true', null);

-- HAMSTRING (Femorales)
INSERT INTO "public"."exercise_templates" ("id", "name", "description", "muscle_group", "exercise_type", "difficulty_level", "default_sets", "default_reps", "default_weight", "default_duration_seconds", "rest_seconds", "instructions", "is_public", "user_id") VALUES 
(gen_random_uuid(), 'Curl Femoral Tumbado', 'Aislamiento de isquiotibiales', 'hamstring', 'isolation', 'beginner', '3', '12', null, null, '60', 'Acostado boca abajo en la máquina, flexiona las rodillas llevando el peso hacia los glúteos', 'true', null),
(gen_random_uuid(), 'Buenos Días', 'Ejercicio compuesto para espalda baja y femoral', 'hamstring', 'compound', 'advanced', '3', '10', null, null, '90', 'Con una barra sobre los trapecios, flexiona la cadera manteniendo la espalda recta', 'true', null),
(gen_random_uuid(), 'Puente de Glúteos', 'Ejercicio básico sin equipo', 'hamstring', 'bodyweight', 'beginner', '3', '15', null, null, '45', 'Acostado boca arriba, pies cerca de los glúteos, eleva las caderas contrayendo glúteos y femorales', 'true', null),
(gen_random_uuid(), 'Curl Nórdico', 'Ejercicio avanzado excéntrico', 'hamstring', 'bodyweight', 'advanced', '3', '6', null, null, '90', 'Arrodillado con los pies anclados, deja caer el cuerpo hacia adelante resistiendo con los isquiotibiales', 'true', null);

-- OBLIQUES (Oblicuos)
INSERT INTO "public"."exercise_templates" ("id", "name", "description", "muscle_group", "exercise_type", "difficulty_level", "default_sets", "default_reps", "default_weight", "default_duration_seconds", "rest_seconds", "instructions", "is_public", "user_id") VALUES 
(gen_random_uuid(), 'Plancha Lateral', 'Ejercicio estático para oblicuos', 'obliques', 'bodyweight', 'intermediate', '3', null, null, '30', '45', 'Apoya el antebrazo y el lado del pie en el suelo, mantén el cuerpo en línea recta', 'true', null),
(gen_random_uuid(), 'Crunch Oblicuo', 'Enfoca específicamente oblicuos', 'obliques', 'bodyweight', 'beginner', '3', '15', null, null, '45', 'Acostado boca arriba, lleva un codo hacia la rodilla opuesta en diagonal', 'true', null),
(gen_random_uuid(), 'Woodchoppers', 'Simula el movimiento de cortar leña', 'obliques', 'functional', 'intermediate', '3', '12', null, null, '60', 'Con polea o mancuerna, tira en diagonal desde arriba hacia la cadera opuesta', 'true', null),
(gen_random_uuid(), 'Side Bend', 'Flexión lateral con peso', 'obliques', 'isolation', 'beginner', '3', '15', null, null, '45', 'De pie con una mancuerna, inclina el torso hacia el lado sin girar', 'true', null);

-- QUADRICEPS (Cuádriceps) adicionales
INSERT INTO "public"."exercise_templates" ("id", "name", "description", "muscle_group", "exercise_type", "difficulty_level", "default_sets", "default_reps", "default_weight", "default_duration_seconds", "rest_seconds", "instructions", "is_public", "user_id") VALUES 
(gen_random_uuid(), 'Prensa de Piernas', 'Gran ejercicio para cuádriceps con menos estrés lumbar', 'quadriceps', 'compound', 'intermediate', '4', '12', null, null, '90', 'Siéntate en la máquina, empuja la plataforma y baja controladamente sin bloquear rodillas', 'true', null),
(gen_random_uuid(), 'Extensión de Piernas', 'Aislamiento puro de cuádriceps', 'quadriceps', 'isolation', 'beginner', '3', '15', null, null, '60', 'Sentado en la máquina, extiende las rodillas completamente y baja con control', 'true', null),
(gen_random_uuid(), 'Zancadas', 'Ejercicio funcional unilateral', 'quadriceps', 'compound', 'intermediate', '3', '10', null, null, '60', 'Da un paso al frente, baja hasta que ambas rodillas formen 90 grados y vuelve a la posición inicial', 'true', null),
(gen_random_uuid(), 'Sissy Squat', 'Enfoca la parte distal del cuádriceps', 'quadriceps', 'bodyweight', 'advanced', '3', '12', null, null, '60', 'Con los talones elevados, inclínate hacia atrás mientras flexionas las rodillas', 'true', null);

-- SHOULDER (Hombros)
INSERT INTO "public"."exercise_templates" ("id", "name", "description", "muscle_group", "exercise_type", "difficulty_level", "default_sets", "default_reps", "default_weight", "default_duration_seconds", "rest_seconds", "instructions", "is_public", "user_id") VALUES 
(gen_random_uuid(), 'Press Militar', 'Ejercicio básico compuesto para hombros', 'shoulder', 'compound', 'intermediate', '4', '8', null, null, '90', 'De pie o sentado, empuja la barra desde los hombros hasta la extensión completa de brazos', 'true', null),
(gen_random_uuid(), 'Elevaciones Laterales', 'Enfoca el deltoides medio', 'shoulder', 'isolation', 'beginner', '3', '12', null, null, '60', 'De pie con mancuernas, eleva los brazos hasta la altura de los hombros manteniendo codos ligeramente flexionados', 'true', null),
(gen_random_uuid(), 'Remo al Mentón', 'Compuesto para deltoides y trapecios', 'shoulder', 'compound', 'intermediate', '3', '12', null, null, '60', 'Con barra o mancuerna, tira verticalmente desde los muslos hasta la barbilla', 'true', null),
(gen_random_uuid(), 'Elevaciones Frontales', 'Aislamiento del deltoides anterior', 'shoulder', 'isolation', 'beginner', '3', '12', null, null, '60', 'De pie con mancuernas, eleva los brazos frente a ti hasta la altura de los hombros', 'true', null);

-- TRICEPS adicionales
INSERT INTO "public"."exercise_templates" ("id", "name", "description", "muscle_group", "exercise_type", "difficulty_level", "default_sets", "default_reps", "default_weight", "default_duration_seconds", "rest_seconds", "instructions", "is_public", "user_id") VALUES 
(gen_random_uuid(), 'Extensión de Tríceps con Polea', 'Gran aislamiento con tensión constante', 'triceps', 'isolation', 'beginner', '3', '12', null, null, '60', 'De pie frente a la polea alta, con codos fijos al lado del cuerpo, extiende los antebrazos', 'true', null),
(gen_random_uuid(), 'Press Francés', 'También conocido como extensión de tríceps con barra', 'triceps', 'isolation', 'intermediate', '3', '12', null, null, '60', 'Acostado o sentado, baja la barra hacia la frente flexionando los codos y extiende', 'true', null),
(gen_random_uuid(), 'Extensión de Tríceps sobre la Cabeza', 'Estira completamente el tríceps', 'triceps', 'isolation', 'beginner', '3', '12', null, null, '60', 'Con mancuerna sostenida por ambas manos, baja detrás de la cabeza y extiende hacia arriba', 'true', null),
(gen_random_uuid(), 'Kickbacks', 'Aislamiento de la cabeza lateral', 'triceps', 'isolation', 'beginner', '3', '12', null, null, '60', 'Inclinado con apoyo, codo pegado al cuerpo, extiende el antebrazo hacia atrás', 'true', null);

-- BACK (Espalda) adicionales
INSERT INTO "public"."exercise_templates" ("id", "name", "description", "muscle_group", "exercise_type", "difficulty_level", "default_sets", "default_reps", "default_weight", "default_duration_seconds", "rest_seconds", "instructions", "is_public", "user_id") VALUES 
(gen_random_uuid(), 'Remo con Barra', 'Compuesto para espalda media', 'back', 'compound', 'intermediate', '3', '10', null, null, '60', 'Inclinado con espalda recta, tira de la barra hacia el abdomen inferior', 'true', null),
(gen_random_uuid(), 'Pulldown', 'Enfoca dorsal ancho y bíceps', 'back', 'compound', 'beginner', '3', '12', null, null, '60', 'Sentado en la máquina, tira de la barra hacia la clavícula', 'true', null),
(gen_random_uuid(), 'Remo en T', 'Aislamiento para espalda media', 'back', 'isolation', 'intermediate', '3', '12', null, null, '60', 'Inclinado sobre banco, tira de las mancuernas hacia los costados', 'true', null),
(gen_random_uuid(), 'Hiperextensiones', 'Para lumbar y erectores espinales', 'back', 'isolation', 'beginner', '3', '15', null, null, '60', 'En el banco romano, flexiona el torso y eleva hasta alinear con las piernas', 'true', null);

-- FULL_BODY (Cuerpo completo)
INSERT INTO "public"."exercise_templates" ("id", "name", "description", "muscle_group", "exercise_type", "difficulty_level", "default_sets", "default_reps", "default_weight", "default_duration_seconds", "rest_seconds", "instructions", "is_public", "user_id") VALUES 
(gen_random_uuid(), 'Burpees', 'Ejercicio de alta intensidad para todo el cuerpo', 'full_body', 'cardio', 'intermediate', '3', '15', null, null, '60', 'Desde posición de pie, agáchate, coloca manos en el suelo, salta a posición de plancha, flexión, regresa y salta', 'true', null),
(gen_random_uuid(), 'Thruster', 'Combinación de sentadilla y press', 'full_body', 'compound', 'advanced', '3', '10', null, null, '90', 'Con peso en hombros, realiza una sentadilla y al subir haz un press hacia arriba', 'true', null),
(gen_random_uuid(), 'Turkish Get-Up', 'Ejercicio técnico para estabilidad', 'full_body', 'functional', 'advanced', '3', '5', null, null, '90', 'Acostado con peso elevado en un brazo, levántate manteniendo el peso arriba en todo momento', 'true', null),
(gen_random_uuid(), 'Clean and Jerk', 'Ejercicio olímpico de potencia', 'full_body', 'olympic', 'advanced', '4', '5', null, null, '120', 'Levanta la barra desde el suelo hasta los hombros en un movimiento y luego presiónala sobre la cabeza', 'true', null);

-- CARDIO
INSERT INTO "public"."exercise_templates" ("id", "name", "description", "muscle_group", "exercise_type", "difficulty_level", "default_sets", "default_reps", "default_weight", "default_duration_seconds", "rest_seconds", "instructions", "is_public", "user_id") VALUES 
(gen_random_uuid(), 'Carrera Interválica', 'Alternancia entre alta y baja intensidad', 'cardio', 'cardio', 'intermediate', '5', null, null, '60', '60', 'Alterna entre correr a máxima intensidad y trotar suavemente como recuperación', 'true', null),
(gen_random_uuid(), 'Salto a la Comba', 'Excelente para coordinación y resistencia', 'cardio', 'cardio', 'beginner', '3', null, null, '120', '60', 'Salta la cuerda manteniendo un ritmo constante, con apenas flexión de rodillas', 'true', null),
(gen_random_uuid(), 'Escalador Elíptico', 'Cardio de bajo impacto', 'cardio', 'cardio', 'beginner', '1', null, null, '900', '0', 'Mantén un ritmo constante con resistencia moderada, utilizando tanto brazos como piernas', 'true', null),
(gen_random_uuid(), 'Remo Ergómetro', 'Ejercicio cardiovascular que implica todo el cuerpo', 'cardio', 'cardio', 'intermediate', '1', null, null, '600', '0', 'Mantén la espalda recta, empuja con las piernas primero y luego tira con los brazos', 'true', null); 