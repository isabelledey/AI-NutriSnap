'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { AppStep, UserProfile, MealAnalysis } from '@/lib/types'
import {
  getUserProfile,
  saveUserProfile,
  isOnboarded,
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

export default function Home() {
  const { t } = useTranslation()
  const router = useRouter()
  const [step, setStep] = useState<AppStep>('landing')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [currentAnalysis, setCurrentAnalysis] = useState<MealAnalysis | null>(null)
  const [currentImage, setCurrentImage] = useState<string | null>(null)

  // Check if user is already onboarded
  useEffect(() => {
    if (isOnboarded()) {
      const savedProfile = getUserProfile()
      if (savedProfile) {
        setProfile(savedProfile)
        setStep('dashboard')
      }
    }
  }, [])

  const handleStart = () => {
    setStep('photo')
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

    if (isOnboarded() && profile) {
      // Already onboarded, save directly
      if (currentAnalysis) {
        const mealWithTimestamp = {
          ...currentAnalysis,
          timestamp: currentAnalysis.timestamp || new Date().toISOString(),
        }
        saveMealToLog(mealWithTimestamp)
        await syncMealToSupabase(profile.email, mealWithTimestamp)
        clearPendingMeal()
        toast.success(t('meal_saved'))
      }
      setStep('dashboard')
    } else {
      // Need to onboard first
      setStep('onboarding-email')
    }
  }

  const handleOnboardingComplete = async (completedProfile: UserProfile) => {
    saveUserProfile(completedProfile)
    setProfile(completedProfile)
    await syncProfileToSupabase(completedProfile)

    // Save any pending meal
    const pending = getPendingMeal()
    if (pending) {
      const mealWithTimestamp = {
        ...pending,
        timestamp: pending.timestamp || new Date().toISOString(),
      }
      saveMealToLog(mealWithTimestamp)
      await syncMealToSupabase(completedProfile.email, mealWithTimestamp)
      clearPendingMeal()
      toast.success(t('profile_created_saved'))
    } else {
      toast.success(t('profile_created'))
    }

    setStep('dashboard')
  }

  const handleAddMeal = () => {
    setCurrentAnalysis(null)
    setCurrentImage(null)
    setStep('photo')
  }

  const handleLogout = () => {
    clearAppSession()
    setProfile(null)
    setCurrentAnalysis(null)
    setCurrentImage(null)
    setStep('landing')
    router.replace('/')
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

      {step === 'landing' && <LandingHero onStart={handleStart} />}

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
        <OnboardingWizard onComplete={handleOnboardingComplete} />
      )}

      {step === 'dashboard' && profile && (
        <Dashboard profile={profile} onAddMeal={handleAddMeal} />
      )}
    </main>
  )
}
