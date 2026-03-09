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
  category?:
    | 'fruit'
    | 'vegetable'
    | 'grain'
    | 'protein'
    | 'dairy'
    | 'snack'
    | 'sweet'
    | 'meal'
    | 'street_food'
    | 'restaurant'
    | 'supplement'
    | 'packaged'
    | 'ingredient'
  region?: 'global' | 'indian' | 'bengali' | 'asian' | 'western'
  source:
    | 'usda'
    | 'indian_db'
    | 'bengali_db'
    | 'open_food_facts'
    | 'restaurant'
    | 'supplement'
    | 'packaged'
    | 'street_food'
    | 'custom'
  user_id?: string
  created_at: string
  isLocal?: boolean
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
