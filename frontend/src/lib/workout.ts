import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '../types/database.types';
import { 
  Workout, 
  WorkoutExercise, 
  WorkoutFilters, 
  WorkoutWithExercises,
  WorkoutInsert,
  WorkoutExerciseInsert,
  WorkoutTemplate,
  WorkoutTemplateWithExercises,
  ExerciseTemplate,
  ExerciseTemplateFilters,
  WorkoutStatistics,
  WorkoutProgressRecord,
  WorkoutProgressData
} from '@/types/workout';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from "./supabase";

// Inicializar cliente Supabase para componentes
const supabaseClient = createClientComponentClient<Database>();

// Función para obtener todos los workouts de un usuario
export async function getUserWorkouts(
  userId: string,
  filters?: WorkoutFilters
): Promise<Workout[]> {
  let query = supabaseClient
    .from('workouts')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  // Aplicar filtros si existen
  if (filters) {
    if (filters.dateFrom) {
      query = query.gte('date', format(filters.dateFrom, 'yyyy-MM-dd'));
    }
    if (filters.dateTo) {
      query = query.lte('date', format(filters.dateTo, 'yyyy-MM-dd'));
    }
    if (filters.workoutType) {
      query = query.eq('workout_type', filters.workoutType);
    }
    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching workouts:', error);
    throw error;
  }

  return data;
}

// Función para obtener un workout específico con sus ejercicios
export async function getWorkoutWithExercises(
  workoutId: string
): Promise<WorkoutWithExercises | null> {
  // Obtener el workout
  const { data: workout, error: workoutError } = await supabaseClient
    .from('workouts')
    .select('*')
    .eq('id', workoutId)
    .single();

  if (workoutError) {
    console.error('Error fetching workout:', workoutError);
    throw workoutError;
  }

  if (!workout) {
    return null;
  }

  // Obtener los ejercicios asociados a este workout
  const { data: exercises, error: exercisesError } = await supabaseClient
    .from('workout_exercises')
    .select('*')
    .eq('workout_id', workoutId)
    .order('order_index', { ascending: true });

  if (exercisesError) {
    console.error('Error fetching workout exercises:', exercisesError);
    throw exercisesError;
  }

  return {
    ...workout,
    exercises: exercises || []
  };
}

// Función para crear un nuevo workout
export async function createWorkout(
  workout: WorkoutInsert,
  exercises: Omit<WorkoutExerciseInsert, 'workout_id'>[]
): Promise<WorkoutWithExercises> {
  // Iniciar una transacción
  const { data: createdWorkout, error: workoutError } = await supabaseClient
    .from('workouts')
    .insert(workout)
    .select()
    .single();

  if (workoutError) {
    console.error('Error creating workout:', workoutError);
    throw workoutError;
  }

  if (!createdWorkout) {
    throw new Error('Error creating workout: No data returned');
  }

  // Añadir el ID del workout a cada ejercicio
  const exercisesWithWorkoutId = exercises.map((exercise) => ({
    ...exercise,
    workout_id: createdWorkout.id
  }));

  // Insertar ejercicios
  const { data: createdExercises, error: exercisesError } = await supabaseClient
    .from('workout_exercises')
    .insert(exercisesWithWorkoutId)
    .select();

  if (exercisesError) {
    // En caso de error, intentar eliminar el workout creado para mantener consistencia
    await supabaseClient.from('workouts').delete().eq('id', createdWorkout.id);
    console.error('Error creating workout exercises:', exercisesError);
    throw exercisesError;
  }

  return {
    ...createdWorkout,
    exercises: createdExercises || []
  };
}

