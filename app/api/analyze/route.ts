import { NextRequest, NextResponse } from 'next/server'
import { getMockAnalysis } from '@/lib/nutrition'
import { dataUrlToInlineData, generateWithGemini, parseJsonResponse } from '@/lib/gemini'
import type { MealAnalysis } from '@/lib/types'

type AnalyzeResponse = Pick<MealAnalysis, 'name' | 'calories' | 'protein' | 'carbs' | 'fat' | 'fiber' | 'items'>

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const image = body?.image as string | undefined

    if (!image) {
      return NextResponse.json({ success: false, message: 'Image is required' }, { status: 400 })
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ success: true, analysis: getMockAnalysis() })
    }

    const inlineData = dataUrlToInlineData(image)
    const prompt = `
Analyze this meal photo and return strict JSON only.
The result must follow:
{
  "name": string,
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "fiber": number,
  "items": [{ "name": string, "portion": string, "calories": number, "protein": number, "carbs": number, "fat": number }]
}
Rules:
- Identify what is actually visible.
- Estimate realistic macro values in grams.
- No markdown, no explanation, JSON only.
`.trim()

    const raw = await generateWithGemini(
      [
        {
          role: 'user',
          parts: [{ text: prompt }, { inline_data: inlineData }],
        },
      ],
      { responseMimeType: 'application/json' },
    )

    const parsed = parseJsonResponse<AnalyzeResponse>(raw)
    const analysis: MealAnalysis = {
      name: parsed.name,
      calories: Math.max(0, Math.round(parsed.calories)),
      protein: Math.max(0, Math.round(parsed.protein)),
      carbs: Math.max(0, Math.round(parsed.carbs)),
      fat: Math.max(0, Math.round(parsed.fat)),
      fiber: Math.max(0, Math.round(parsed.fiber)),
      items: (parsed.items || []).map((item) => ({
        name: item.name,
        portion: item.portion,
        calories: Math.max(0, Math.round(item.calories)),
        protein: Math.max(0, Math.round(item.protein)),
        carbs: Math.max(0, Math.round(item.carbs)),
        fat: Math.max(0, Math.round(item.fat)),
      })),
    }

    return NextResponse.json({ success: true, analysis })
  } catch {
    return NextResponse.json({
      success: true,
      analysis: getMockAnalysis(),
    })
  }
}
