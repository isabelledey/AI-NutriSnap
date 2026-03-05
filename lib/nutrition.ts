import type { UserProfile, MealAnalysis, MealSuggestion } from './types'

// Mifflin-St Jeor equation for BMR
export function calculateBMR(profile: UserProfile): number {
  const weightKg = profile.weightUnit === 'lbs' ? profile.weight * 0.453592 : profile.weight
  const heightCm = profile.heightUnit === 'ft' ? profile.height * 30.48 : profile.height

  if (profile.gender === 'female') {
    return 10 * weightKg + 6.25 * heightCm - 5 * profile.age - 161
  }
  return 10 * weightKg + 6.25 * heightCm - 5 * profile.age + 5
}

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

const GOAL_ADJUSTMENTS: Record<string, number> = {
  lose_weight: -500,
  maintain: 0,
  build_muscle: 300,
  get_fit: -200,
}

export function calculateDailyCalorieTarget(profile: UserProfile): number {
  const bmr = calculateBMR(profile)
  const tdee = bmr * (ACTIVITY_MULTIPLIERS[profile.activityLevel] || 1.55)
  const goalAdjustment = GOAL_ADJUSTMENTS[profile.goal] || 0
  return Math.round(tdee + goalAdjustment)
}

export function calculateRemainingCalories(target: number, consumed: number): number {
  return Math.max(0, target - consumed)
}

export function getTotalConsumed(meals: MealAnalysis[]): {
  calories: number
  protein: number
  carbs: number
  fat: number
} {
  return meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fat: acc.fat + meal.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
}

// Mock food analysis - will be replaced by Gemini API
export function getMockAnalysis(): MealAnalysis {
  const dishes = [
    {
      name: 'Grilled Chicken Salad',
      calories: 420,
      protein: 38,
      carbs: 18,
      fat: 22,
      fiber: 6,
      items: [
        { name: 'Grilled Chicken Breast', portion: '150g', calories: 250, protein: 30, carbs: 0, fat: 14 },
        { name: 'Mixed Greens', portion: '100g', calories: 25, protein: 2, carbs: 4, fat: 0 },
        { name: 'Cherry Tomatoes', portion: '50g', calories: 15, protein: 1, carbs: 3, fat: 0 },
        { name: 'Olive Oil Dressing', portion: '2 tbsp', calories: 120, protein: 0, carbs: 1, fat: 14 },
        { name: 'Feta Cheese', portion: '20g', calories: 50, protein: 3, carbs: 1, fat: 4 },
      ],
    },
    {
      name: 'Pasta Bolognese',
      calories: 650,
      protein: 28,
      carbs: 72,
      fat: 24,
      fiber: 5,
      items: [
        { name: 'Spaghetti', portion: '200g cooked', calories: 310, protein: 11, carbs: 62, fat: 2 },
        { name: 'Beef Ragu Sauce', portion: '150g', calories: 220, protein: 15, carbs: 8, fat: 14 },
        { name: 'Parmesan Cheese', portion: '15g', calories: 60, protein: 4, carbs: 0, fat: 4 },
        { name: 'Olive Oil', portion: '1 tbsp', calories: 60, protein: 0, carbs: 0, fat: 7 },
      ],
    },
    {
      name: 'Salmon Bowl',
      calories: 520,
      protein: 35,
      carbs: 45,
      fat: 18,
      fiber: 4,
      items: [
        { name: 'Grilled Salmon', portion: '130g', calories: 260, protein: 30, carbs: 0, fat: 15 },
        { name: 'Brown Rice', portion: '150g cooked', calories: 170, protein: 4, carbs: 36, fat: 1 },
        { name: 'Edamame', portion: '50g', calories: 60, protein: 5, carbs: 5, fat: 3 },
        { name: 'Sesame Dressing', portion: '1 tbsp', calories: 50, protein: 1, carbs: 3, fat: 4 },
      ],
    },
  ]
  return dishes[Math.floor(Math.random() * dishes.length)]
}

// Mock meal suggestions based on remaining calories
export function getMockSuggestions(
  remainingCalories: number,
  preferences: string[],
  mealType?: string
): MealSuggestion[] {
  const allSuggestions: MealSuggestion[] = [
    {
      name: 'Greek Yogurt Parfait',
      description: 'Creamy yogurt layered with granola and fresh berries',
      calories: 280,
      protein: 18,
      carbs: 35,
      fat: 8,
      mealType: 'breakfast',
    },
    {
      name: 'Avocado Toast with Eggs',
      description: 'Whole grain toast topped with mashed avocado and poached eggs',
      calories: 380,
      protein: 16,
      carbs: 28,
      fat: 24,
      mealType: 'breakfast',
    },
    {
      name: 'Quinoa Buddha Bowl',
      description: 'Protein-packed quinoa with roasted vegetables and tahini',
      calories: 450,
      protein: 16,
      carbs: 52,
      fat: 18,
      mealType: 'lunch',
    },
    {
      name: 'Turkey Wrap',
      description: 'Whole wheat wrap with turkey, hummus, and fresh veggies',
      calories: 350,
      protein: 25,
      carbs: 32,
      fat: 12,
      mealType: 'lunch',
    },
    {
      name: 'Baked Cod with Vegetables',
      description: 'Herb-crusted cod with roasted seasonal vegetables',
      calories: 380,
      protein: 32,
      carbs: 18,
      fat: 14,
      mealType: 'dinner',
    },
    {
      name: 'Chicken Stir-Fry',
      description: 'Lean chicken with colorful bell peppers and brown rice',
      calories: 480,
      protein: 35,
      carbs: 42,
      fat: 16,
      mealType: 'dinner',
    },
    {
      name: 'Mixed Nuts & Fruit',
      description: 'A handful of almonds, walnuts, and dried cranberries',
      calories: 200,
      protein: 6,
      carbs: 18,
      fat: 14,
      mealType: 'snack',
    },
    {
      name: 'Protein Smoothie',
      description: 'Banana, spinach, protein powder, and almond milk',
      calories: 250,
      protein: 22,
      carbs: 30,
      fat: 5,
      mealType: 'snack',
    },
  ]

  const isVegetarian = preferences.includes('Vegetarian') || preferences.includes('Vegan')
  let filtered = allSuggestions

  if (isVegetarian) {
    filtered = filtered.filter(
      (s) =>
        !s.name.toLowerCase().includes('chicken') &&
        !s.name.toLowerCase().includes('turkey') &&
        !s.name.toLowerCase().includes('cod') &&
        !s.name.toLowerCase().includes('salmon')
    )
  }

  if (mealType) {
    const ofType = filtered.filter((s) => s.mealType === mealType)
    if (ofType.length > 0) filtered = ofType
  }

  return filtered
    .filter((s) => s.calories <= remainingCalories)
    .slice(0, 3)
}
