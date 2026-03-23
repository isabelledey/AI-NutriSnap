import { cookies } from 'next/headers'
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { DEMO_SESSION_COOKIE, getDemoSessionEmailFromCookieValue, normalizeAuthEmail } from '@/lib/demo-session'

export type ServerSessionState = {
  email: string | null
  isDemoSession: boolean
}

export async function createServerClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }

  return createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, { ...options, secure: process.env.NODE_ENV === 'production' })
          })
        } catch {
          // Cookie writes can fail in some Server Component render contexts.
        }
      },
    },
  })
}

export async function getServerSessionState(): Promise<ServerSessionState> {
  const cookieStore = await cookies()
  const demoSessionEmail = getDemoSessionEmailFromCookieValue(
    cookieStore.get(DEMO_SESSION_COOKIE)?.value ?? null,
  )

  if (demoSessionEmail) {
    return {
      email: demoSessionEmail,
      isDemoSession: true,
    }
  }

  try {
    const supabase = await createServerClient()
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError && sessionError.message !== 'Auth session missing!') {
      console.error('[AUTH DEBUG] Server getSession failed:', {
        message: sessionError.message,
        status: 'status' in sessionError ? sessionError.status : undefined,
        error: sessionError,
      })
    }

    const sessionEmail = normalizeAuthEmail(session?.user?.email ?? '')
    if (sessionEmail) {
      return {
        email: sessionEmail,
        isDemoSession: false,
      }
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError && userError.message !== 'Auth session missing!') {
      console.error('[AUTH DEBUG] Server getUser failed:', {
        message: userError.message,
        status: 'status' in userError ? userError.status : undefined,
        error: userError,
      })
    }

    return {
      email: user?.email ? normalizeAuthEmail(user.email) : null,
      isDemoSession: false,
    }
  } catch (error) {
    console.error('[AUTH DEBUG] Failed to resolve server session state:', error)
    return {
      email: null,
      isDemoSession: false,
    }
  }
}
