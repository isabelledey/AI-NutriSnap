'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { AppStep, UserProfile, MealAnalysis } from '@/lib/types'
import {
  saveUserProfile,
  saveMealToLog,
  setPendingMeal,
  getPendingMeal,
  clearPendingMeal,
  clearAppSession,
  syncProfileToSupabase,
  syncMealToSupabase,
} from '@/lib/store'
import { LandingHero } from '@/components/landing-hero'
import { PhotoCapture } from '@/components/photo-capture'
import { MealAnalysisDisplay } from '@/components/meal-analysis'
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard'
import { Dashboard } from '@/components/dashboard/dashboard'
import { AppHeader } from '@/components/app-header'
import { toast } from 'sonner'
import { useTranslation } from '@/components/i18n/language-provider'
import { createClient } from '@/lib/supabase/client'
import type { AuthMode } from '@/lib/auth'

interface ClientAppProps {
  initialStep: AppStep
  initialProfile: UserProfile | null
}

export function ClientApp({ initialStep, initialProfile }: ClientAppProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const [step, setStep] = useState<AppStep>(initialStep)
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile)
  const [currentAnalysis, setCurrentAnalysis] = useState<MealAnalysis | null>(null)
  const [currentImage, setCurrentImage] = useState<string | null>(null)
  const [authMode, setAuthMode] = useState<AuthMode>('signup')

  // Sync profile locally if provided by server
  useEffect(() => {
    if (initialProfile) {
      saveUserProfile(initialProfile)
    }
  }, [initialProfile])

  const handleStart = () => {
    setStep('photo')
  }

  const handleSignInFromLanding = () => {
    setAuthMode('signin')
    setStep('onboarding-email')
  }

  const handleMealAnalyzed = (analysis: MealAnalysis, imageDataUrl: string) => {
    setCurrentImage(imageDataUrl)
    setCurrentAnalysis(analysis)
    setStep('analysis')
  }

  const handleAnalyzeAgain = () => {
    if (!currentImage) {
      toast.error(t('no_meal_image'))
    }
    setStep('photo')
  }

  const handleAnalysisContinue = async () => {
    if (currentAnalysis) {
      // Save the pending meal for after onboarding
      setPendingMeal(currentAnalysis)
    }

    if (profile) {
      // Already onboarded, save directly
      if (currentAnalysis) {
        const mealWithTimestamp = {
          ...currentAnalysis,
          timestamp: currentAnalysis.timestamp || new Date().toISOString(),
        }
        saveMealToLog(mealWithTimestamp)
        const mealSynced = await syncMealToSupabase(profile.email, mealWithTimestamp)
        if (!mealSynced) {
          toast.error('Meal was saved locally but failed to sync to Supabase. Check console logs.')
        }
        clearPendingMeal()
        toast.success(t('meal_saved'))
      }
      setStep('dashboard')
    } else {
      // Need to onboard first
      setAuthMode('signup')
      setStep('onboarding-email')
    }
  }

  const handleOnboardingComplete = async (
    completedProfile: UserProfile,
    options?: { isExistingUser?: boolean },
  ) => {
    const isExistingUser = Boolean(options?.isExistingUser)
    saveUserProfile(completedProfile)
    setProfile(completedProfile)
    if (!isExistingUser) {
      const profileSynced = await syncProfileToSupabase(completedProfile)
      if (!profileSynced) {
        toast.error('Profile was saved locally but failed to sync to Supabase. Check console logs.')
      }
    }

    // Save any pending meal
    const pending = getPendingMeal()
    if (pending) {
      const mealWithTimestamp = {
        ...pending,
        timestamp: pending.timestamp || new Date().toISOString(),
      }
      saveMealToLog(mealWithTimestamp)
      const mealSynced = await syncMealToSupabase(completedProfile.email, mealWithTimestamp)
      if (!mealSynced) {
        toast.error('Meal was saved locally but failed to sync to Supabase. Check console logs.')
      }
      clearPendingMeal()
      toast.success(isExistingUser ? t('meal_saved') : t('profile_created_saved'))
    } else {
      if (!isExistingUser) {
        toast.success(t('profile_created'))
      }
    }

    setStep('dashboard')
  }

  const handleAddMeal = () => {
    setCurrentAnalysis(null)
    setCurrentImage(null)
    setStep('photo')
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    clearAppSession()
    setProfile(null)
    setCurrentAnalysis(null)
    setCurrentImage(null)
    setStep('landing')
    
    // Refresh the page so the Server Component catches the logged-out state via cookies
    router.refresh()
  }

  const headerBackAction =
    step === 'photo'
      ? () => setStep(profile ? 'dashboard' : 'landing')
      : undefined

  const showHeaderLogout = step === 'analysis' || step === 'dashboard' || step === 'photo'

  return (
    <main className="mx-auto min-h-[100dvh] max-w-md">
      <AppHeader
        onLogout={handleLogout}
        showLogout={showHeaderLogout}
        onGoBack={headerBackAction}
      />

      {step === 'landing' && <LandingHero onStart={handleStart} onSignIn={handleSignInFromLanding} />}

      {step === 'photo' && (
        <PhotoCapture
          onMealAnalyzed={handleMealAnalyzed}
          onBack={() => setStep(profile ? 'dashboard' : 'landing')}
          initialImageDataUrl={currentImage}
        />
      )}

      {step === 'analysis' && currentAnalysis && (
        <MealAnalysisDisplay
          analysis={currentAnalysis}
          imageUrl={currentImage || undefined}
          onContinue={handleAnalysisContinue}
          onAnalyzeAgain={handleAnalyzeAgain}
        />
      )}

      {(step === 'onboarding-email' || step === 'onboarding-verify' || step === 'onboarding-profile') && (
        <OnboardingWizard mode={authMode} onComplete={handleOnboardingComplete} />
      )}

      {step === 'dashboard' && profile && (
        <Dashboard profile={profile} onAddMeal={handleAddMeal} />
      )}
    </main>
  )
}