// Función para actualizar un workout existente
export async function updateWorkout(
  workoutId: string,
  workout: Partial<Workout>,
  exercises: WorkoutExerciseInsert[]
): Promise<void> {
  // Actualizar el workout
  const { error: workoutError } = await supabaseClient
    .from('workouts')
    .update(workout)
    .eq('id', workoutId);

  if (workoutError) {
    console.error('Error updating workout:', workoutError);
    throw workoutError;
  }

  // Eliminar los ejercicios existentes
  const { error: deleteError } = await supabaseClient
    .from('workout_exercises')
    .delete()
    .eq('workout_id', workoutId);

  if (deleteError) {
    console.error('Error deleting existing exercises:', deleteError);
    throw deleteError;
  }

  // Añadir el ID del workout a cada ejercicio
  const exercisesWithWorkoutId = exercises.map((exercise, index) => ({
    ...exercise,
    workout_id: workoutId,
    order_index: index
  }));

  // Insertar los nuevos ejercicios
  const { data: createdExercises, error: exercisesError } = await supabaseClient
    .from('workout_exercises')
    .insert(exercisesWithWorkoutId)
    .select();

  if (exercisesError) {
    console.error('Error updating workout exercises:', exercisesError);
    throw exercisesError;
  }

  // Obtener el user_id del workout
  const { data: workoutData } = await supabaseClient
    .from('workouts')
    .select('user_id')
    .eq('id', workoutId)
    .single();

  if (workoutData) {
    // Actualizar el progreso del usuario para cada ejercicio
    await updateUserProgress(workoutData.user_id, createdExercises || []);
  }
}

// Función para eliminar un workout
export async function deleteWorkout(workoutId: string): Promise<void> {
  // Eliminar los ejercicios primero (por restricciones de clave foránea)
  const { error: exercisesError } = await supabaseClient
    .from('workout_exercises')
    .delete()
    .eq('workout_id', workoutId);

  if (exercisesError) {
    console.error('Error deleting workout exercises:', exercisesError);
    throw exercisesError;
  }

  // Eliminar el workout
  const { error: workoutError } = await supabaseClient
    .from('workouts')
    .delete()
    .eq('id', workoutId);

  if (workoutError) {
    console.error('Error deleting workout:', workoutError);
    throw workoutError;
  }
}

// Función para obtener plantillas de ejercicios
export async function getExerciseTemplates(
  filters?: ExerciseTemplateFilters
): Promise<ExerciseTemplate[]> {
  let query = supabaseClient
    .from('exercise_templates')
    .select('*')
    .order('name');

  // Aplicar filtros si existen
  if (filters) {
    if (filters.muscleGroup) {
      query = query.eq('muscle_group', filters.muscleGroup);
    }
    if (filters.exerciseType) {
      query = query.eq('exercise_type', filters.exerciseType);
    }
    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching exercise templates:', error);
    throw error;
  }

  return data;
}

