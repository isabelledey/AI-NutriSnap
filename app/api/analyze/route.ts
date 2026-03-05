import { NextResponse } from 'next/server'
import { getMockAnalysis } from '@/lib/nutrition'

export async function POST() {
  // Simulate AI processing delay
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Mock analysis - will be replaced by Gemini Vision API
  const analysis = getMockAnalysis()

  return NextResponse.json({
    success: true,
    analysis,
  })
}
