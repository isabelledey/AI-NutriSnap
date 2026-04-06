'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LandingHero } from '@/components/landing-hero'
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard'
import { clearPendingMeal, getPendingMeal, saveUserProfile, syncMealToSupabase, syncProfileToSupabase } from '@/lib/store'
import { toast } from 'sonner'
import type { UserProfile } from '@/lib/types'
import type { AuthMode } from '@/lib/auth'

const PROFILE_ONBOARDING_ROUTE = '/build-profile'

export function AuthPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<AuthMode>('signup')
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    const requestedMode = searchParams.get('mode')
    if (requestedMode === 'signin' || requestedMode === 'signup') {
      setMode(requestedMode)
      setShowOnboarding(true)
      return
    }

    setMode('signup')
    setShowOnboarding(false)
  }, [searchParams])

  const handleStart = () => {
    router.push('/analyze')
  }

  const handleSignIn = () => {
    setMode('signin')
    setShowOnboarding(true)
  }

  const handleOnboardingComplete = async (
    completedProfile: UserProfile,
    options?: { isExistingUser?: boolean },
  ) => {
    const isExistingUser = Boolean(options?.isExistingUser)
    saveUserProfile(completedProfile)

    if (!isExistingUser) {
      const profileSynced = await syncProfileToSupabase(completedProfile)
      if (!profileSynced) {
        toast.error('Profile was saved locally but failed to sync to Supabase. Check console logs.')
      }
    }

    const pendingMeal = getPendingMeal()
    if (pendingMeal) {
      const mealWithTimestamp = {
        ...pendingMeal,
        timestamp: pendingMeal.timestamp || new Date().toISOString(),
      }
      const mealSynced = await syncMealToSupabase(completedProfile.email, mealWithTimestamp)
      if (!mealSynced) {
        toast.error('Meal was saved locally but failed to sync to Supabase. Check console logs.')
      }
      clearPendingMeal()
      toast.success(isExistingUser ? 'Meal saved to your daily log!' : 'Profile created and meal saved!')
    } else if (!isExistingUser) {
      toast.success('Profile created! Start tracking your meals.')
    }

    router.refresh()
    router.push(isExistingUser ? '/dashboard' : PROFILE_ONBOARDING_ROUTE)
  }

  if (showOnboarding) {
    return <OnboardingWizard mode={mode} onComplete={handleOnboardingComplete} />
  }

  return <LandingHero onStart={handleStart} onSignIn={handleSignIn} />
}