// Función para obtener plantillas de workout
export async function getWorkoutTemplates(
  userId: string,
  includePublic: boolean = true
): Promise<WorkoutTemplate[]> {
  let query = supabaseClient
    .from('workout_templates')
    .select('*');

  if (includePublic) {
    query = query.or(`user_id.eq.${userId},is_public.eq.true`);
  } else {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query.order('name');

  if (error) {
    console.error('Error fetching workout templates:', error);
    throw error;
  }

  return data;
}

// Función para obtener una plantilla de workout con sus ejercicios
export async function getWorkoutTemplateWithExercises(
  templateId: string
): Promise<WorkoutTemplateWithExercises | null> {
  // Obtener la plantilla
  const { data: template, error: templateError } = await supabaseClient
    .from('workout_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (templateError) {
    console.error('Error fetching workout template:', templateError);
    throw templateError;
  }

  if (!template) {
    return null;
  }

  // Obtener los ejercicios asociados a esta plantilla
  const { data: exercises, error: exercisesError } = await supabaseClient
    .from('workout_template_exercises')
    .select('*')
    .eq('template_id', templateId)
    .order('order_index', { ascending: true });

  if (exercisesError) {
    console.error('Error fetching template exercises:', exercisesError);
    throw exercisesError;
  }

  return {
    ...template,
    exercises: exercises || []
  };
}

// Función para crear un workout a partir de una plantilla
export async function createWorkoutFromTemplate(
  userId: string,
  templateId: string,
  date: Date
): Promise<string> {
  // Obtener la plantilla con sus ejercicios
  const template = await getWorkoutTemplateWithExercises(templateId);
  
  if (!template) {
    throw new Error('Template not found');
  }

  // Crear el nuevo workout
  const newWorkout: WorkoutInsert = {
    user_id: userId,
    name: template.name,
    date: format(date, 'yyyy-MM-dd'),
    workout_type: template.workout_type,
    duration_minutes: template.estimated_duration_minutes,
    notes: `Created from template: ${template.name}`
  };

  // Primero crear el workout para obtener su ID
  const { data: createdWorkout, error: workoutError } = await supabaseClient
    .from('workouts')
    .insert(newWorkout)
    .select()
    .single();

  if (workoutError || !createdWorkout) {
    console.error('Error creating workout from template:', workoutError);
    throw workoutError || new Error('No data returned');
  }

  // Crear los ejercicios para el nuevo workout con el ID del workout
  const exercises: WorkoutExerciseInsert[] = template.exercises.map((exercise, index) => {
    return {
      workout_id: createdWorkout.id,
      name: exercise.name,
      sets: exercise.sets,
      reps: exercise.reps,
      rest_seconds: exercise.rest_seconds,
      weight: exercise.suggested_weight,
      duration_seconds: undefined,
      distance: undefined,
      units: undefined,
      notes: exercise.notes,
      order_index: index
    };
  });

  // Insertar los ejercicios
  const { error: exercisesError } = await supabaseClient
    .from('workout_exercises')
    .insert(exercises);

  if (exercisesError) {
    // En caso de error, eliminar el workout creado
    await supabaseClient.from('workouts').delete().eq('id', createdWorkout.id);
    console.error('Error creating exercises for template workout:', exercisesError);
    throw exercisesError;
  }
  
  return createdWorkout.id;
}

// Función para obtener estadísticas de workout
export async function getWorkoutStatistics(
  userId: string
): Promise<WorkoutStatistics> {
  // Obtener todos los workouts del usuario
  const { data: workouts, error } = await supabaseClient
    .from('workouts')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching workouts for statistics:', error);
    throw error;
  }

  if (!workouts || workouts.length === 0) {
    return {
      totalWorkouts: 0,
      totalDuration: 0,
      totalExercises: 0,
      favoriteWorkoutType: 'N/A',
      workoutsByType: {},
      workoutsByMonth: {},
      mostWorkedMuscleGroups: {},
      averageDuration: 0,
      streakDays: 0
    };
  }

  // Calcular número total de workouts
  const totalWorkouts = workouts.length;

  // Calcular duración total
  const totalDuration = workouts.reduce((sum, workout) => 
    sum + (workout.duration_minutes || 0), 0);

  // Calcular duración promedio
  const averageDuration = totalWorkouts > 0 ? totalDuration / totalWorkouts : 0;

  // Workouts por tipo
  const workoutsByType: Record<string, number> = {};
  workouts.forEach(workout => {
    const type = workout.workout_type || 'unknown';
    workoutsByType[type] = (workoutsByType[type] || 0) + 1;
  });

  // Encontrar el tipo de workout favorito
  let favoriteWorkoutType = 'N/A';
  let maxCount = 0;
  Object.entries(workoutsByType).forEach(([type, count]) => {
    if (count > maxCount) {
      maxCount = count;
      favoriteWorkoutType = type;
    }
  });

  // Workouts por mes
  const workoutsByMonth: Record<string, number> = {};
  workouts.forEach(workout => {
    const date = new Date(workout.date);
    const month = format(date, 'MMM yyyy');
    workoutsByMonth[month] = (workoutsByMonth[month] || 0) + 1;
  });

  // Obtener el número total de ejercicios
  const { count: totalExercises, error: countError } = await supabaseClient
    .from('workout_exercises')
    .select('*', { count: 'exact', head: true })
    .in('workout_id', workouts.map(w => w.id));

  if (countError) {
    console.error('Error counting exercises:', countError);
    throw countError;
  }

  // Calcular la racha actual de entrenamientos
  let streakDays = 0;
  // Implementación simple de racha - se puede mejorar para detectar días consecutivos
  
  // Contar grupos musculares trabajados
  const mostWorkedMuscleGroups: Record<string, number> = {};
  for (const workout of workouts) {
    if (workout.muscle_groups && Array.isArray(workout.muscle_groups)) {
      workout.muscle_groups.forEach((group: string) => {
        mostWorkedMuscleGroups[group] = (mostWorkedMuscleGroups[group] || 0) + 1;
      });
    }
  }

  return {
    totalWorkouts,
    totalDuration,
    totalExercises: totalExercises || 0,
    favoriteWorkoutType,
    workoutsByType,
    workoutsByMonth,
    mostWorkedMuscleGroups,
    averageDuration,
    streakDays
  };
}

