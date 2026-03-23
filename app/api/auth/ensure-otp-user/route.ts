import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as { email?: string; name?: string } | null
    const email = body?.email?.trim().toLowerCase()
    const name = body?.name?.trim() || ''

    if (!email) {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 })
    }

    const supabase: any = getSupabaseAdmin()
    const { error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: name ? { name } : undefined,
    })

    if (error) {
      const message = error.message?.toLowerCase?.() || ''
      const isExistingUserError =
        message.includes('already registered') ||
        message.includes('already been registered') ||
        message.includes('user already exists')

      if (!isExistingUserError) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unexpected error' },
      { status: 500 },
    )
  }
}
