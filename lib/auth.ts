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
export type OtpDeliveryStrategy = 'mock' | 'supabase'

export type SendOtpResult = {
  success: boolean
  shouldTransition: boolean
  nextMode?: AuthMode
  delivery?: OtpDeliveryStrategy
}

const DEV_AUTH_EMAIL_KEY = 'demo_otp_email'
const DEV_AUTH_MODE_KEY = 'demo_otp_mode'
const DEV_AUTH_NAME_KEY = 'demo_otp_name'
const DEV_AUTH_STRATEGY_KEY = 'demo_otp_strategy'

type ProfileLookupResult = {
  exists: boolean
  profile: UserProfile | null
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
  const profilePayload: UserProfile = {
    ...createDefaultDemoProfile(email, { name }),
    // Keep demo signups in an explicitly incomplete state so onboarding can continue.
    foodPreferences: [],
  }

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

function setPendingOtpAttempt(
  email: string,
  mode: AuthMode,
  strategy: OtpDeliveryStrategy,
  name = '',
): void {
  localStorage.setItem(DEV_AUTH_EMAIL_KEY, email)
  localStorage.setItem(DEV_AUTH_MODE_KEY, mode)
  localStorage.setItem(DEV_AUTH_STRATEGY_KEY, strategy)

  if (name.trim()) {
    localStorage.setItem(DEV_AUTH_NAME_KEY, name.trim())
    return
  }

  localStorage.removeItem(DEV_AUTH_NAME_KEY)
}

function clearPendingOtpAttempt(): void {
  localStorage.removeItem(DEV_AUTH_EMAIL_KEY)
  localStorage.removeItem(DEV_AUTH_MODE_KEY)
  localStorage.removeItem(DEV_AUTH_NAME_KEY)
  localStorage.removeItem(DEV_AUTH_STRATEGY_KEY)
}

export async function sendOTP(email: string, name: string, mode: AuthMode = 'signup'): Promise<SendOtpResult> {
  const normalizedEmail = normalizeAuthEmail(email)
  const trimmedName = name.trim()

  if (!normalizedEmail) {
    toast.error('Email is required.')
    return { success: false, shouldTransition: false }
  }

  if (mode === 'signup' && !trimmedName) {
    toast.error('Name is required.')
    return { success: false, shouldTransition: false }
  }

  try {
    const profileLookup = await fetchProfileByEmail(normalizedEmail)
    const existingPendingEmail = localStorage.getItem(DEV_AUTH_EMAIL_KEY)
    const existingPendingMode = localStorage.getItem(DEV_AUTH_MODE_KEY)
    const isCurrentPendingSignupAttempt =
      mode === 'signup' &&
      existingPendingEmail === normalizedEmail &&
      existingPendingMode === 'signup'

    if (mode === 'signup' && profileLookup.exists && !isCurrentPendingSignupAttempt) {
      toast.info('That email already has an account. Switching you to Log In.')
      return {
        success: false,
        shouldTransition: false,
        nextMode: 'signin',
      }
    }

    if (mode === 'signin' && !profileLookup.exists) {
      throw new Error('Account not found. Please sign up first.')
    }

    if (mode === 'signin') {
      setPendingOtpAttempt(normalizedEmail, mode, 'mock')
      toast.success(`Code ready. Enter ${DEMO_OTP}`)
      return {
        success: true,
        shouldTransition: true,
        delivery: 'mock',
      }
    }

    if (!profileLookup.exists) {
      await createDevSignupProfile(normalizedEmail, trimmedName)
    }

    setPendingOtpAttempt(normalizedEmail, mode, 'mock', trimmedName)
  } catch (error) {
    console.error('[AUTH DEBUG]', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to start authentication. Please try again.')
  }

  if (isDevAuthBypassEnabled()) {
    toast.success(`Code ready. Enter ${DEMO_OTP}`)
    return {
      success: true,
      shouldTransition: true,
      delivery: 'mock',
    }
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
    console.warn('[AUTH SOFT FAIL] Ignored OTP email send error and continuing with mock OTP:', error)
    toast.info(`Email quota reached or failed. Enter ${DEMO_OTP} to continue.`)
    return {
      success: true,
      shouldTransition: true,
      delivery: 'mock',
    }
  }

  toast.success(`Verification code sent. You can also enter ${DEMO_OTP}.`)
  return {
    success: true,
    shouldTransition: true,
    delivery: 'mock',
  }
}

export async function verifyOTP(email: string, code: string): Promise<VerifyOtpResult> {
  const normalizedEmail = normalizeAuthEmail(email)
  const token = code.trim()
  const storedEmail = localStorage.getItem(DEV_AUTH_EMAIL_KEY)
  const storedMode = localStorage.getItem(DEV_AUTH_MODE_KEY)
  const storedName = localStorage.getItem(DEV_AUTH_NAME_KEY)?.trim() ?? ''
  const storedStrategy = localStorage.getItem(DEV_AUTH_STRATEGY_KEY) as OtpDeliveryStrategy | null
  const legacyMockSignin = storedMode === 'signin' && !storedStrategy
  const shouldUseMockOtp =
    storedEmail === normalizedEmail &&
    (storedStrategy === 'mock' || legacyMockSignin || (isDevAuthBypassEnabled() && storedMode === 'signup'))
  let usedMockOtp = false

  if (!normalizedEmail || token.length !== 6) {
    toast.error('Invalid verification code.')
    return { success: false, profile: null }
  }

  if (shouldUseMockOtp) {
    if (token !== DEMO_OTP) {
      toast.error('Invalid verification code.')
      return { success: false, profile: null }
    }

    clearPendingOtpAttempt()
    persistDemoSession(normalizedEmail)
    usedMockOtp = true
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

  toast.success(usedMockOtp ? 'Code verified!' : 'Email verified!')

  try {
    const profileLookup = await fetchProfileByEmail(normalizedEmail)

    return {
      success: true,
      profile:
        profileLookup.profile ??
        (usedMockOtp ? createDefaultDemoProfile(normalizedEmail, { name: storedName }) : null),
    }
  } catch (error) {
    console.error('[AUTH DEBUG]', error)
    return {
      success: true,
      profile: usedMockOtp ? createDefaultDemoProfile(normalizedEmail, { name: storedName }) : null,
    }
  }
}
