import type { UserProfile, DailyLog, MealAnalysis } from './types'

const PROFILE_KEY = 'nutrisnap_profile'
const LOG_KEY_PREFIX = 'nutrisnap_log_'
const PENDING_MEAL_KEY = 'nutrisnap_pending_meal'

export function getUserProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null
  const data = localStorage.getItem(PROFILE_KEY)
  return data ? JSON.parse(data) : null
}

export function saveUserProfile(profile: UserProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
}

export function isOnboarded(): boolean {
  return getUserProfile() !== null
}

function getDateKey(date?: string): string {
  const d = date || new Date().toISOString().split('T')[0]
  return `${LOG_KEY_PREFIX}${d}`
}

export function getDailyLog(date?: string): DailyLog {
  if (typeof window === 'undefined') {
    return { date: date || new Date().toISOString().split('T')[0], meals: [], suggestions: [] }
  }
  const key = getDateKey(date)
  const data = localStorage.getItem(key)
  if (data) return JSON.parse(data)
  return {
    date: date || new Date().toISOString().split('T')[0],
    meals: [],
    suggestions: [],
  }
}

export function saveDailyLog(log: DailyLog): void {
  const key = getDateKey(log.date)
  localStorage.setItem(key, JSON.stringify(log))
}

export function saveMealToLog(meal: MealAnalysis, date?: string): void {
  const log = getDailyLog(date)
  log.meals.push({
    ...meal,
    timestamp: meal.timestamp || new Date().toISOString(),
  })
  saveDailyLog(log)
}

export function setPendingMeal(meal: MealAnalysis): void {
  localStorage.setItem(PENDING_MEAL_KEY, JSON.stringify(meal))
}

export function getPendingMeal(): MealAnalysis | null {
  if (typeof window === 'undefined') return null
  const data = localStorage.getItem(PENDING_MEAL_KEY)
  return data ? JSON.parse(data) : null
}

export function clearPendingMeal(): void {
  localStorage.removeItem(PENDING_MEAL_KEY)
}
