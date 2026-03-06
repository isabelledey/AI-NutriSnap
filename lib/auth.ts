import { toast } from 'sonner'
import type { UserProfile } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

export type VerifyOtpResult = {
  success: boolean
  profile: UserProfile | null
}

export type AuthMode = 'signup' | 'signin'
const DEMO_OTP = '123456'
const USE_DEMO_OTP = true

export async function sendOTP(email: string, name: string, mode: AuthMode = 'signup'): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase()
  const trimmedName = name.trim()

  if (!normalizedEmail) {
    toast.error('Email is required.')
    return false
  }

  if (mode === 'signup' && !trimmedName) {
    toast.error('Name is required.')
    return false
  }

  try {
    const res = await fetch(`/api/profile?email=${encodeURIComponent(normalizedEmail)}`, {
      cache: 'no-store',
    })
    const data = await res.json().catch(() => null)

    if (mode === 'signup' && res.ok && data?.success && data?.profile) {
      toast.error('This email is already registered to NutriSnap. Please log in instead.')
      return false
    }

    if (mode === 'signin' && (!res.ok || !data?.success || !data?.profile)) {
      toast.error('No account found with this email. Please sign up first.')
      return false
    }
  } catch (error) {
    if (mode === 'signin') {
      console.error('[Auth] Failed to verify sign-in email existence:', error)
      toast.error('No account found with this email. Please sign up first.')
      return false
    }
  }

  const supabase = createClient()
  if (USE_DEMO_OTP) {
    localStorage.setItem('demo_otp_email', normalizedEmail)
    localStorage.setItem('demo_otp_mode', mode)
    toast.success(`Demo code: ${DEMO_OTP}`)
    return true
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      ...(mode === 'signup' ? { data: { name: trimmedName } } : {}),
    },
  })

  if (error) {
    console.error('[Auth] Supabase sendOTP error:', error)
    toast.error(error.message || 'Failed to send verification code. Please try again.')
    return false
  }

  toast.success('Verification code sent!')
  return true
}

export async function verifyOTP(email: string, code: string): Promise<VerifyOtpResult> {
  const normalizedEmail = email.trim().toLowerCase()
  const token = code.trim()

  if (!normalizedEmail || token.length !== 6) {
    toast.error('Invalid verification code.')
    return { success: false, profile: null }
  }

  const supabase = createClient()
  if (USE_DEMO_OTP) {
    const storedEmail = localStorage.getItem('demo_otp_email')
    if (storedEmail !== normalizedEmail || token !== DEMO_OTP) {
      toast.error('Invalid verification code.')
      return { success: false, profile: null }
    }
    localStorage.removeItem('demo_otp_email')
    localStorage.removeItem('demo_otp_mode')
  } else {
    const { error } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token,
      type: 'email',
    })

    if (error) {
      console.error('[Auth] Supabase verifyOtp error:', error)
      toast.error(error.message || 'Invalid verification code.')
      return { success: false, profile: null }
    }
  }

  toast.success('Email verified!')

  try {
    const res = await fetch(`/api/profile?email=${encodeURIComponent(normalizedEmail)}`, {
      cache: 'no-store',
    })
    const data = await res.json().catch(() => null)

    if (!res.ok || !data?.success) {
      return { success: true, profile: null }
    }

    return { success: true, profile: (data.profile as UserProfile | null) ?? null }
  } catch {
    return { success: true, profile: null }
  }
}
