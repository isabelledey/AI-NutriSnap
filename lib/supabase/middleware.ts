import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { DEMO_SESSION_COOKIE, getDemoSessionEmailFromCookieValue } from '@/lib/demo-session'

function isProtectedAppRoute(pathname: string): boolean {
  return (
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/') ||
    pathname === '/build-profile' ||
    pathname.startsWith('/build-profile/') ||
    pathname === '/onboarding' ||
    pathname.startsWith('/onboarding/')
  )
}

function redirectToHome(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone()
  url.pathname = '/'
  url.search = ''
  return NextResponse.redirect(url)
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  })
  const pathname = request.nextUrl.pathname
  const demoSessionEmail = getDemoSessionEmailFromCookieValue(
    request.cookies.get(DEMO_SESSION_COOKIE)?.value ?? null,
  )
  const hasDemoSession = Boolean(demoSessionEmail)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    if (isProtectedAppRoute(pathname) && !hasDemoSession) {
      return redirectToHome(request)
    }
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
      path: pathname,
      message: error.message,
      status: 'status' in error ? error.status : undefined,
      error,
    })
  }

  const hasSupabaseSession = Boolean(user)
  if (isProtectedAppRoute(pathname) && !hasSupabaseSession && !hasDemoSession) {
    console.error('[AUTH DEBUG] Middleware saw no verified user for protected request.', {
      path: pathname,
      hasAuthCookies: request.cookies.getAll().some((cookie) => cookie.name.startsWith('sb-')),
      hasDemoSession,
    })
    return redirectToHome(request)
  }

  return response
}
