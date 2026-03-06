import { NextRequest, NextResponse } from 'next/server'
import { getMockSuggestions } from '@/lib/nutrition'
import { generateWithGemini, parseJsonResponse } from '@/lib/gemini'
import type { UserProfile, MealSuggestion } from '@/lib/types'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { remainingCalories, preferences, mealType, profile, consumedToday } = body as {
    remainingCalories: number
    preferences?: string[]
    mealType?: MealSuggestion['mealType']
    profile?: UserProfile
    consumedToday?: { calories: number; protein: number; carbs: number; fat: number }
  }

  if (remainingCalories === undefined) {
    return NextResponse.json(
      { success: false, message: 'remainingCalories is required' },
      { status: 400 }
    )
  }

  if (!process.env.GEMINI_API_KEY) {
    const suggestions = getMockSuggestions(remainingCalories, preferences || [], mealType)
    return NextResponse.json({
      success: true,
      suggestions,
    })
  }

  try {
    const profileSummary = profile
      ? {
          goal: profile.goal,
          activityLevel: profile.activityLevel,
          foodPreferences: profile.foodPreferences,
          dailyCalorieTarget: profile.dailyCalorieTarget,
          age: profile.age,
          gender: profile.gender,
          height: profile.height,
          heightUnit: profile.heightUnit,
          weight: profile.weight,
          weightUnit: profile.weightUnit,
        }
      : null

    const prompt = `
Create 3 meal suggestions in strict JSON array format.
Return only JSON array, no markdown, no extra text.
Each item schema:
{
  "name": string,
  "description": string,
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "mealType": "breakfast" | "lunch" | "dinner" | "snack"
}

Constraints:
- remainingCalories: ${remainingCalories}
- mealType (optional): ${mealType || 'any'}
- explicit preferences: ${JSON.stringify(preferences || [])}
- profile: ${JSON.stringify(profileSummary)}
- consumedToday: ${JSON.stringify(consumedToday || null)}
- Must align with user's goal and diet preferences.
- Every suggestion calories <= remainingCalories.
- Practical, realistic dishes.
`.trim()

    const raw = await generateWithGemini(
      [{ role: 'user', parts: [{ text: prompt }] }],
      { responseMimeType: 'application/json' },
    )
    const parsed = parseJsonResponse<MealSuggestion[]>(raw)

    const allowedMealTypes = new Set(['breakfast', 'lunch', 'dinner', 'snack'])
    const suggestions = (parsed || [])
      .filter((s) => s && typeof s.name === 'string' && allowedMealTypes.has(s.mealType))
      .map((s) => ({
        name: s.name,
        description: s.description || 'Balanced option',
        calories: Math.max(0, Math.round(s.calories)),
        protein: Math.max(0, Math.round(s.protein)),
        carbs: Math.max(0, Math.round(s.carbs)),
        fat: Math.max(0, Math.round(s.fat)),
        mealType: s.mealType,
      }))
      .filter((s) => s.calories <= remainingCalories)
      .slice(0, 3)

    if (suggestions.length > 0) {
      return NextResponse.json({
        success: true,
        suggestions,
      })
    }
  } catch {
    // Fallback below
  }

  const suggestions = getMockSuggestions(remainingCalories, preferences || [], mealType)

  return NextResponse.json({
    success: true,
    suggestions,
  })
}
