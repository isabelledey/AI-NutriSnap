import { toast } from 'sonner'
import type { UserProfile } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

export type VerifyOtpResult = {
  success: boolean
  profile: UserProfile | null
}

const DEMO_OTP = '123456'

export async function sendOTP(email: string, name: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase()
  const trimmedName = name.trim()

  if (!normalizedEmail) {
    toast.error('Email is required.')
    return false
  }

  if (!trimmedName) {
    toast.error('Name is required.')
    return false
  }

  // Duplicate check before sending OTP
  try {
    const res = await fetch(`/api/profile?email=${encodeURIComponent(normalizedEmail)}`)
    const data = await res.json()
    if (data?.success && data?.profile) {
      toast.error('This email is already registered to NutriSnap. Please log in instead.')
      return false
    }
  } catch (error) {
    console.error('Error checking duplicate email:', error)
    // Proceed if the check fails to not totally block the user on a network hiccup
  }

  const supabase = createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      data: {
        name: trimmedName,
      },
    },
  })

  if (error) {
    console.error('Supabase sendOTP error:', error)
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
  const { error } = await supabase.auth.verifyOtp({
    email: normalizedEmail,
    token,
    type: 'email',
  })

  if (error) {
    console.error('Supabase verifyOtp error:', error)
    toast.error(error.message || 'Invalid verification code.')
    return { success: false, profile: null }
  }

  // Ensure session is retrieved as requested
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError || !sessionData.session) {
    console.error('Supabase getSession error after verify:', sessionError || 'No session found')
    toast.error('Session error after verification.')
    return { success: false, profile: null }
  }

  toast.success('Email verified!')

  try {
    const res = await fetch(`/api/profile?id=${encodeURIComponent(sessionData.session.user.id)}`, {
      cache: 'no-store',
    })
    const data = await res.json()

    if (!res.ok || !data?.success) {
      return { success: true, profile: null }
    }

    return { success: true, profile: (data.profile as UserProfile | null) ?? null }
  } catch {
    return { success: true, profile: null }
  }
}
