import { NextRequest, NextResponse } from 'next/server'
import { getMockSuggestions } from '@/lib/nutrition'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { remainingCalories, preferences, mealType } = body

  if (remainingCalories === undefined) {
    return NextResponse.json(
      { success: false, message: 'remainingCalories is required' },
      { status: 400 }
    )
  }

  // Mock suggestions - will be replaced by Gemini API for intelligent suggestions
  const suggestions = getMockSuggestions(
    remainingCalories,
    preferences || [],
    mealType
  )

  return NextResponse.json({
    success: true,
    suggestions,
  })
}
