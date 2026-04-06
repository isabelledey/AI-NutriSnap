'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppHeader } from '@/components/app-header'
import { ProfileStep } from '@/components/onboarding/profile-step'
import { createClient } from '@/lib/supabase/client'
import {
  clearAppSession,
  clearPendingMeal,
  clearPendingOnboarding,
  getPendingMeal,
  getPendingOnboarding,
  getUserProfile,
  isProfileComplete,
  saveUserProfile,
  syncMealToSupabase,
  syncProfileToSupabase,
} from '@/lib/store'
import {
  clearDemoSession,
  getDemoSessionEmailFromBrowser,
  normalizeAuthEmail,
} from '@/lib/demo-session'
import type { UserProfile } from '@/lib/types'
import { toast } from 'sonner'

interface OnboardingPageClientProps {
  initialSessionEmail: string | null
}

export function OnboardingPageClient({ initialSessionEmail }: OnboardingPageClientProps) {
  const router = useRouter()
  const [sessionEmail, setSessionEmail] = useState<string | null>(initialSessionEmail)
  const [profileName, setProfileName] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    let ignore = false

    const loadOnboardingContext = async () => {
      const pendingOnboarding = getPendingOnboarding()
      const localProfile = getUserProfile()
      const demoSessionEmail = getDemoSessionEmailFromBrowser()

      if (pendingOnboarding?.name) {
        setProfileName(pendingOnboarding.name)
      } else if (localProfile?.name) {
        setProfileName(localProfile.name)
      }

      if (demoSessionEmail) {
        if (!ignore) {
          setSessionEmail(demoSessionEmail)
          setIsLoading(false)
        }
        return
      }

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!ignore) {
          setSessionEmail(session?.user?.email ? normalizeAuthEmail(session.user.email) : null)
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    void loadOnboardingContext()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (ignore) return

      const demoSessionEmail = getDemoSessionEmailFromBrowser()
      if (session?.user?.email) {
        setSessionEmail(normalizeAuthEmail(session.user.email))
      } else if (demoSessionEmail) {
        setSessionEmail(demoSessionEmail)
      } else {
        setSessionEmail(null)
      }
    })

    return () => {
      ignore = true
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    let ignore = false

    const validateRoute = async () => {
      if (isLoading) return

      if (!sessionEmail) {
        router.replace('/?mode=signup')
        return
      }

      const pendingOnboarding = getPendingOnboarding()
      const localProfile = getUserProfile()
      const localProfileForSession = localProfile?.email === sessionEmail ? localProfile : null

      try {
        const res = await fetch(`/api/profile?email=${encodeURIComponent(sessionEmail)}`, {
          cache: 'no-store',
        })
        const data = await res.json().catch(() => null)

        if (ignore) return

        if (res.ok && data?.success && data?.profile) {
          const remoteProfile = data.profile as UserProfile
          if (remoteProfile.name && !pendingOnboarding?.name) {
            setProfileName(remoteProfile.name)
          }

          // Only the remote profile should decide whether onboarding is actually finished.
          if (isProfileComplete(remoteProfile)) {
            saveUserProfile(remoteProfile)
            clearPendingOnboarding()
            router.replace('/dashboard')
            return
          }
        } else if (localProfileForSession?.name && !pendingOnboarding?.name) {
          setProfileName(localProfileForSession.name)
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    void validateRoute()
    return () => {
      ignore = true
    }
  }, [isLoading, router, sessionEmail])

  const handleComplete = async (profile: UserProfile) => {
    if (!sessionEmail) {
      router.replace('/?mode=signup')
      return
    }

    const completedProfile: UserProfile = {
      ...profile,
      email: sessionEmail,
      name: profileName || profile.name || '',
    }

    saveUserProfile(completedProfile)

    const profileSynced = await syncProfileToSupabase(completedProfile)
    if (!profileSynced) {
      toast.error('Profile was saved locally but failed to sync to Supabase. Check console logs.')
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
      toast.success('Profile created and meal saved!')
    } else {
      toast.success('Profile created! Start tracking your meals.')
    }

    clearPendingOnboarding()
    router.refresh()
    router.push('/dashboard')
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    clearDemoSession()
    clearAppSession()
    clearPendingOnboarding()
    router.replace('/')
    router.refresh()
  }

  if (isLoading) {
    return (
      <main className="mx-auto min-h-[100dvh] max-w-md">
        <AppHeader onLogout={handleLogout} showLogout />
        <div className="px-6 pb-12 pt-20">
          <div className="h-40 animate-pulse rounded-2xl bg-muted" />
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto min-h-[100dvh] max-w-md">
      <AppHeader onLogout={handleLogout} showLogout />
      <div className="px-6 pt-16">
        <ProfileStep onComplete={handleComplete} />
      </div>
    </main>
  )
}
