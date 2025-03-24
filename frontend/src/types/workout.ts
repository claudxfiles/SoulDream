// Tipos básicos para la aplicación - No necesitamos importar Database desde supabase aquí
// ya que estamos definiendo nuestros propios tipos

/**
 * Tipos relacionados con entrenamientos
 */

// Enums para opciones predefinidas
export enum WorkoutType {
  STRENGTH = 'Fuerza',
  CARDIO = 'Cardio',
  FLEXIBILITY = 'Flexibilidad',
  HIIT = 'HIIT',
  YOGA = 'Yoga',
  PILATES = 'Pilates',
  CROSSFIT = 'Crossfit',
  CUSTOM = 'Personalizado'
}

export enum MuscleGroup {
  ABS = 'abs',
  BICEPS = 'biceps',
  CALVES = 'calves',
  CHEST = 'chest',
  FOREARMS = 'forearms',
  GLUTES = 'glutes',
  HAMSTRING = 'hamstring',
  OBLIQUES = 'obliques',
  QUADRICEPS = 'quadriceps',
  SHOULDER = 'shoulder',
  TRICEPS = 'triceps',
  BACK = 'back',
  FULL_BODY = 'full_body',
  CARDIO = 'cardio'
}

// Mapeo de grupos musculares a sus imágenes
export const muscleGroupImages: Record<string, string> = {
  [MuscleGroup.ABS]: '/image-workout/abs.png',
  [MuscleGroup.BICEPS]: '/image-workout/Biceps.png',
  [MuscleGroup.CALVES]: '/image-workout/Calves.png',
  [MuscleGroup.CHEST]: '/image-workout/Chest.png',
  [MuscleGroup.FOREARMS]: '/image-workout/forearms.png',
  [MuscleGroup.GLUTES]: '/image-workout/Glutes.png',
  [MuscleGroup.HAMSTRING]: '/image-workout/Hamstring.png', 
  [MuscleGroup.OBLIQUES]: '/image-workout/Obliques.png',
  [MuscleGroup.QUADRICEPS]: '/image-workout/Quadriceps.png',
  [MuscleGroup.SHOULDER]: '/image-workout/Shoulder.png',
  [MuscleGroup.TRICEPS]: '/image-workout/triceps.png',
  [MuscleGroup.BACK]: '/image-workout/back.webp',
  [MuscleGroup.FULL_BODY]: '/image-workout/full_body.webp',
  [MuscleGroup.CARDIO]: '/image-workout/cardio.webp'
};

export enum ExerciseType {
  STRENGTH = 'strength',
  CARDIO = 'cardio',
  FLEXIBILITY = 'flexibility',
  BODYWEIGHT = 'bodyweight',
  COMPOUND = 'compound',
  ISOLATION = 'isolation'
}

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced'
}

// Interfaces para la aplicación
export interface Workout {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  date: string;
  created_at: string;
  calories_burned?: number;
  workout_type: WorkoutType;
  related_goal_id?: string;
  rating?: number;
  muscle_groups?: string[];
  notes?: string;
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  duration_seconds?: number;
  distance?: number;
  units?: string;
  rest_seconds: number;
  order_index: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkoutWithExercises extends Workout {
  exercises: WorkoutExercise[];
  duration?: string;
  last_performed?: string;
  created_at: string;
}

// Tipos para inserciones
export type WorkoutInsert = Omit<Workout, 'id' | 'created_at'> & {
  calories_burned?: number | null;
  notes?: string | null;
  muscle_groups?: string[] | null;
};

export type WorkoutExerciseInsert = Omit<WorkoutExercise, 'id' | 'created_at' | 'updated_at'>;

// Tipo para ser usado en contexto del asistente de IA
export interface WorkoutData extends WorkoutWithExercises {
  totalWorkoutsThisWeek?: number;
  totalWorkoutsThisMonth?: number;
  favoriteExercises?: string[];
  recentProgress?: WorkoutProgressData[];
  nextScheduledWorkout?: string;
}

export interface WorkoutTemplate {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  estimated_duration_minutes: number;
  workout_type: WorkoutType;
  difficulty_level: DifficultyLevel;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  tags?: string[];
  muscle_groups?: string[];
}

export interface WorkoutTemplateExercise {
  id: string;
  template_id: string;
  name: string;
  sets: number;
  reps: number;
  suggested_weight?: number;
  rest_seconds: number;
  order_index: number;
  notes?: string;
  muscle_group: MuscleGroup;
  exercise_type: ExerciseType;
  created_at: string;
  updated_at: string;
}

export interface WorkoutTemplateWithExercises extends WorkoutTemplate {
  exercises: WorkoutTemplateExercise[];
  duration?: string;
  type?: string;
  notes?: string;
}

export interface WorkoutProgressData {
  exerciseName: string;
  dates: string[];
  values: number[];
  metric: 'weight' | 'reps' | 'duration' | 'distance';
}

export interface WorkoutProgressRecord {
  id: string;
  user_id: string;
  exercise_name: string;
  max_weight: number;
  max_reps: number;
  total_volume: number;
  last_performed: string;
  best_set: {
    date: string;
    weight: number;
    reps: number;
    volume: number;
  };
  progress_history: Array<{
    date: string;
    weight: number;
    reps: number;
    volume: number;
  }>;
  created_at: string;
  updated_at: string;
}

export interface WorkoutFilters {
  dateFrom?: Date;
  dateTo?: Date;
  workoutType?: WorkoutType;
  muscleGroups?: MuscleGroup[];
  search?: string;
}

export interface ExerciseTemplateFilters {
  muscleGroup?: MuscleGroup;
  exerciseType?: ExerciseType;
  search?: string;
}

export interface WorkoutStatistics {
  totalWorkouts: number;
  totalDuration: number;
  totalExercises: number;
  favoriteWorkoutType: string;
  workoutsByType: Record<string, number>;
  workoutsByMonth: Record<string, number>;
  mostWorkedMuscleGroups: Record<string, number>;
  averageDuration: number;
  streakDays: number;
}

export interface AIWorkoutRecommendation {
  name: string;
  description: string;
  workoutType: WorkoutType;
  difficultyLevel: DifficultyLevel;
  estimatedDuration: number;
  muscleGroups: MuscleGroup[];
  exercises: {
    name: string;
    sets: number;
    reps: number | string;
    restSeconds: number;
    notes?: string;
  }[];
  notes?: string;
}

export interface ExerciseTemplate {
  id: string;
  name: string;
  description?: string;
  muscle_group: string;
  exercise_type: ExerciseType;
  difficulty_level?: DifficultyLevel;
  default_sets?: number;
  default_reps?: number;
  default_weight?: number;
  default_duration_seconds?: number;
  rest_seconds?: number;
  instructions?: string;
  is_public: boolean;
  user_id?: string;
  created_at: string;
  updated_at: string;
} 