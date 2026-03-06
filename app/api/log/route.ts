import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import type { MealAnalysis } from '@/lib/types'

async function getProfileIdByEmail(email: string) {
  const supabase: any = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data?.id as string | undefined
}

async function getOrCreateDailyLogId(profileId: string, logDate: string) {
  const supabase: any = getSupabaseAdmin()
  const { data: existing, error: existingError } = await supabase
    .from('daily_logs')
    .select('id')
    .eq('profile_id', profileId)
    .eq('log_date', logDate)
    .maybeSingle()

  if (existingError) throw new Error(existingError.message)
  if (existing?.id) return existing.id as string

  const { data: created, error: createError } = await supabase
    .from('daily_logs')
    .insert({
      profile_id: profileId,
      log_date: logDate,
    })
    .select('id')
    .single()

  if (createError) throw new Error(createError.message)
  return created.id as string
}

function parseMealRow(row: Record<string, any>): MealAnalysis {
  return {
    id: row.id,
    name: row.name,
    calories: row.calories,
    protein: row.protein,
    carbs: row.carbs,
    fat: row.fat,
    fiber: row.fiber,
    items: row.items ?? [],
    imageUrl: row.image_url ?? undefined,
    timestamp: row.consumed_at ?? row.created_at,
  }
}

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email')
    const date = req.nextUrl.searchParams.get('date') ?? new Date().toISOString().split('T')[0]

    if (!email) {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 })
    }

    const profileId = await getProfileIdByEmail(email)
    if (!profileId) {
      return NextResponse.json({
        success: true,
        log: { date, meals: [], suggestions: [] },
      })
    }

    const supabase: any = getSupabaseAdmin()
    const { data: dailyLog, error: logError } = await supabase
      .from('daily_logs')
      .select('id')
      .eq('profile_id', profileId)
      .eq('log_date', date)
      .maybeSingle()

    if (logError) {
      return NextResponse.json({ success: false, message: logError.message }, { status: 500 })
    }

    if (!dailyLog?.id) {
      return NextResponse.json({
        success: true,
        log: { date, meals: [], suggestions: [] },
      })
    }

    const { data: meals, error: mealsError } = await supabase
      .from('meals')
      .select('*')
      .eq('daily_log_id', dailyLog.id)
      .order('consumed_at', { ascending: false })

    if (mealsError) {
      return NextResponse.json({ success: false, message: mealsError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      log: {
        date,
        meals: (meals ?? []).map(parseMealRow),
        suggestions: [],
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unexpected error' },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = body?.email as string | undefined
    const meal = body?.meal as MealAnalysis | undefined
    const date = (body?.date as string | undefined) ?? new Date().toISOString().split('T')[0]

    if (!email || !meal) {
      return NextResponse.json({ success: false, message: 'Email and meal are required' }, { status: 400 })
    }

    const profileId = await getProfileIdByEmail(email)
    if (!profileId) {
      return NextResponse.json({ success: false, message: 'Profile not found for email' }, { status: 404 })
    }

    const dailyLogId = await getOrCreateDailyLogId(profileId, date)
    const supabase: any = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('meals')
      .insert({
        daily_log_id: dailyLogId,
        name: meal.name,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        fiber: meal.fiber,
        items: meal.items,
        image_url: meal.imageUrl ?? null,
        consumed_at: meal.timestamp ?? new Date().toISOString(),
      })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, meal: parseMealRow(data) })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unexpected error' },
      { status: 500 },
    )
  }
}