// Función auxiliar para codificar nombres de ejercicios
function encodeExerciseName(name: string): string {
  return encodeURIComponent(name.trim());
}

// Función para actualizar el progreso del usuario
async function updateUserProgress(userId: string, exercises: WorkoutExercise[]): Promise<void> {
  try {
    for (const exercise of exercises) {
      const encodedName = encodeExerciseName(exercise.name);
      
      // Obtener el progreso actual
      const { data: existingProgress } = await supabaseClient
        .from('workout_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('exercise_name', exercise.name)
        .maybeSingle();

      const now = new Date().toISOString();
      const newSet = {
        date: now,
        weight: exercise.weight || 0,
        reps: exercise.reps,
        volume: (exercise.weight || 0) * exercise.reps
      };

      if (existingProgress) {
        // Actualizar progreso existente
        const updatedProgress: Partial<WorkoutProgressRecord> = {
          max_weight: Math.max(existingProgress.max_weight || 0, exercise.weight || 0),
          max_reps: Math.max(existingProgress.max_reps || 0, exercise.reps),
          total_volume: (existingProgress.total_volume || 0) + (exercise.weight || 0) * exercise.reps,
          last_performed: now,
          progress_history: [...(existingProgress.progress_history || []), newSet]
        };

        if ((exercise.weight || 0) * exercise.reps > (existingProgress.best_set?.volume || 0)) {
          updatedProgress.best_set = newSet;
        }

        await supabaseClient
          .from('workout_progress')
          .update(updatedProgress)
          .eq('user_id', userId)
          .eq('exercise_name', exercise.name);
      } else {
        // Crear nuevo progreso
        await supabaseClient
          .from('workout_progress')
          .insert({
            user_id: userId,
            exercise_name: exercise.name,
            max_weight: exercise.weight || 0,
            max_reps: exercise.reps,
            total_volume: (exercise.weight || 0) * exercise.reps,
            last_performed: now,
            best_set: newSet,
            progress_history: [newSet]
          });
      }
    }
  } catch (error) {
    console.error('Error updating user progress:', error);
    // No lanzar el error para no interrumpir el flujo principal
  }
}

// Función para obtener datos de progreso para un ejercicio específico
export async function getExerciseProgressData(
  userId: string,
  exerciseName: string,
  metric: 'weight' | 'reps' | 'duration' | 'distance'
): Promise<WorkoutProgressData> {
  try {
    // Determinar qué campo buscar basado en la métrica
    let metricField = '';
    switch (metric) {
      case 'weight':
        metricField = 'weight';
        break;
      case 'reps':
        metricField = 'reps';
        break;
      case 'duration':
        metricField = 'duration_seconds';
        break;
      case 'distance':
        metricField = 'distance';
        break;
    }

    // Obtener los workouts del usuario
    const { data: workouts, error: workoutsError } = await supabaseClient
      .from('workouts')
      .select('id, date')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (workoutsError) {
      console.error('Error fetching workouts for progress:', workoutsError);
      throw workoutsError;
    }

    if (!workouts || workouts.length === 0) {
      return {
        exerciseName,
        dates: [],
        values: [],
        metric
      };
    }

    // Usar el cliente de Supabase para obtener los ejercicios, pero con nombres codificados correctamente
    const { data: exercises, error: exercisesError } = await supabaseClient
      .from('workout_exercises')
      .select(`workout_id, ${metricField}`)
      .filter('name', 'eq', exerciseName)
      .in('workout_id', workouts.map(w => w.id));

    if (exercisesError) {
      console.error('Error fetching exercises for progress:', exercisesError);
      throw exercisesError;
    }

    if (!exercises || exercises.length === 0) {
      return {
        exerciseName,
        dates: [],
        values: [],
        metric
      };
    }

    // Mapear los workouts con sus fechas
    const workoutMap = new Map(workouts.map(w => [w.id, w.date]));
    
    // Construir los arrays de datos
    const dates: string[] = [];
    const values: number[] = [];

    exercises.forEach((exercise: any) => {
      const date = workoutMap.get(exercise.workout_id);
      const value = exercise[metricField];
      
      if (date && typeof value === 'number') {
        dates.push(date);
        values.push(value);
      }
    });

    return {
      exerciseName,
      dates,
      values,
      metric
    };
  } catch (error) {
    console.error(`Error getting progress data for exercise ${exerciseName}:`, error);
    // Devolver datos vacíos en caso de error
    return {
      exerciseName,
      dates: [],
      values: [],
      metric
    };
  }
}

// Función para obtener ejercicios recientes (para sugerencias)
export async function getRecentExercises(
  userId: string,
  limit: number = 10
): Promise<string[]> {
  // Obtener los workouts más recientes
  const { data: workouts, error: workoutsError } = await supabaseClient
    .from('workouts')
    .select('id')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(5);

  if (workoutsError) {
    console.error('Error fetching recent workouts:', workoutsError);
    throw workoutsError;
  }

  if (!workouts || workouts.length === 0) {
    return [];
  }

  // Obtener ejercicios únicos de esos workouts
  const { data: exercises, error: exercisesError } = await supabaseClient
    .from('workout_exercises')
    .select('name')
    .in('workout_id', workouts.map(w => w.id));

  if (exercisesError) {
    console.error('Error fetching recent exercises:', exercisesError);
    throw exercisesError;
  }

  if (!exercises || exercises.length === 0) {
    return [];
  }

  // Eliminar duplicados y limitar al número especificado
  const uniqueExercises = Array.from(new Set(exercises.map(e => e.name)));
  return uniqueExercises.slice(0, limit);
}

// Función para crear plantillas de muestra si el usuario no tiene ninguna
export async function createSampleWorkoutTemplates(userId: string): Promise<void> {
  // Verificar si el usuario ya tiene plantillas
  const { data, error } = await supabaseClient
    .from('workout_templates')
    .select('id')
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error checking for existing templates:', error);
    throw error;
  }
  
  // Si el usuario ya tiene plantillas, no crear nuevas
  if (data && data.length > 0) {
    return;
  }
  
  // Lista de plantillas de muestra
  const sampleTemplates = [
    {
      user_id: userId,
      name: 'Abs de Acero',
      description: 'Rutina intensiva para fortalecer el core',
      estimated_duration_minutes: 35,
      workout_type: 'Fuerza',
      difficulty_level: 'intermediate',
      is_public: true,
      muscle_groups: ['abs', 'obliques']
    },
    {
      user_id: userId,
      name: 'Brazos Definidos',
      description: 'Rutina para tonificar y definir los brazos',
      estimated_duration_minutes: 40,
      workout_type: 'Fuerza',
      difficulty_level: 'beginner',
      is_public: true,
      muscle_groups: ['biceps', 'triceps', 'forearms']
    },
    {
      user_id: userId,
      name: 'Cardio Quemagrasa',
      description: 'Entrenamiento cardiovascular para quemar calorías',
      estimated_duration_minutes: 35,
      workout_type: 'Cardio',
      difficulty_level: 'intermediate',
      is_public: true,
      muscle_groups: ['cardio', 'full_body']
    },
    {
      user_id: userId,
      name: 'Crossfit WOD',
      description: 'Entrenamiento del día estilo crossfit',
      estimated_duration_minutes: 40,
      workout_type: 'Crossfit',
      difficulty_level: 'advanced',
      is_public: true,
      muscle_groups: ['full_body', 'cardio']
    }
  ];
  
  // Insertar las plantillas de muestra
  const { error: insertError } = await supabaseClient
    .from('workout_templates')
    .insert(sampleTemplates);
  
  if (insertError) {
    console.error('Error creating sample templates:', insertError);
    throw insertError;
  }
}

