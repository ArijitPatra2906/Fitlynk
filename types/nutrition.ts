export interface ServingSize {
  unit: string
  grams: number
  label?: string
}

export interface Food {
  _id: string
  name: string
  brand?: string
  barcode?: string
  calories_per_100g: number
  protein_per_100g: number
  carbs_per_100g: number
  fat_per_100g: number
  serving_sizes?: ServingSize[]
  source: 'user' | 'openfoodfacts'
  created_by?: string
  created_at: string
  updated_at: string
}

export interface PopulatedFood {
  _id: string
  name: string
  brand?: string
}

export interface MealLog {
  _id: string
  user_id: string
  date: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  food_id: Food | string | PopulatedFood
  serving_size: number
  serving_unit: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  created_at: string
}

export interface MealLogPopulated extends Omit<MealLog, 'food_id'> {
  food_id: PopulatedFood
}
