export interface BodyMetrics {
  _id: string
  user_id: string
  weight_kg?: number
  body_fat_percentage?: number
  muscle_mass_kg?: number
  recorded_at: string
  created_at: string
  updated_at: string
}

export interface StepLog {
  _id: string
  user_id: string
  date: string
  steps: number
  distance_km?: number
  calories_burned?: number
  active_minutes?: number
  slow_minutes?: number
  brisk_minutes?: number
  slow_steps?: number
  brisk_steps?: number
  source?: 'manual' | 'device' | 'synced'
  created_at: string
  updated_at: string
}

export interface WaterLog {
  _id: string
  user_id: string
  date: string
  amount_ml: number
  logged_at: string
  created_at: string
  updated_at: string
}
