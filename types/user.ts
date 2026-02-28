export interface User {
  _id: string
  email: string
  name: string
  avatar_url?: string
  height?: number
  weight_kg?: number
  date_of_birth?: string
  gender?: 'male' | 'female' | 'other'
  units: 'metric' | 'imperial'
  google_id?: string
  auth_provider: 'email' | 'google'
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}
