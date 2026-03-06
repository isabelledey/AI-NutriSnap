import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

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

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email')
    const start = req.nextUrl.searchParams.get('start')

    if (!email) {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 })
    }

    if (!start) {
      return NextResponse.json({ success: false, message: 'Start timestamp is required' }, { status: 400 })
    }

    const profileId = await getProfileIdByEmail(email)
    if (!profileId) {
      return NextResponse.json({ success: true, todayCalories: 0 })
    }

    const supabase: any = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('meals')
      .select('calories, daily_logs!inner(profile_id)')
      .eq('daily_logs.profile_id', profileId)
      .gte('created_at', start)

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    const todayCalories = (data ?? []).reduce((sum: number, row: Record<string, any>) => {
      const value = Number(row.calories)
      return sum + (Number.isFinite(value) ? value : 0)
    }, 0)

    return NextResponse.json({ success: true, todayCalories: Math.max(0, Math.round(todayCalories)) })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unexpected error' },
      { status: 500 },
    )
  }
}
