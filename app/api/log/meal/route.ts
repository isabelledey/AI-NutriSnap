import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const mealId = body?.mealId as string | undefined

    if (!mealId) {
      return NextResponse.json({ success: false, message: 'Meal id is required' }, { status: 400 })
    }

    const supabase: any = getSupabaseAdmin()
    const { error } = await supabase.from('meals').delete().eq('id', mealId)

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unexpected error' },
      { status: 500 },
    )
  }
}