// Función para obtener plantillas por grupo muscular
export async function getWorkoutTemplatesByMuscleGroup(
  userId: string,
  muscleGroup: string
): Promise<WorkoutTemplate[]> {
  try {
    if (muscleGroup === "all") {
      // Si es "todos", simplemente devolver todas las plantillas disponibles
      const { data: templates, error } = await supabaseClient
        .from('workout_templates')
        .select('*')
        .or(`user_id.eq.${userId},is_public.eq.true`);
      
      if (error) {
        console.error('Error fetching templates:', error);
        throw error;
      }
      
      return templates || [];
    }

    // Buscar plantillas que tienen ejercicios con ese grupo muscular
    const { data: exercisesByMuscleGroup, error } = await supabaseClient
      .from('workout_template_exercises')
      .select('template_id')
      .eq('muscle_group', muscleGroup);
    
    if (error) {
      console.error('Error fetching exercises by muscle group:', error);
      // Intentar buscar en el array muscle_groups como fallback
      try {
        const { data: templatesByMuscleGroupArray, error: fallbackError } = await supabaseClient
          .from('workout_templates')
          .select('*')
          .or(`user_id.eq.${userId},is_public.eq.true`)
          .contains('muscle_groups', [muscleGroup]);
          
        if (fallbackError) {
          console.error('Error en fallback de búsqueda por muscle_groups:', fallbackError);
          return [];
        }
        
        return templatesByMuscleGroupArray || [];
      } catch (fallbackError) {
        console.error('Error total en getWorkoutTemplatesByMuscleGroup:', fallbackError);
        return [];
      }
    }
    
    // Si no hay ejercicios con ese grupo muscular, retornar array vacío
    if (!exercisesByMuscleGroup || exercisesByMuscleGroup.length === 0) {
      console.log('No se encontraron ejercicios para el grupo muscular:', muscleGroup);
      return [];
    }
    
    // Extraer los IDs de plantillas únicos
    const templateIds = Array.from(
      new Set(exercisesByMuscleGroup.map(ex => ex.template_id))
    );
    
    if (templateIds.length === 0) {
      return [];
    }
    
    // Buscar las plantillas por los IDs obtenidos
    const { data: templates, error: templatesError } = await supabaseClient
      .from('workout_templates')
      .select('*')
      .or(`user_id.eq.${userId},is_public.eq.true`)
      .in('id', templateIds);
    
    if (templatesError) {
      console.error('Error fetching templates by IDs:', templatesError);
      return [];
    }
    
    return templates || [];
  } catch (error) {
    console.error(`Error en getWorkoutTemplatesByMuscleGroup:`, error);
    return [];
  }
}

export async function getWorkoutById(id: string): Promise<WorkoutWithExercises> {
  try {
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
      throw new Error("Usuario no autenticado");
    }

    // Obtener el workout con sus ejercicios
    const { data: workout, error } = await supabaseClient
      .from("workouts")
      .select(`
        *,
        exercises:workout_exercises (
          id,
          workout_id,
          name,
          sets,
          reps,
          weight,
          duration_seconds,
          distance,
          units,
          rest_seconds,
          order_index,
          notes,
          created_at,
          updated_at
        )
      `)
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching workout:", error);
      throw error;
    }

    if (!workout) {
      console.error("No workout found with ID:", id);
      throw new Error("Workout not found");
    }

    return workout as WorkoutWithExercises;
  } catch (error) {
    console.error("Error in getWorkoutById:", error);
    throw error;
  }
} 