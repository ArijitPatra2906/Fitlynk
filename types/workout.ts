export interface Exercise {
  _id: string
  name: string
  category: 'strength' | 'cardio' | 'mobility' | 'plyometric'
  muscle_groups: string[]
  primary_muscle?: string
  secondary_muscles?: string[]
  equipment?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  exercise_type?: 'compound' | 'isolation'
  calories_per_minute?: number
  instructions?: string[]
  created_by?: string
  is_custom: boolean
  is_active: boolean
  created_at: string
}

export interface WorkoutSet {
  set_number: number
  reps: number
  weight_kg: number
  duration_s?: number
  distance_m?: number
  is_warmup: boolean
  completed_at?: string
}

export interface ExerciseInWorkout {
  exercise_id: Exercise | string
  order_index: number
  sets: WorkoutSet[]
  notes?: string
}

export interface Workout {
  _id?: string
  user_id?: string
  name: string
  exercises: ExerciseInWorkout[]
  started_at: string
  ended_at?: string
  calories?: number
  notes?: string
  is_template: boolean
  template_id?: string
  created_at?: string
  updated_at?: string
}
