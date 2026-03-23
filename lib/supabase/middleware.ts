import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { DEMO_SESSION_COOKIE, getDemoSessionEmailFromCookieValue } from '@/lib/demo-session'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  })
  const demoSessionEmail = getDemoSessionEmailFromCookieValue(
    request.cookies.get(DEMO_SESSION_COOKIE)?.value ?? null,
  )

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return response
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))

        response = NextResponse.next({
          request,
        })

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, { ...options, secure: process.env.NODE_ENV === 'production' })
        })
      },
    },
  })

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error && error.message !== 'Auth session missing!') {
    console.error('[AUTH DEBUG] Middleware getUser failed:', {
      path: request.nextUrl.pathname,
      message: error.message,
      status: 'status' in error ? error.status : undefined,
      error,
    })
  }

  if (!user && request.nextUrl.pathname.startsWith('/dashboard') && !demoSessionEmail) {
    console.error('[AUTH DEBUG] Middleware saw no verified user for dashboard request.', {
      path: request.nextUrl.pathname,
      hasAuthCookies: request.cookies.getAll().some((cookie) => cookie.name.startsWith('sb-')),
    })
  }

  return response
}
