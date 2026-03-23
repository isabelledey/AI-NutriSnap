import { toast } from 'sonner'
import type { UserProfile } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import {
  createDefaultDemoProfile,
  DEMO_OTP,
  isDevAuthBypassEnabled,
  normalizeAuthEmail,
  persistDemoSession,
} from '@/lib/demo-session'

export type VerifyOtpResult = {
  success: boolean
  profile: UserProfile | null
}

export type AuthMode = 'signup' | 'signin'

const DEV_AUTH_EMAIL_KEY = 'demo_otp_email'
const DEV_AUTH_MODE_KEY = 'demo_otp_mode'

type ProfileLookupResult = {
  exists: boolean
  profile: UserProfile | null
}

function getAuthErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  if (typeof error === 'object' && error !== null) {
    const message = 'message' in error ? error.message : null
    if (typeof message === 'string' && message.trim()) {
      return message
    }

    try {
      return JSON.stringify(error)
    } catch {
      return fallback
    }
  }

  if (typeof error === 'string' && error.trim()) {
    return error
  }

  return fallback
}

async function waitForSupabaseSession(supabase: ReturnType<typeof createClient>, attempts = 6): Promise<boolean> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session) {
      return true
    }

    await new Promise((resolve) => window.setTimeout(resolve, 250))
  }

  return false
}

async function ensureOtpAuthUser(email: string, name: string): Promise<void> {
  const res = await fetch('/api/auth/ensure-otp-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, name }),
  })

  const data = await res.json().catch(() => null)
  if (!res.ok || !data?.success) {
    throw new Error(data?.message || 'Failed to prepare your sign-in account.')
  }
}

async function fetchProfileByEmail(email: string): Promise<ProfileLookupResult> {
  const res = await fetch(`/api/profile?email=${encodeURIComponent(email)}`, {
    cache: 'no-store',
  })
  const data = await res.json().catch(() => null)

  if (!res.ok || !data?.success) {
    throw new Error(data?.message || 'Failed to load account details.')
  }

  return {
    exists: Boolean(data?.profile),
    profile: (data.profile as UserProfile | null) ?? null,
  }
}

async function createDevSignupProfile(email: string, name: string): Promise<UserProfile> {
  const profilePayload = createDefaultDemoProfile(email, { name })

  const res = await fetch('/api/profile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profilePayload),
  })
  const data = await res.json().catch(() => null)

  if (!res.ok || !data?.success || !data?.profile) {
    throw new Error(data?.message || 'Failed to create your development profile.')
  }

  return data.profile as UserProfile
}

export async function sendOTP(email: string, name: string, mode: AuthMode = 'signup'): Promise<boolean> {
  const normalizedEmail = normalizeAuthEmail(email)
  const trimmedName = name.trim()
  const isDevBypassEnabled = isDevAuthBypassEnabled()

  if (!normalizedEmail) {
    toast.error('Email is required.')
    return false
  }

  if (mode === 'signup' && !trimmedName) {
    toast.error('Name is required.')
    return false
  }

  try {
    const profileLookup = await fetchProfileByEmail(normalizedEmail)
    const existingPendingEmail = localStorage.getItem(DEV_AUTH_EMAIL_KEY)
    const existingPendingMode = localStorage.getItem(DEV_AUTH_MODE_KEY)
    const isCurrentDevSignupAttempt =
      isDevBypassEnabled &&
      mode === 'signup' &&
      existingPendingEmail === normalizedEmail &&
      existingPendingMode === 'signup'

    if (mode === 'signup' && profileLookup.exists && !isCurrentDevSignupAttempt) {
      throw new Error('This email is already registered to NutriSnap. Please log in instead.')
    }

    if (mode === 'signin' && !profileLookup.exists) {
      throw new Error('Account not found. Please sign up first.')
    }

    if (isDevBypassEnabled) {
      if (mode === 'signup' && !profileLookup.exists) {
        await createDevSignupProfile(normalizedEmail, trimmedName)
      }

      localStorage.setItem(DEV_AUTH_EMAIL_KEY, normalizedEmail)
      localStorage.setItem(DEV_AUTH_MODE_KEY, mode)
      toast.success(`Dev Mode: enter ${DEMO_OTP}`)
      return true
    }

    if (mode === 'signin' && profileLookup.exists) {
      await ensureOtpAuthUser(normalizedEmail, profileLookup.profile?.name || trimmedName)
    }
  } catch (error) {
    console.error('[AUTH DEBUG]', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to start authentication. Please try again.')
  }

  const supabase = createClient()

  const otpOptions =
    mode === 'signup'
      ? {
          shouldCreateUser: true,
          data: { name: trimmedName },
        }
      : {
          shouldCreateUser: false,
        }

  try {
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: otpOptions,
    })

    if (error) {
      throw error
    }
  } catch (error) {
    const authError = error as { message?: string; status?: number }
    console.error('[AUTH DEBUG]', error)

    if (authError.status === 429) {
      toast.error('Rate limit reached. Please use the demo account.')
      return false
    }

    toast.error(getAuthErrorMessage(error, 'Failed to send verification code. Please try again.'))
    return false
  }

  toast.success('Verification code sent!')
  return true
}

export async function verifyOTP(email: string, code: string): Promise<VerifyOtpResult> {
  const normalizedEmail = normalizeAuthEmail(email)
  const token = code.trim()
  const isDevBypassEnabled = isDevAuthBypassEnabled()

  if (!normalizedEmail || token.length !== 6) {
    toast.error('Invalid verification code.')
    return { success: false, profile: null }
  }

  if (isDevBypassEnabled) {
    const storedEmail = localStorage.getItem(DEV_AUTH_EMAIL_KEY)
    if (storedEmail !== normalizedEmail || token !== DEMO_OTP) {
      toast.error('Invalid verification code.')
      return { success: false, profile: null }
    }

    localStorage.removeItem(DEV_AUTH_EMAIL_KEY)
    localStorage.removeItem(DEV_AUTH_MODE_KEY)
    persistDemoSession(normalizedEmail)
  } else {
    const supabase = createClient()
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token,
        type: 'email',
      })

      if (error) {
        throw error
      }

      if (!session) {
        const hasSession = await waitForSupabaseSession(supabase)
        if (!hasSession) {
          console.error('[Auth] verifyOtp succeeded but no Supabase session cookie was established.')
          toast.error('Verification succeeded, but your session is still syncing. Please try again.')
          return { success: false, profile: null }
        }
      }
    } catch (error) {
      const authError = error as { message?: string; status?: number }
      console.error('[AUTH DEBUG]', error)

      if (authError.status === 429) {
        toast.error('Rate limit reached. Please use the demo account.')
        return { success: false, profile: null }
      }

      toast.error(authError.message || 'Invalid verification code.')
      return { success: false, profile: null }
    }
  }

  toast.success('Email verified!')

  try {
    const profileLookup = await fetchProfileByEmail(normalizedEmail)

    return {
      success: true,
      profile: profileLookup.profile ?? (isDevBypassEnabled ? createDefaultDemoProfile(normalizedEmail) : null),
    }
  } catch (error) {
    console.error('[AUTH DEBUG]', error)
    return {
      success: true,
      profile: isDevBypassEnabled ? createDefaultDemoProfile(normalizedEmail) : null,
    }
  }
}
