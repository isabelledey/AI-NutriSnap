export interface FoodItem {
  name: string
  portion: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface MealAnalysis {
  id?: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  items: FoodItem[]
  imageUrl?: string
  timestamp?: string
}

export type ScanQuestion = {
  id: string
  text: string
  options: string[]
}

export type ScanResult = {
  is_food: boolean
  questions: ScanQuestion[]
}

export interface MealSuggestion {
  name: string
  description: string
  calories: number
  protein: number
  carbs: number
  fat: number
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
}

export interface UserProfile {
  email: string
  name: string
  age: number
  gender: 'male' | 'female' | 'other'
  height: number
  heightUnit: 'cm' | 'ft'
  weight: number
  weightUnit: 'kg' | 'lbs'
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  foodPreferences: string[]
  goal: 'lose_weight' | 'maintain' | 'build_muscle' | 'get_fit'
  dailyCalorieTarget: number
}

export interface DailyLog {
  date: string
  meals: MealAnalysis[]
  suggestions: MealSuggestion[]
}

export type AppStep =
  | 'landing'
  | 'photo'
  | 'analyzing'
  | 'analysis'
  | 'onboarding-email'
  | 'onboarding-verify'
  | 'onboarding-profile'
  | 'dashboard'
