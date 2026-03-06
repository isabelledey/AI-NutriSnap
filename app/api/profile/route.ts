import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { createServerClient } from '@/lib/supabase/server'
import type { UserProfile } from '@/lib/types'

function parseProfileRow(row: Record<string, any>): UserProfile {
  return {
    email: row.email,
    name: row.name ?? '',
    age: row.age,
    gender: row.gender,
    height: row.height,
    heightUnit: row.height_unit,
    weight: row.weight,
    weightUnit: row.weight_unit,
    activityLevel: row.activity_level,
    foodPreferences: row.food_preferences ?? [],
    goal: row.goal,
    dailyCalorieTarget: row.daily_calorie_target,
  }
}

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    const email = req.nextUrl.searchParams.get('email')
    
    if (!id && !email) {
      return NextResponse.json({ success: false, message: 'ID or Email is required' }, { status: 400 })
    }

    const supabase: any = getSupabaseAdmin()
    
    let query = supabase.from('profiles').select('*')
    
    if (id) {
      query = query.eq('id', id)
    } else if (email) {
      query = query.eq('email', email)
    }
    
    const { data, error } = await query.maybeSingle()

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ success: true, profile: null })
    }

    return NextResponse.json({ success: true, profile: parseProfileRow(data) })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unexpected error' },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const profile = (await req.json()) as UserProfile

    if (!profile?.email) {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 })
    }

    const supabaseServer = await createServerClient()
    const { data: sessionData, error: sessionError } = await supabaseServer.auth.getSession()

    if (sessionError || !sessionData?.session?.user?.id) {
      console.error('Supabase auth session error in profile POST:', sessionError)
      return NextResponse.json({ success: false, message: 'Unauthorized, no active session' }, { status: 401 })
    }

    const userId = sessionData.session.user.id

    const supabase: any = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          email: profile.email,
          name: profile.name,
          age: profile.age,
          gender: profile.gender,
          height: profile.height,
          height_unit: profile.heightUnit,
          weight: profile.weight,
          weight_unit: profile.weightUnit,
          activity_level: profile.activityLevel,
          food_preferences: profile.foodPreferences,
          goal: profile.goal,
          daily_calorie_target: profile.dailyCalorieTarget,
        },
        { onConflict: 'id' },
      )
      .select('*')
      .single()

    if (error) {
      console.error("Supabase upsert error in profile POST:", error)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, profile: parseProfileRow(data) })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unexpected error' },
      { status: 500 },
    )
  }
}
