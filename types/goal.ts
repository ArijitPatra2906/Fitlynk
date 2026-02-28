export interface Goal {
  _id: string
  user_id: string
  goal_type: 'lose' | 'maintain' | 'gain'
  calorie_target: number
  protein_g: number
  carbs_g: number
  fat_g: number
  weight_goal_kg?: number
  activity_level: 'sedentary' | 'light' | 'moderate' | 'very_active' | 'extra_active'
  created_at: string
  updated_at: string
}
